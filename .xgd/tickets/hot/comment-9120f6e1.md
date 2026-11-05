---
uid: comment-9120f6e1
id: COMMENT-3037
type: comment
title: Comment on request REQ-267
created_by: xgd
created_at: '2026-09-17T22:09:36.694942+00:00'
updated_at: '2026-09-17T23:27:59.568355+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-042df82b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ec84c04d-7400-4b14-8425-49d955371f27",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="185708f2-2f0f-4c90-84d8-c8ffb2122c20-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T22:08:51.377254+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="185708f2-2f0f-4c90-84d8-c8ffb2122c20-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T22:40:07.567114+00:00" -->
#### Claude
Now let me write the migrations.

Now adding the routes.

Now the API client additions.

Now the history "load older" control and the pending queue.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="0d8d9b30-0aee-4c58-b106-aa8a899c8a7f-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T22:56:53.707312+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="0d8d9b30-0aee-4c58-b106-aa8a899c8a7f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:27:58.559976+00:00" -->
#### Claude
REQ-267 is free-coded and landed on `xgd-working`. Status is `free_coded`, version `0.2.242`, three commits recorded, branch and worktree cleaned up.

## What shipped

**The inbound pipeline** (`apps/control-app/src/inbound.ts`, `mime.ts`, plus an `email` handler on the control-app worker). Records, then forwards — independently, so a capture that throws still forwards and a forward that fails still leaves a record. Tenancy comes from the envelope recipient matched against `sending_domains`, never the `To:` header; an unresolvable recipient domain is rejected and writes nothing. A known sender produces an `inbound_email` ticket plus exactly one `contact_events` row; alignment is recorded as evidence, never as a gate. Nothing on the inbound path touches consent state. Over-size messages are recorded as refused without reading the body.

**The pending queue** — a stranger's mail creates no contact and no event. Promote runs `addContact` and attaches the stored messages; discard is sticky per business and per sender address (`inbound_suppressions`, partial unique index over live rows) and is reversible.

**The test gutter** (`gutter.ts`, migration `0014`) — `synthetic`/`run_id` on `users`, `contact_events`, `user_acceptances`, `asset_grants`, plus a `synthetic_runs` registry. The mark rides `recordEvent`'s existing `SELECT … FROM users` as a `MAX()` floor, so no caller can clear it. Exclusion rides `Scope.includeSynthetic` through one shared `realOnly()` clause across five contact reads and two event reads. The reserved `bfm+run_<hex>@` namespace never forwards; a malformed, unknown or expired marker degrades to real mail.

**Timeline paging** — `eventsOf` takes a window (limit + opaque cursor) over `(occurred_at, rowid)`, the query's own ordering. Cursor is carried on the row, so existing callers' return types are unchanged.

**Inert rendering** — received bodies reach the DOM only via `textContent`; no `innerHTML`, no `srcdoc`, no remote image loads.

## Verification

- `pnpm -r build` (tsc across all packages) clean.
- Full suite: **4728 passed, 4 failed**. All four failures reproduce on unmodified `xgd-working` (`bug32-webui-scope-rebr

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-chat-end -->