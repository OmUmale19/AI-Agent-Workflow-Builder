import { NextResponse } from "next/server";
import { executeWorkflowRun } from "@/functions/workflow-engine/executor";

export async function POST(req: Request) {
  try {
    const { workflow_id, input } = await req.json();

    if (!workflow_id) {
      return NextResponse.json({ success: false, message: "Missing workflow_id" }, { status: 400 });
    }

    const result = await executeWorkflowRun(workflow_id, {
      workflow_run_id: "",
      trigger_type: "manual",
      input: input || {},
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Trigger run API error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
