import { gql } from "@apollo/client";
import { STEP_RUN_FIELDS } from "./fragments";

export const SUBSCRIBE_STEP_RUNS = gql`
  subscription SubscribeStepRuns($workflow_run_id: uuid!) {
    step_runs(
      where: { workflow_run_id: { _eq: $workflow_run_id } }
      order_by: { created_at: asc }
    ) {
      ...StepRunFields
    }
  }
  ${STEP_RUN_FIELDS}
`;

export const SUBSCRIBE_WORKFLOW_RUN = gql`
  subscription SubscribeWorkflowRun($id: uuid!) {
    workflow_runs_by_pk(id: $id) {
      id
      workflow_id
      status
      output
      error
      started_at
      completed_at
      step_runs(order_by: { created_at: asc }) {
        ...StepRunFields
      }
    }
  }
  ${STEP_RUN_FIELDS}
`;
