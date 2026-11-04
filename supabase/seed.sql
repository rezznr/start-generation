-- Star Generation demo data. Run after the schema (supabase/migrations/0001_schema.sql), as the
-- postgres role (SQL editor, psql or `pnpm db:seed:sql`). Safe to run again: it replaces its own rows.
-- Every demo account uses the password  StarGen!2026
-- Same data as `pnpm db:seed`, which builds it through the app's own RPCs instead.

create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- Clean previous demo rows (children first; the schema has no cascade from classes to profiles).
delete from audit_events;
delete from tutor_earnings;
delete from lesson_reports;
delete from lesson_rates;
delete from lessons;
delete from invoices;
delete from enrollments;
delete from class_student_pricing;
delete from class_tutor_rates;
delete from classes;
delete from profiles;
delete from auth.identities where user_id in (select id from auth.users where email like '%@stargeneration.demo');
delete from auth.users where email like '%@stargeneration.demo';

-- GoTrue cannot read NULL in its token columns, so every one of them is set to ''.
-- Accounts: 1 admin, 2 tutors, 3 students.
with people (id, email, role, full_name) as (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'admin@stargeneration.demo', 'admin', 'Alya Pratama'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'rina@stargeneration.demo',  'tutor', 'Rina Kusuma'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'dimas@stargeneration.demo', 'tutor', 'Dimas Wijaya'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'nadia@stargeneration.demo', 'student', 'Nadia Putri'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'bagas@stargeneration.demo', 'student', 'Bagas Santoso'),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'citra@stargeneration.demo', 'student', 'Citra Lestari')
), users as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    crypt('StarGen!2026', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', ''
  from people returning id, email
), identities as (
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  select gen_random_uuid(), id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
  from users
)
insert into profiles (id, role, full_name)
select id, role::user_role, full_name from people;

-- One class: capacity 2, student price Rp750.000, tutor rate Rp100.000 per hour.
insert into classes (id, title, description, capacity, tutor_id) values
  ('c0000000-0000-4000-8000-000000000001', 'Cambridge IGCSE Mathematics',
   'Weekly group sessions covering the IGCSE Mathematics syllabus with guided practice.', 2,
   'a0000000-0000-4000-8000-000000000002');
insert into class_student_pricing values ('c0000000-0000-4000-8000-000000000001', 750000);
insert into class_tutor_rates values ('c0000000-0000-4000-8000-000000000001', 100000);

-- Nadia holds one paid seat. Bagas stays free to take the second seat; Citra then sees "class full".
insert into enrollments (id, class_id, student_id) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004');
insert into invoices (id, enrollment_id, class_id, student_id, amount, status, paid_at, paid_by, payment_ref) values
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000004', 750000, 'paid', now(), 'a0000000-0000-4000-8000-000000000001', 'Demo transfer');
insert into audit_events (actor_id, action, entity_id, details) values
  ('a0000000-0000-4000-8000-000000000001', 'invoice.paid', 'f0000000-0000-4000-8000-000000000001', '{"payment_ref":"Demo transfer"}');

-- Lessons (the trigger copies the tutor and snapshots the hourly rate). Times are on the hour.
insert into lessons (id, class_id, tutor_id, starts_at, ends_at) values
  ('10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   date_trunc('hour', now()) + interval '48 hours', date_trunc('hour', now()) + interval '49 hours'),           -- upcoming
  ('10000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   date_trunc('hour', now()) - interval '72 hours', date_trunc('hour', now()) - interval '71 hours'),           -- ended, report pending
  ('10000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   date_trunc('hour', now()) - interval '168 hours', date_trunc('hour', now()) - interval '166 hours 30 minutes'); -- 90 min, approved

insert into lesson_reports (lesson_id, topic, progress, next_steps) values
  ('10000000-0000-4000-8000-000000000002', 'Quadratic equations',
   'The group completed the worked examples and most students solved the practice set unaided.',
   'Review the remaining practice questions and prepare one question for the next session.'),
  ('10000000-0000-4000-8000-000000000003', 'Simultaneous equations',
   'The group completed the worked examples and most students solved the practice set unaided.',
   'Review the remaining practice questions and prepare one question for the next session.');

-- Approve the third lesson exactly as approve_report() does: 90 min x Rp100.000/h = Rp150.000, once.
update lesson_reports set status = 'approved', approved_at = now(), approved_by = 'a0000000-0000-4000-8000-000000000001'
  where lesson_id = '10000000-0000-4000-8000-000000000003';
update lessons set approved_at = now() where id = '10000000-0000-4000-8000-000000000003';
insert into tutor_earnings (lesson_id, tutor_id, duration_minutes, hourly_rate, amount)
  select l.id, l.tutor_id, l.duration_minutes, r.hourly_rate, round(r.hourly_rate::numeric * l.duration_minutes / 60)::int
  from lessons l join lesson_rates r on r.lesson_id = l.id
  where l.id = '10000000-0000-4000-8000-000000000003';
insert into audit_events (actor_id, action, entity_id) values
  ('a0000000-0000-4000-8000-000000000001', 'report.approved', '10000000-0000-4000-8000-000000000003');
