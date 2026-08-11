import fs from "fs";
import path from "path";

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

const adminSecret = process.env.NHOST_ADMIN_SECRET || process.env.NEXT_PUBLIC_NHOST_ADMIN_SECRET;
const metadataUrl = "https://hrnmyjgzlqolghdbwkqh.hasura.ap-south-1.nhost.run/v1/metadata";

async function trackRelationships() {
  const reqs = [
    {
      type: "pg_create_array_relationship",
      args: {
        source: "default",
        table: { schema: "public", name: "workflows" },
        name: "steps",
        using: {
          foreign_key_constraint_on: {
            table: { schema: "public", name: "workflow_steps" },
            column: "workflow_id"
          }
        }
      }
    },
    {
      type: "pg_create_array_relationship",
      args: {
        source: "default",
        table: { schema: "public", name: "workflows" },
        name: "runs",
        using: {
          foreign_key_constraint_on: {
            table: { schema: "public", name: "workflow_runs" },
            column: "workflow_id"
          }
        }
      }
    },
    {
      type: "pg_create_array_relationship",
      args: {
        source: "default",
        table: { schema: "public", name: "workflow_runs" },
        name: "step_runs",
        using: {
          foreign_key_constraint_on: {
            table: { schema: "public", name: "step_runs" },
            column: "workflow_run_id"
          }
        }
      }
    }
  ];

  for (const req of reqs) {
    try {
      const res = await fetch(metadataUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": adminSecret || ""
        },
        body: JSON.stringify(req)
      });
      const json = await res.json();
      console.log(`Track ${req.args.name}:`, JSON.stringify(json));
    } catch (err: any) {
      console.error(err);
    }
  }
}

trackRelationships();
