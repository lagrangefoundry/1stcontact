---
uid: report-fbae9a89
id: REPORT-3876
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T02:37:15.644081+00:00'
updated_at: '2026-09-11T02:37:15.644081+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '2'
---

Story and criteria are in. Grounding notes:

- **Intent first**: read REQ-165's section of `bundle-87be4669` (body + the "What landed" half + the ticket's only chat comment, which carries no spec dialogue), then the code — `tools/generate/src/cli/kb-projection.ts`, `writeProjections`/`corpusMembership`/`projectedDocument` in `kb.ts`, the `kb export|build|status` wiring in `cli/index.ts` — and the FC suite already on disk (`tests/test_UAT_FC_REQ-165_projected_reference.test.ts`, 13 tests). The 13 ACs map 1:1 onto those 13 UATs, so `check_fc_orphans` has a formal criterion for each.
- **No intent/code contradiction** for this item. Four reconciliation decisions are recorded in the story's `## Reconciliation Decisions`: the one-document-per-source granularity the intent left open; the two-producer split in `1c kb status` (intent silent); the deliberate **non**-formalization of "no projected fact is also stated in an authored document" (the intent itself scopes that to review, and it has no observable boundary — the testable half is covered by the exhaustive/nothing-invented ACs); and the awareness-map clustering question left open so a later clustering change isn't a false regression.
- Worth flagging: this worktree's `kb.ts` still carries `optedIn`/`INCLUDE_FIELD` — plan item 1's REQ-164 change hasn't been cherry-picked yet. AC-1636 is written over the *declared* predicate rather than any particular one, so it holds before and after that arrives.

```
Story #2 created for reconciliation bundle-87be4669

Story UID: story-5836022a (STORY-137)
Title: Projected Reference: The Product's Own Facts, Generated From Their Sources
Type: feature
Acceptance Criteria: 13 created (AC-1634 … AC-1646)

Progress: 2 of 17 plan items complete
```
