export type WorkflowStepType =
  | "llm_call"
  | "http_request"
  | "db_write"
  | "notify"
  | "conditional_branch"
  | "approval_gate";

export interface LLMCallConfig {
  prompt: string;
  model?: string;
}

export interface HttpRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
}

export interface DbWriteConfig {
  table: string;
  payload: Record<string, any>;
}

export interface NotifyConfig {
  channel: string;
  message: string;
}

export interface ConditionalBranchConfig {
  condition_field: string;
  operator: "equals" | "contains" | "greater_than" | "truthy";
  expected_value: string;
  true_step_position?: number;
  false_step_position?: number;
}

export interface ApprovalGateConfig {
  approver_role: "owner" | "editor";
  message: string;
}

export type StepConfig =
  | LLMCallConfig
  | HttpRequestConfig
  | DbWriteConfig
  | NotifyConfig
  | ConditionalBranchConfig
  | ApprovalGateConfig;

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  position: number;
  type: WorkflowStepType;
  config: StepConfig;
  created_at: string;
  updated_at: string;
}
