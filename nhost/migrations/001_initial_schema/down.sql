-- ============================================================
-- AI Agent Workflow Builder
-- Rollback Migration (down.sql)
-- ============================================================

DROP VIEW IF EXISTS organization_usage;
DROP TRIGGER IF EXISTS workflow_steps_updated_at ON workflow_steps;
DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS step_runs CASCADE;
DROP TABLE IF EXISTS workflow_runs CASCADE;
DROP TABLE IF EXISTS workflow_triggers CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

DROP TYPE IF EXISTS step_run_status CASCADE;
DROP TYPE IF EXISTS workflow_run_status CASCADE;
DROP TYPE IF EXISTS workflow_trigger_type CASCADE;
DROP TYPE IF EXISTS workflow_step_type CASCADE;
DROP TYPE IF EXISTS organization_member_role CASCADE;
