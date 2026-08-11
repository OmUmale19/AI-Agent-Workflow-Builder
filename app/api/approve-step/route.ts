import { NextResponse } from "next/server";
import { hasuraAdminQuery } from "@/functions/shared/nhost-admin";
import { resumeWorkflowRun } from "@/functions/workflow-engine/executor";

export async function POST(req: Request) {
  try {
    const { step_run_id } = await req.json();

    if (!step_run_id) {
      return NextResponse.json(
        { success: false, message: "Missing step_run_id parameter." },
        { status: 400 }
      );
    }

    // 1. Fetch step_run details
    const getStepRunQuery = `
      query GetStepRunForApproval($step_run_id: uuid!) {
        step_runs_by_pk(id: $step_run_id) {
          id
          status
          workflow_run_id
        }
      }
    `;

    const data = await hasuraAdminQuery(getStepRunQuery, { step_run_id });
    const stepRun = data.step_runs_by_pk;

    if (!stepRun) {
      return NextResponse.json(
        { success: false, message: "Step run not found." },
        { status: 404 }
      );
    }

    // 2. Mark Step Run as Approved & Completed
    const approveMutation = `
      mutation ApproveStepRun($id: uuid!, $approved_at: timestamptz!) {
        update_step_runs_by_pk(
          pk_columns: { id: $id },
          _set: {
            status: "completed",
            approved_at: $approved_at
          }
        ) {
          id
        }
      }
    `;

    await hasuraAdminQuery(approveMutation, {
      id: step_run_id,
      approved_at: new Date().toISOString(),
    });

    // 3. Resume Workflow Run Execution
    const resumeResult = await resumeWorkflowRun(
      stepRun.workflow_run_id,
      step_run_id
    );

    return NextResponse.json({
      success: true,
      step_run_id,
      status: resumeResult.status,
      message: "Step approved successfully. Workflow execution resumed.",
    });
  } catch (err: any) {
    console.error("Approve step API error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to approve step." },
      { status: 500 }
    );
  }
}
