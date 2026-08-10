-- ============================================================
-- Development Seed Data
-- ============================================================

INSERT INTO organizations (
    id,
    name,
    calls_used,
    calls_allowed
)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Organization A',
    0,
    1000
),
(
    '22222222-2222-2222-2222-222222222222',
    'Organization B',
    0,
    1000
)
ON CONFLICT (id) DO NOTHING;