---
uid: acceptance_criterion-76d3ad8f
id: AC-977
type: acceptance_criterion
title: Every response the workspace origin returns is served as non-cacheable, including
  the workspace document itself
created_by: xgd
created_at: '2026-08-07T01:45:07.830525+00:00'
updated_at: '2026-08-07T01:58:15.168691+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Every response from the workspace origin — the workspace document, the browser
source, the component modules, and every rendered channel page and asset —
carries a directive forbidding cache storage. There is no exempt response: the
origin rewrites its own bytes underneath the browser, and a single cacheable
response is enough to leave an operator looking at a stale page that appears to
be working.

## Verification

Request a representative route from each class the origin serves (the workspace
document, the browser source, a served component, a rendered page in each
channel) and assert every response carries a no-store cache directive. Include
the workspace document explicitly, since it is hand-written and does not travel
the same file-sending path as the rest.