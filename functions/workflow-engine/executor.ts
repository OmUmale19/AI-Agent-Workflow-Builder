import { hasuraAdminQuery } from "../shared/nhost-admin";
import { callGeminiLLM } from "../shared/gemini";

export interface ExecutionContext {
  workflow_run_id: string;
  trigger_type: string;
  triggered_by?: string;
  input: Record<string, any>;
}

export async function executeWorkflowRun(
  workflow_id: string,
  context: ExecutionContext
) {
  // 1. Fetch Workflow, Steps & Org Quota
  const wfQuery = `
    query GetWorkflowInfo($workflow_id: uuid!) {
      workflows_by_pk(id: $workflow_id) {
        id
        org_id
        name
        is_active
        organization {
          id
          calls_used
          calls_allowed
        }
        steps(order_by: { position: asc }) {
          id
          name
          position
          type
          config
        }
      }
    }
  `;

  const data = await hasuraAdminQuery(wfQuery, { workflow_id });
  const workflow = data.workflows_by_pk;

  if (!workflow) {
    throw new Error(`Workflow with ID ${workflow_id} not found.`);
  }

  const org = workflow.organization;
  if (org && org.calls_used >= org.calls_allowed) {
    throw new Error(`Usage quota exceeded for organization (${org.calls_used}/${org.calls_allowed}).`);
  }

  // 2. Create Workflow Run record
  const createRunMutation = `
    mutation CreateRun($object: workflow_runs_insert_input!) {
      insert_workflow_runs_one(object: $object) {
        id
        status
      }
    }
  `;

  const runRes = await hasuraAdminQuery(createRunMutation, {
    object: {
      workflow_id,
      triggered_by: context.triggered_by || null,
      trigger_type: context.trigger_type || "manual",
      status: "running",
      input: context.input || {},
      started_at: new Date().toISOString(),
    },
  });

  const workflow_run_id = runRes.insert_workflow_runs_one.id;
  const steps = workflow.steps || [];

  // 3. Create initial Step Run records
  for (const step of steps) {
    const createStepRunMutation = `
      mutation CreateStepRun($object: step_runs_insert_input!) {
        insert_step_runs_one(object: $object) {
          id
        }
      }
    `;
    await hasuraAdminQuery(createStepRunMutation, {
      object: {
        workflow_run_id,
        workflow_step_id: step.id,
        status: "pending",
        attempt_count: 0,
      },
    });
  }

  // 4. Sequential Step Execution
  return await processSteps(workflow_run_id, workflow.org_id, steps, 0, context.input || {});
}

export async function resumeWorkflowRun(
  workflow_run_id: string,
  approved_step_run_id: string
) {
  // Fetch run details & step runs
  const query = `
    query GetRunDetails($workflow_run_id: uuid!) {
      workflow_runs_by_pk(id: $workflow_run_id) {
        id
        workflow_id
        input
        workflow {
          org_id
          steps(order_by: { position: asc }) {
            id
            name
            position
            type
            config
          }
        }
        step_runs(order_by: { created_at: asc }) {
          id
          workflow_step_id
          status
          output
        }
      }
    }
  `;

  const data = await hasuraAdminQuery(query, { workflow_run_id });
  const run = data.workflow_runs_by_pk;
  if (!run) throw new Error("Workflow run not found.");

  const steps = run.workflow.steps || [];
  const approvedStepRun = (run.step_runs || []).find(
    (sr: any) => sr.id === approved_step_run_id
  );

  if (!approvedStepRun) throw new Error("Approved step run not found.");

  const approvedStepIndex = steps.findIndex(
    (s: any) => s.id === approvedStepRun.workflow_step_id
  );

  // Resume workflow run status to running
  await hasuraAdminQuery(
    `mutation UpdateRunStatus($id: uuid!) {
      update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: "running"}) { id }
    }`,
    { id: workflow_run_id }
  );

  // Accumulate previous outputs
  let cumulativeContext = run.input || {};
  for (const sr of run.step_runs || []) {
    if (sr.output) {
      cumulativeContext = { ...cumulativeContext, ...sr.output };
    }
  }

  // Continue from next step
  return await processSteps(
    workflow_run_id,
    run.workflow.org_id,
    steps,
    approvedStepIndex + 1,
    cumulativeContext
  );
}

