import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";
import { readFileSync } from "node:fs";

config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

// SQL migrations own public tables; Supabase owns auth tables. Prisma is an
// introspected client, not the schema migration authority for either schema.
const schemaText = readFileSync(
  new URL("./prisma/schema.prisma", import.meta.url),
  "utf8",
);
const externalObjects = (kind: "model" | "enum") =>
  [
    ...schemaText.matchAll(
      new RegExp(`^${kind} (\\w+) \\{([\\s\\S]*?)^\\}`, "gm"),
    ),
  ].map(
    ([, name, body]) =>
      `${body.match(/@@schema\("([^"]+)"\)/)?.[1] ?? "public"}.${body.match(/@@map\("([^"]+)"\)/)?.[1] ?? name}`,
  );

export default defineConfig({
  schema: "prisma/schema.prisma",
  experimental: { externalTables: true },
  tables: { external: externalObjects("model") },
  enums: { external: externalObjects("enum") },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
