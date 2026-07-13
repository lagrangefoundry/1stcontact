---
uid: report-f094bdb0
id: REPORT-501
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-13T20:13:59.060052+00:00'
updated_at: '2026-07-13T20:13:59.060052+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-d9c2e655
  plan_item_index: '3'
---

All tickets created successfully. Here is the completion report.

```
Story #3 created for reconciliation bundle-d9c2e655

Story UID: story-79e068e5 (STORY-69)
Title: Fidelity capture/diff blind-spot fixes: modern-CSS colour resolution and stale-reference geometry flagging
Type: feature
Capability: CAP-57 (capability-3aac6f84) — Fidelity Capture Extraction & Verification Correctness (new)
Acceptance Criteria: 5 created
  - AC-589  Modern-CSS colour formats resolve to an accurate sRGB hex, not the inferred sentinel
  - AC-590  Fully transparent or unpaintable colour falls back to the #000000 sentinel and is flagged inferred
  - AC-591  Standard rgb()/rgba() colours resolve to hex even without a rendering surface
  - AC-592  One-sided box geometry is reported as a box mismatch, not a silent pass
  - AC-593  Report prints a loud STALE-REFERENCE warning counting reference objects with no box geometry

Progress: 3 of 8 plan items complete
```

**Key decision:** I created a new capability **CAP-57** rather than filing this under the existing **CAP-56 (Fidelity Value-Diff Reporting)**. CAP-56's own body explicitly carves out "the extraction correctness and tolerance policy that decide *what counts as a difference*" as out of its scope — and item 3 is precisely that: colour extraction correctness plus comparison-verification integrity (what the diff can *see*), not report layout. Grounding: I read the REQ-52 intent (both the `4b0282b` oklch fix and `3cd464e` fix2 stale-reference notes) and the implementing code (`extract.ts` `rgbToHex` canvas resolver with two-sentinel probe + jsdom fallback; `values-diff.ts` `buildObjectCard` one-sided-geometry flag; `fidelity.ts` STALE-REFERENCE summary). Intent and code agree — no divergence to flag.
