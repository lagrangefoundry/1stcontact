---
uid: todo-55aa1deb
id: TODO-11
type: todo
title: 'Builder sessions: measure and reduce cost per session'
created_by: CHAT-58
created_at: '2026-10-02T17:48:30.678889+00:00'
updated_at: '2026-10-02T17:49:04.546944+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  kind: user_task
  priority: low
  epic_parent: epic-95bc3b15
  auto_merge_back: true
---

Deferred from CHAT-58 and the "Next hypothesis" design doc §2.4 and §9.

The first two-agent test session (Charlie's Plumbing, 2 Oct 2026) cost about $33, roughly 3× what current pricing supports at this stage of a build.

Likely contributors, inferred from tool use rather than measured:
- long room posts re-read by every participant on later rounds
- frequent standing-note rewrites (16)
- builder delegations (11)
- full room re-reads from cursor 0

First step: measure cost per agent, per tool and per turn for a session. Then reduce. The volume reductions in the next hypothesis should help on their own.

Not a priority until the core interaction works.

See [[DOC-65]].