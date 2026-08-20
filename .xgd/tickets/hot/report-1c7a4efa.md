---
uid: report-1c7a4efa
id: REPORT-2290
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-08-20T01:04:33.751635+00:00'
updated_at: '2026-08-20T01:04:33.751635+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-2485c83c
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: Behaviour-instance catalog, config validation and vetted default look sit on both sides of the module contract
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-b3de4571 (STORY-107) | confirm | capability-2d32662d (CAP-94) | (no change) | Owns the **consumer** side: the governed control surface / CLI through which a site owner instantiates a component. Its evidence runs entirely through the AI toolbox and `module add\|set\|rm` CLI. Three of its four subjects (settings, page metadata, generated images) have no module-contract content at all; moving it would drag them into the framework capability. |
| story-179b8c06 (STORY-85) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the **producer** side: the behavior-module contract itself — typed config specs, the validators, the catalog registry, the L2 preset, slots/controls, zero-CSS obligation, shipped client JS. Its evidence reaches `packages/framework/src/index` directly. Moving it would evict the framework contract from the framework-substrate capability. |

### Why the overlap is acceptable

The cluster names three touch points. In each, the two stories observe the same
subject matter from **two different, separately-checkable boundaries** — a
producer/consumer split, not a duplication. Verified against the ACs' stated
verification methods *and* the committed test entry points, not prose alone:

| Touch point | CAP-70 / STORY-85 (framework contract) | CAP-94 / STORY-107 (control surface) |
|---|---|---|
| **Catalog** | The registry keyed `<id>@<version>`; `kind: 'behavior'` discriminant; `Behavior*` types resolve from the package root (AC-8d11ea8d) | `list_behaviors` **projects** the catalog through the surface, and an unknown kind returns the surface's `NOT_FOUND` envelope naming what the catalog holds (AC-4807267c / AC-1098) |
| **Config validation** | `validateBehaviorConfig` reports per-field violations for required/type/range/enum/list-item defects (AC-145872b3 / AC-697) | The **surface** applies that check ahead of the site definition validator, so the caller gets a field error rather than a render-time surprise, and the page is left unchanged (AC-d27d0a92 / AC-1100) |
| **Vetted default look** | `contactFormPreset()` **produces** valid L1, binds one control per field plus submit, exposes overridable design constants (AC-ec371aca / AC-811) | Adding a component with configuration alone **consumes** that preset so the instance arrives rendering in one call, then is refinable through the element-tree write path (AC-775579b2) |

Evidence is disjoint by file and by entry point:

- STORY-107 → `tests/reconciliation-beyond-l1-authoring.test.ts`, importing
  `tools/generate/src/cli` and the AI toolbox. AC-1098 asserts on the toolbox
  response shape and the CLI's `{ok:false,error}` envelope.
- STORY-85 → `tests/reconciliation-behavior-modules.test.ts` and
  `tests/reconciliation-behavior-l1-composition.test.ts`, importing
  `packages/framework/src/index`. AC-811 calls `contactFormPreset` and
  `validateBehaviorInstance` directly and checks the subtree against
  `l1NodeSchema` / `validateL1`.

Collapsing either direction loses a real, independently-failing guarantee: the
preset could produce valid L1 while the surface never wires it in (component
arrives blank), or the validator could be correct while the surface calls it
after the site validator (error surfaces at render, not at the field).

The stories also already declare this boundary explicitly. STORY-107's Technical
Context flags the default-presentation index as living in the framework's L2
layer, "whose owning capability is the behaviour-module contract (CAP-70 /
story-179b8c06)", documented on the surface side only because that is where the
behaviour is observable — and notes a later reconciliation of CAP-70 may want an
L2-side criterion of its own. AC-811 on STORY-85 **is** that criterion, so the
flagged follow-up is already closed rather than outstanding. STORY-85's Out of
Scope reciprocally disclaims the L1 substrate and capture-fold work. STORY-107
additionally records the deliberate two-vocabulary split
(`add_component`/`list_behaviors` at the surface; `module add`/`behavior list` at
the CLI and write path) as "one set of behaviours, two vocabularies at two
boundaries".

### Verification

- Every story in the cluster belongs to exactly one capability; no story was skipped.
- No merges performed, so no AC relationships were disturbed — all 15 ACs remain
  on STORY-107 and all 15 on STORY-85.
- No ticket writes were required, so no test renaming was triggered
  (AC numbering is unchanged on both sides).
