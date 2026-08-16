---
uid: comment-3b6fdccc
id: COMMENT-1029
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-16T00:29:30.249709+00:00'
updated_at: '2026-08-16T00:29:30.249709+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c3c3870e
  kind: note
---

Cluster 4 resolved. **Both stories confirmed in place — no ticket changes.**

## The finding

The cluster's three apparent collisions all resolve as one **provider/consumer split across the framework ↔ control-surface boundary**:

| Overlap | CAP-70 / STORY-85 asserts | CAP-94 / STORY-107 asserts |
|---|---|---|
| Catalog | the registry exists and is published (`Behavior*`, `kind:'behavior'`) — AC-8d11ea8d | it's *readable through the governed surface*, and an absent kind is `NOT_FOUND` naming what the catalog holds — AC-1098 |
| Contract validation | *what* the validator checks — typed specs, enum/min/max, `itemSchema` recursion — AC-697 | *where in the call sequence* it runs (before the site validator), field-scoped refusal, page unchanged — AC-1100 |
| Default look | the L2 preset that *produces* the subtree — AC-ec371aca | the observable outcome: config alone → rendering component with a control per field — AC-1099 |

Neither side subsumes the other; AC-1099 is a *consumer* of AC-ec371aca.

## What made this conclusive

- **The stories already state the boundary.** STORY-107's Technical Context flags the default-presentation index as owned by "CAP-70 / story-179b8c06", documented at CAP-94 only because that's where the behaviour is *observable*, and notes a later CAP-70 reconciliation "may want an L2-side criterion of its own". That flagged reconciliation is **already satisfied** — CAP-70 carries AC-ec371aca. The two sides are complementary by design.
- **Evidence is disjoint in code.** CAP-94's UATs (`tests/reconciliation-beyond-l1-authoring.test.ts`) drive the control surface — `box.run('list_behaviors')`, `box.run('add_component', …)`, the CLI `{ok:false,error}` envelope. CAP-70's (`tests/reconciliation-behavior-modules.test.ts`) call framework functions directly — `validateBehaviorConfig(meta, config)`. No shared file, entry point, or assertion.
- **Mutually consistent exclusions.** STORY-85 never claims the surface operations; STORY-107 explicitly puts authoring a new *kind* of component out of scope.

Reassignment was rejected because STORY-107 covers four authoring subjects (settings, components, page metadata, generated images) and only the component slice touches CAP-70 — moving it would drag the SVG validator and settings-merge scope into the framework substrate. Merging would collapse the "layout is L1; behavior is a module" boundary CAP-70's own body declares load-bearing.

## Verification

Each story has exactly one `capability_uid`, unchanged. Both read in full along with all 30 ACs. No merges → no AC reparenting, and all `test_UAT_AC<number>_*` names remain correct.

Report `REPORT-2028` (`report-c3c3870e`) created with `cluster_id: 4`, `report_kind: overlap_resolution`, `subject_uid: report-7ef6a9ea`, result `pass` — fields verified.

One thing I noted but did **not** act on, as it's outside this step: `capability-ae9d65d6` carries `uat_coverage: fail` at the capability level while the ACs I sampled report `pass`. It's pre-existing and unrelated to the overlap; I recorded it in the report so it isn't mistaken for a side effect of this resolution.
