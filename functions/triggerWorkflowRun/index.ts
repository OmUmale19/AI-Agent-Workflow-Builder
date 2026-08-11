import { Request, Response } from "express";
import { executeWorkflowRun } from "../workflow-engine/executor";

export default async function handler(req: Request, res: Response) {
  try {
    const { action, input: actionInput } = req.body || {};
    const workflow_id = actionInput?.workflow_id || req.body?.workflow_id || req.query?.workflow_id;
    let inputPayload = actionInput?.input || {};

    if (typeof inputPayload === "string") {
      try {
        inputPayload = JSON.parse(inputPayload);
      } catch {
        inputPayload = { prompt: inputPayload };
      }
    }

    if (!workflow_id) {
      return res.status(400).json({
        success: false,
        workflow_run_id: "",
        status: "failed",
        message: "Missing workflow_id parameter.",
      });
    }

    const sessionVars = req.body?.session_variables || {};
    const userId = sessionVars["x-hasura-user-id"];

    const result = await executeWorkflowRun(workflow_id, {
      workflow_run_id: "",
      trigger_type: "manual",
      triggered_by: userId,
      input: inputPayload,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Error in triggerWorkflowRun function:", err);
    return res.status(500).json({
      success: false,
      workflow_run_id: "",
      status: "failed",
      message: err.message || "Failed to trigger workflow run.",
    });
  }
}
