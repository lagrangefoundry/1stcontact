---
uid: comment-d7a7e8f3
id: COMMENT-3154
type: comment
title: Comment on request REQ-281
created_by: xgd
created_at: '2026-09-19T01:00:19.177540+00:00'
updated_at: '2026-09-19T01:26:52.450318+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3c6bad4e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "32c50db5-a243-4317-bdcc-d901f34415a2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a0fb4760-0a6a-4661-beef-8ea9b47c5844-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:59:15.009485+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a0fb4760-0a6a-4661-beef-8ea9b47c5844-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:26:52.396096+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Ticket scoped. Cutting the branch.

Now `material.ts` — the erasure and the deleted listing.

Now the assistant-side port and refusal.

Now the surface declaration.

Now the Worker-side host implementation of the `deleted` port.

Now the builder panel changes.

Now update the existing REQ-228 host double so the port is complete, then write the UATs.

Now the lock-and-merge sequence.

Fast-forwarded. Now the gate and cleanup.

Done and landed.

## What shipped — REQ-281

**The verb is `archive`.** `DELETE /api/material?uid=` → `archiveMaterial` → the component's own erasure path. That one call buys the whole feature: the trash cascade moves the attachment's bytes (so the old blob position 404s — "deleted that still serves is not deleted"), the read slice scans live records only so the row leaves `listMaterial` (the Library tab *and* the assistant's catalogue, which are one read), `materialImageLibrary`, and the KB corpus — and it raises the change feed's `exit` the tab already redraws from. None of that is re-implemented.

**Retrieval is told too.** The erasure runs the same index seam the description correction runs — otherwise a deleted brand document keeps answering searches until some unrelated upload refreshes the corpus. `forgetFromIndex` is a deliberate sibling of `indexAfterWrite` rather than the same function: they report opposite facts and their warnings are read by a person.

**The consultant stops going stale.** `itemNamed` now re-resolves a failed name over the deleted catalogue — through the same `storedImageOf` projection, so `IMAGE-5` still resolves after deletion — and refuses with a declared `DELETED` code. A session holding a name from earlier says "they got rid of that" instead of listing the catalogue back at somebody quoting their own client. The trash is consulted *only* on the miss path and is never a listing. `surface_version` 2 → 3.

**The control and its copy.** Foot of the detail pane, not on the row; a text button in the danger colour, not a danger button. The confirmation names what is lost (file, description, crop if there is one, the shared number) and — **only for a placed item** — that it stays on the site, because the page holds the site's own copy and taking it down is a change to the page. Cancel ("Keep it") takes focus. A refusal keeps the dialog open with the origin's own sentence, since this is the one write on that pane redrawing cannot undo.

## Decisions I made
- `DELETE` on the list's own path rather than `POST /api/material/delete` — the sibling POST routes are each a narrow write of one *named field*; this removes the resource. `/api/domain` sets the precedent.
- A placed item **is** deletable without a second gate, per the ticket's recommendation.
- `deleted()` is a required port member, not an optional flag on `list()` — separate functions can't be conflated into a leak.

## Evidence
`workers` project fully green: **134 files / 1209 tests**. Three new UAT files (25 tests): the erasure over real D1/R2 including *the site's copy surviving*; the pane and its wording; the surface's refusal and declaration. `node` project's remaining 13 failures are pre-existing or worktree artifacts (browser-gated, webui serving, system-KB) — I confirmed the split against the main checkout.

One real catch en route: BUG-53's static sweep requires every class handed to `modalButton` to have a CSS rule, so `.builder-library__confirm-delete` is declared (as the danger repaint of `--primary`).

Ticket is at `free_coded`, commits `0c06d07b91` + `5ff0717cd3`, version `0.2.281`, branch merged and cleaned. I ran `./bin/1c assets` so a running builder picks up the JS. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->