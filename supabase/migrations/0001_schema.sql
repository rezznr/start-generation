-- Star Generation: schema, constraints, RLS and transactional functions.
-- Money is integer rupiah. Earnings = round(rate * minutes / 60), half away from zero.

create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;

create type user_role as enum ('admin', 'tutor', 'student');
create type invoice_status as enum ('unpaid', 'paid');
create type report_status as enum ('pending', 'approved');

-- Roles live here and nowhere a user can edit (no UPDATE grant, no auth metadata).
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null,
  full_name text not null
);

-- Pricing is split out of `classes` so that column confidentiality is a table grant
-- rather than a frontend promise: students must not read tutor rates, tutors must not read student prices.
create table classes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  capacity int not null check (capacity > 0),
  tutor_id uuid not null references profiles,
  created_at timestamptz not null default now()
);
create index on classes (tutor_id);

create table class_student_pricing (
  class_id uuid primary key references classes on delete cascade,
  student_price int not null check (student_price >= 0)
);
create table class_tutor_rates (
  class_id uuid primary key references classes on delete cascade,
  hourly_rate int not null check (hourly_rate >= 0)
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes,
  student_id uuid not null references profiles,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);
create index on enrollments (student_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references enrollments,
  class_id uuid not null references classes,
  student_id uuid not null references profiles,
  amount int not null check (amount >= 0), -- snapshot of student price at enrollment
  status invoice_status not null default 'unpaid',
  paid_at timestamptz,
  paid_by uuid references profiles,
  payment_ref text,
  created_at timestamptz not null default now(),
  check ((status = 'paid') = (paid_at is not null))
);
create index on invoices (student_id);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes,
  tutor_id uuid not null references profiles, -- copied from the class by trigger so the exclusion constraint spans classes
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes int generated always as ((extract(epoch from (ends_at - starts_at)) / 60)::int) stored,
  approved_at timestamptz, -- set only by approve_report(); makes the lesson immutable
  check (ends_at > starts_at),
  -- [start, end): 10:00-11:00 and 11:00-12:00 are allowed. Holds under concurrent inserts.
  exclude using gist (tutor_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
);
create index on lessons (class_id, starts_at);

create table lesson_rates (
  lesson_id uuid primary key references lessons on delete cascade,
  hourly_rate int not null check (hourly_rate >= 0) -- snapshot taken when the lesson is created
);

create table lesson_reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references lessons,
  topic text not null check (length(trim(topic)) > 0),
  progress text not null check (length(trim(progress)) > 0),
  next_steps text not null check (length(trim(next_steps)) > 0),
  status report_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles
);

create table tutor_earnings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references lessons, -- exactly one entry per lesson
  tutor_id uuid not null references profiles,
  duration_minutes int not null,
  hourly_rate int not null,
  amount int not null,
  approved_at timestamptz not null default now()
);
create index on tutor_earnings (tutor_id);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles,
  action text not null,
  entity_id uuid not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- helpers (SECURITY DEFINER, empty search_path) ----------

create function app_role() returns user_role
language sql stable security definer set search_path = '' as
$$ select role from public.profiles where id = auth.uid() $$;

create function has_paid(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.invoices
   where class_id = p_class and student_id = auth.uid() and status = 'paid') $$;

create function is_class_tutor(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.classes where id = p_class and tutor_id = auth.uid()) $$;

create function is_lesson_tutor(p_lesson uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.lessons where id = p_lesson and tutor_id = auth.uid()) $$;

-- ---------- triggers: invariants that must hold on every path ----------

create function lessons_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.approved_at is not null then raise exception 'Approved lessons cannot be deleted'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.approved_at is not null and new.approved_at is not distinct from old.approved_at then
    raise exception 'Approved lessons are read-only';
  end if;
  if tg_op = 'INSERT' then
    select tutor_id into new.tutor_id from public.classes where id = new.class_id;
    new.approved_at := null;
  else
    new.class_id := old.class_id; new.tutor_id := old.tutor_id;
  end if;
  return new;
end $$;
create trigger lessons_before_write before insert or update or delete on lessons
  for each row execute function lessons_before_write();

create function lessons_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lesson_rates (lesson_id, hourly_rate)
  select new.id, hourly_rate from public.class_tutor_rates where class_id = new.class_id;
  return new;
end $$;
create trigger lessons_after_insert after insert on lessons
  for each row execute function lessons_after_insert();

create function reports_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_end timestamptz;
begin
  if tg_op = 'DELETE' then raise exception 'Reports cannot be deleted'; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'approved' then raise exception 'Approved reports are read-only'; end if;
    new.lesson_id := old.lesson_id;
    return new;
  end if;
  select ends_at into v_end from public.lessons where id = new.lesson_id;
  if v_end is null or now() < v_end then raise exception 'A report can only be submitted after the lesson has ended'; end if;
  return new;
end $$;
create trigger reports_before_write before insert or update or delete on lesson_reports
  for each row execute function reports_before_write();

