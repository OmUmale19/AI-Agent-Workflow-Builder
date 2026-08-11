export type WorkflowTriggerType =
  | "manual"
  | "webhook"
  | "scheduled"
  | "database_event";

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  type: WorkflowTriggerType;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}
