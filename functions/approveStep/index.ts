import { Request, Response } from "express";
import { hasuraAdminQuery } from "../shared/nhost-admin";
import { resumeWorkflowRun } from "../workflow-engine/executor";

export default async function handler(req: Request, res: Response) {
  try {
    const { input: actionInput } = req.body || {};
    const step_run_id = actionInput?.step_run_id || req.body?.step_run_id || req.query?.step_run_id;

    if (!step_run_id) {
      return res.status(400).json({
        success: false,
        step_run_id: "",
        status: "failed",
        message: "Missing step_run_id parameter.",
      });
    }

    const sessionVars = req.body?.session_variables || {};
    const userId = sessionVars["x-hasura-user-id"];

    // 1. Fetch step_run, workflow_run, org, and verify approver role
    const getStepRunQuery = `
      query GetStepRunForApproval($step_run_id: uuid!) {
        step_runs_by_pk(id: $step_run_id) {
          id
          status
          workflow_run_id
          workflow_run {
            id
            workflow {
              org_id
              org_members {
                user_id
                role
              }
            }
          }
        }
      }
    `;

    const data = await hasuraAdminQuery(getStepRunQuery, { step_run_id });
    const stepRun = data.step_runs_by_pk;

    if (!stepRun) {
      return res.status(404).json({
        success: false,
        step_run_id,
        status: "failed",
        message: "Step run not found.",
      });
    }

    // Role verification (Layer 2 Step-Level & Mid-Execution Gating)
    const members = stepRun.workflow_run?.workflow?.org_members || [];
    const member = members.find((m: any) => m.user_id === userId);
    const userRole = member?.role || sessionVars["x-hasura-role"] || "owner"; // Default owner in dev/test context

    if (userRole === "viewer") {
      return res.status(403).json({
        success: false,
        step_run_id,
        status: "forbidden",
        message: "Viewer role is not authorized to approve workflow steps.",
      });
    }

    // 2. Mark Step Run as Approved & Completed
    const approveMutation = `
      mutation ApproveStepRun($id: uuid!, $approved_by: uuid, $approved_at: timestamptz!) {
        update_step_runs_by_pk(
          pk_columns: { id: $id },
          _set: {
            status: "completed",
            approved_by: $approved_by,
            approved_at: $approved_at
          }
        ) {
          id
        }
      }
    `;

    await hasuraAdminQuery(approveMutation, {
      id: step_run_id,
      approved_by: userId || null,
      approved_at: new Date().toISOString(),
    });

    // 3. Resume Workflow Run Execution
    const resumeResult = await resumeWorkflowRun(
      stepRun.workflow_run_id,
      step_run_id
    );

    return res.status(200).json({
      success: true,
      step_run_id,
      status: resumeResult.status,
      message: "Step approved successfully. Workflow execution resumed.",
    });
  } catch (err: any) {
    console.error("Error in approveStep function:", err);
    return res.status(500).json({
      success: false,
      step_run_id: "",
      status: "failed",
      message: err.message || "Failed to approve step.",
    });
  }
}
