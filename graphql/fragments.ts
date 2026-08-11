import { gql } from "@apollo/client";

export const STEP_FIELDS = gql`
  fragment StepFields on workflow_steps {
    id
    workflow_id
    name
    position
    type
    config
    created_at
    updated_at
  }
`;

export const TRIGGER_FIELDS = gql`
  fragment TriggerFields on workflow_triggers {
    id
    workflow_id
    type
    config
    is_active
    created_at
  }
`;

export const STEP_RUN_FIELDS = gql`
  fragment StepRunFields on step_runs {
    id
    workflow_run_id
    workflow_step_id
    status
    input
    output
    error
    attempt_count
    approved_by
    approved_at
    started_at
    completed_at
    created_at
    workflow_step {
      id
      name
      type
      position
    }
  }
`;

export const RUN_FIELDS = gql`
  fragment RunFields on workflow_runs {
    id
    workflow_id
    triggered_by
    trigger_type
    status
    input
    output
    error
    started_at
    completed_at
    created_at
    step_runs(order_by: { created_at: asc }) {
      ...StepRunFields
    }
  }
  ${STEP_RUN_FIELDS}
`;
