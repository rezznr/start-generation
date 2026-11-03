// Business-rule tests against the real Supabase project, using authenticated clients per role.
// Prerequisite: `pnpm db:migrate && pnpm db:seed`. Each test creates its own classes, so runs do not depend on seed state.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const PASSWORD = "StarGen!2026";
const users: Record<string, SupabaseClient> = {};
const ids: Record<string, string> = {};

async function login(name: string) {
  const c = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email: `${name}@stargeneration.demo`, password: PASSWORD });
  if (error) throw error;
  users[name] = c; ids[name] = data.user.id;
}
const ok = <T>(r: { data: T; error: { message: string } | null }) => { expect(r.error?.message).toBeUndefined(); return r.data as NonNullable<T>; };
const failed = (r: { error: { message: string } | null }) => { expect(r.error).not.toBeNull(); return r.error!.message; };

let n = 0;
async function newClass(capacity: number, tutor = "rina") {
  return ok(await users.admin.rpc("save_class", {
    p_id: null, p_title: `Test class ${Date.now()}-${n++}`, p_description: "", p_capacity: capacity,
    p_tutor_id: ids[tutor], p_student_price: 500000, p_tutor_rate: 100000,
  })) as string;
}
// Lessons are placed in unique past or future slots so tests never collide with each other or the seed.
// A random hour per run, so repeated runs never collide with lessons left by earlier ones.
const RUN_HOUR = Math.floor(Math.random() * 20);
const slot = (dayOffset: number, minutes = 60, hour = RUN_HOUR) => {
  const d = new Date(); d.setUTCHours(hour, 0, 0, 0); d.setUTCDate(d.getUTCDate() + dayOffset);
  return { starts_at: d.toISOString(), ends_at: new Date(d.getTime() + minutes * 60_000).toISOString() };
};
let dayCounter = -400 - Math.floor(Math.random() * 3000);
const nextDay = () => (dayCounter -= 2);
async function lesson(classId: string, s: ReturnType<typeof slot>) {
  return ok(await users.rina.from("lessons").insert({ class_id: classId, ...s }).select("id").single()).id as string;
}
const report = { topic: "Topic", progress: "Progress made", next_steps: "Next steps" };

beforeAll(async () => {
  await Promise.all(["admin", "rina", "dimas", "nadia", "bagas", "citra"].map(login));
}, 60_000);

describe("enrollment", () => {
  it("rejects duplicate enrollment", async () => {
    const c = await newClass(5);
    ok(await users.bagas.rpc("enroll", { p_class_id: c }));
    expect(failed(await users.bagas.rpc("enroll", { p_class_id: c }))).toMatch(/already enrolled/);
  });

  it("gives exactly one winner when two students race for the last seat", async () => {
    const c = await newClass(1);
    const results = await Promise.all([users.bagas, users.citra].map((u) => u.rpc("enroll", { p_class_id: c })));
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    const loser = results.find((r) => r.error)!;
    expect(loser.error!.message).toMatch(/full/);
    expect(ok(await users.admin.from("enrollments").select("id").eq("class_id", c))).toHaveLength(1);
    expect(ok(await users.admin.from("invoices").select("id").eq("class_id", c))).toHaveLength(1);
  });

  it("creates enrollment and invoice together with the price snapshot, or neither", async () => {
    const c = await newClass(1);
    ok(await users.bagas.rpc("enroll", { p_class_id: c }));
    failed(await users.citra.rpc("enroll", { p_class_id: c }));
    expect(ok(await users.admin.from("enrollments").select("id").eq("class_id", c))).toHaveLength(1);
    const inv = ok(await users.admin.from("invoices").select("amount, status").eq("class_id", c));
    expect(inv).toEqual([{ amount: 500000, status: "unpaid" }]);
  });

  it("blocks direct inserts that bypass the transaction", async () => {
    const c = await newClass(5);
    failed(await users.bagas.from("enrollments").insert({ class_id: c, student_id: ids.bagas }));
    failed(await users.bagas.from("invoices").insert({ class_id: c, student_id: ids.bagas, amount: 0, enrollment_id: crypto.randomUUID() }));
  });

  it("cannot lower capacity below reserved seats", async () => {
    const c = await newClass(3);
    ok(await users.bagas.rpc("enroll", { p_class_id: c }));
    ok(await users.citra.rpc("enroll", { p_class_id: c }));
    const r = await users.admin.rpc("save_class", { p_id: c, p_title: "x", p_description: "", p_capacity: 1, p_tutor_id: ids.rina, p_student_price: 1, p_tutor_rate: 1 });
    expect(failed(r)).toMatch(/Capacity cannot be lower/);
  });

  it("locks the tutor once the class has lessons", async () => {
    const c = await newClass(3);
    await lesson(c, slot(nextDay()));
    const r = await users.admin.rpc("save_class", { p_id: c, p_title: "x", p_description: "", p_capacity: 3, p_tutor_id: ids.dimas, p_student_price: 1, p_tutor_rate: 1 });
    expect(failed(r)).toMatch(/tutor cannot be changed/);
  });
});

