---
uid: capability-aa030c83
id: CAP-63
type: capability
title: 1c Capture & Diff Fidelity
created_by: xgd
created_at: '2026-07-19T02:17:11.713654+00:00'
updated_at: '2026-08-20T07:00:29.542126+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: 1c_capture_diff_fidelity
  uat_coverage: fail
---

# Capability: 1c Capture & Diff Fidelity

The `1c` reproduction toolchain's **capture → compare** spine, and the CLI surface
that makes it scriptable. `1c capture` records a reference site's per-element
rendered values across the viewport ladder; the diff commands compare those against
a reproduction render and emit per-element deltas by property.

The animating invariant across every story here is **"0 value-diffs ⟺
pixel-faithful"** — a clean diff must mean the reproduction genuinely renders like
the reference. Each axis closes a blind spot where the gate reported clean while the
render visibly differed, or fixes a pairing/false-delta bug in the other direction.

## Scope

- **Intrinsic value axes and pairing** — the captured-and-compared per-element
  properties (rendered-text extent, composited surface fill, box border, typography
  treatments, element effects, image crop), their tolerances and severities, and the
  element-pairing rules that decide which two elements are compared.
- **Gradients as a captured and diffed value** — text-fill (`background-clip: text`)
  and panel/surface gradients captured with direction and ordered colour stops
  (including stop position offsets), and diffed as fidelity axes. The authoring
  surface retained here is the legacy *module content-field* gradient and its
  shared `resolveSurfaceGradient` resolver, which the REQ-84 / REQ-96 pivot
  superseded and which the L1 renderer never calls. The live L1 gradient axis
  (linear + radial `surfaceGradient` / `gradientFill`) is **not** owned here — see
  the value-axis ownership rule below.
- **The values-diff report surface — noise management over an exact capture.** The
  false-positive half of the animating invariant: the per-axis noise layer applied
  as a per-run overlay above an exact capture (never baked into it), the
  `--collapse` dedup that counts defects rather than per-viewport cells, the
  demotion of a derived axis to a drill-down diagnostic, the Type-A / Type-B
  repair-order classification, and the `--clusters` roll-up into ranked causes each
  carrying a fix / review / accept disposition. What an axis *records* and what the
  report *counts* are separate decisions; both are owned here.
- **Size-aware and cross-size diffing** — the shared `--size` viewport selector on
  `values-diff` and pixel `diff`, the per-width reference screenshots capture
  persists, and the standalone `responsive-diff` N-way cross-size node analysis with
  its change classifier.
- **The `1c` CLI as a process — verb-agnostic correctness.** The guarantees that
  hold at the dispatcher, around whichever verb was named, and are therefore owned
  here for the *whole* command set rather than per command: boolean flags parse as
  boolean and do not swallow following positionals; in `--json` mode stdout carries
  only the single JSON document, with render/bootstrap diagnostics routed to stderr
  and the pages-directory warning suppressed at its source on every verb; a
  store-selecting flag reaches the render/serve a sub-command triggers; the render
  path constructs an Astro container only for a page that needs one; and a command
  that loads a declared runtime dependency refuses at dispatch when the installed
  tree does not match the committed manifests.

## Ownership rule: CLI mechanism here, verb meaning with the verb's capability

