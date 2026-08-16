---
uid: report-c3c3870e
id: REPORT-2028
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-08-16T00:29:07.901079+00:00'
updated_at: '2026-08-16T00:29:07.901079+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-7ef6a9ea
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: Behaviour component catalog, contract validation and vetted default look
**Stories resolved**: 2 (both confirmed — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-179b8c06 (STORY-85) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the *mechanism*: the behavior contract, its `Behavior*` publication and `kind: 'behavior'` discriminant, the `<id>@<version>` registry, the `validateBehaviorConfig/Slots/Controls/Instance` validator semantics, and the L2 default-look preset. Framework-internal; entry points are framework functions. |
| story-b3de4571 (STORY-107) | confirm | capability-2d32662d (CAP-94) | (no change) | Owns the *governed authoring surface* over that mechanism: `list_behaviors` / `add_component` / `configure_component` / `remove_component` (and the `module add\|set\|rm` CLI vocabulary), their ordering guarantee, error taxonomy and observable end-to-end outcome. Only one of its four subjects (components) touches CAP-70 at all; settings, page metadata and generated images do not. |

### Why this overlap is acceptable

The cluster names three apparent collisions. Each resolves as a **provider/consumer
split across the framework/control-surface boundary**, with the two sides asserting
different propositions at different entry points:

1. **Catalog.** AC-1098 (CAP-94) asserts the catalog is *readable through the governed
   surface* and that naming an absent kind is refused with a `NOT_FOUND` whose text
   enumerates what the catalog holds. AC-8d11ea8d (CAP-70) asserts the catalog *exists
   and is published* under the `Behavior*` names with an atomic discriminant. Neither
   subsumes the other.
2. **Contract validation.** AC-1100 (CAP-94) asserts *where in the call sequence* the
   check runs (ahead of the site-definition validator), that the caller sees a
   field-scoped refusal, and that the page is unchanged. AC-697 (CAP-70) asserts *what
   the validator checks* — per-field typed specs, enum/min/max, `itemSchema` recursion,
   violation shapes. Sequencing-and-surface vs. validator semantics.
3. **Vetted default look.** AC-1099 (CAP-94) asserts the observable outcome — config
   alone yields a rendering component with a control per field. AC-ec371aca (CAP-70)
   specifies the L2 preset that *produces* that subtree, its control bindings and its
   overridable design constants. AC-1099 is a consumer of AC-ec371aca.

### Corroborating evidence

- **The stories already declare the boundary explicitly.** STORY-107's Technical Context
  flags the default-presentation index as living in "the framework's L2 layer, whose
  owning capability is the behaviour-module contract (CAP-70 / story-179b8c06)", noting
  it is documented at CAP-94 only because that is where the behaviour is *observable*,
  and that a later CAP-70 reconciliation "may want an L2-side criterion of its own".
  **That flagged reconciliation is already satisfied**: CAP-70 carries AC-ec371aca. The
  two sides are complementary, not redundant.
- STORY-107 also records the deliberate two-vocabulary naming (`add_component` at the
  surface, `module add` in the write path) — "one set of behaviours, two vocabularies at
  two boundaries" — which is the boundary itself, stated.
- STORY-85's **Out of scope** names the L1 substrate and capture fold but never claims
  the control-surface operations; STORY-107's **Out of scope** names authoring a new
  *kind* of component ("the catalog is closed, and a new behaviour is written, reviewed
  and vetted by a developer"), which is exactly CAP-70's territory. The exclusions are
  mutually consistent.
- **Evidence is disjoint at the code level.** CAP-94's UATs live in
  `tests/reconciliation-beyond-l1-authoring.test.ts` and drive the control surface
  (`box.run('list_behaviors')`, `box.run('add_component', ...)`) plus the CLI
  `{ok:false,error}` envelope. CAP-70's live in
  `tests/reconciliation-behavior-modules.test.ts` and call framework functions directly
  (`validateBehaviorConfig(meta, config)`). No test file, entry point or assertion is
  shared.

### Why not reassign or merge

- **Reassign is wrong.** STORY-107 is one cohesive story over four authoring subjects —
  settings, components, page metadata, generated images. Only the component portion
  touches CAP-70's domain. Moving the whole story would drag settings, page metadata and
  SVG-validator scope into the framework substrate capability, which is plainly outside
  CAP-70's declared boundary. Splitting the story is not permitted by this step (no new
  stories), and would not be warranted anyway — the four subjects share one surface, one
  write path and one grant model.
- **Merge is wrong.** The stories describe different behaviour at different layers with
  disjoint evidence; merging would collapse the mechanism/surface boundary that CAP-70's
  own body declares load-bearing ("layout is L1; behavior is a module" — DOC-23, DOC-24)
  and would leave the merged story straddling two capabilities.

### Verification

- Every story in the cluster belongs to exactly one capability: story-b3de4571 ->
  capability-2d32662d; story-179b8c06 -> capability-ae9d65d6. Unchanged, and each has a
  single `capability_uid`.
- Neither story was skipped; both were read in full along with all 30 of their ACs
  (15 each).
- No merges performed, so no AC reparenting was required and no test function renaming
  is needed — all 30 ACs retain their existing `story_uid` and their
  `test_UAT_AC<number>_*` names remain correct.
- No ticket writes were made for this cluster, by design (action C).

### Observation (out of scope, not acted on)

capability-ae9d65d6 carries `uat_coverage: fail` at the capability level while its ACs
sampled here report `uat_coverage: pass`. This is a pre-existing condition unrelated to
the overlap and outside this step's remit; flagged only so it is not mistaken for a
side effect of overlap resolution.
