// Provisions demo users through the Auth Admin API, then drives the real RPC and RLS paths
// as each user so the seed data is produced by the same rules the app enforces.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const DEMO_PASSWORD = "StarGen!2026";

const people = [
  ["admin@stargeneration.demo", "admin", "Alya Pratama"],
  ["rina@stargeneration.demo", "tutor", "Rina Kusuma"],
  ["dimas@stargeneration.demo", "tutor", "Dimas Wijaya"],
  ["nadia@stargeneration.demo", "student", "Nadia Putri"],
  ["bagas@stargeneration.demo", "student", "Bagas Santoso"],
  ["citra@stargeneration.demo", "student", "Citra Lestari"],
];

const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
for (const u of existing.users.filter((u) => u.email.endsWith("@stargeneration.demo"))) {
  ok(await admin.auth.admin.deleteUser(u.id));
}

const ids = {};
for (const [email, role, full_name] of people) {
  const { user } = ok(await admin.auth.admin.createUser({ email, password: DEMO_PASSWORD, email_confirm: true }));
  ids[email] = user.id;
  ok(await admin.from("profiles").insert({ id: user.id, role, full_name }));
}

async function as(email) {
  const c = createClient(url, key, { auth: { persistSession: false } });
  ok(await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD }));
  return c;
}
const [adm, rina, nadia] = await Promise.all(
  ["admin", "rina", "nadia"].map((n) => as(`${n}@stargeneration.demo`)),
);

const classId = ok(await adm.rpc("save_class", {
  p_id: null, p_title: "Cambridge IGCSE Mathematics",
  p_description: "Weekly group sessions covering the IGCSE Mathematics syllabus with guided practice.",
  p_capacity: 2, p_tutor_id: ids["rina@stargeneration.demo"], p_student_price: 750000, p_tutor_rate: 100000,
}));

// Nadia holds one paid seat. Bagas stays free to take the second seat, Citra then sees "class full".
const nadiaInvoice = ok(await nadia.rpc("enroll", { p_class_id: classId }));
ok(await adm.rpc("mark_invoice_paid", { p_invoice_id: nadiaInvoice, p_ref: "Demo transfer" }));

// Lessons are created as the tutor, so ownership, overlap and snapshot rules all apply.
const hour = 3600_000;
const top = Math.floor(Date.now() / hour) * hour;
const slot = (offsetHours, minutes) => ({
  class_id: classId,
  starts_at: new Date(top + offsetHours * hour).toISOString(),
  ends_at: new Date(top + offsetHours * hour + minutes * 60_000).toISOString(),
});
const upcoming = slot(48, 60);
const pending = slot(-72, 60);
const approved = slot(-168, 90); // 90 min x Rp100.000/h = Rp150.000
for (const l of [upcoming, pending, approved]) ok(await rina.from("lessons").insert(l));

const lessonAt = async (l) =>
  ok(await rina.from("lessons").select("id").eq("starts_at", l.starts_at).single()).id;
const report = (lesson_id, topic) => ({
  lesson_id, topic,
  progress: "The group completed the worked examples and most students solved the practice set unaided.",
  next_steps: "Review the remaining practice questions and prepare one question for the next session.",
});
const pendingId = await lessonAt(pending);
const approvedId = await lessonAt(approved);
ok(await rina.from("lesson_reports").insert(report(pendingId, "Quadratic equations")));
ok(await rina.from("lesson_reports").insert(report(approvedId, "Simultaneous equations")));
ok(await adm.rpc("approve_report", { p_lesson_id: approvedId }));

console.log(`Seeded. Password for every demo account: ${DEMO_PASSWORD}`);

