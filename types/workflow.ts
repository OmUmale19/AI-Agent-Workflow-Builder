import { WorkflowStep } from "./workflow-step";
import { WorkflowTrigger } from "./trigger";
import { WorkflowRun } from "./run";

export interface Workflow {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  runs?: WorkflowRun[];
}
