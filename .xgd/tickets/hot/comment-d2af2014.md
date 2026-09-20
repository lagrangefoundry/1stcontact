---
uid: comment-d2af2014
id: COMMENT-3364
type: comment
title: Comment on request REQ-287
created_by: xgd
created_at: '2026-09-20T22:21:26.467600+00:00'
updated_at: '2026-09-20T22:29:26.835775+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3a73d6af
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b2a0abec-58d9-4980-83b8-f35cd489f6ba",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="707050f6-ae30-4392-9cb7-d16bd82824a2-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T22:21:05.392502+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="707050f6-ae30-4392-9cb7-d16bd82824a2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T22:29:25.457600+00:00" -->
#### Claude
The ticket is clear enough to implement without blocking questions. One decision I'll make myself: the label renders **bold** (as the ticket's example shows) where the filename was in backticks — backticks say "this is a literal storage name", bold says "this is a name you can say back".

Let me start the free-coding flow.

Now the server half — `materialEnvelope` carries `label`:

Good, I'm in the worktree. Now the edit:

Now the client half — `uploadNote`:

Now the two UAT files:

Let me simplify my fetch stub to match that idiom:

Now the jsdom sibling — the sentence itself:

Now run the two suites:

All 4 pass. Now the regression scope — adjacent suites that touch the envelope and the note:

Now typecheck:

Now lock, merge back, and record:

Done. REQ-287 is at `free_coded` with commit `5c6b767`, merged into `xgd-working`.

**What changed**

- `apps/control-app/src/router.ts` — `materialEnvelope` now projects `label` (`?? null`, so the key is on every envelope rather than sometimes absent). The value is already on the ticket in hand: `ingest` allocates it in the same `create` as the classification, so nothing is read back.
- `apps/control-app/src/builder/app.js` — `uploadNote`'s placement sentence reads *"Added, and it's on your site as **IMAGE-25**."* A new `placedName` helper falls back to the backticked filename where `label` is null. The filename stays on the note's first line in bold.

**Decisions I made**

- **Bold for the label, backticks for the filename fallback.** The ticket's example showed bold; the distinction is doing work — backticks say "storage key", bold says "a name you can say back".
- **`?? null` rather than passing the field through raw**, so the key is present on every envelope and a caller never has to tell absence from emptiness — same reasoning `description_model` already uses.
- **Both entry points get the label.** `/api/material/fetch` composes the same envelope, so fetched material is named the same way. That wasn't in the original body, so I added a section naming it rather than leaving it for reconciliation to find — along with the `?? null` decision and a test plan.

**Evidence** — two UAT files, one per half:

- `tests/test_UAT_FC_REQ-287_the_envelope_carries_the_label.workers.test.ts` (4 tests, real D1 + real site store through `route()`) — the label is in the envelope and is the same string `listMaterial` shows; a uuid-named drop still has the uuid as `site_asset`; an unplaced reference doc is labelled just the same; the fetch route carries it too.
- `tests/test_UAT_FC_REQ-287_the_note_names_the_label.test.ts` (3 tests, real builder + real chat pane, only HTTP injected) — the sentence names the label and not the uuid; the filename survives on line one; a null label keeps the backticked filename; a labelled-but-unplaced material produces **no** placement sentence, which is the way this change could have broken the gate.

**Regression scope**: the two new suites plus REQ-161 (overlay + material surface), REQ-163, REQ-173, REQ-213, REQ-280 (both), REQ-122 chat panel, and the assistant-pane reconciliation suite — 87 tests, all passing. `pnpm -r build` (tsc `--noEmit` across the workspace) is clean.

<!-- xgd-chat-end -->