---
uid: report-b4fa019a
id: REPORT-1907
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T21:49:32.182167+00:00'
updated_at: '2026-08-12T21:49:32.182167+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-8a132869
  plan_item_index: '3'
---

Working tree is clean — only ticket commits; no runtime code touched.

**Two deviations from the plan's literal AC wording, both deliberate:**

1. The plan asked the new pan AC to say an unreadable framing form "remains findable as a **residual**." The residual channel in this story is per-**element** (AC-733) — an image with an unparseable `object-position` still folds to a leaf, just without the axis, so no residual is emitted. I worded it as: no axis is written, never a guess, and the gap stays findable because framing is an axis the reproduction comparison already checks (confirmed: `objectPosition` and `filter` are both Type-A axes in `values-diff.ts:1319,1332`). The distinction is recorded in Technical Context as the value-level analogue of the element-level promise.
2. The colour-adjustment AC is stated of a folded **surface** as well as a folded picture, because `boxAxes` folds `filter` too (`fold.ts:967`) — not only `imageAxes`.

```
Upgrade mutations applied for plan item 3 of 4

Target Stories: story-8acc338d
Primary Story UID: story-8acc338d
Stories Modified: 1
ACs Modified: 1
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-8acc338d"          # STORY-84
  acceptance_criteria:
    modified: ["acceptance_criterion-39597704"]   # AC-729 (body + title)
    added:
      - "acceptance_criterion-ce707959"           # AC-1133 — framing folds to the typed pair
      - "acceptance_criterion-15a70fd3"           # AC-1134 — colour adjustment folds to the typed stack
    removed: []

Progress: 3 of 4 plan items complete
```

What changed in the story body: the image-leaf bullet now names framing and adjustment; the box-leaf bullet names the surface's own adjustment; a new **"How a measured value becomes a typed axis"** paragraph states the four admission rules (default-not-carried, per-function no-op, one fraction per spelling, unreadable-is-a-gap, over-envelope carried at the nearest expressible value); In scope gains the framing/adjustment axes and Out of scope gains the editor surface that writes the same parameters by hand (item 2's bucket). Technical Context gains the residual-is-per-element clarification, the REQ-136 capture/fold gap note, the envelope-matched clamp ceilings, the deliberate drop-shadow omission, and an amendment to the transform/mask bullet so framing (which does not move the box) is correctly on the idempotency-safe side.
