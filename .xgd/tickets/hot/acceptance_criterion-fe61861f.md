---
uid: acceptance_criterion-fe61861f
id: AC-1051
type: acceptance_criterion
title: Asking what the assistant is answers with the role it offers and whether it
  can run, without opening a conversation
created_by: xgd
created_at: '2026-08-10T08:35:25.190109+00:00'
updated_at: '2026-08-16T05:22:23.130746+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
A caller can ask the origin what the assistant is, without naming a site and
without opening a conversation. The answer names the one role on offer, states
whether a turn can currently be run, and — when it cannot — carries an
operator-readable reason. The answer is the same whether or not any conversation
has ever been opened.

## Verification
Query the capability answer on a freshly started origin with the assistant
usable: it lists the assistant's role and reports that it is ready, with no
reason attached. No conversation exists afterwards.