---
uid: comment-74ac7f35
id: COMMENT-2410
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T00:50:11.534386+00:00'
updated_at: '2026-09-10T00:50:11.534386+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6406e84b
  kind: note
---

Report filed as `report-6406e84b`.

## What I did

Closed three more pending ACs, all browser-free:

- **AC-1606** (split-control attribution) — new file, 5 tests through the real `EXTRACT_SCRIPT` → `flattenSignals` → `diffManifests` pipeline. Covers the two clauses no sibling asserts: the **border** axis resolving to the bearing node, and a pre-BUG-22 manifest staying **inert**.
- **AC-1605** (per-run text extent) — new file, 4 tests. The `<br>`-broken paragraph measuring each run off its own text node, plus the one-line-difference diff clause.
- **AC-1617** (deterministic reference cell) — appended to the size-aware suite, 4 tests over the real `selectProjectionAtWidth` and `cmdValuesDiff`.

Three mutation tests, each with the FC siblings as control:

| Mutant | Result |
|---|---|
| `actBorder` no longer resolves to the bearing node | All 6 BUG-22 siblings green — they never author a border — only the new tests caught it |
| `ownRun = true` (the BUG-25 pathology) | All 4 BUG-25 siblings **skipped** (browser-gated); only the new tests caught it |
| `selectProjectionAtWidth` → iteration order | All 11 pre-existing size-aware tests green; only the new AC-1617 tests caught it |

The middle one is the point: AC-1605's capture claim had no executing evidence at all in a browserless environment. The mutant shows the guards skipping while the behaviour regresses.

`Test Files 13 passed | Tests 100 passed | 14 skipped`. Production untouched.

## One correction

My previous report said "STORY-77's pending set is now empty." That was wrong — AC-1617 belongs to STORY-77 and was still pending. It's closed now, so the claim holds as of this call but didn't then. The remaining-work table in that report listed AC-1617 correctly; only the summary sentence was off.

## A second AC wording gap

While writing AC-1605's tests I found its Criterion and Verification disagree about the nested-span case, and only one can be true of the code. The Criterion ("an element contributes its own rendered text box only when it owns exactly one text run") matches `extract.ts:1123` exactly. The Verification asks that a nested-span heading's run match "that run's own text-node rect" — verified empirically that it doesn't; it comes back as the element measurement. I asserted the Criterion and flagged the wording for an ac-level pass. Same class as the AC-1610 gap I forwarded earlier.

## Where things stand

Finding 10 is **9 of 13**. Remaining: AC-1607 and AC-1608 (STORY-75, both with siblings), and AC-1611/AC-1612 (STORY-76 — no sibling under any name; `grep -rln "REQ-72" tests/` still returns nothing, so AC-1612's gradient-stop hexification is untested outright).

Findings 3 and 4 are unchanged on their eighth filing, still blocked on your call and on Chromium respectively.
