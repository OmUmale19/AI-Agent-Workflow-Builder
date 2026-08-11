import { NextResponse } from "next/server";
import { executeWorkflowRun } from "@/functions/workflow-engine/executor";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const workflow_id = url.searchParams.get("workflow_id") || body.workflow_id;
    const webhookSecret = req.headers.get("x-webhook-secret") || url.searchParams.get("secret");
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid webhook secret authorization." }, { status: 401 });
    }

    if (!workflow_id) {
      return NextResponse.json({ error: "Missing required workflow_id parameter." }, { status: 400 });
    }

    const result = await executeWorkflowRun(workflow_id, {
      workflow_run_id: "",
      trigger_type: "webhook",
      input: body,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Webhook route execution error:", err);
    return NextResponse.json({ error: err.message || "Failed to trigger webhook workflow." }, { status: 500 });
  }
}
