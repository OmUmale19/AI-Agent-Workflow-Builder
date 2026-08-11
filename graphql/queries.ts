import { gql } from "@apollo/client";
import { STEP_FIELDS, TRIGGER_FIELDS, RUN_FIELDS, STEP_RUN_FIELDS } from "./fragments";

export const GET_ORGANIZATION_WORKFLOWS = gql`
  query GetOrganizationWorkflows($org_id: uuid!) {
    workflows(
      where: { org_id: { _eq: $org_id } }
      order_by: { created_at: desc }
    ) {
      id
      org_id
      name
      description
      is_active
      created_by
      created_at
      updated_at
      steps(order_by: { position: asc }) {
        ...StepFields
      }
      triggers {
        ...TriggerFields
      }
      runs(limit: 1, order_by: { created_at: desc }) {
        ...RunFields
      }
    }
  }
  ${STEP_FIELDS}
  ${TRIGGER_FIELDS}
  ${RUN_FIELDS}
`;

export const GET_WORKFLOW_BY_ID = gql`
  query GetWorkflowById($id: uuid!) {
    workflows_by_pk(id: $id) {
      id
      org_id
      name
      description
      is_active
      created_by
      created_at
      updated_at
      steps(order_by: { position: asc }) {
        ...StepFields
      }
      triggers {
        ...TriggerFields
      }
      runs(limit: 1, order_by: { created_at: desc }) {
        ...RunFields
      }
    }
  }
  ${STEP_FIELDS}
  ${TRIGGER_FIELDS}
  ${RUN_FIELDS}
`;

export const GET_ORGANIZATION_USAGE = gql`
  query GetOrganizationUsage($org_id: uuid!) {
    organization_usage(where: { organization_id: { _eq: $org_id } }) {
      organization_id
      organization_name
      calls_used
      calls_allowed
      usage_percentage
      quota_period_start
    }
  }
`;

export const GET_WORKFLOW_RUN_DETAILS = gql`
  query GetWorkflowRunDetails($id: uuid!) {
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

