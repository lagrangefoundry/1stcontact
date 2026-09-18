---
uid: bug-54eee0e0
id: BUG-113
type: bug
title: 1c repro serves the absolute base while the gate certifies the recovered document
created_by: EPIC-12
created_at: '2026-09-18T02:25:34.264842+00:00'
updated_at: '2026-09-18T05:05:46.277633+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9b245eb4
---


# `1c repro` serves the absolute base while the gate certifies the recovered document

## What is wrong

`tools/generate/src/cli/gate-core.ts` builds two documents:

```
const { doc: recovered, promoted } = promoteToFlow(base, { scale: CONTENT_SCALE })
const report = threeProbeGate(base, multiState, { recovered, contentScale: CONTENT_SCALE })
```

`promoteToFlow` is the machinery that converts pinned sibling groups into flow so
they cannot collide, and on the `gigabytealchemy.ai` bundle it works: `recovered`
reports **zero layout findings at every captured width**, where `base` reports
four to five overlaps.

`tools/generate/src/cli/repro.ts` imports `promoteToFlow` and never calls it. The
page it writes is `localized.doc` — the absolute base. The served
`home.html` for console iteration 3 carries **78 `position: absolute` rules**.

So the envelope probes certify a flowed document that is never served, and the
browser renders a pinned document that was never envelope-checked. The gate's
verdict is about a different artifact from the one the operator is looking at.

## Why this is not obviously a one-line fix

There is a real design tension here and this ticket must resolve it with
evidence rather than assume the answer.

- REQ-88's **absolute-base / structure-overlay** split exists on purpose:
  fidelity is a property of the absolute base — it reproduces the oracle
  exactly — while the envelope probes measure the recovered overlay. Serving the
  base is the maximum-fidelity choice.
- The epic's doctrine §2.1 says an 80%-faithful copy is worse than no copy, which
  argues for the base.
- But an absolutely-positioned page is fragile by construction: any text that
  wraps to one more line than the capture did lands on its neighbour. That is a
  fidelity failure too, and a far more visible one than a sub-pixel position
  delta.

## Behaviour wanted

Resolve the split, and make the gate's verdict describe the served artifact
either way. Two admissible outcomes:

**(a) Serve the recovered document.** `1c repro` writes
`promoteToFlow(base).doc`. The fidelity residual this introduces must be
measured and reported, not assumed negligible — if promotion costs fidelity, the
number says how much.

**(b) Keep serving the base, and say why.** The reason is recorded in the code
and in this ticket, and the envelope probes are additionally run against the
base so the served document is envelope-checked rather than exempt.

In both cases the invariant is the same: **whatever document is served is the
document the gate's verdict is about.** No probe may grade an artifact that is
not written to disk.

## Testable

- `evaluateLayout` over the document `1c repro` writes for
  `storage/references/gigabytealchemy.ai/index` reports **zero `overlap`
  findings at every captured width** — under (a) because the served document is
  flowed, under (b) because the base was repaired once the probes could see it.
- The measured fidelity residual between base and served document is reported as
  a number, so the trade made is visible rather than implicit.
- Open the reproduction in a browser at a width that is not 1280 and the form
  controls no longer paint over the prose above them.
---

## Resolution — outcome (b), on measured evidence

Promotion was measured against all three retained bundles before choosing. It is
not a servable overlay at any perturbation scale:

| bundle | promoted regions | envelope findings (base → recovered) | fidelity of the recovered doc |
|---|---|---|---|
| `gigabytealchemy.ai` | 5 | 29 → 0 | **318 residuals, maxΔ 1426px**, 12 oracle samples unmatched |
| `faelan.com` | 1 | 52 → 0 | 66 residuals, maxΔ 1363px |
| `joyfulculinarycreations.com` | 4 | 114 → 0 | 413 residuals, maxΔ 3958px |

`promoteToFlow` clears the envelope by dropping each promoted member's geometry,
so a region that was a 14px-wide check glyph in a grid becomes a full-bleed
stacked row. The recovered document is a *different page*, not a repaired one —
`maxΔ 1426px` on a 1440px viewport is the whole width. Serving it is the
80%-faithful copy the epic's doctrine §2.1 rules out. **So `1c repro` keeps
writing the absolute base, and that reason is now recorded in `repro.ts` beside
the code that makes the choice, with the cost printed on every run.**

Outcome (b) then obliges the probes to see what is served. Once they did, the
findings they reported were mostly their own:

- **The base's overlaps at captured widths were an artefact of the evaluator's
  own text-height model.** The oracle's element boxes have *zero* overlapping
  pairs at every captured width, and the reproduced boxes match the oracle to
  0.89px — yet `evaluateLayout` reported 5 overlaps per width, because a text
  leaf pins no height, so the analytic model estimated one from a 0.5em average
  glyph advance and over-counted by exactly one line on 14 of 53 leaves.
