---
uid: comment-9df8a526
id: COMMENT-3148
type: comment
title: Comment on request REQ-276
created_by: xgd
created_at: '2026-09-18T23:24:45.124773+00:00'
updated_at: '2026-09-18T23:42:27.777949+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5a055c2d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "44a2df2e-6d95-4f2b-bc44-bf44d6108c0e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6c902dae-6d3c-434a-a978-89b64a6539af-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:24:02.247584+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6c902dae-6d3c-434a-a978-89b64a6539af-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:42:26.587874+00:00" -->
#### Claude
I've read the ticket, the repro-console (`tools/repro-console/`), its brief, and the ticket read-back path. No blocking questions — the design decisions are mine to make. Let me record the design on the ticket first.

Now the branch.

Now the prompt section:

Now page.ts — the view types and rendering:

Now the aggregate panel rendering and styles:

Now gaps.ts:

Now the UATs:

Now sync the ticket body with what actually landed, then lock + bump + merge in one shot.

The lock is free. Now bump, merge, and claim in one shot:

Landed on `xgd-working`, REQ-276 at `free_coded`.

## What was built

A round now says **where the defect sits**, at filing time, in a field.

**The closed set** — nine classes, declared once in `tools/repro-console/src/defect-class.ts`, each belonging to a queue:

- `instrument-blind`, `instrument-asymmetric`, `instrument-no-axis` → **ruler**
- `capture-loses-it`, `fold-wrong`, `renderer-wrong` → **ruler**
- `l1-cannot-express` → **ceiling**
- `harness` → process · `cannot-tell` → unknown

It composes with the brief's existing §5 three-kind taxonomy rather than competing: §5's class 1 splits into `capture-loses-it`/`fold-wrong` (EPIC-19's own split), class 2 is `l1-cannot-express`, class 3 is `renderer-wrong`. The three instrument classes had no home in §5 at all — they arrive as secondary `1c` bugs, which is nine of EPIC-19's twenty-two defects sorted by nothing.

**Where it lives.** `defect_class`, a list, passed by the round on `xgd ticket create --fields`. A list because one gap ticket carries every residual in dependency order — a scalar keyed to the leading issue would hide a ceiling finding at position three from exactly the filter this exists to enable.

**The authority is the ticket.** The console reads `fields.defect_class` in the same `xgd ticket get --json` that already fetches status and `created_by`. A ticket with no class, or a class outside the set, is a violation beside those two — for the gap ticket *and* every secondary bug.

**The split.** Status line reads `Iteration 1 finished — AI filed REQ-263 — 1 ceiling (l1-cannot-express), 1 ruler (instrument-no-axis).`; the same clause sits under the round beside the cost line; a *what this loop has filed* panel above the iteration list aggregates it across rounds with ticket ids under each class.

**Drift guard.** The prompt carries the set generated from the code, so a round is never told a class the console will not accept; a UAT asserts every class in the code appears in the brief with its meaning.

Two judgement calls I made rather than asked about: `renderer-wrong` is in the set despite having no row in EPIC-19's table (rounds 1–3 filed none, but §5 class 3 exists), and the shared `xgd ticket get --json` test stub now defaults to a valid class so the five unrelated console suites don't trip the new violation.

10 UATs in `tests/test_UAT_FC_REQ-276_defect_class.test.ts`; all 90 tests across the seven repro-console suites pass. Two failures in `test_UAT_FC_REQ-254_reproduction_console.test.ts` are pre-existing (they spawn real `1c`, which needs built assets) — confirmed against a stashed tree before I started.

<!-- xgd-chat-end -->