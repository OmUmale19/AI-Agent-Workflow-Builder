-- ============================================================
-- Organization Usage View
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