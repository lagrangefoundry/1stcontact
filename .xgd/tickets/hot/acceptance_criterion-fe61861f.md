---
uid: acceptance_criterion-fe61861f
id: AC-1051
type: acceptance_criterion
title: Asking what the assistant is answers with the role it offers and whether it
  can run, without opening a conversation
created_by: xgd
created_at: '2026-08-10T08:35:25.190109+00:00'
updated_at: '2026-10-28T04:09:57.173510+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A caller can ask the origin what the assistant is, without naming a site and
without opening a conversation. The answer names the one role on offer —
`consultant` — and no other name, states whether a turn can currently be run,
and — when it cannot — carries an operator-readable reason. The answer is the
same whether or not any conversation has ever been opened, including one stored
under the role's former name: that name is never reported.

## Verification
Query the capability answer on a freshly started origin with the assistant
usable: its role list is exactly `["consultant"]` and it reports that it is
ready, with no reason attached. No conversation exists afterwards.
