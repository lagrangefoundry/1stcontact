---
uid: comment-f04618f3
id: COMMENT-3153
type: comment
title: Comment on bug BUG-122
created_by: xgd
created_at: '2026-09-19T00:17:30.406012+00:00'
updated_at: '2026-09-19T00:35:23.919399+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-91a75ecb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "de5b0080-cfa8-43d6-b076-24b465ddb6a4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4235a7e3-fc03-40a9-917f-a3176fc3f644-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:16:50.479784+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4235a7e3-fc03-40a9-917f-a3176fc3f644-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:35:22.604022+00:00" -->
#### Claude
Now wire it into the pane.

Now the UAT.

Now commit, merge back, and claim.

BUG-122 is implemented and landed on `xgd-working` at `status=free_coded`.

## What I built

I took the first sketch from the ticket — the host-side one — because it's the only piece that closes the hole this incident actually left open:

**BUG-121 landed 20 minutes after you filed this ticket**, and its origin-side `pending_turn` record (written to the session's `chat` ticket *before* the model is called) already covers every turn the origin got to start, including the eviction case the ticket quotes `ai.ts` about. What it structurally cannot cover:

- a submission the origin **never heard of** — the request failed in the network or was refused before that write;
- a record a **later turn replaced** (it keeps one per session);
- a message the panel **queued**: `webui-chat` routes a submit made while the assistant is streaming to its queue, this pane passes no queue transport, so that text is echoed as pending and then dropped — with the draft already deleted. Same loss, quieter route. That one was live and silent.

So the browser now keeps its own copy of every submission, in the same storage the composer files drafts under, from the moment of submit until a transcript accounts for it.

- New `apps/control-app/src/builder/sent-prompts.js`; wired into `builder/chat.js`. `webui-chat` is reached through its public API (`storage`, `onQueue`/`onInterject`, `setInputMarkdown`) — not patched, per DOC-8 §9.4.1.
- Two forms kept: what was typed and what went on the wire (REQ-210 expansion). The transcript is compared against the wire form; the **typed** form goes back in the box.
- On mount the list is reconciled against the replayed transcript *and* the origin's `interrupted` record — anything either accounts for is dropped, so nothing is painted twice. A live turn needs no special case (its `turn_start` is inside the fold).
- What's left is painted as the operator's own message, with a note, and the most recent goes back in the composer — only into an empty one, and forgotten only once it's in one (the composer's own draft persistence is durable from then on).
- Ten per conversation; corrupt reads as absent; a blocked store costs the net, never the turn.

## Verification

7 new UATs in `tests/test_UAT_FC_BUG-122_submitted_prompt_survives_a_reload.test.ts`, mounted against the real `webui-chat` and staging a reload as a fresh panel over the same storage. I checked them RED: with the submit-time copy disabled, 4 of the 7 fail. All 13 suites that touch the chat panel pass (72 tests).

Four existing panel suites (BUG-43, REQ-127, REQ-251, REQ-260) now clear `localStorage` between cases — the pane persists what it submits, so one case's prompt was being handed back to the next case that mounted the same conversation. No assertion changed.

Two notes: `bug32-webui-scope-rebrand` and `reconciliation-builder-workspace-origin` fail in a fresh worktree for the usual missing-`dist-assets` reason, unrelated to this change. And to see this in the running builder you'll need `./bin/1c assets` — a restart alone won't pick up a `src/builder/*.js` edit.

**Not done here:** the queued message is now *recoverable* but still not *delivered* — there's no queue route for this pane. And `lagrange-framework` BUG-58 is untouched and upstream. Both are recorded in the ticket body.

Ticket: `free_coded`, commits `48b97fe0f9` + `308c17c8ba`, version 0.2.277, 3 points. Ready for you to promote to `ready_to_reconcile` when you've had a chance to exercise it.

<!-- xgd-chat-end -->