create function classes_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_reserved int;
begin
  select count(*) into v_reserved from public.enrollments where class_id = new.id;
  if new.capacity < v_reserved then
    raise exception 'Capacity cannot be lower than the % seats already reserved', v_reserved;
  end if;
  if new.tutor_id <> old.tutor_id and exists (select 1 from public.lessons where class_id = new.id) then
    raise exception 'The tutor cannot be changed once the class has lessons';
  end if;
  return new;
end $$;
create trigger classes_before_update before update on classes
  for each row execute function classes_before_update();

-- ---------- RLS ----------

alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_student_pricing enable row level security;
alter table class_tutor_rates enable row level security;
alter table enrollments enable row level security;
alter table invoices enable row level security;
alter table lessons enable row level security;
alter table lesson_rates enable row level security;
alter table lesson_reports enable row level security;
alter table tutor_earnings enable row level security;
alter table audit_events enable row level security;

-- Default deny: strip everything, then grant the minimum back.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select (id, role, full_name) on profiles to authenticated;
create policy profiles_read on profiles for select to authenticated using (true);

grant select on classes to authenticated; -- metadata only, no prices
create policy classes_read on classes for select to authenticated
  using (app_role() in ('admin', 'student') or tutor_id = auth.uid()); -- tutors see only their own classes

grant select on class_student_pricing to authenticated;
create policy student_pricing_admin on class_student_pricing for select to authenticated
  using (app_role() = 'admin');

grant select on class_tutor_rates to authenticated;
create policy tutor_rates_read on class_tutor_rates for select to authenticated
  using (app_role() = 'admin' or is_class_tutor(class_id));

grant select on enrollments to authenticated; -- no INSERT: only enroll() creates rows
create policy enrollments_read on enrollments for select to authenticated
  using (student_id = auth.uid() or app_role() = 'admin');

grant select on invoices to authenticated;
create policy invoices_read on invoices for select to authenticated
  using (student_id = auth.uid() or app_role() = 'admin');

grant select on lessons to authenticated;
grant insert (class_id, starts_at, ends_at) on lessons to authenticated;
grant update (starts_at, ends_at) on lessons to authenticated;
grant delete on lessons to authenticated;
create policy lessons_read on lessons for select to authenticated
  using (app_role() = 'admin' or tutor_id = auth.uid() or (app_role() = 'student' and has_paid(class_id)));
create policy lessons_insert on lessons for insert to authenticated
  with check (app_role() = 'tutor' and is_class_tutor(class_id));
create policy lessons_update on lessons for update to authenticated
  using (tutor_id = auth.uid() and approved_at is null) with check (tutor_id = auth.uid());
create policy lessons_delete on lessons for delete to authenticated
  using (tutor_id = auth.uid() and approved_at is null);

grant select on lesson_rates to authenticated;
create policy lesson_rates_read on lesson_rates for select to authenticated
  using (app_role() = 'admin' or is_lesson_tutor(lesson_id));

grant select on lesson_reports to authenticated;
grant insert (lesson_id, topic, progress, next_steps) on lesson_reports to authenticated;
grant update (topic, progress, next_steps) on lesson_reports to authenticated;
create policy reports_read on lesson_reports for select to authenticated using (
  app_role() = 'admin' or is_lesson_tutor(lesson_id)
  or (status = 'approved' and app_role() = 'student'
      and exists (select 1 from lessons l where l.id = lesson_id and has_paid(l.class_id))));
create policy reports_insert on lesson_reports for insert to authenticated
  with check (app_role() = 'tutor' and is_lesson_tutor(lesson_id));
create policy reports_update on lesson_reports for update to authenticated
  using (status = 'pending' and is_lesson_tutor(lesson_id)) with check (status = 'pending');

grant select on tutor_earnings to authenticated;
create policy earnings_read on tutor_earnings for select to authenticated
  using (app_role() = 'admin' or tutor_id = auth.uid());

grant select on audit_events to authenticated;
create policy audit_admin on audit_events for select to authenticated using (app_role() = 'admin');

-- ---------- transactional RPCs: identity always comes from auth.uid() ----------

