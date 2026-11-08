---
uid: report-2d1becf5
id: REPORT-1273
type: report
title: 'Overlap resolution: cluster 2'
created_by: xgd
created_at: '2026-08-05T17:46:36.358649+00:00'
updated_at: '2026-08-05T17:46:36.358649+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '2'
---

## Cluster 2 Resolution

**Boundary**: Gradients: captured/diffed fidelity axis (1c) vs authored L1 surface fill and absolute-or-overlay stop colours (substrate)
**Stories resolved**: 3 (0 reassigned, 0 merged, 3 confirmed)

### Verdict

The overlap is **nominal, not behavioural** — "gradient" is shared *vocabulary*
across three distinct roles, and each role is owned exactly once. No AC is
duplicated across the CAP-63 / CAP-70 boundary, and the three roles are carried
by three genuinely different code paths (verified by test imports, not by prose):

| Role | Owner | Code path | ACs |
|---|---|---|---|
| **Capture + diff** a gradient as a fidelity axis — stop-position tolerance, positionless-stop rule, surface-gradient present-vs-missing | CAP-63 / STORY-76 | `diffManifests` over capture manifests | AC-634, AC-635, AC-636 |
| **Define + render** the L1 typed gradient axis — angle + >=2 hex stops, background-layer compositing, envelope rejection | CAP-70 / STORY-83 | `validateL1` + `renderL1Document` (`packages/site-schema/src/l1`, `packages/framework/src/l1`) | AC-725, AC-726 |
| **Author** a gradient at the module seam — shared resolver (literal-or-role) + module content validation | CAP-63 / STORY-76 | `resolveSurfaceGradient` (`modules/text-style.ts`), `validateModuleContent` (`modules/validate.ts`) | AC-637, AC-638 |

The third row is the ambiguity the survey flagged ("the authoring half could
equally sit in CAP-70"). It is **not a duplication defect**: nothing in CAP-70
covers the module-layer resolver or the module content validator's gradient
field. L1 is hex-only and forbids role indirection *by design* — STORY-80's
AC-716 states it explicitly ("the named-overlay affordance (palette role / named
step / named shape) is an authoring-layer convenience above L1, not part of the
safe substrate"), and STORY-80's body repeats it as REQ-79 language-triviality
principle #2. AC-637 asserts `resolveSurfaceGradient({angleDeg: 135, stops:
['#f1f5f9', 'accent']})` yields `linear-gradient(135deg, #f1f5f9 0%,
var(--color-accent) 100%)` — the literal-or-overlay pair. That behaviour is
structurally *outside* what L1 can cover, so relocating it into CAP-70 would
place an AC in contradiction with its host story's stated scope.

**No reassignment is warranted.** Three of STORY-76's five ACs are `values-diff`
comparison semantics with tolerances — CAP-63's declared core ("the
captured-and-compared per-element properties ... their tolerances and
severities"). Moving the story to CAP-70 to chase two authoring ACs would pull
the diff spine out of the diff capability: strictly worse. CAP-63's rebalanced
scope already names the seam deliberately — "Gradients as a first-class value —
text-fill and panel/surface gradients captured with direction and ordered colour
stops (including stop position offsets), **authorable**, and diffed as a fidelity
axis" — and CAP-63's out-of-scope ("the L1 typed tree, its envelope validator and
safe renderer") is respected: AC-637/638 touch none of those.

**No merge is warranted.** No story pair describes the same behaviour. AC-634/635/636
assert on diff deltas, AC-725/726 on emitted CSS and envelope errors, AC-637/638
on a resolver's declaration string and a module validator's error list. Four
artifacts, four observations — none a restatement of another.

**Story cohesion holds.** STORY-76's authoring third exists in service of the 1c
fidelity loop — capture the gradient, diff it, author the value that closes the
diff — which its own user-value statement makes explicit: "...and I can author
the panel gradient that closes the gap." Splitting is not an available action,
and a 2-AC gradient-authoring story would recreate exactly the below-threshold
fragmentation the 2026-08-05 rebalance consolidated away (CAP-64 "1c Gradient
Fidelity" was merged into CAP-63 for that reason).

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-82eb6908 (STORY-76) | confirm | capability-aa030c83 | (no change) | Centre of gravity is the capture/diff spine (AC-634/635/636 over `diffManifests`), which is CAP-63's declared core. Its authoring third (AC-637/638) covers the module-layer literal-or-role resolver and module content validator — behaviour L1 structurally cannot own, and which no CAP-70 AC duplicates. CAP-63's scope names gradient authoring explicitly; its out-of-scope (L1 tree / envelope / renderer) is not breached. |
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 | (no change) | This *is* the substrate. Owns the L1 typed gradient axis and its envelope (AC-725 renders gradient/scrim/background as ordered layers re-derived from typed fields; AC-726 rejects non-hex stops, <2 stops, unknown keys). Touches capture only as the round-trip gate's consumer, never as owner of a diff axis — CAP-70's out-of-scope names the 1c capture/diff axes as CAP-63's. |
| story-c490f1cf (STORY-80) | confirm | capability-ae9d65d6 | (no change) | The absolute-base repointer for values re-homed onto L1 leaf axes after the REQ-84 dial deletion — squarely CAP-70's "Absolute-or-overlay value system" scope line. Its sole AC-716 covers hex/px literals via `validateL1` + `renderL1Document`, and explicitly parks the named-overlay affordance *above* L1, which is what keeps it disjoint from STORY-76's role-alias resolver. |

### Verification

- Every story belongs to exactly one capability; no story was skipped.
- No merges performed, so no AC relationships were disturbed. All 18 ACs across
  the three stories (5 + 12 + 1) retain their original `story_uid`.
- No test renaming required (no AC moved between stories).
- Evidence is live, not asserted: `npx vitest run
  tests/reconcile-gradient-first-class.test.ts tests/req62-gradient-panel.test.ts
  tests/reconciliation-absolute-value-literals.test.ts` — **3 files passed, 13
  tests passed, 0 failed**.
- Code-path disjointness confirmed by import inspection: the L1 tests import
  `validateL1` / `renderL1Document`; the gradient-authoring tests import
  `resolveSurfaceGradient` / `validateModuleContent`. No shared symbol.

### Out-of-scope observations (not acted on)

These are AC-hygiene issues orthogonal to the capability boundary, and outside
the three actions this resolution step permits (reassign / merge / confirm):

1. **AC-637's title is stale.** It reads "A text-block authored with a gradient
   panel renders a padded, rounded panel with that gradient surface", but the
   `text-block` module was deleted by REQ-84. The criterion body and its test
   both describe only the shared resolver, so the title contradicts its own
   body. STORY-76's out-of-scope note already concedes the gap: "no module
   currently owns a padded/rounded/inset gradient-panel render".
2. **`resolveSurfaceGradient` has no production consumer.** It is exported from
   `packages/framework/src/index.ts`, but neither live behavior module (carousel,
   contact-form) declares a gradient content field. AC-637's evidence is a direct
   resolver call rather than a real entry point — a coverage-strength question,
   not a boundary one.
3. **Matrix status drift.** AC-716 sits at `status: pending` while its test
   passes; AC-725 and AC-726 carry no `uat_coverage` field despite passing
   tests. Flagged for a matrix-cleanup pass.
