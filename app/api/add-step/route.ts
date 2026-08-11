import { NextResponse } from "next/server";
import { hasuraAdminQuery } from "@/functions/shared/nhost-admin";

export async function POST(req: Request) {
  try {
    const { workflow_id, name, position, type, config } = await req.json();

    const addStepMutation = `
      mutation AddStep($workflow_id: uuid!, $name: String!, $position: Int!, $type: workflow_step_type!, $config: jsonb!) {
        insert_workflow_steps_one(object: { workflow_id: $workflow_id, name: $name, position: $position, type: $type, config: $config }) {
          id
          name
          position
          type
          config
        }
      }
    `;

    const res = await hasuraAdminQuery(addStepMutation, {
      workflow_id,
      name,
      position,
      type,
      config,
    });

    return NextResponse.json({ success: true, step: res.insert_workflow_steps_one });
  } catch (err: any) {
    console.error("Add step API error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
