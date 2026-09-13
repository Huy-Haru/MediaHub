import fs from "node:fs/promises";
import pg from "pg";
import { createHash } from "node:crypto";
import { loadEnvironment } from "../dist/config/env.js";
loadEnvironment();
const client = new pg.Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  await client.connect();
  await client.query("begin");
  await client.query(
    "set local lock_timeout='5s'; set local statement_timeout='30s'",
  );
  const ledger = await client.query(
    "select to_regclass('public.mediahub_schema_migrations') as name",
  );
  for (const name of [
    "004_leads.sql",
    "005_content_and_communication.sql",
    "006_workflow_extensions.sql",
    "007_account_management.sql",
    "008_catalog_details.sql",
    "009_lead_attachments.sql",
    "010_profile_preferences.sql",
    "011_project_management.sql",
    "012_quotation_drafts.sql",
    "013_lead_project_conversion.sql",
    "014_support_and_payments.sql",
    "015_staff_account_management.sql",
    "016_creator_marketplace.sql",
    "017_marketplace_social.sql",
    "018_realtime_messenger.sql",
  ]) {
    const sql = await fs.readFile(
      new URL(`../../supabase/migrations/${name}`, import.meta.url),
      "utf8",
    );
    if (ledger.rows[0].name) {
      const prior = await client.query(
        "select checksum from public.mediahub_schema_migrations where name=$1",
        [name],
      );
      if (prior.rowCount) {
        if (
          prior.rows[0].checksum !==
          createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex")
        )
          throw new Error(`Applied migration checksum changed: ${name}`);
        console.log(`Verified applied migration ${name}`);
        continue;
      }
    }
    await client.query(
      sql.replace(/^\s*begin;\s*/i, "").replace(/\s*commit;\s*$/i, ""),
    );
    console.log(`Validated migration ${name}`);
  }
  const test = await fs.readFile(
    new URL("../test/workflow.sql", import.meta.url),
    "utf8",
  );
  await client.query(test);
  console.log(
    "Validated transactional workflow, ownership and RLS assertions.",
  );
  await client.query("rollback");
  console.log("Rolled back all schema changes and test data.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(
    "Migration check failed:",
    error.code ?? error.name,
    error.message,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