- **The remaining collisions were strictly *between* captured widths.** At 400 /
  500 / 600 / 700px the reproduction genuinely collided — including
  `control form-0-your-name` painting over the prose "Join our mailing list for
  updates" at 700px, which is the defect the operator saw in the browser. Cause:
  the fold classifies `interpolate|snap` **per node**, so across the 375→768
  window 15 of 70 nodes correctly held while the other 55 interpolated through
  positions the page never renders. A ladder window in which any node reflows is
  a breakpoint, not a fluid range.

## Behaviour this ticket lands

1. **The served document is composed, and it is what the envelope probes grade.**
   The browser paints the page body *plus* each behaviour module's presentation
   mounted at its slot, so that composition is now built explicitly (each form
   subtree translated by its slot's keyframes, mirroring the renderer's
   positioned slot) and handed to the off-sample and content-robustness probes.
   Sample-fidelity stays on the base: the base is what is written to
   `pages/home.json`, and inside a slot L1 is not the emitter — which is what
   `sampleFidelity.mounted` already existed to say.
2. **No probe grades `promoteToFlow`'s output.** The recovery is still computed,
   but only as a *costed diagnostic*: how many findings it would clear and what
   it would cost in fidelity residuals and maxΔ px. `1c l1-gate` and `1c repro`
   both print that number, so the trade is visible rather than implicit.
3. **At a captured width the envelope is measured, not estimated.** The oracle
   holds each text run's real height at every captured width; the evaluator now
   uses it, interpolating between captured widths exactly as the renderer
   interpolates geometry, and falling back to the estimate only where no
   measurement exists. Under content perturbation the measurement is grown by the
   estimator's own line-count ratio, so the robustness probe keeps its meaning.
4. **A ladder window in which any node reflows holds for every node.** The fold's
   per-node `segmentKind` verdict is promoted to a per-window one: if any node
   snaps across a window, every track holds across it. Fidelity is untouched by
   construction — at a captured width `snap` and `interpolate` both resolve to
   that width's keyframe — and the reproduction stops passing through
   intermediate layouts it never had.

## Measured result

For `storage/references/gigabytealchemy.ai/index`, the document `1c repro`
writes now reports **zero overlap findings at every captured width** (was 4–5 per
width) **and zero at every off-sample width sampled from 320 to 1440** (was 2–4
across 400–700). Sample fidelity is unchanged: pass, maxΔ 0.89px, 0 residuals.
`joyfulculinarycreations.com` drops from 35 to 16 findings at 900px and from 10
to 3 at 1100px on the same change, with fidelity likewise unchanged.

Content-robustness still fails on the served base — an absolutely-positioned page
is fragile by construction, and the only recovery we have costs more fidelity
than it is worth. That failure is now *reported about the served page* with the
recovery's price beside it, instead of being answered by a document nobody
serves. The framework gap it names is a flow recovery that preserves horizontal
geometry; that is not this ticket.

## Supersedes

REQ-88's acceptance that "demand-driven recovery CLOSES the content-robustness
residual" is invalidated. Recovery closed it only on an artifact that was never
written to disk. The gate now surfaces the residual and prices the recovery; it
does not apply it.

5. **The gate grades the bundle artifact `1c repro` actually serves.** `1c repro`
   writes `localizeAssets(<the bundle's retained l1.json>)`, but `1c l1-gate` was
   re-folding `multistate.json` and grading *that*. The two diverge the moment the
   fold changes — including from this ticket's own point 4, which is how it was
   found: on `gigabytealchemy.ai` the gate read 0 off-sample findings while the
   document `repro` wrote read 3 at 500px, because the retained `l1.json` had been
   folded before the per-window reflow hold existed. That is the same defect this
   ticket closes, one level out, so it is closed here too: the gate reads the
   retained `l1.json` + `forms.json` and grades those. The fresh fold is still
   computed — `foldResiduals` is a question about *folder power* and needs it —
   and where the two disagree the gate now says so and names `1c refold` as the
   remedy, rather than silently certifying a document the operator will not be
   served.

## Test plan

UATs in `tests/test_UAT_FC_BUG-113_served_document_is_graded.test.ts`:

- the document `1c repro` writes reports zero `overlap` findings at every
  captured width, and the same at off-sample widths;
- the envelope probes grade the composed served document — a collision that
  exists only once a module's controls are mounted is reported, where before it
  was invisible;
- `promoteToFlow`'s output is graded by no probe, and its fidelity cost is
  reported as a number by both `1c repro` and `1c l1-gate`;
- a text leaf's envelope height at a captured width is the oracle's measurement,
  not the estimate;
- a ladder window carrying any reflow holds for every node, and sample fidelity
  is unchanged by that holding;
- `1c l1-gate` grades the bundle's retained `l1.json` — the artifact `1c repro`
  serves — and reports the bundle as stale, naming `1c refold`, when that
  artifact disagrees with a fresh fold of the same oracle.
