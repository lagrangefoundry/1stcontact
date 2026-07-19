---
uid: request-d6bc0d26
id: REQ-61
type: request
title: '1c responsive-diff: analyze a target across N sizes to reproduce it faithfully
  at each discrete size'
created_by: xgd
created_at: '2026-07-16T22:38:42.886677+00:00'
updated_at: '2026-07-19T04:53:19.215272+00:00'
completed_at: '2026-07-19T04:53:19.215272+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: c74a0fcb3d4fc5f9719653c0837dddbc1d846fe6
    reconcile_sha: null
    main_sha: null
  - working_sha: 32ae6eefa51ba457d41138475fc07dfeb4116891
    reconcile_sha: null
    main_sha: null
  - working_sha: b01970c3c0e0e1f7d3241e4739d27a339d333870
    reconcile_sha: null
    main_sha: null
  - working_sha: b92a5cbe4a92f7c23c3d464a8e162156dc6fceca
    reconcile_sha: null
    main_sha: null
  - working_sha: cb38897533fc17aa19c483c638687cf702ed93e4
    reconcile_sha: null
    main_sha: null
  - working_sha: 0c485b201a7a00b74e3b3ba76de755c12af96de8
    reconcile_sha: null
    main_sha: null
  - working_sha: 687a0cfd5c66f45660518306bf1e2aeb982eff81
    reconcile_sha: null
    main_sha: null
  - working_sha: a92e9022dc72a985ec3a295df377c882c7f455a5
    reconcile_sha: null
    main_sha: null
  - working_sha: 7e1649b6cb563b613aea47d814d27444951ab2cb
    reconcile_sha: null
    main_sha: null
  version: 0.0.135
  bundled_in: bundle-ab9e0cb6
---

## Goal

A **standalone pipeline that analyzes one target site across sizes** to learn how
it changes responsively — so we can reproduce a site that *looks the same as the
target at each of a small set of discrete sizes*.

This is **not** a comparison of our reproduction against the target. It renders
the **target alone** at N sizes and diffs the target-against-itself across those
sizes.

## Framing (settled)

The objective is **"looks the same at each of the N sizes"**, not "faithful to the
responsive transitions." We do **not** care how the page moves *between* the
sample sizes. That tolerance is deliberate and it simplifies everything:

- **No curve-fitting / no invariant-relationship inference.** We do not try to
  recover that a length is `50vw` or `%`-of-container. We capture the value at
  each discrete size and reproduce it per-breakpoint. Discrete pinning fully
  satisfies "looks the same at N sizes"; recognizing the underlying CSS unit only
  buys between-size fidelity, which is out of scope.
- The big, important responsive changes are **discrete and structural**, not
  smooth: components disappear on mobile, nav collapses from a bar to a hamburger,
  font sizes step at breakpoints. Those are what we must capture.

## Size parameter on the existing diff commands (gap — in scope)

Neither existing diff command takes a viewport size today:

- `1c diff` (pixel/perceptual, `tools/generate/src/cli/perceptual.ts` `cmdDiff`)
  — no size param; hardcoded to desktop 1280×800.
- `1c values-diff` (`tools/generate/src/cli/fidelity.ts` `cmdValuesDiff`) — no
  size param; a `--multi-viewport` mode exists but it reads the reference's own
  persisted ladder, not a user-chosen size.

**Add a `--size desktop|tablet|phone` parameter to BOTH commands, default
`desktop`** (preserves current behavior). This is the shared size vocabulary the
new `responsive-diff` command also uses.

## New command: `1c responsive-diff`

A new command, parallel to today's value-diff (which compares two *versions* of a
site) — but this compares **one site rendered at N sizes**.

- Renders the target at **N sizes, configurable, default 3** (mobile / tablet /
  desktop).
- Emits an **N-way value diff**: one row per DOM node, N columns of captured
  values (box geometry, computed styles, font sizes), so each value's trajectory
  across sizes reads left-to-right. A pairwise diff hides the trend; we want all N
  values side by side.
- This artifact is the mechanical Phase-1 deliverable. The AI reads it and authors
  per-breakpoint overrides for the reproduction.

**Why the N-way diff is mechanically easy:** for CSS responsive design it is *one
shared DOM* across all N renders — same nodes, only computed styles differ. So:

- same DOM node = same component (no cross-size identity-matching problem);
- "component departs on mobile" = that node goes `display:none` (still in the diff,
  flagged gone);
- hamburger swap = *both* the menu bar and the hamburger are in the DOM the whole
  time; each size hides one — so it shows up as two presence-flips.

