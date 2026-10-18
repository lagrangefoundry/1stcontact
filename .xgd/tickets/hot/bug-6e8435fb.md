---
uid: bug-6e8435fb
id: BUG-224
type: bug
title: Client messages sent while a delegated builder is running never reach the consultant
  session
created_by: xgd
created_at: '2026-10-18T18:25:08.681855+00:00'
updated_at: '2026-10-18T19:13:46.210353+00:00'
completed_at: null
last_field_updated: epic_parent
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
---

## What happened
In a consultant session, the client typed several messages while the consultant was inside one long turn that made a chain of `Delegate` calls (builder role, four delegations in sequence, about 20 minutes in total). None of those messages ever reached the consultant: not between delegations, not at the end of the turn, and not in the next turn. `AgentHistory` shows no user turn between the client message that started the work and the consultant's final reply. The client only found out because the consultant never answered them, and had to paste the text again by hand.

## Expected
Either:
- messages typed during a running turn are delivered to the consultant between tool calls (best, so the consultant can react mid-run), or
- they are queued and delivered as the next user turn once the running turn ends.

They should never be dropped silently. If input is refused while a turn is running, the client should be told in the UI.

## Reproduce
1. Start a consultant turn that makes two or more sequential `Delegate` calls (each several minutes long).
2. While it runs, type and send one or more messages from the client UI.
3. When the turn ends, read `AgentHistory` for the session: the messages are missing, and the next turn's input does not contain them.

## Impact
High. The client feels ignored ("abandoned"), and design input given mid-build is lost. In this case it was reactions to a comparison site that changed the visual direction.