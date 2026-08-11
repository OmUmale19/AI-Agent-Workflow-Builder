import { Request, Response } from "express";
import { executeWorkflowRun } from "../workflow-engine/executor";

export default async function handler(req: Request, res: Response) {
  try {
    const workflow_id = (req.query.workflow_id || req.body?.workflow_id) as string;
    const webhookSecret = req.headers["x-webhook-secret"] || req.query.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return res.status(401).json({ error: "Invalid webhook secret authorization." });
    }

    if (!workflow_id) {
      return res.status(400).json({ error: "Missing required workflow_id parameter." });
    }

    const payload = req.body || {};

    const result = await executeWorkflowRun(workflow_id, {
      workflow_run_id: "",
      trigger_type: "webhook",
      input: payload,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Webhook trigger execution error:", err);
    return res.status(500).json({ error: err.message || "Failed to trigger webhook workflow." });
  }
}
