// Applies supabase/migrations/*.sql in order. Usage: pnpm db:migrate
// Not idempotent by design: it drops and recreates the public schema so a fresh setup is reproducible.
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
await client.query("drop schema public cascade; create schema public;");
await client.query("grant usage on schema public to postgres, anon, authenticated, service_role;");
await client.query("grant all on schema public to postgres, service_role;");
for (const f of readdirSync("supabase/migrations").sort()) {
  console.log("applying", f);
  await client.query(readFileSync(`supabase/migrations/${f}`, "utf8"));
}
await client.end();
