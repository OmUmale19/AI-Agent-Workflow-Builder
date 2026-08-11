import { gql } from "@apollo/client";
import { STEP_FIELDS, TRIGGER_FIELDS } from "./fragments";

export const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow(
    $org_id: uuid!
    $name: String!
    $description: String
  ) {
    insert_workflows_one(
      object: { org_id: $org_id, name: $name, description: $description }
    ) {
      id
      org_id
      name
      description
      is_active
      created_at
    }
  }
`;

export const ADD_WORKFLOW_STEP = gql`
  mutation AddWorkflowStep(
    $workflow_id: uuid!
    $name: String!
    $position: Int!
    $type: workflow_step_type!
    $config: jsonb!
  ) {
    insert_workflow_steps_one(
      object: {
        workflow_id: $workflow_id
        name: $name
        position: $position
        type: $type
        config: $config
      }
    ) {
      ...StepFields
    }
  }
  ${STEP_FIELDS}
`;

export const ADD_WORKFLOW_TRIGGER = gql`
  mutation AddWorkflowTrigger(
    $workflow_id: uuid!
    $type: workflow_trigger_type!
    $config: jsonb
  ) {
    insert_workflow_triggers_one(
      object: { workflow_id: $workflow_id, type: $type, config: $config }
    ) {
      ...TriggerFields
    }
  }
  ${TRIGGER_FIELDS}
`;

export const TRIGGER_WORKFLOW_RUN = gql`
  mutation TriggerWorkflowRun($workflow_id: String!, $input: String) {
    triggerWorkflowRun(workflow_id: $workflow_id, input: $input) {
      success
      workflow_run_id
      status
      message
    }
  }
`;

export const APPROVE_STEP = gql`
  mutation ApproveStep($step_run_id: String!) {
    approveStep(step_run_id: $step_run_id) {
      success
      step_run_id
      status
      message
    }
  }
`;

export const DELETE_WORKFLOW = gql`
  mutation DeleteWorkflow($id: uuid!) {
    delete_workflows_by_pk(id: $id) {
      id
    }
  }
`;