create function enroll(p_class_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_capacity int; v_reserved int; v_price int;
  v_enrollment uuid; v_invoice uuid;
begin
  if public.app_role() is distinct from 'student' then raise exception 'Only students can enroll'; end if;
  -- Row lock serialises concurrent enrollments for the same class.
  select capacity into v_capacity from public.classes where id = p_class_id for update;
  if not found then raise exception 'Class not found'; end if;
  if exists (select 1 from public.enrollments where class_id = p_class_id and student_id = v_uid) then
    raise exception 'You are already enrolled in this class';
  end if;
  select count(*) into v_reserved from public.enrollments where class_id = p_class_id;
  if v_reserved >= v_capacity then raise exception 'This class is full'; end if;
  select student_price into v_price from public.class_student_pricing where class_id = p_class_id;
  insert into public.enrollments (class_id, student_id) values (p_class_id, v_uid) returning id into v_enrollment;
  insert into public.invoices (enrollment_id, class_id, student_id, amount)
    values (v_enrollment, p_class_id, v_uid, v_price) returning id into v_invoice;
  return v_invoice;
end $$;

create function mark_invoice_paid(p_invoice_id uuid, p_ref text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_status public.invoice_status;
begin
  if public.app_role() is distinct from 'admin' then raise exception 'Only admins can confirm payments'; end if;
  select status into v_status from public.invoices where id = p_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if v_status = 'paid' then return; end if; -- idempotent: repeat calls change nothing
  update public.invoices set status = 'paid', paid_at = now(), paid_by = auth.uid(), payment_ref = nullif(trim(p_ref), '')
    where id = p_invoice_id;
  insert into public.audit_events (actor_id, action, entity_id, details)
    values (auth.uid(), 'invoice.paid', p_invoice_id, jsonb_build_object('payment_ref', p_ref));
end $$;

create function approve_report(p_lesson_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_lesson public.lessons; v_status public.report_status; v_rate int; v_earning uuid;
begin
  if public.app_role() is distinct from 'admin' then raise exception 'Only admins can approve reports'; end if;
  select * into v_lesson from public.lessons where id = p_lesson_id for update;
  if not found then raise exception 'Lesson not found'; end if;
  if now() < v_lesson.ends_at then raise exception 'The lesson has not ended yet'; end if;
  select status into v_status from public.lesson_reports where lesson_id = p_lesson_id for update;
  if not found then raise exception 'No report has been submitted for this lesson'; end if;
  if v_status = 'approved' then
    select id into v_earning from public.tutor_earnings where lesson_id = p_lesson_id;
    return v_earning; -- repeat approval returns the same result
  end if;
  select hourly_rate into v_rate from public.lesson_rates where lesson_id = p_lesson_id;
  update public.lesson_reports set status = 'approved', approved_at = now(), approved_by = auth.uid()
    where lesson_id = p_lesson_id;
  update public.lessons set approved_at = now() where id = p_lesson_id;
  insert into public.tutor_earnings (lesson_id, tutor_id, duration_minutes, hourly_rate, amount)
    values (p_lesson_id, v_lesson.tutor_id, v_lesson.duration_minutes, v_rate,
            round(v_rate::numeric * v_lesson.duration_minutes / 60)::int)
    returning id into v_earning;
  insert into public.audit_events (actor_id, action, entity_id)
    values (auth.uid(), 'report.approved', p_lesson_id);
  return v_earning;
end $$;

-- Same formula as approve_report, for the admin preview.
create function preview_earning(p_lesson_id uuid) returns int
language sql stable security definer set search_path = '' as $$
  select case when public.app_role() = 'admin'
    then round(r.hourly_rate::numeric * l.duration_minutes / 60)::int end
  from public.lessons l join public.lesson_rates r on r.lesson_id = l.id where l.id = p_lesson_id
$$;

create function save_class(p_id uuid, p_title text, p_description text, p_capacity int,
                           p_tutor_id uuid, p_student_price int, p_tutor_rate int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id;
begin
  if public.app_role() is distinct from 'admin' then raise exception 'Only admins can manage classes'; end if;
  if not exists (select 1 from public.profiles where id = p_tutor_id and role = 'tutor') then
    raise exception 'Assigned user is not a tutor';
  end if;
  if v_id is null then
    insert into public.classes (title, description, capacity, tutor_id)
      values (p_title, p_description, p_capacity, p_tutor_id) returning id into v_id;
  else
    update public.classes set title = p_title, description = p_description,
      capacity = p_capacity, tutor_id = p_tutor_id where id = v_id;
  end if;
  insert into public.class_student_pricing values (v_id, p_student_price)
    on conflict (class_id) do update set student_price = excluded.student_price;
  insert into public.class_tutor_rates values (v_id, p_tutor_rate)
    on conflict (class_id) do update set hourly_rate = excluded.hourly_rate;
  return v_id;
end $$;

-- Catalog with price and seats left, for students and admins. Tutors are refused so prices stay hidden.
create function catalog() returns table (id uuid, title text, description text, capacity int,
  tutor_name text, student_price int, seats_reserved int)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.description, c.capacity, p.full_name, sp.student_price,
         (select count(*)::int from public.enrollments e where e.class_id = c.id)
  from public.classes c
  join public.profiles p on p.id = c.tutor_id
  join public.class_student_pricing sp on sp.class_id = c.id
  where public.app_role() in ('admin', 'student')
$$;

-- Tutors see how many students are enrolled, never who paid or how much.
create function class_enrolled_count(p_class_id uuid) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.enrollments
  where class_id = p_class_id and (public.app_role() = 'admin' or public.is_class_tutor(p_class_id))
$$;

grant execute on function app_role(), has_paid(uuid), is_class_tutor(uuid), is_lesson_tutor(uuid) to authenticated;
grant execute on function enroll(uuid), mark_invoice_paid(uuid, text), approve_report(uuid), preview_earning(uuid),
  save_class(uuid, text, text, int, uuid, int, int), catalog(), class_enrolled_count(uuid) to authenticated;

-- The seed script runs with the secret key (service_role). It bypasses RLS but still needs table grants.
grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;
