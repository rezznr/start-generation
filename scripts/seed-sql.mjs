// Runs supabase/seed.sql against SUPABASE_DB_URL. Usage: pnpm db:seed:sql
import { readFileSync } from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
await client.query(readFileSync("supabase/seed.sql", "utf8"));
await client.end();
console.log("Seeded from supabase/seed.sql. Password for every demo account: StarGen!2026");
