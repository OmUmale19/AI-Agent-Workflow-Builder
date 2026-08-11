import { WorkflowTriggerType } from "./trigger";
import { WorkflowStepType } from "./workflow-step";

export type WorkflowRunStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type StepRunStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "skipped";

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  triggered_by?: string;
  trigger_type: WorkflowTriggerType;
  status: WorkflowRunStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  step_runs?: StepRun[];
}

export interface StepRun {
  id: string;
  workflow_run_id: string;
  workflow_step_id: string;
  status: StepRunStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  attempt_count: number;
  approved_by?: string;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  workflow_step?: {
    name: string;
    type: WorkflowStepType;
    position: number;
  };
}
