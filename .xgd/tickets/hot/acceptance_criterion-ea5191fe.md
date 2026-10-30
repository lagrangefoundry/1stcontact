---
uid: acceptance_criterion-ea5191fe
id: AC-2066
type: acceptance_criterion
title: The per-turn reminder the model receives calls the site owner the client and
  never uses the old register word "user" or the former role name
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-10-30T20:01:09.812660+00:00'
updated_at: '2026-10-30T20:01:09.812660+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The per-turn reminder the model actually receives on a turn — as resolved by the
host's reminder provider and carried in the model request, not the function's
return value read back — speaks in the consultant's register: it calls the person
the site belongs to the client, and it contains neither the old register word
"user" nor the role's former name.

## Verification
Against the real builder origin with only the model client doubled, run one turn
and capture the first model request. Locate the reminder in what the model was
sent (it opens with `You are working on the site "<slug>".`). The reminder text
contains "client" as a word, does not match "user" as a word case-insensitively,
and does not match the former role name case-insensitively.
