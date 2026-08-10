-- ============================================================
-- AI Agent Workflow Builder
-- PostgreSQL Schema Migration (up.sql)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_member_role') THEN
        CREATE TYPE organization_member_role AS ENUM ('owner', 'editor', 'viewer');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_step_type') THEN
        CREATE TYPE workflow_step_type AS ENUM (
            'llm_call',
            'http_request',
            'db_write',
            'notify',
            'conditional_branch',
            'approval_gate'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_trigger_type') THEN
        CREATE TYPE workflow_trigger_type AS ENUM (
            'manual',
            'webhook',
            'scheduled',
            'database_event'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_run_status') THEN
        CREATE TYPE workflow_run_status AS ENUM (
            'pending',
            'running',
            'paused',
            'completed',
            'failed',
            'cancelled'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'step_run_status') THEN
        CREATE TYPE step_run_status AS ENUM (
            'pending',
            'running',
            'paused',
            'completed',
            'failed',
            'skipped'
        );
    END IF;
END $$;

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    -- Usage quota
    calls_used INTEGER NOT NULL DEFAULT 0,
    calls_allowed INTEGER NOT NULL DEFAULT 1000,

    quota_period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc(
        'month',
        NOW()
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_calls_used_non_negative
        CHECK (calls_used >= 0),

    CONSTRAINT organizations_calls_allowed_positive
        CHECK (calls_allowed > 0)
);

-- ============================================================
-- 2. ORGANIZATION MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL,

    role organization_member_role NOT NULL DEFAULT 'viewer',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
    ON org_members(user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id
    ON org_members(org_id);

-- ============================================================
-- 3. WORKFLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org_id
    ON workflows(org_id);

-- ============================================================
-- 4. WORKFLOW STEPS
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID NOT NULL
        REFERENCES workflows(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    position INTEGER NOT NULL,

    type workflow_step_type NOT NULL,

    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (workflow_id, position)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id
    ON workflow_steps(workflow_id);

-- ============================================================
-- 5. WORKFLOW TRIGGERS
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID NOT NULL
        REFERENCES workflows(id)
        ON DELETE CASCADE,

    type workflow_trigger_type NOT NULL,

    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow_id
    ON workflow_triggers(workflow_id);

-- ============================================================
-- 6. WORKFLOW RUNS
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID NOT NULL
        REFERENCES workflows(id)
        ON DELETE CASCADE,

    triggered_by UUID,

    trigger_type workflow_trigger_type NOT NULL DEFAULT 'manual',

    status workflow_run_status NOT NULL DEFAULT 'pending',

    input JSONB NOT NULL DEFAULT '{}'::jsonb,

    output JSONB,

    error TEXT,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id
    ON workflow_runs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status
    ON workflow_runs(status);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at
    ON workflow_runs(created_at DESC);

-- ============================================================
-- 7. STEP RUNS
-- ============================================================

CREATE TABLE IF NOT EXISTS step_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_run_id UUID NOT NULL
        REFERENCES workflow_runs(id)
        ON DELETE CASCADE,

    workflow_step_id UUID NOT NULL
        REFERENCES workflow_steps(id)
        ON DELETE CASCADE,

    status step_run_status NOT NULL DEFAULT 'pending',

    input JSONB,

    output JSONB,

    error TEXT,

    attempt_count INTEGER NOT NULL DEFAULT 0,

    approved_by UUID,

    approved_at TIMESTAMPTZ,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT step_runs_attempt_count_non_negative
        CHECK (attempt_count >= 0),

    UNIQUE (workflow_run_id, workflow_step_id)
);

CREATE INDEX IF NOT EXISTS idx_step_runs_workflow_run_id
    ON step_runs(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_step_runs_workflow_step_id
    ON step_runs(workflow_step_id);

CREATE INDEX IF NOT EXISTS idx_step_runs_status
    ON step_runs(status);

-- ============================================================
-- 8. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW organization_usage AS
SELECT
    o.id AS organization_id,
    o.name AS organization_name,
    o.calls_used,
    o.calls_allowed,
    CASE
        WHEN o.calls_allowed > 0
        THEN ROUND(
            (o.calls_used::NUMERIC / o.calls_allowed::NUMERIC) * 100,
            2
        )
        ELSE 0
    END AS usage_percentage,
    o.quota_period_start
FROM organizations o;

-- ============================================================
-- TIMESTAMP UPDATE FUNCTION & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
CREATE TRIGGER workflows_updated_at
BEFORE UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER workflow_steps_updated_at
BEFORE UPDATE ON workflow_steps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();