import { NextResponse } from "next/server";
import { hasuraAdminQuery } from "@/functions/shared/nhost-admin";

export async function POST(req: Request) {
  try {
    const { org_id, name, description } = await req.json();

    if (!org_id || !name) {
      return NextResponse.json(
        { success: false, message: "Missing org_id or name" },
        { status: 400 }
      );
    }

    // 1. Create Workflow
    const createWfMutation = `
      mutation CreateWorkflow($org_id: uuid!, $name: String!, $description: String) {
        insert_workflows_one(object: { org_id: $org_id, name: $name, description: $description }) {
          id
          org_id
          name
          description
          created_at
        }
      }
    `;

    const wfRes = await hasuraAdminQuery(createWfMutation, { org_id, name, description });
    const newWf = wfRes.insert_workflows_one;

    if (!newWf?.id) {
      throw new Error("Failed to insert workflow.");
    }

    const workflow_id = newWf.id;

    // 2. Add 4 default sample steps
    const addStepMutation = `
      mutation AddStep($workflow_id: uuid!, $name: String!, $position: Int!, $type: workflow_step_type!, $config: jsonb!) {
        insert_workflow_steps_one(object: { workflow_id: $workflow_id, name: $name, position: $position, type: $type, config: $config }) {
          id
        }
      }
    `;

    await hasuraAdminQuery(addStepMutation, {
      workflow_id,
      name: "Analyze Task with Gemini AI",
      position: 1,
      type: "llm_call",
      config: { prompt: "Generate a summary plan for automating agent workflows." },
    });

    await hasuraAdminQuery(addStepMutation, {
      workflow_id,
      name: "Fetch Target Data via HTTP",
      position: 2,
      type: "http_request",
      config: { url: "https://httpbin.org/json", method: "GET" },
    });

    await hasuraAdminQuery(addStepMutation, {
      workflow_id,
      name: "Evaluate Condition",
      position: 3,
      type: "conditional_branch",
      config: { condition_field: "llm_output", expected_value: "plan" },
    });

    await hasuraAdminQuery(addStepMutation, {
      workflow_id,
      name: "Manager Approval Gate",
      position: 4,
      type: "approval_gate",
      config: { approver_role: "editor", message: "Approval needed before committing changes." },
    });

    // 3. Add Manual Trigger
    const addTriggerMutation = `
      mutation AddTrigger($workflow_id: uuid!) {
        insert_workflow_triggers_one(object: { workflow_id: $workflow_id, type: manual }) {
          id
        }
      }
    `;
    await hasuraAdminQuery(addTriggerMutation, { workflow_id });

    return NextResponse.json({ success: true, workflow: newWf });
  } catch (err: any) {
    console.error("Create workflow API error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}
