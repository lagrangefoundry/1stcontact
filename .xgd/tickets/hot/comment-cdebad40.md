---
uid: comment-cdebad40
id: COMMENT-1472
type: comment
title: Comment on bug BUG-36
created_by: xgd
created_at: '2026-08-24T21:06:39.620762+00:00'
updated_at: '2026-08-24T21:06:39.620762+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-db356ff8
  kind: note
---

Filed as **BUG-37** (`bug-6612c4b7`) — *control-app: Edit mode dies with
Cloudflare 1102 — the preview render cache never hits in the Worker*.

Diagnosis only, status `draft`, no branch cut and no code written. The lead in
COMMENT-1447 above is carried into that ticket in full, along with the
`deps.store` divergence between the Worker and the Node transport, three
candidate fixes, and the prerequisite that `[observability]` be added to
`apps/control-app/wrangler.toml` before any of it can be confirmed.

Nothing further is owed by BUG-36.
