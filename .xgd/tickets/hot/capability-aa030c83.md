---
uid: capability-aa030c83
id: CAP-63
type: capability
title: 1c Capture & Diff Fidelity
created_by: xgd
created_at: '2026-07-19T02:17:11.713654+00:00'
updated_at: '2026-08-09T01:20:01.813593+00:00'
completed_at: null
last_field_updated: body
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