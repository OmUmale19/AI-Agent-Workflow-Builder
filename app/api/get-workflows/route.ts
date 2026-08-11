import { NextResponse } from "next/server";
import { hasuraAdminQuery } from "@/functions/shared/nhost-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get("org_id");

    if (!org_id) {
      return NextResponse.json({ success: false, workflows: [] }, { status: 400 });
    }

    const query = `
      query GetWorkflows($org_id: uuid!) {
        workflows(where: { org_id: { _eq: $org_id } }, order_by: { created_at: desc }) {
          id
          org_id
          name
          description
          created_at
          steps(order_by: { position: asc }) {
            id
            workflow_id
            name
            position
            type
            config
          }
        }
      }
    `;

    const res = await hasuraAdminQuery(query, { org_id });
    return NextResponse.json({ success: true, workflows: res.workflows || [] });
  } catch (err: any) {
    console.error("Get workflows API error:", err);
    return NextResponse.json({ success: false, message: err.message, workflows: [] }, { status: 500 });
  }
}