describe("payment", () => {
  it("is admin only and idempotent", async () => {
    const c = await newClass(3);
    const inv = ok(await users.bagas.rpc("enroll", { p_class_id: c })) as string;
    failed(await users.bagas.rpc("mark_invoice_paid", { p_invoice_id: inv }));
    failed(await users.rina.rpc("mark_invoice_paid", { p_invoice_id: inv }));
    ok(await users.admin.rpc("mark_invoice_paid", { p_invoice_id: inv, p_ref: "ref" }));
    const first = ok(await users.admin.from("invoices").select("paid_at, paid_by").eq("id", inv).single());
    ok(await users.admin.rpc("mark_invoice_paid", { p_invoice_id: inv, p_ref: "again" }));
    expect(ok(await users.admin.from("invoices").select("paid_at, paid_by, payment_ref").eq("id", inv).single()))
      .toEqual({ ...first, payment_ref: "ref" });
    expect(ok(await users.admin.from("audit_events").select("id").eq("entity_id", inv))).toHaveLength(1);
  });

  it("does not let a student edit their own invoice", async () => {
    const c = await newClass(3);
    const inv = ok(await users.bagas.rpc("enroll", { p_class_id: c })) as string;
    const r = await users.bagas.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv).select();
    expect(r.data ?? []).toHaveLength(0);
    expect(ok(await users.admin.from("invoices").select("status").eq("id", inv).single()).status).toBe("unpaid");
  });
});

describe("access control", () => {
  it("hides schedule from unpaid students and shows it after payment", async () => {
    const c = await newClass(3);
    await lesson(c, slot(nextDay()));
    const inv = ok(await users.bagas.rpc("enroll", { p_class_id: c })) as string;
    expect(ok(await users.bagas.from("lessons").select("id").eq("class_id", c))).toHaveLength(0);
    ok(await users.admin.rpc("mark_invoice_paid", { p_invoice_id: inv }));
    expect(ok(await users.bagas.from("lessons").select("id").eq("class_id", c))).toHaveLength(1);
  });

  it("hides pending reports from paid students and other classes' reports from everyone else", async () => {
    const c = await newClass(3);
    const l = await lesson(c, slot(nextDay()));
    const inv = ok(await users.bagas.rpc("enroll", { p_class_id: c })) as string;
    ok(await users.admin.rpc("mark_invoice_paid", { p_invoice_id: inv }));
    ok(await users.rina.from("lesson_reports").insert({ lesson_id: l, ...report }));
    expect(ok(await users.bagas.from("lesson_reports").select("id").eq("lesson_id", l))).toHaveLength(0);
    ok(await users.admin.rpc("approve_report", { p_lesson_id: l }));
    expect(ok(await users.bagas.from("lesson_reports").select("id").eq("lesson_id", l))).toHaveLength(1);
    expect(ok(await users.citra.from("lesson_reports").select("id").eq("lesson_id", l))).toHaveLength(0);
  });

  it("keeps student prices and other tutors' classes away from tutors", async () => {
    const c = await newClass(3);
    expect(ok(await users.rina.from("class_student_pricing").select("*"))).toHaveLength(0);
    expect(ok(await users.rina.from("invoices").select("id"))).toHaveLength(0);
    expect(ok(await users.rina.from("enrollments").select("id"))).toHaveLength(0);
    expect(ok(await users.rina.rpc("catalog"))).toHaveLength(0);
    expect(ok(await users.dimas.from("classes").select("id").eq("id", c))).toHaveLength(0);
    expect(ok(await users.dimas.from("class_tutor_rates").select("*").eq("class_id", c))).toHaveLength(0);
    expect(ok(await users.dimas.from("tutor_earnings").select("id"))).toHaveLength(0);
  });

  it("does not let users change their own role", async () => {
    const r = await users.bagas.from("profiles").update({ role: "admin" }).eq("id", ids.bagas).select();
    expect(r.error ?? (r.data ?? []).length === 0).toBeTruthy();
    expect(ok(await users.admin.from("profiles").select("role").eq("id", ids.bagas).single()).role).toBe("student");
  });
});

