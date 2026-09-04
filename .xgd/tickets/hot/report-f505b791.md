---
uid: report-f505b791
id: REPORT-3467
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-04T02:27:59.158453+00:00'
updated_at: '2026-09-04T02:27:59.158453+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-203b1dc2
  plan_item_index: '2'
---

Story and all 12 acceptance criteria are created and attached.

**What grounded the work:**
- Read REQ-165's section of `bundle-203b1dc2` — both the original statement and the "What landed" half, which is later and was followed (the landed half names the framework behavior catalogue as the first source, records the one-document-per-source granularity decision, and enumerates the two-namespace sweep, the no-rewrite rule and the declaration-derived membership).
- Read `tools/generate/src/cli/kb-projection.ts` (865 lines), `writeProjections` / `corpusMembership` / `projectedDocument` in `kb.ts`, and the `kb export` / `kb build` wiring in `index.ts:748-800`. The projections run first in both commands, not only in the assets build as the plan item's phrasing implies.
- Cross-checked against `tests/test_UAT_FC_REQ-165_projected_reference.test.ts`, whose 12 existing FC tests map onto the AC set.

**Two reuse-first calls, recorded in the story:**
- The `kb status` exported-vs-projected split is REQ-165's doing but is owned by item 1's AC-1293 modification — noted in Technical Context as delegated rather than duplicated as an AC here.
- REQ-165's fourth acceptance item ("no projected fact is also stated in an authored document") explicitly assigns itself to review rather than to a test; recorded as an intent-declared review assertion, not formalised as an AC.

**Two Reconciliation Decisions** (intent silent, formalised now): the degradation contract — unreadable source prose costs a sentence, never an entry (AC-1513) — and definition scoping to the shape a term was written for (AC-1510).

One environment note: each `ticket create` reported `Push failed (may be offline)` from a proxy auth refusal. The tickets and their commits landed locally; only the push to the remote did not.

```
Story #2 created for reconciliation bundle-203b1dc2

Story UID: story-0d7d3aad
Title: Projected reference: the product's own facts reach the assistant generated from their source, never authored
Type: feature
Acceptance Criteria: 12 created

Progress: 2 of 15 plan items complete
```
