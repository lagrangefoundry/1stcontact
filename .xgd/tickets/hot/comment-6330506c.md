---
uid: comment-6330506c
id: COMMENT-1769
type: comment
title: Comment on acceptance_criterion AC-914
created_by: xgd
created_at: '2026-08-31T11:54:03.527507+00:00'
updated_at: '2026-08-31T11:54:03.527507+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-3745124c
  kind: change
---

Removed during reconciliation of BUNDLE-20 (REQ-149), plan item 8, on
2026-08-31.

This criterion asserted that a deploy whose rendered output contained a
top-level entry named the same as the reserved preview segment is refused by
name and ships nothing.

Both its subject and its enforcement point no longer exist. The preview channel
that reserved a segment inside every site's address was removed with the
snapshot-addressed draft links it served, so that segment is an ordinary one
again — the code and its evidence now assert the opposite property, that a
published site may hold a top-level page of that name and it addresses like any
other. The gate itself lived in the operator-side deploy command, which was
deleted rather than ported; there is no deploy stage left for it to run over.

This is intent-directed removal, not drift: the source intent removes the
channel deliberately ("a half-present feature is the legacy-mode split
CLAUDE.md forbids") rather than leaving a route that could only 404.
