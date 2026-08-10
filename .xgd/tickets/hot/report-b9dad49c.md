---
uid: report-b9dad49c
id: REPORT-1755
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-10T08:24:29.196403+00:00'
updated_at: '2026-08-10T08:24:29.196403+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-e59210c5
  plan_item_index: '3'
---

Plan item 3 applied.

**Intent read first** (bundle-e59210c5 → REQ-128 section; no comments on the ticket). The operator's declared spec: background *image* is a re-phasing of REQ-118's phase 1, not a gap; it reuses that ticket's derivation, enum control, asset listing and `copy get|set` surface; **selection only — no "none" option**; **change, never add**; the axis is offered on the container segment only, not on `text`/`image` nodes that can also carry it. Code (`packages/site-schema/src/l1/edit.ts` `backgroundHandleOf`/`copyFieldsOf`/`applyCopyFields`, `tools/generate/src/cli/edit.ts` `PICKER_KINDS`/`segmentOptions`) matches the intent exactly — including the empty-string-is-not-a-background rule and assignment into the existing `axes` object. No divergence to record.

Two ACs outside the plan's `add` list were **sharpened** rather than left contradictory: AC-981 and AC-1001 both named "a container" as a region that exposes nothing, which is now false for a container carrying a background. Both now say "a painted panel carrying **no** background image". Same behaviour surface, same target stories — no new capability.

```
Upgrade mutations applied for plan item 3 of 8

Target Stories: story-37a3921b, story-3bf94bd4
Primary Story UID: story-37a3921b
Stories Modified: 2
ACs Modified: 2
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-37a3921b"
    - "story-3bf94bd4"
  acceptance_criteria:
    modified: ["acceptance_criterion-95afd919", "acceptance_criterion-2f436fa0"]
    added:
      - "acceptance_criterion-8a3c8c3e"   # AC-1045 (story-37a3921b) one closed picker, nothing else of its paint
      - "acceptance_criterion-3cf8a118"   # AC-1046 (story-37a3921b) updates background, other axes and asset bytes untouched
      - "acceptance_criterion-145e768e"   # AC-1047 (story-37a3921b) current handle always among options
      - "acceptance_criterion-3c28fccd"   # AC-1048 (story-37a3921b) off-list handle refused at the field, whole-or-nothing
      - "acceptance_criterion-6ee8863b"   # AC-1049 (story-37a3921b) paint but no background -> empty field list
      - "acceptance_criterion-170a171f"   # AC-1050 (story-3bf94bd4) same transport, field-scoped refusal
    removed: []

Progress: 3 of 8 plan items complete
```

Story-100 body now widens "asking what a region exposes" to painted panels, adds the out-of-scope bullets (adding/removing a background; background colour and the rest of the paint group), and records four technical-context points: one listing serves both pickers, why there is no empty option (typed rather than checked), why the handle is offered on the panel and not on everything that can carry one, and that applying writes *into* the existing parameters. Story-101 records kind-agnosticism proved a second time with no client change, that a background handle is not dressed as copy, and that the "nothing to edit" worked example has narrowed again. No runtime code touched; working tree clean of source changes.
