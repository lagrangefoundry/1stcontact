---
uid: acceptance_criterion-1cd3b11f
id: AC-2208
type: acceptance_criterion
title: A contact written without a stage is stored at Lead, and the seeded platform
  operator is stored at Invited, agreeing with its invite stamp
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:15.241331+00:00'
updated_at: '2026-11-07T21:54:19.780609+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
On the baseline schema, a contact written without naming a pipeline stage is stored at stage `lead` — whether or not it carries an invite timestamp — because `lead` is the column's default and the stage is never derived from the stamp. The platform operator seeded at bootstrap is stored at stage `invited`, consistent with its seeded invite timestamp, so the seeded row's stage does not disagree with its stamp; re-running the seeding writes no second row. The seeded operator reads as **Invited** through the people API.

## Verification
On a fresh database with the baseline schema applied, insert contacts without naming a stage, one with and one without an invite timestamp; assert each is stored at `lead`. Run bootstrap seeding of a platform operator; assert the seeded row has a set invite timestamp and stage `invited`, and that seeding again leaves exactly one address row for that operator. After the operator accepts the terms, read the people API as them and assert their row is `pipelineStage == "invited"` and labelled "Invited".

## Alignment note
Rewritten in place under the `aligned_to_tip` ruling of fix plan REPORT-11180. The previous criterion asked that a pipeline-stage migration backfill existing contacts by their invite stamp. The REQ-190 rebaseline folded every prior migration into `0001_baseline.sql`, with `pipeline_stage` as a baseline column, and the database was wiped rather than migrated, so no backfill exists to test.