The CLI-wide guarantees above name verbs other capabilities own (`repro`,
`l1-gate`, `refold` are CAP-71's; `colors` and the `asset` verbs are CAP-89's;
`deploy`/`serve` are CAP-82's). They stay here, and the boundary is mechanism
versus meaning:

- **This capability owns the mechanism** — argv parsing, stream discipline,
  bootstrap quiet, flag propagation into sub-commands, and the install preflight.
  Each is implemented once at dispatch, ahead of the command switch, and its
  evidence is only meaningful pinned across the verb set as a whole: the gated
  command set is asserted entire so that adding a browser-driving verb without
  gating it is a visible regression rather than a silent hole. Splitting these
  per-verb across four capabilities would produce four partial copies of one
  guarantee and destroy exactly the evidence that makes it load-bearing.
- **The owning capability keeps the meaning** — what `l1-gate` decides is CAP-71's,
  what `1c colors --json` carries in its census document is CAP-89's, what a deploy
  reports and refuses is CAP-82's. A `--json` payload contract is that verb's; the
  guarantee that nothing else lands on stdout beside it is this capability's.

## Ownership rule: a value axis follows the layer that renders it

A fidelity axis added here and a value axis an author writes are different
artifacts even when they name the same design property. The rule is **the layer
that renders it**, not the driver that demanded it:

- **This capability owns the captured and compared shape** — what `1c capture`
  records for a property, the comparison axis, its tolerance and severity. A
  gradient's captured direction, ordered stops and stop offsets, and the
  text-fill and surface-gradient diff axes, are owned here.
- **The framework substrate capability owns the axis that paints it** — an L1
  leaf axis validated by the envelope and emitted by the single safe renderer.
  The L1 gradient axis is therefore CAP-70's, and is already filed there on the
  L1 substrate story rather than on any story here.

Reproduction is what motivates most L1 axes, so "the driver demanded it" would
route nearly every axis into this capability and dissolve the out-of-scope
clause below. The layer test is stable and mechanically checkable: if the value
reaches the browser through `packages/framework/src/l1`, it is CAP-70's.

## Out of scope

The L1 typed tree, its envelope validator and safe renderer, and the fold/gate
reproduction pipeline that consume these captures. Those are separate capabilities.
Likewise the content and semantics of any individual verb's output — see the
ownership rule above; only the CLI mechanism around it is owned here.

## History

Consolidated 2026-08-05 by structural rebalance from `1c Values-Diff Fidelity`
(survivor, CAP-63), `1c Gradient Fidelity` (CAP-64), `1c Size-Aware Diffing`
(CAP-65), and `1c CLI Argument Parsing & Output Hygiene` (CAP-66) — each of which
was individually below the matrix minimum UAT threshold while covering one facet of
the same capture-and-compare pipeline.

Overlap cluster 4 (2026-08-08) confirmed STORY-76 in place and recorded the
value-axis ownership rule above: the story's capture and diff halves are owned
here, and its authoring half targets the superseded module resolver rather than
the L1 axis the survey took it for.

Overlap cluster 3 (2026-08-08) confirmed STORY-79 in place and recorded the
ownership rule above. The CAP-66 merge is what made a CLI-wide story sit inside a
domain-named capability; the asymmetry is a naming artifact of that merge, not a
misfiling, and the rule states the boundary explicitly so the question does not
have to be re-litigated per verb.

BUNDLE-10 attribution repair (2026-08-19). Story-level capability-intent
alignment found `bundle-4ff83a8b` (BUNDLE-10, free_and_reconciled 2026-07-29)
referenced by no ticket anywhere in the matrix, while five of its members were
live in this capability's capture-and-compare spine and unexpressed by any story:
BUG-22 (the surface-bearing box, and the diff resolving a split control against
it), BUG-15 (the all-collapse fallback to a body-spanning band), BUG-25
(per-text-node run geometry), BUG-16 (capture-time font settling) and BUG-24
(modern-syntax scrim capture). All five are now carried by STORY-75 and the
bundle is attributed in its `updated_by`. A single skipped intent, not a
matrix-genesis boundary — BUNDLE-8 reconciled the same day and was attributed.

Unbundled-intent repair (2026-08-19). Every ledger built for this capability up
to attempt 7 enumerated *bundles* only, and this store also carries intent as
individually free-coded `request` tickets that reconcile without ever being
bundled. A store-wide sweep found four such intents live in this capability's
scope and expressed by no story: REQ-64 (the noise audit — the false-positive
sibling of REQ-63's coverage audit), REQ-76 (`--clusters` cause roll-up), REQ-72
(in-browser resolution of gradient stop colours to hex, without which a captured
gradient carries a direction and no stops) and REQ-73 (the adjacent-gap axis and
the paired retirement of section band vertical padding). REQ-64 and REQ-76 are
now carried by **STORY-116**, a sibling report-surface story, because they concern
what the diff *reports* rather than what the capture *records*; REQ-72 is carried
by STORY-76 and REQ-73 by STORY-75, each attributed in `updated_by`. REQ-66 needed
no action — it is genuinely retired and STORY-84 records the supersession.

Two live unbundled intents in this cluster are deliberately **not** swept in:
REQ-74 (`adopt-gaps` writes a repair into a site) and REQ-78 (the `1c
aligned-crops` verb's own meaning). Both are unstoried matrix-wide, but this
capability is capture-and-compare and the CLI ownership rule keeps a verb's
meaning with its owning capability, so they are cross-capability gaps to file
rather than CAP-63 story edits.

BUNDLE-10's remaining members are deliberately **not** swept in here:
BUG-12/13/14/17/18/19/20/23 and REQ-88/REQ-93 are fold / L1-pipeline (CAP-71 /
CAP-70) and BUG-21 is a framework control-surface defect. The same skipped
intent is likely to have left gaps in those capabilities and is worth checking
against them separately.