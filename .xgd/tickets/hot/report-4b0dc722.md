---
uid: report-4b0dc722
id: REPORT-1368
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T03:15:04.260333+00:00'
updated_at: '2026-08-06T03:15:04.260333+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-ee56a66e
  plan_item_index: '9'
---

Upgrade mutations applied for plan item 9 of 12

**Target Stories**: story-24098299 (STORY-86 — End-to-end 3-probe reproduction acceptance gate)

Read first: the bundle's REQ-94 intent section (problem, the three structurally-blind gates, the 3-point proposal, acceptance) — no comments on the bundle. Then `tools/generate/src/cli/gate.ts`, the `case 'gate'` handler and usage block in `cli/index.ts`, and `tests/req94-cross-gate-reconciliation.test.ts`.

**In scope for change**: STORY-86 body + new ACs on it.
**Explicitly out of scope (unchanged)**: AC-705/706/707/708/709/710/724/734/735/736/737 (the three probes, the evaluator, recovery, fold-residual channel — none of REQ-94's behaviour contradicts them), and every other story in the matrix.

What the story now says that it did not: the acceptance boundary extends from the three geometry probes to a cross-gate verdict — browser-free gates first, a perceptual floor that can fail a run alone, a reference-coverage report emitted every run, a named cause with a next step, value deltas as evidence only, and a hard error on a bundle with no retained reference manifest.

Two places where I recorded the code's own hedges in Technical Context rather than turning them into ACs: the perceptual floor's numeric defaults are provisional (the intent says a calibrated floor needs a human-labelled anchor set that does not exist yet), so the ACs assert the floor's mechanism — either bound sufficient, echoed into the report, per-run overridable — not the values 8/25%; and the section-density number is a proxy that only shapes an already-failing verdict, never fails a run on its own.

```
Stories Modified: 1
ACs Modified: 0
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-24098299"
  acceptance_criteria:
    modified: []
    added:
      - "acceptance_criterion-d52afcea"   # AC-852 single cross-gate verb, browser-free gates first
      - "acceptance_criterion-7f54de7d"   # AC-853 perceptual floor fails regardless; floor echoed
      - "acceptance_criterion-e87390d4"   # AC-854 reference coverage reported every run
      - "acceptance_criterion-c4727f6d"   # AC-855 named cause + next step
      - "acceptance_criterion-7bf91cb5"   # AC-856 deltas are evidence; no-manifest is a hard error
    removed: []
```

No new stories created; no runtime code modified.

Progress: 9 of 12 plan items complete