async function processSteps(
  workflow_run_id: string,
  org_id: string,
  steps: any[],
  startIndex: number,
  initialInput: Record<string, any>
) {
  let stepContext = { ...initialInput };

  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];
    const config = step.config || {};

    // Get step_run record
    const getSrQuery = `
      query GetStepRun($workflow_run_id: uuid!, $workflow_step_id: uuid!) {
        step_runs(where: { workflow_run_id: { _eq: $workflow_run_id }, workflow_step_id: { _eq: $workflow_step_id } }) {
          id
          attempt_count
        }
      }
    `;
    const srData = await hasuraAdminQuery(getSrQuery, {
      workflow_run_id,
      workflow_step_id: step.id,
    });
    const step_run_id = srData.step_runs?.[0]?.id;

    if (!step_run_id) continue;

    // Update step status to running
    await updateStepRun(step_run_id, {
      status: "running",
      input: stepContext,
      started_at: new Date().toISOString(),
      attempt_count: 1,
    });

    try {
      let stepOutput: Record<string, any> = {};

      if (step.type === "llm_call") {
        const prompt = config.prompt || stepContext.prompt || "Default LLM Prompt";
        const llmResult = await callGeminiLLM(prompt, config.model);
        stepOutput = { llm_output: llmResult.text, model: llmResult.model, latency_ms: llmResult.latency_ms };
      } else if (step.type === "http_request") {
        stepOutput = await executeHttpRequestWithRetry(config, stepContext);
      } else if (step.type === "db_write") {
        stepOutput = { db_write: "success", table: config.table || "default_table", record_id: "rec_" + Date.now() };
      } else if (step.type === "notify") {
        stepOutput = { notify: "sent", channel: config.channel || "slack", message: config.message || "Workflow notification" };
      } else if (step.type === "conditional_branch") {
        const fieldVal = stepContext[config.condition_field || "llm_output"] || stepContext.llm_output || "";
        const expected = config.expected_value || "";
        const isMatch = String(fieldVal).toLowerCase().includes(String(expected).toLowerCase());
        stepOutput = { condition_met: isMatch, evaluated_field: config.condition_field, field_value: fieldVal };
      } else if (step.type === "approval_gate") {
        // PAUSE RUN AT APPROVAL GATE
        await updateStepRun(step_run_id, {
          status: "paused",
          output: { message: config.message || "Awaiting approval to proceed." },
        });

        await hasuraAdminQuery(
          `mutation PauseRun($id: uuid!) {
            update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: "paused"}) { id }
          }`,
          { id: workflow_run_id }
        );

        return {
          success: true,
          workflow_run_id,
          status: "paused",
          message: `Workflow paused at step "${step.name}". Approval required.`,
        };
      }

      // Mark step completed
      await updateStepRun(step_run_id, {
        status: "completed",
        output: stepOutput,
        completed_at: new Date().toISOString(),
      });

      stepContext = { ...stepContext, ...stepOutput };
    } catch (err: any) {
      await updateStepRun(step_run_id, {
        status: "failed",
        error: err.message || "Step execution failed",
        completed_at: new Date().toISOString(),
      });

      await hasuraAdminQuery(
        `mutation FailRun($id: uuid!, $err: String!) {
          update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: "failed", error: $err}) { id }
        }`,
        { id: workflow_run_id, err: err.message }
      );

      throw err;
    }
  }

  // 5. Complete Workflow Run & Increment Quota
  await hasuraAdminQuery(
    `mutation CompleteRun($id: uuid!) {
      update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: "completed", completed_at: "${new Date().toISOString()}"}) { id }
    }`,
    { id: workflow_run_id }
  );

  // Increment calls_used
  await hasuraAdminQuery(
    `mutation IncrementQuota($org_id: uuid!) {
      update_organizations_by_pk(pk_columns: {id: $org_id}, _inc: {calls_used: 1}) { id }
    }`,
    { org_id }
  );

  return {
    success: true,
    workflow_run_id,
    status: "completed",
    message: "Workflow run completed successfully.",
  };
}

async function executeHttpRequestWithRetry(config: any, context: any, maxRetries = 2) {
  const url = config.url || "https://httpbin.org/json";
  const method = config.method || "GET";
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(config.headers || {}) },
        body: method !== "GET" ? JSON.stringify(config.body || context) : undefined,
      });

      if (res.ok) {
        const body = await res.json().catch(() => ({ status: res.statusText }));
        return { http_status: res.status, data: body, attempts: attempt };
      }
    } catch (err) {
      if (attempt > maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error(`HTTP Request failed after ${maxRetries} retries.`);
}

async function updateStepRun(id: string, fields: Record<string, any>) {
  const mutation = `
    mutation UpdateStepRun($id: uuid!, $set: step_runs_set_input!) {
      update_step_runs_by_pk(pk_columns: {id: $id}, _set: $set) {
        id
      }
    }
  `;
  await hasuraAdminQuery(mutation, { id, set: fields });
}
