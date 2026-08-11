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

async function check() {
  const query = `
    query GetWorkflows {
      workflows {
        id
        org_id
        name
        description
        steps {
          id
          name
          type
        }
      }
    }
  `;

  try {
    const res = await hasuraAdminQuery(query);
    console.log("DB Workflows:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Check error:", err);
  }
}

check();
