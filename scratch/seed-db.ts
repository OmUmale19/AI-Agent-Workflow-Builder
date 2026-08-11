import fs from "fs";
import path from "path";
import { hasuraAdminQuery } from "../functions/shared/nhost-admin";

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    for (const line of envConfig.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
} catch (e) {}

async function seed() {
  const seedOrgsMutation = `
    mutation SeedOrgs {
      insert_organizations(
        objects: [
          { id: "11111111-1111-1111-1111-111111111111", name: "Org A (Acme Corp)", calls_used: 0, calls_allowed: 1000 },
          { id: "22222222-2222-2222-2222-222222222222", name: "Org B (Stark Tech)", calls_used: 0, calls_allowed: 1000 }
        ],
        on_conflict: { constraint: organizations_pkey, update_columns: [name] }
      ) {
        affected_rows
      }
    }
  `;

  try {
    const res = await hasuraAdminQuery(seedOrgsMutation);
    console.log("SUCCESS! Seeded Organizations:", JSON.stringify(res));
  } catch (err) {
    console.error("Seed error:", err);
  }
}

seed();
