---
uid: comment-4fa95a6e
id: COMMENT-1293
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T11:28:34.098032+00:00'
updated_at: '2026-08-20T11:28:34.098032+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2e87dfd7
  kind: note
---

**REPORT-2423** (`report-2e87dfd7`) created — **FAIL**: 2 violations, 2 warnings, 0 needs_review. Schema verified (`result: fail`, `report_kind`, `subject_uid`, `level: story`, integer counts).

## What I found

First I verified attempt 8's three fixes actually landed in STORY-84 — they did (viewport-height probe, self-painting-run exception, `1c repro` materialization). None of my findings repeats them.

The prior four cycles all built the intent ledger from `fold.ts` attributions alone. I widened the sweep to all eight capability-owned source files, then term-scanned all 31 story bodies per attributed behaviour. That surfaced two live, reconciled behaviours no story expresses:

**Violation 1 — STORY-84, the translucent scrim (BUG-24).** BUG-24 diagnoses *two* independent root causes; the prior ledger filed it wholly under CAP-63 as capture-side, which is what hid this. The second cause is the fold's own: `foldSectionBackgrounds` read only `backgroundImageUrl`, so a captured hero veil could not round-trip. The fix is live at `fold.ts:1260` (folds on image **OR** scrim) and `:1281-1288`. Ownership is settled without escalation — STORY-75 (CAP-63) explicitly puts "what the fold *does* with a captured backdrop, **scrim** or control (owned by the fold story)" out of its own scope. STORY-84's nearest sentence says "full-bleed **opaque** panel fill", which actively excludes the case. Four `test_UAT_FC_BUG-24_*` fold UATs prove it live.

**Violation 2 — STORY-86, the `mounted` fidelity channel (REQ-88).** The sample-fidelity probe reports three channels; the story enumerates two ("residuals and unmatched entries") while claiming "the three probes and their report shapes" in scope. `mounted` is declared at `probes.ts:584`, populated at `:656`, and printed to the operator at `cli/index.ts:636-640`. Unowned matrix-wide, and no test references it.

Two warnings (BUG-19's full-bleed bar band rule; the gate's height-probe dedup) — both real omissions of *mechanism* rather than of a stated rule, so they don't gate the verdict.

## Two things worth your attention

**The finding-per-cycle pattern has a root cause.** Both stories carry a single scalar `updated_by` and all 34 ACs carry `intent_uid: None`, so every assessor rebuilds the ledger from the corpus by whatever sweep they happen to run — and a narrower sweep than the last one silently passes. That's why this is attempt 9. Repairing the chain isn't addressable at `level=story`, but it's the thing that would stop this. I recorded the sweep method and left the script at `.xgd/tmp/attr.py`.

**`git push` failed** (`Broken pipe` — no network in this sandbox). The report was created and committed locally; it just isn't pushed.

I stayed read-only: no tickets, tests, or code modified — only scratch scripts under `.xgd/tmp/`.