describe("scheduling", () => {
  it("rejects a lesson that ends before it starts", async () => {
    const c = await newClass(3);
    const s = slot(nextDay());
    failed(await users.rina.from("lessons").insert({ class_id: c, starts_at: s.ends_at, ends_at: s.starts_at }));
  });

  it("rejects overlaps across classes, allows adjacent lessons, and survives concurrent inserts", async () => {
    const a = await newClass(3), b = await newClass(3);
    const day = nextDay();
    await lesson(a, slot(day, 60, RUN_HOUR)); // one hour
    failed(await users.rina.from("lessons").insert({ class_id: b, ...slot(day, 60, RUN_HOUR) }));
    await lesson(b, slot(day, 60, RUN_HOUR + 1)); // starts exactly when the first ends
    const race = slot(nextDay());
    const results = await Promise.all([a, b].map((c) => users.rina.from("lessons").insert({ class_id: c, ...race })));
    expect(results.filter((r) => !r.error)).toHaveLength(1);
  });

  it("rejects lessons for a class the tutor is not assigned to", async () => {
    const c = await newClass(3, "dimas");
    failed(await users.rina.from("lessons").insert({ class_id: c, ...slot(nextDay()) }));
  });

  it("rejects a report before the lesson has ended", async () => {
    const c = await newClass(3);
    const l = await lesson(c, slot(30 + n));
    failed(await users.rina.from("lesson_reports").insert({ lesson_id: l, ...report }));
  });
});

describe("approval and earnings", () => {
  async function endedLesson(c: string, minutes: number) {
    const l = await lesson(c, slot(nextDay(), minutes));
    ok(await users.rina.from("lesson_reports").insert({ lesson_id: l, ...report }));
    return l;
  }

  it("pays Rp150.000 for 90 minutes at Rp100.000 per hour", async () => {
    const c = await newClass(3);
    const l = await endedLesson(c, 90);
    expect(ok(await users.admin.rpc("preview_earning", { p_lesson_id: l }))).toBe(150000);
    ok(await users.admin.rpc("approve_report", { p_lesson_id: l }));
    expect(ok(await users.admin.from("tutor_earnings").select("amount").eq("lesson_id", l).single()).amount).toBe(150000);
  });

  it("does not let a tutor approve", async () => {
    const c = await newClass(3);
    const l = await endedLesson(c, 60);
    failed(await users.rina.rpc("approve_report", { p_lesson_id: l }));
    const r = await users.rina.from("lesson_reports").update({ status: "approved" }).eq("lesson_id", l).select();
    expect(r.error ?? (r.data ?? []).length === 0).toBeTruthy();
  });

  it("records one earning under repeated and concurrent approval", async () => {
    const c = await newClass(3);
    const l = await endedLesson(c, 60);
    const results = await Promise.all([1, 2, 3].map(() => users.admin.rpc("approve_report", { p_lesson_id: l })));
    results.forEach((r) => expect(r.error).toBeNull());
    ok(await users.admin.rpc("approve_report", { p_lesson_id: l }));
    expect(ok(await users.admin.from("tutor_earnings").select("id").eq("lesson_id", l))).toHaveLength(1);
    expect(ok(await users.admin.from("audit_events").select("id").eq("entity_id", l))).toHaveLength(1);
  });

  it("does not change earnings with the number of students", async () => {
    const c = await newClass(3);
    ok(await users.bagas.rpc("enroll", { p_class_id: c }));
    ok(await users.citra.rpc("enroll", { p_class_id: c }));
    const l = await endedLesson(c, 60);
    ok(await users.admin.rpc("approve_report", { p_lesson_id: l }));
    expect(ok(await users.admin.from("tutor_earnings").select("amount").eq("lesson_id", l).single()).amount).toBe(100000);
  });

  it("makes approved lessons and reports immutable", async () => {
    const c = await newClass(3);
    const l = await endedLesson(c, 60);
    ok(await users.admin.rpc("approve_report", { p_lesson_id: l }));
    const upd = await users.rina.from("lessons").update({ ends_at: new Date().toISOString() }).eq("id", l).select();
    expect(upd.error ?? (upd.data ?? []).length === 0).toBeTruthy();
    const del = await users.rina.from("lessons").delete().eq("id", l).select();
    expect(del.error ?? (del.data ?? []).length === 0).toBeTruthy();
    const rep = await users.rina.from("lesson_reports").update({ topic: "changed" }).eq("lesson_id", l).select();
    expect(rep.error ?? (rep.data ?? []).length === 0).toBeTruthy();
    expect(ok(await users.admin.from("lesson_reports").select("topic").eq("lesson_id", l).single()).topic).toBe("Topic");
  });
});
