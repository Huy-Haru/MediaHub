import pg from "pg";
import { z } from "zod";
import { loadEnvironment } from "../dist/config/env.js";
loadEnvironment();
const position = process.argv.indexOf("--email");
const email = z
  .email()
  .parse(position < 0 ? undefined : process.argv[position + 1])
  .toLowerCase();
const client = new pg.Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  await client.connect();
  await client.query("begin");
  await client.query("select pg_advisory_xact_lock(736231928)");
  const existing = await client.query(
    "select id from public.profiles where role='ADMIN' and active limit 1",
  );
  if (existing.rowCount)
    throw new Error(
      "An active administrator already exists. Use the authenticated admin UI to manage roles.",
    );
  const target = await client.query(
    "select id from public.profiles where lower(email)=$1 and active for update",
    [email],
  );
  if (target.rowCount !== 1)
    throw new Error(
      "Exactly one active registered account must match this email.",
    );
  await client.query("update public.profiles set role='ADMIN' where id=$1", [
    target.rows[0].id,
  ]);
  await client.query(
    "insert into public.audit_logs(actor_id,action,entity,entity_id) values($1,'BOOTSTRAP_ADMIN','profiles',$1)",
    [target.rows[0].id],
  );
  await client.query("commit");
  console.log(
    "First administrator activated for the explicitly selected account.",
  );
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
