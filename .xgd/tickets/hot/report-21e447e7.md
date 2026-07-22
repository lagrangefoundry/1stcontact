---
uid: report-21e447e7
id: REPORT-733
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-22T20:07:52.717895+00:00'
updated_at: '2026-07-22T20:07:52.717895+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-31e474b9
  plan_item_index: '4'
---

All artifacts created successfully.

```
Story #4 created for reconciliation bundle-31e474b9

Story UID: story-24098299 (STORY-86)
Title: End-to-end 3-probe reproduction acceptance gate
Type: feature
Capability: CAP-73 (End-to-End Reproduction Gate (3-Probe)) — newly created
Acceptance Criteria: 6 created
  AC-705 — sample-fidelity probe vs oracle within tolerance
  AC-706 — off-sample envelope at unsampled widths (500/900)
  AC-707 — content-robustness envelope under perturbed content
  AC-708 — combined gate on absolute-base/overlay split, non-vacuous
  AC-709 — demand-driven promotion of only failing pinned groups → valid L1
  AC-710 — probe residuals/findings are diagnostic (name leaves + magnitude)

Progress: 4 of 9 plan items complete
```

The story is grounded in both the intent (REQ-86 §Goal/Behaviour/Acceptance and the free-coding delivery notes in `bundle-31e474b9`) and the code (`tools/generate/src/l1/probes.ts` + `tests/req86-e2e-repro.test.ts`). It documents the acceptance boundary as user-visible capability — the three probes, their combined gate over the absolute-base/structure-overlay split, and demand-driven `promoteToFlow` — while keeping ACs behavioral (observable report shapes and pass/fail discriminators, no internal function names). Dependencies on CAP-70 (item 1) and CAP-71 (item 2) are recorded per the plan.
