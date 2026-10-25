---
uid: comment-015c4ce0
id: COMMENT-4141
type: comment
title: Comment on request REQ-339
created_by: xgd
created_at: '2026-09-28T03:50:19.278762+00:00'
updated_at: '2026-09-28T04:08:30.649076+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a7df66b6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "91a334d9-534f-47ea-8a6d-78c114cbb453",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1a43d63c-1c49-4e74-9e25-690ab35de95d-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T03:49:36.209443+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1a43d63c-1c49-4e74-9e25-690ab35de95d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T04:08:30.023404+00:00" -->
#### Claude
I'll start by reading the ticket.

Now the priming.json — builder_reminders and reminders:

I have what I need — the design is clear and the ticket is specific. Starting the free-coding flow.

Repairing the worktree first (known environment artifact):

Now let me establish a baseline for the suites I'll touch.

Now fix the existing REQ-295 test that assumed every builder reminder is a provider:

Now the node-side UAT for the document half:

Now the workers UAT, which drives the real route:

Now verifying the UATs actually fail without the fix:

Now the regression scope — every suite touching priming, roles, memory or delegation:

124 pass. Now typecheck and lint:

Pre-existing. Restoring:

Now updating the ticket body — appending the implementation record while preserving the operator's text:

I changed directory to the main checkout earlier and the bump landed there. Reverting:

Now lock and merge back into `xgd-working`:

Done. REQ-339 is at `free_coded`, commit `d5a1f5b48b2` merged into `xgd-working`, branch cleaned up.

## What I built

**Cause 1 — the record.** `session.summary` (the framework's product-tier entry, rebound by this host to the standing note plus the ledger) now reads `ctx.role` and renders `null` for any role that isn't the consultant. `null` drops the entry and its separator — the same silence a host with no ledger already gets, so no second tier, no second registry, no branch in the host.

Three design calls I made:
- **Allow-list, not a deny-list for the worker.** The entry claims *"your record of this engagement"*, and the verbs that keep it (`set_standing_note`, `record_decision`) are on the ledger surface, which `instances.json` grants to the consultant alone. A role added later gets silence by default rather than the consultant's memory.
- **The legacy role names are in it** — they're extra keys onto the same consultant role object, and a conversation older than the rename resumes under its stored name.
- **The gate sits ahead of `source.record()`**, so a worker costs the record not even a ticket read.

**Cause 2 — the reminders.** `builder_reminders` gains the consultant's `act-rather-than-narrate` line verbatim, plus `no-status-narration` (the half only a worker needs: its report at the end is the entire of what the consultant receives, so a running commentary has no reader). Both static, riding the per-turn tail, so the shared cacheable prefix is untouched. `site.line` and `site.digest` are unchanged — behaviour 4.

## Evidence

Two UATs, 13 cases. The workers one drives the real route: a real conversation writes a real note and decision through the tools into D1, then delegates on the next turn; the worker's requests and the caller's are told apart by model, so behaviours 1 and 3 are asserted *on the same turn off the same binding*. I verified the RED baseline — 7 of the 13 fail without the fix; the other 6 are the regression guards (consultant delivery, legacy names, site facts) that were already true.

Regression scope: 169 tests across the priming/roles/memory/delegation suites, green. One pre-existing failure in `reconciliation-assistant-conversation.test.ts` (a tool-name/grant comparison) — confirmed against the untouched tree, unrelated.

## Two things I left alone

- **The transcript-pointer and tool-transcript-note entries also reach every worker.** They name `read_work_log`, which the builder grant doesn't include — so a worker is told about an instrument it hasn't got, which is the one rule `roles.ts` exists to keep. ~120 words per worker. Same one-line `ctx.role` gate would close it, but the ticket puts the grant and the report channel out of scope, so it's a separate ticket if you want it.
- **I bumped `package.json` in the main checkout by mistake first** (a `cd` persisted across tool calls); reverted it before committing, and the bump that shipped is the one made in the worktree.

<!-- xgd-chat-end -->