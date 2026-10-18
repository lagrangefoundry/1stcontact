---
uid: bug-6e8435fb
id: BUG-224
type: bug
title: Client messages sent while a delegated builder is running never reach the consultant
  session
created_by: xgd
created_at: '2026-10-18T18:25:08.681855+00:00'
updated_at: '2026-10-18T19:30:41.653561+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-8f59f165
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



## Confirmed in the code (EPIC-19, 2026-10-18)

This is a known gap, not a regression. `apps/control-app/src/builder/chat.js:1098` says so: `webui-chat` routes a submit made while the consultant is working to its queue, and **this pane passes no queue transport**, so the text is shown as pending and then dropped. BUG-122 only made it recoverable as a draft on the next load. REQ-345, which would have delivered it, was abandoned in favour of the group room, and the client is not in the room on the one-to-one path. So on today's path a mid-turn message is lost every time.

**Fix, in two steps, both ours:**
1. **Queue transport (the floor).** Pass `webui-chat` a queue transport so queued messages run as the next turn once the current one ends. `webui-chat` already coalesces everything queued during a turn into one submission and keeps later arrivals for the round after. Nothing is ever dropped, and the pending bubble stays visible until delivered.
2. **Between tool calls (the goal).** lagrange-framework REQ-180's per-request signals channel has landed. Use it to tell the consultant, on her next tool call, that the client has written (a count and a cursor), and give her a way to read it, so she can acknowledge it mid-run. During a single long `Delegate` the message waits until that builder returns; that is acceptable.

The UI must say which happened: *"Sent — I'll see this when I finish the current step"* while it waits.