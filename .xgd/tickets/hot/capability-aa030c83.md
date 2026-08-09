---
uid: capability-aa030c83
id: CAP-63
type: capability
title: 1c Capture & Diff Fidelity
created_by: xgd
created_at: '2026-07-19T02:17:11.713654+00:00'
updated_at: '2026-08-09T01:13:44.163061+00:00'
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
- **Gradients as a first-class value** — text-fill (`background-clip: text`) and
  panel/surface gradients captured with direction and ordered colour stops
  (including stop position offsets), authorable, and diffed as a fidelity axis.
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

Overlap cluster 3 (2026-08-08) confirmed STORY-79 in place and recorded the
ownership rule above. The CAP-66 merge is what made a CLI-wide story sit inside a
domain-named capability; the asymmetry is a naming artifact of that merge, not a
misfiling, and the rule states the boundary explicitly so the question does not
have to be re-litigated per verb.
