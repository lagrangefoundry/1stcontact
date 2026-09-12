---
uid: comment-f2d1aa6d
id: COMMENT-2877
type: comment
title: Comment on request REQ-233
created_by: xgd
created_at: '2026-09-12T21:40:35.571469+00:00'
updated_at: '2026-09-12T22:01:48.491800+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6c30c342
  kind: chat_transcript
---

<!-- xgd-turn id="7b06f192-a8c9-440d-b774-3295a1bb93de-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:40:12.374885+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7b06f192-a8c9-440d-b774-3295a1bb93de-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:01:47.953585+00:00" -->
#### Claude
I've read the ticket and the surrounding code. One design note before I start, then I'll proceed — it's an implementation call I'm making rather than a blocking question:

**The ticket's Approach names `contact_events` as the cursor source. I'm using `users.updated_at` instead.** `contact_events` does not in fact record every mutation — `setPersonStatus`, `setPersonRecord` and `writeName` write no event — so an events-sourced feed would miss renames and stage/status changes, which is required behaviour #2. Making it cover them would mean inventing `contact.renamed` events that duplicate `user_names`' own history, which [[DOC-44]] §4.1 explicitly argues against. `users.updated_at` is already "this contact row changed" and is already bumped by every path but one (`writeName`), which I'll fix.

Everything else follows the ticket: `subscribeMaterial`/`library.js` is the template, server-side tail over SSE, no client poll, inert closer with no `EventSource`.

Now the `writeName` stamp fix:

Now the change reader in `people.ts`:

Now the `seq` on `/api/people` and the new route:

Now `streamContactChanges`, placed beside its material sibling:

Now the client transport:

Now `refresh`/`clear` and the change-application machinery:

Now the panel-side UAT:

Meanwhile, the ticket body — preserving what's there and recording the design decisions:

Done. REQ-233 is at `free_coded`, commit `b0ad859b02` merged into `xgd-working`.

## What changed

**The pane subscribes.** `GET /api/people/changes` is an SSE feed the browser opens as an `EventSource`; `/api/people` hands out the cursor it read *before* listing; `createPeoplePanel` patches the row an event names instead of re-reading. All six numbered behaviours are met, and the no-`EventSource` path returns an inert closer exactly as `library.js` does.

**Two decisions worth your attention:**

1. **The cursor is `users.updated_at`, not `contact_events`.** The ticket's Approach assumed the event spine records every mutation — it doesn't. `setPersonStatus`, `setPersonRecord` and `writeName` write no event, by design, so an events-sourced feed would have missed every rename and status change (required behaviour 2). Adding `contact.renamed` events would duplicate `user_names`' own history, which DOC-44 §4.1 explicitly argues against.

2. **`writeName` now stamps `users.updated_at`.** This was the one write-path gap the feature required, and it corrects an existing asymmetry — `setPersonRecord`'s *address* branch already stamped the person for the same reason. It fires only on paths that actually write, so a no-op commit-on-blur doesn't wake every open pane.

The cursor being a wall clock rather than a log counter forced two consequences I've documented in the ticket: each poll reads from 5s behind its cursor (isolate clock skew would otherwise silently drop an arrival — this ticket's own bug), with per-connection de-duplication so the window isn't re-sent, and a forward-only cursor. Plus migration `0003` adding `(tenant_id, updated_at)`.

## Evidence

- `test_UAT_FC_REQ-233_contacts_live.test.ts` — 13 cases, mounted against the real components.
- `test_UAT_FC_REQ-233_contact_changes.workers.test.ts` — 15 cases through `route()` against real D1.

Both checked negatively: disabling the subscription fails 12 of 13 pane cases; removing the `writeName` stamp fails both rename cases. The rename and invite claims backdate the row out of the lookback window, so they're about the write and not about the replay.

Full suite: **3801 passed, 2 failed** — `bug32-webui-scope-rebrand` and `BUG-67 backend_settings`, both of which reproduce on `xgd-working` without my changes.

<!-- xgd-chat-end -->