Edge case: JS that swaps DOM *content* per size (rather than CSS-hiding it) breaks
the shared-DOM assumption. Real but rarer; treat as a known edge case.

## Phase 2 (small classifier, not inference)

Over the N-way diff, flag the rows that change across sizes and classify each
change into one of three kinds:

1. **value-step** — a value jumps (font 48→32, padding shrinks) → per-breakpoint
   value override. Trivial.
2. **presence-flip** — `display` toggles (component departs / appears) →
   per-breakpoint visibility. The important one.
3. **layout-swap** — structural change (menu→hamburger, `flex-direction`
   row→column) → **module-internal** responsive behavior, not a value override.
   The nav/header module must know how to collapse. Per the "generalize a module
   before adding one" principle, this is a responsive *treatment* on the existing
   nav/header module, not a new "hamburger module."

This is diffing plus a tiny classifier — no fitting.

## Reproduction-side dependency (investigated 2026-07-16)

The diff produces per-breakpoint overrides + module responsive treatments. Current
state of the consuming side:

- **Per-breakpoint VALUES: not supported for lengths/dials.** `classifyLength` /
  `LengthKind` (`packages/framework/src/modules/dials.ts:157-194`) takes a single
  scalar (literal or token); `validate.ts:170-181` enforces scalar. No breakpoint
  keys.
- **But the pattern already exists for POSITIONS (REQ-15).**
  `positionBreakpointsSchema` (`packages/site-schema/src/schema.ts:212-226`) keys
  overrides by `sm/md/lg/xl`; `layer.ts:60-73,172-193` emits media queries with an
  "override and up" cascade. → **Generalize this proven position-breakpoint
  mechanism to dial/length values** rather than inventing a new one. This is the
  real def-side work and it is a *generalization*, aligning with the
  "generalize before adding a module" principle.
- **Nav collapse exists but is hardcoded, not configurable.** The header hamburger
  (`packages/framework/src/modules/header/index.astro:185-201`) is baked at
  `max-width: 768px` with no per-instance dial. → For layout-swap reproduction it
  needs to become a configurable responsive **treatment** on the header/nav
  module (breakpoint + on/off), not a hardcoded rule.

## Scope boundaries

- **In:** `--size` param on `1c diff` and `1c values-diff` (default desktop);
  the `1c responsive-diff` command (Phase 1, N configurable, default 3); the
  change-classifier (Phase 2); generalizing per-breakpoint overrides from
  positions to dial/length values; making nav/header collapse a configurable
  treatment.
- **Out:** inferring CSS units / continuous relationships; between-size fidelity;
  comparing our reproduction against the target (that stays the existing
  value-diff).

## Dependencies / lineage

- Builds on REQ-58: multi-viewport capture (T2 `multistate.json`) and the length
  value model (T13).
- Builds on REQ-15: the position per-breakpoint override mechanism, which is the
  template for per-breakpoint dial/length values.
- Supersedes the earlier REQ-61 framing (length-KIND inference for the
  ours-vs-theirs values-diff), which is dropped: the goal is standalone
  discrete-per-size reproduction, not unit recovery.


## Task 6 scope correction — per-breakpoint is "across the board", not a subset (2026-07-16)

Operator: scope is NOT discretionary. Per REQ-58 T11–T19, the reproduction
philosophy is **every CSS parameter expressible as an absolute number, with named
steps/roles as a design overlay — across the board, once and for all.** Per-breakpoint
is that same mandate extended to the breakpoint dimension: every length parameter
that takes an absolute value must also take **per-breakpoint absolute values**.

Consequence for the build: this is a **value-model generalization at the shared
`resolveStep` / inline-`--fc-*`-var seam** (dials.ts) — NOT a per-module wiring
choice. Every dial already routes through that seam (T18/T19: spacing, contentWidth,
gap, logoSize, offsets, inset, panelPad), so generalizing the seam gives per-breakpoint
uniformly. Mechanism mirrors the position `{sm/md/lg/xl}` "override-and-up" cascade
(layer.ts overrideChain / BREAKPOINT_PX):
- a length value may be a per-breakpoint object `{ base, sm?, md?, lg?, xl? }`;
- the resolver emits base + per-breakpoint override vars (`--fc-pt`, `--fc-pt-sm`…);
- a shared CSS-rules generator emits the media-query override chain per consumed
  property, so a module opts a property in with one call (mirrors breakpointRules()).
Plus: nav/header hamburger collapse becomes a configurable treatment (breakpoint dial),
not hardcoded at 768px.