---
uid: request-7ff1bacd
id: REQ-88
type: request
title: 'L1 reproduction pipeline: capture bundle → servable, gate-able site'
created_by: xgd
created_at: '2026-07-21T23:30:09.316183+00:00'
updated_at: '2026-08-05T17:38:12.718338+00:00'
completed_at: '2026-08-05T17:38:12.718338+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 64961b57474019bb198eca62e1d8dea935f01f2b
    reconcile_sha: null
    main_sha: null
  - working_sha: 26be17a39da3d1228d2cae34c29f3d4542c3ddfb
    reconcile_sha: null
    main_sha: null
  - working_sha: eb8e1d5a9ecbcd44d42a1749620735403a691eb5
    reconcile_sha: null
    main_sha: null
  - working_sha: e7161f4fa34346fae29fe65833bbc115543f698b
    reconcile_sha: null
    main_sha: null
  - working_sha: 067d2791374364d179228c7595c0472c80c758ce
    reconcile_sha: null
    main_sha: null
  - working_sha: 2b3f0ee2dc8aefad5ca393f5b630718e61f53b90
    reconcile_sha: null
    main_sha: null
  - working_sha: 26a001020ec896f1c533824b38651d3f5bbfdc33
    reconcile_sha: null
    main_sha: null
  - working_sha: d366d8d03d0e73a0a0e0cf45f6ffe4eaaf95677b
    reconcile_sha: null
    main_sha: null
  version: 0.0.205
  story_points: 12
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-024feeba
---

## What changed

An operator-runnable pipeline that turns a capture bundle into a servable,
gate-able 1c site, plus the fidelity fixes the first real reproduction
(gigabytealchemy.ai) forced.

### 1. The pipeline (`1c repro`, `1c l1-gate`)

Before this, `foldToL1` / `renderL1Page` / the 3-probe gate existed only as
library functions exercised by vitest on synthetic fixtures. A pure marketing
page is 100% layout/content — 100% L1, with no behavior module to host it — so
there was no site representation that said "this page *is* an L1 document" and
no way to render one into servable `dist` output.

- **`1c repro <slug> --ref <bundle>`** — writes a site whose home page *is* the
  bundle's folded L1 document, and mirrors the bundle's assets into the draft.
  Idempotent (re-running wipes and rebuilds). On the reproduction values this is
  a verbatim copy — `local := value-render(target)`, materialized by the fold —
  so it adds and subtracts nothing; it is the adapter that lets `render` /
  `serve` / `shot` / `diff` / `values-diff` operate on a folded document.
- **`1c l1-gate --ref <bundle>`** — the 3-probe acceptance gate
  (sample-fidelity · off-sample · content-robustness), run analytically with no
  browser, plus the fold-residual report. Read-only; it re-folds from the
  captured value set and does not consume `repro`'s output.

The operator workflow is: `capture → repro → render/serve/shot → l1-gate +
values-diff + diff`, with each residual attributed via the DOC-21 ladder.

### 2. Fidelity fixes from the first reproduction

Found by reading the reproduction against the target. Together these took
`values-diff` from 139 to 20 deduped defects and the perceptual mean from 15.85
to 12.10 / 255.

- **Full font stack (BUG-16 follow-on).** Capture truncated `font-family` to its
  primary token, dropping the fallback stack. An unmatched family name is valid
  CSS that resolves to no font, so the reproduction had nothing to fall back to
  and painted the document default — the site rendered in serif because
  Tailwind's stack leads with `ui-sans-serif`. Runs now carry the whole stack;
  the primary is derived only where a single *name* is needed (face load-check,
  `@font-face` keying). This collapsed text extent/wrapping 50 → 7 and vertical
  spacing 24 → 1, both of which were font-metric shadows.

- **Geometric surface attribution.** `surfaceFill` / `borderLeft` /
  `surfaceGradient` were resolved by walking `parentElement`. That proxy only
  holds when the painting box is a DOM *ancestor*; an L1 reproduction paints
  bands and cards as absolutely-positioned *siblings*, so the walk skipped every
  card and reported the body backstop — ~60 phantom defects on pixels that were
  already correct (and the fill delta reported reversed), drowning the real ones.
  Resolution is now geometric: the painted boxes *containing* the run, tightest
  first. Identical on a conventionally-nested page, so the reference side is
  unchanged.

- **Section-edge band clamp.** Bands tiled to the next band's first *run*, so a
  section opening with padding was swallowed — the hero band painted 96px of
  cream near-black. Band bottoms now clamp to a real captured section edge.
  `sections[].box` was only carried when the band had a background image,
  leaving the fold with no boundaries for any other section; it is geometry
  every section has, so it is now carried always (the image URL stays
  independently gated).

## Design decisions

- **Reproduction is a copy, not a computation.** Because L1 speaks the same
  language as a captured value set, the fold *is* the reproduction; `repro` only
  packages it. All reproduction quality is therefore determined upstream by the
  fold, the language, and the renderer — nothing at `repro` can change fidelity.
- **Two gates, two concerns.** `l1-gate` grades geometry and envelope only; it
  is deliberately blind to colour, font, image and list styling. Appearance is
  measured by `values-diff` + the perceptual `diff`. A green gate on a visually
  incomplete page is the designed behaviour, not a false pass.
- **Form controls stay residuals.** L1 has no input node kind; per DOC-25/DOC-26
  these belong to the `contact-form` behavior module. The fold signals them as
  typed residuals rather than synthesizing fake controls.

## Test plan

- `tests/req88-surface-attribution.test.ts` — 6 UATs over a fixture reproducing
  the sibling-painted shape (band and card painted as absolutely-positioned
  siblings of the run), plus a nested control pinning that the reference side
  does not move. 3 fail without the fix with the exact phantom values.
- `tests/bug16-webfont-load-before-extract.test.ts`, `tests/capture.test.ts` —
  assertions moved to the full-stack `font-family` contract.
- End-to-end verification against the live target: `capture → repro → render →
  l1-gate → values-diff → diff`. `l1-gate` PASS (sample-fidelity maxΔ 0.5px,
  off-sample 0, content-robustness 0); `values-diff` 20 deduped defects;
  perceptual mean 12.10 / 255.
- Full suite: 694 passing, 7 more than baseline, with no new failures (the 3
  pre-existing failures are unchanged).


### 3. Band tops (follow-on, same commit series)

The clamp above bounded band *bottoms*. Band **tops** had the mirror defect: a
band began at its first *run*, not at the edge that opens its section, so the
navy footer started at its copyright line and left a 52px cream sliver above it.
Tops now snap up to the section edge that opens the band — the **greatest** edge
at/below the band's first run and at/above the previous band's content.

Taking the *smallest* qualifying edge instead makes a band climb over every
section between the two, and the footer swallowed the whole contact section and
painted it navy. That regression never reached the scoreboard: the perceptual
diff caught it (mean 31.58) while `values-diff` still read 17. It is pinned by
`test_UAT_FC_REQ-88_band_top_snap_never_crosses_the_band_above_it`.

The BUG-13 unsafe-scheme guard asserted `box === undefined`, which was incidental
coupling to the image gating. Retargeted at the actual security property: no
section-background box is *emitted* for an unsafe scheme (the box carries no URL).

## Final measurements (supersede the figures above)

- `values-diff --multi-viewport --clusters`: **139 → 17** deduped defects.
  surfaceFill 32 → 0, borderLeft 20 → 1, surfaceGradient 3 → 0, text
  extent/wrapping 50 → 7, vertical spacing 24 → 1.
- Perceptual `diff` @1280: mean **15.85 → 5.21** / 255; pixels over threshold
  6.7% → 2.8%; nearly every horizontal band at or near 0.
- `l1-gate`: PASS (sample-fidelity maxΔ 0.5px, off-sample 0, content-robustness 0).
- Full suite: 696 passing, 8 UATs in `req88-surface-attribution`, no new
  failures (3 pre-existing failures unchanged).

### Known remaining (17)

Not defects this ticket claims to have fixed:

- 7 × text extent/wrapping — residual font-metric drift.
- 4 × missing — the contact-form fields, correctly deferred to the `contact-form`
  behavior module (they are typed fold residuals, per the design decision above).
- 2 × control styling — the Subscribe / Send message buttons render oversized
  (padding). Note the reported `shape: radius 8px → 0px` is itself an attribution
  phantom of the same family as the fixed ones: the radius is painted on the
  button's backing box while the diff reads the text run's own axes. The
  oversizing is real; the radius delta is not.
- 1 × vertical spacing, 1 × borderLeft @320, 1 × layout structure, 1 × content
  anchor (the last two accept-level).

-
## Round-5 pass — surface rect + font binding (commit 455a16f1)

Operator-reported visual defects the numeric gates did not surface, fixed under
this ticket. Both were joins that already had the data on one side.

### Card geometry is measured, not inferred

BUG-14 derived a panel's box from where its text runs sat, expanded by an
estimate of the ancestor's unseen padding. That estimate is what produced
[[bug-24975383]] (BUG-21)'s 2x-height buttons; fixing it per-edge only reversed
the error's direction — panels came out **inset** by a per-card amount
(`x=111 w=854` against the reference's `x=88 w=896`, three siblings each off by a
different margin) and lost their rounding entirely, because a *run* is square
while the *panel* element carries `r=8`.

[[bug-3e3fabdb]] (BUG-22) had already added `SurfaceShape` — the painting
ancestor, its own rect, its radius. The fold now reads it rather than re-deriving
it. That rect doubles as an exact grouping identity (same rect joins, different
rects never do), so sibling tiles can neither merge nor drift. `cardPadding` /
`cardOutset` are deleted; with no captured surface shape a card is exactly its
runs' union and nothing is invented.

Guard: a surface as wide as the viewport is the **band**, not a card. Bands are
reconstructed separately, so adopting that rect stretched a quote's 868x29 accent
rule to 1280x595.

### A mirrored web font binds its family

Two broken joins, both fallout from BUG-16 widening a run's `fontFamily` from its
primary token to the full stack:

1. `buildTheme` looked the face-file table up by the full stack (`Cinzel, serif`)
   while it is keyed by the bare `@font-face` name (`Cinzel`) — `files: []`, so no
   resource reached the document.
2. The face then declared the *stack* as its family, which the renderer sanitises
   to `"Cinzel serif"` — a name no run's `Cinzel, serif` can ever match.

Either alone left the title painting the document default (an unmatched family is
valid CSS that resolves to no font). `primaryFamily` now lives in `theme.ts` as
the single definition; `pipeline.ts`'s duplicate is removed.

### Measured (fresh capture, full pipeline)

| | before | after |
|---|---|---|
| perceptual mean | 2.56 / 255 | **1.65 / 255** |
| pixels over threshold | 1.6% | **0.9%** |
| values-diff defects / causes | 15 / 7 | **14 / 5** |
| Type-A flat | 0 | 0 |
| 3-probe gate | PASS | PASS (0 residuals) |

Panels match the oracle exactly at every width (`card-4/5/6` at `x=88 w=896
r=8`; tiles at `277x192 r=8`; quote rules at `868x29`). The repro fold-gap
warning that flagged the orphaned `.woff2` is now silent because the face is
referenced.

### Still open (operator list, NOT fixed here)

- **Hero title residual.** 8 of the 12 remaining diff regions cluster on the
  Cinzel title (y 80..240). The CSS is now correct — right family, weight 600,
  `letter-spacing -0.9px`, and a gradient `background-clip: text` byte-identical
  to the oracle — and `1c shot` passes through the BUG-16 font barrier, so this is
  **not** a load race. The residual is metric-level and remains unattributed.
- **Hero not pinned to the page fold** — not investigated.
- **Send-message button wraps its label.** The 4 absent contact fields are the
  expected `contact-form` behavior-module residual; the label wrap is not.
- **Text extent / wrapping** is still 7 defects dispositioned `[REVIEW]`, which
  reads as benign drift but is the visible wrapping breakage on panel titles and
  the footer. That disposition is miscalibrated.

### Tests

`tests/req88-surface-shape-and-fontface.test.ts` — 5 UATs: surface rect adopted
with its radius; sibling tiles stay separate and aligned; a full-viewport surface
stays a band; the face table joins on the primary token; an emitted `@font-face`
declares a family the run can match.

`tests/bug21-control-surface-outset.test.ts` — one UAT retargeted from asserting
the deleted estimate to asserting that nothing is invented when no surface shape
was captured.

Suite: 737 pass, 1 pre-existing fail (`req92` form-control ids, BUG-14 drift).

## Round-5 follow-up — text boxes cannot wrap inside their own extent (commit 5d414929)

Investigation of the four defects left open above. Three of them share one root
cause; the fourth is a distinct L1 capability gap.

### Root cause: a text box was rounded DOWN below its own glyph extent

A shrink-to-fit run's captured box **is** its glyph extent — the capture records
`box.width === renderedTextBox.width` for 21 of the page's 55 runs. `Math.round`
on that makes the box narrower than the text it must hold whenever the fraction
is under .5, and CSS answers a too-small box by wrapping. Nine runs were pinned
below their own measured extent:

| run | measured | pinned | slack |
|---|---|---|---|
| `Gigabyte Alchemy` | 685.31 | 685 | −0.31 |
| `XGD (Extreme Generative Development)` | 448.44 | 448 | −0.44 |
| `Completely on-device…` | 446.34 | 446 | −0.34 |
| `Designed for developers…` | 413.23 | 413 | −0.23 |
| `Creates space for deeper…` | 340.19 | 340 | −0.19 |
| `Intentional Software` | 320.25 | 320 | −0.25 |
| `Sanctum Voice` | 167.30 | 167 | −0.30 |
| `GitHub` / `LinkedIn` | 45.27 / 54.16 | 45 / 54 | −0.27 / −0.16 |

**This is the hero-title defect.** `Gigabyte Alchemy` is one 97px line in the
reference; 0.31px short it reflows onto a second 90px line. Six of the twelve
perceptual regions sit on it — y 80..160 is line one, and `#1 @80,176 336x80` is
a **line two the reference never had**. The title's position and axes were
already exact at every width (`y=79`, size 72/600, `ls -1.8`, `lh 90`, and the
responsive track), so the earlier "metric-level, unattributed" note was wrong:
it was geometry, not metrics.

Fix: a **text** leaf ceils its width — the smallest integer that still contains
the measured content, growing the box by at most a pixel and inventing no room.
Box and image leaves have no reflow constraint and keep nearest rounding, so a
surface cannot creep outward a pixel per pass.

This also covers the reported panel-title wrapping (`Sanctum Voice`) and is the
mechanism behind the footer and send-button wraps.

### Controls sit at exactly zero slack

At >=768 `Send message` has content width 108.78 against a glyph width of
108.78, and `Subscribe` 74.75 against 74.75 — the padding is exact and the text
fills it completely. Ceil lifts these to +0.22 / +0.25px, which fixes the
reported wrap but leaves them decided by a fifth of a pixel. A run whose
*content* width equals its glyph width is shrink-to-fit and physically cannot
wrap in the reference; reproducing it as a fixed-width absolutely-positioned box
reintroduces that possibility. A typed `whiteSpace: nowrap` axis on such runs
would make it structural rather than lucky. NOT implemented — flagged.

### Hero pinning is a viewport-height gap, not a misplacement

The hero content matches the reference **exactly at every width** (title
`y=79 x=88 w=685`, `Intentional Software` `y=318`, `Tools for clarity…` `y=384`),
and `section-bg-0`'s height tracks each captured viewport (800 / 800 / 1024 /
768 / 800 / 900). Nothing is misplaced.

The reference's hero is `min-h-screen` — **`100vh`, viewport-relative**. L1
keyframes geometry on *width* only, so it reproduces as a fixed `800px`. Viewed
in any window that is not 800px tall the hero stops short of the fold, which is
what the operator saw.

Both gates are blind to this **by construction**: capture and shot use the same
viewport height, so the error is identically zero on every probe. Same shape as
the single-viewport blind spot, but on the height axis — and no amount of
width-ladder sampling can reach it.

Closing it needs a typed L1 axis for viewport-relative extent (per CLAUDE.md, an
L1 primitive — never a raw-CSS hole). NOT implemented; it is a design decision
about L1's geometry model, not a fold bug.

### Tests
Two UATs added to `tests/req88-surface-shape-and-fontface.test.ts`: a text box is
never narrower than its own glyph extent (over the four real fractional widths
above, at every width in the ladder); a box leaf keeps nearest rounding.
Suite: 739 pass, 1 pre-existing fail (`req92` form-control ids, BUG-14 drift).


-
## Round-6 pass — the operator's list, and the two viewport axes behind it

Five operator-reported defects, plus four the audit added. All were invisible to
`values-diff`, the perceptual `diff` and `l1-gate` — and in three cases the gates
could not have seen them, which is the more useful finding.

### 1. Accent rules were painted on the wrong box

`border-l-4 border-emerald-400 pl-6` paints the bar on a **wrapper**; the run
inside is inset by that wrapper's padding. `accentBarOf` reported the bar's width
and colour but not *whose box it was*, and `surfaceOf` could not supply it — it
resolves the nearest *background*-painting ancestor, and an accent wrapper
commonly has no fill, so the walk ran past it to the band, which the fold then
discards as viewport-wide. The fallback drew the rule on the run: indented 28px
from the reference, and (a border paints inside its own border box) overlapping
the first glyph.

Capture now records `accentBox`, the bearing element's rect — the mirror of
BUG-22's `SurfaceShape.box` for an asymmetric rule. It is consulted only when no
card-shaped fill was resolved, so a card painting both keeps one rect for both.
The three `bg-white/70` cards were always correct for exactly this reason.

### 2. Single-line runs could wrap — and did, in Gecko

The fold turns a flowed run into a fixed-width absolutely-positioned box, which
re-opens a decision the reference had already closed. A shrink-to-fit run's box
IS its glyph extent, so the reproduction's slack over its own text is 0.12–0.81px
— and engines measure glyphs differently. Six checklist items, the send-message
CTA and the footer copyright wrapped in Firefox and overprinted the run below
(measured: `Completely on-device…` overran the following ✓ by 42px).

REQ-88's earlier `Math.ceil` on text widths bought a fraction of a pixel and left
the outcome to luck. `axes.nowrapFromPx` states the fact instead.

It is a **width, not a flag**, and that distinction is the whole fix: those same
checklist items are one line on desktop and three at 320px. A flag could only be
set for runs that never wrap at any width — which excludes precisely the runs
that broke. The threshold is the smallest captured width whose entire suffix is
single-line, so it never claims more than the reference showed (a run single-line
at 1024 but not 1280 yields 1440, not 1024).

**Why no gate saw it.** `values-diff` and `diff` shoot Chromium only, where
nothing wrapped; `l1-gate`'s off-sample probe is analytic and has no font metrics,
so it cannot observe a line break even in principle. The defect lived exactly in
the gap. `tests/req88-nowrap-x-browser.test.ts` closes it by rendering in every
available engine, with a calibration UAT that fails if the fixture ever stops
discriminating.

### 3. `100vh` was unrepresentable — and unidentifiable

Section 1's height equals the viewport height in all six captures. But the ladder
varies width and height *together*, so a `min-h-screen` hero measuring 1024 at
768x1024 and 768 at 1024x768 is indistinguishable from an element whose height
decreases with width. The axis was not merely unmodelled; it was **unfittable**.

`HEIGHT_PROBE_VIEWPORTS` re-shoots one ladder width (1280) at a second height,
making the response a finite difference. It is deliberately not part of
`RESPONSIVE_VIEWPORTS` — that ladder defines keyframes, screenshots and diff
cells, and a duplicate width would perturb all three; `restingByWidth` skips the
probe as a keyframe while the fold reads it as evidence.

Modelled as a **derivative**, `geometry.viewportResponse`, because a `100vh` hero
is never a local fact: the hero grows and *every node below it* is pushed down by
the same amount. `{heightFactor: 1}` on the hero and `{yFactor: 1}` on everything
below say the same thing in the same units. Each is applied against its own
keyframe's `atHeight`, so a keyframe still evaluates to exactly its captured
pixels at capture size. Bands take their response from their **section edges**,
not their runs — a hero's copy sits in the top half and never moves while the
band's bottom travels a full viewport height.

Without a probe the fold emits nothing rather than guessing from a correlation.

### 4. A centred column was modelled as a straight line

`mx-auto max-w-*` is flat while the viewport is narrower than the container, then
rises at half rate. Interpolating across that knee put the left margin at **55.5px
at 1150 where the reference is 24px** — the 2.3x the operator saw — and holding
the last keyframe froze it at 168px above 1440 where the reference keeps growing.

`fitColumn` recovers the rule from where content actually sits, and `document.column`
+ `geometry.anchor` express it in closed form. On the real capture it recovers
`{containerPx: 1152, insetPx: 24, maxWidthPx: 896}` — exactly `max-w-6xl mx-auto
px-6` + `max-w-4xl` — and 33 of 71 nodes anchor to it.

The origin is the **modal** left edge, not the minimum: a real page has more than
one gutter (this reference sets its header 8px wider than its content), and the
extreme is whichever happens to be widest, not the column the page is laid out in.
Taking the minimum made the fit fail outright. Both the column and each node's
affine placement are rejected unless they reproduce every sample to within a
pixel, so a page with no centred column keeps its keyframes untouched.

Measured after the fix, at every width including off-sample and above the ladder:

| viewport | 320 | 768 | 1024 | 1100 | 1150 | 1280 | 1440 | 1600 | 1800 |
|---|---|---|---|---|---|---|---|---|---|
| rendered origin | 24 | 24 | 24 | 24 | 24 | 88 | 168 | 248 | 348 |
| rule | 24 | 24 | 24 | 24 | 24 | 88 | 168 | 248 | 348 |

### 5. Padding did not keyframe while geometry did

`foldPadding` took the widest sample and replayed it at every width. Silent on
this page (0 of 54 runs vary), but the pinned box is a border box, so a desktop
pad replayed at 320 eats content width from the inside. `responsivePadding` gives
each side its own track on the same terms as the type axes — a track earns its
place only by varying.

### Investigated and dismissed

- **Headings "overflow" their box by ~3px.** The element box is 40px (line-height)
  while the ink box is 43px in *both* sides — the reference simply hugs the ink.
  The glyphs render identically; there is no visual defect and nothing to fix.

### Measured

- Firefox wrapped-run count on the real fold: **19 → 13**, now identical to
  Chromium, with the remaining 13 being genuine multi-line paragraphs that match
  the reference's own line counts. All six checklist items, the CTA and the
  footer are gone from the list.
- Left margin exact at 9 widths spanning off-sample and above-ladder (table above).
- Column recovered exactly; 33/71 nodes anchored; 20/55 runs pinned unbreakable.
- Suite: **756 passing**, +17 UATs, no new failures (the one failure in
  `req92-image-box-fold` is pre-existing and reproduces on a clean tree).
- Clean-workspace `tsc` across site-schema / framework / generate: no errors.

### Requires a re-capture

`accentBox` and the height probe are **capture-side** data absent from the current
bundle, so items 1 and 3 need `1c capture page` before they take effect. Verified
against the existing bundle: the fold degrades cleanly — accents keep the old
(wrong) rect, no height response is emitted, and nothing else regresses. The
`nowrapFromPx` and column fixes need no re-capture and are live on the current
bundle.

### Suite green

`tests/req92-image-box-fold.test.ts` had been failing since REQ-88's own round-3/4
band work: it asserted every folded box id matches `surface-\d+`, the vocabulary
of BUG-11's per-run backing box that this ticket *replaced* with the section-band
→ card reconstruction. The property under test (a form control is never faked into
a box leaf) was always holding; only the id vocabulary had moved and the
expectation had not followed. Retargeted at the reconstruction's ids. The suite is
now **757/757 green**, with no pre-existing failures remaining.


-
## Round-7 pass — the probe was read as a ladder cell

Round 6's height probe leaked into every consumer that keys a projection on
`(engine, width, state)`. That key carries no viewport height — deliberately,
because height is not what a *responsive* comparison is about — so the probe
collided with the 1280 ladder cell it re-shoots. The claim in round 6 that the
probe "adds one projection and nothing else" was wrong: `RESPONSIVE_VIEWPORTS`
bounds what gets *shot*, not what downstream reads, and both consumers enumerate
`multiState.projections` directly.

The collision was silent and page-wide, on a reproduction that had not changed:

- **`l1-gate` sample-fidelity FAIL, 55 unmatched.** `oracleBoxes` drains a FIFO
  leaf queue per `(key, width)`; a second full set of 1280 oracle rows found those
  queues already empty and reported every text run on the page as a coverage gap.
- **`values-diff` 7 cells, 95 deltas.** `diffMultiState` both *overwrote* 1280's
  reproduction with the probe's taller render and emitted a second 1280 cell —
  59 phantom deltas.

`partitionProbes` makes the rule explicit and shared: the first projection at a
key defines the ladder, later ones are evidence. Applied in `diffMultiState`,
`restingByWidth`, `heightProbesFor`, and (deduped structurally, so `OracleSource`
keeps carrying no `engine`) `oracleBoxes`.

### The accent fix had never taken effect

`accentBox` was carried on `contentRunToElement` and `sections.ts`'s
`toContentRun` — neither of which builds the multi-state manifest. `rawRunToElement`
does, and it dropped the field, so capture recorded the bearer's rect and nothing
downstream ever saw it. Zero elements in the round-6 capture carried it. Now
carried on the projection the fold actually reads, pinned by
`test_UAT_FC_REQ-88_the_accent_bearer_rect_survives_the_manifest_projection`.

### Measured on the fresh capture (round-6 code + this fix)

| | round 6 shipped | after round 7 |
|---|---|---|
| `l1-gate` sample-fidelity | FAIL — 55 unmatched | **PASS** — 0 unmatched, 0 residuals, maxΔ 0.89px |
| `values-diff` cells | 7 (one phantom) | **6** |
| perceptual mean | 1.06 / 255 | 1.06 / 255 (unchanged — was never affected) |
| runs pinned unbreakable | 20 / 55 | **42 / 55** (width-aware threshold) |
| height response | — | **hero `{heightFactor: 1}`, 64 nodes below `{yFactor: 1}`** |
| column | — | `{1152, 24, 896}`, 33 nodes anchored |

The `100vh` hero is now recovered end-to-end from a real capture: the probe makes
it identifiable, and `section-band-0` carries `heightFactor: 1` while everything
below it carries `yFactor: 1`.

Suite **761 passing**, +4 UATs, clean workspace `tsc`.

### Still open

- **Accent rules still land at `x=116`** on the current bundle. `accentBox` is
  capture-side and this fix landed after the capture, so one more `1c capture page`
  is required before the two quote bars move to `x=88 w=896`.
- **The hero title residual** (diff regions #1/#2/#3/#5/#8, all in `y 80..160`)
  is unchanged and still unattributed — the same metric-level residual recorded in
  round 5, not a geometry or column defect.
- **4 contact-form fields** remain typed residuals by design (`contact-form`
  behavior module), which is also what the `arrangement` / `gap` deltas at ≥768
  are measuring: the surviving controls sit differently once the fields are absent.


-
## Round-8 pass — anchoring is per axis, and it must be

The operator saw one hero line sitting left of its neighbours at some widths. It
was a defect I introduced in round 6: `fitAnchor` required **both** `x` and
`width` to fit the column before anchoring either.

On the reference hero, exactly one line's width equals the column extent. So that
line followed the column while its three neighbours kept fully-absolute keyframes,
and the two models disagree precisely where the column origin starts moving:

| viewport | 1024 | 1100 | 1150 | 1200 | 1280 |
|---|---|---|---|---|---|
| `Tools for clarity` (anchored) | 24 | 24 | 24 | 48 | 88 |
| the other three (keyframed) | 24 | 43 | **55.5** | 68 | 88 |
| the rule | 24 | 24 | 24 | 48 | 88 |

A 31px split in text the reference keeps flush — and worse than not anchoring at
all, because mixed models break an alignment the reference guarantees.

**Alignment is a shared property; width is a private one.** A node whose left edge
follows the column must say so even when its width is its own business. The anchor
is now `{x?, width?}`, each fitted and suppressed independently.

Three further findings from making that work, each of which had to be fixed for
the page to come out right:

- **A nested `max-w-*` is a capped column term.** `min(maxPx, px + fraction *
  extent)` is what a narrower run inside the column looks like. Refusing it was
  half the reason neighbours ended up on different models.
- **A two-point fit is interpolation, not evidence.** The hero title's width (a
  shrink-to-fit glyph extent under responsive type) fits *any* two of its samples
  and then "verifies" against the cap — yielding `-684px + 3.14 * extent`. Capped
  fits now demand an over-determined fit, and every fit is bounded to a plausible
  share of the column (`|fraction| <= 2`).
- **A layout MODE change is not a fit.** A 3-up grid stacks below `md` and the
  hero title uses a narrower gutter there, so no single affine function covers
  both regimes. Those nodes now anchor via `x.pxTrack` — the origin stays
  closed-form and only the small inside-the-column offset is keyframed, which is
  strictly better than keyframing the absolute position. The track inherits the
  node's own geometry `segments`, so the inset snaps where the geometry snaps;
  without that the third grid column slid 42px off the right edge at ~700px.
- **A full-bleed band is never anchored.** Its `x` is 0 absolutely; writing that
  as `origin + (-origin)` and interpolating the residual walks it to `x = -31` at
  1150. The inset-track fallback is refused for anything spanning the viewport.

One renderer bug found the same way: `left: max(…) + 24px` is not a legal bare
value, so the declaration was **dropped** and every anchored node slammed to
`x = 0`. Compound anchor expressions are now always wrapped in `calc()`.

### Measured (fresh capture, full page, Chromium)

| viewport | 320 | 700 | 1024 | 1100 | 1150 | 1280 | 1440 | 1600 | 1800 |
|---|---|---|---|---|---|---|---|---|---|
| rendered origin | 24 | 24 | 24 | 24 | 24 | 88 | 168 | 248 | 348 |
| rule | 24 | 24 | 24 | 24 | 24 | 88 | 168 | 248 | 348 |

Exact at all twelve widths probed, with **zero** negative-x nodes and **zero**
horizontal overflow at any of them. Nodes anchored: `x` 63/71 (was 33 for both
axes coupled), `width` 37/71. Suite **763 passing**, +6 UATs.

## The contact form is blocked on the page shape, not the fold

The operator has now reported the missing email/contact inputs twice, and it is
not a folder-power gap. The capture has everything the `contact-form` behavior
module needs — `a11yRole: textbox`, `accessibleName` ("Your name", "Your email",
"Your message", "Your email address"), `nameSource: placeholder`, geometry,
border and radius, for two distinct forms (mailing list at `x=88`, contact at
`x=664`). The fold correctly declines to fake `<input>` elements per DOC-25/26.

The blocker is that **there is nowhere to put them**. `pageSchema`'s `superRefine`
— added by this ticket — enforces a strict XOR:

> a page is either a module stack or a raw L1 document, not both

A captured marketing page is 100% L1 layout **plus one behavior module**. That
combination is currently unrepresentable, so the four fields can only ever be
residuals no matter how good the fold gets. `l1SlotSchema` already anticipates the
seam (it carries `name` and `behavior`); what is missing is the page's ability to
bind a module instance to a slot inside its L1 tree.

Closing it is a coherent piece of work, not a patch:

1. Relax the XOR to "modules may accompany `l1` when each is bound by name to a
   `slot` present in the L1 tree" (the XOR's real intent — no two competing page
   bodies — is preserved).
2. Fold: emit a `slot` node with `behavior: 'contact-form'` at the captured
   controls' union rect instead of a residual.
3. `repro`: derive the module config from the captured controls (`fields[]` from
   `accessibleName` + role, `action` from the captured `<form action>`).
4. `render`: mount the module's fragment into the slot, replacing the inert
   placeholder.
5. The behavior module's conformance obligations (safety / security / x-browser /
   responsive / isolation) then apply to the mounted result.

Not started — recorded here so the next session starts from the diagnosis rather
than re-deriving it.


**Follow-on:** the L1-page/behavior-module composition gap described above is now tracked as **REQ-93** (`request-f26cbe32`) — *L1 pages must be able to host behavior modules in their slots*. REQ-88 introduced the XOR that blocks it, so REQ-93 is its successor rather than a defect against it.


### Sandbox import of joyfulculinarycreations (round-8 follow-on)

Imported as a second reproduction target to stress the round-8 work. Findings are
**not** REQ-88 defects and are tracked separately: [[bug-fe8af80a]] (BUG-25 — a
multi-line heading splits into runs sharing one box, so the hero overprints),
[[bug-2936cebf]] (BUG-27 — CSS background images and lazy media are not captured;
4 images against 86 mirrored assets, perceptual mean 106.8/255), and
[[request-16253634]] (REQ-94 — a clean value gate outvoting a failing perceptual
diff).

REQ-88's own work behaved correctly on this page and is worth recording as
negative evidence: `fitColumn` **declined** it outright (`doc.column`
undefined, 0 nodes anchored) because it genuinely has no centred column, so the
anchor machinery does not overreach onto pages it does not understand; and the
height probe fitted cleanly (82/89 nodes carry a `yFactor`, rendered y positions
match the reference exactly at 1280x800).


-
## Round-9 pass — the reproduced form's labelling and its own button (commit 5b7f82be)

REQ-93 put real controls on the page; the module's defaults were still
overriding two captured facts, and both were visible. Neither is an aesthetic
preference — each is something the reference *does* that the capture records.

### Labelling is a captured fact, and it was causing the drift

The reference names every one of its controls with a **placeholder**; the module
rendered a visible `<label>` row above every field regardless. Measured against
the reference at 1280, that cost:

| field | reference y | ours | drift |
|---|---|---|---|
| Your name | 3784 | 3809 | +25 |
| Your email | 3850 | 3894 | +44 |
| Your message | 3916 | 3979 | +63 |

The drift is *progressive*, which is the signature of flow layout: each label row
pushes everything below it down. So the "incorrectly formatted" and "incorrectly
located" complaints were one defect, not two.

The a11y tree's `nameSource` is the **only** witness to the difference — a label
above the box and the same words inside it are both just text near a box, so no
painted axis can hold it. Carried as `labelMode` through fold → config → render.
The `<label>` stays in the DOM and stays programmatically associated: the a11y
obligation is not traded away for the reference's look, it is moved out of flow.

### The reference's own button is the form's button

A captured button carries text, so the fold's **text-leaf branch claims it before
the control branch ever sees it**. That is right for a page-level button and
wrong for a form's: the reference's chip stayed a page-level run *beside* a form
that rendered its own default `Send` button — two buttons, one inert, overlapping
the Turnstile line.

Buttons are now recorded as candidates during the leaf pass and, after
clustering, one sitting within the same gap scale that separates fields *within*
a form is lifted into that form's `submit` slot. The rule separates the page's
two forms by an order of magnitude, not a hair:

| | to its own fields | to the other form's |
|---|---|---|
| Subscribe | 12px | 128px |
| Send message | 18px | 263px |

against a 75px threshold. The seam grows to hold its claimed button (a seam
stopping at the last field would render the button outside its own slot), and
`.contact-form__submit--l1` surrenders the module's paint so the authored chip is
not nested inside a second, differently-coloured button.

### The trade this makes (deliberate, and reversible)

Absolute geometry is **dropped** on the way into the slot: the module places its
own button, and page-absolute keyframes would resolve against the slot's origin
rather than the page's. So the button's exact per-width position — previously
pinned to 0.5px by BUG-21 — becomes flow-approximate within its seam.

That is a real fidelity cost for a behavioural gain (one working control instead
of two, one of them inert). It is recorded rather than hidden because the
alternative is defensible: keeping the chip in the body preserves the position
and leaves the duplicate. Reversing it would need a way for L1 to position a
control the module owns, which the current one-fragment-per-slot mount cannot
express.

### The gate had to learn what it is not measuring

Lifting the button out of the body made `sampleFidelityProbe` report it as
`unmatched` — the L1 gate failing a *correct* reproduction, because it grades
L1 against oracle text that L1 no longer emits.

Oracle text a behaviour slot covers is now **set aside and counted**
(`sampleFidelity.mounted`, surfaced in the `1c l1-gate` line) rather than either
graded or silently dropped. Grading it fails a correct page; dropping it quietly
turns every mounted region into an ungraded hole nobody can see — the same
blind-spot shape as [[request-16253634]] (REQ-94).

### Tests

`tests/req88-form-labelling-and-submit.test.ts` — 8 UATs. **7 of the 8 fail
without the fix**, with the exact defect values. The 8th (an unrelated page
button is never claimed by a form) passes either way by design: it is the guard
against over-claiming, not a regression pin.

One of them runs the derivation against the **real capture** and pins that all
four controls derive `labelMode: 'placeholder'`, that both buttons are matched to
the right form, and that neither remains in the page body.

Two existing UATs were retargeted rather than weakened:
- `bug21-control-surface-outset` asserted the buttons "survive as a text leaf"
  with exact per-width boxes. Its subject — a padded control is never outset by
  padding its box already includes — is unchanged; the surviving artifact is the
  slot subtree (still chip-path, still its own `surfaceFill`, still no card
  duplicating its fill) plus the seam pinned around it, which a doubled box could
  not fit inside.
- `reconciliation-reproduction-treatments` pinned the button's exact class list.

Suite **785 passing, 0 failing**; clean `tsc` across site-schema and generate.

### Requires a re-capture

`forms.json` is written by the fold at **capture** time, so `1c repro` alone
cannot pick this up — the bundle's bindings predate the change. Run
`1c capture page https://gigabytealchemy.ai` before the next round.

### Note on concurrent work

`tools/generate/src/cli/capture/extract.ts` carried an in-flight BUG-25 edit with
unescaped backticks inside `EXTRACT_SCRIPT`'s template literal, which broke every
`1c` command and the whole vitest run. The mechanical escape (matching the file's
existing convention) was applied to unblock verification; BUG-25 has since
committed it as part of its own work. That is now the **third** occurrence of
this trap in this ticket's sessions — a lint rule for backticks inside
`EXTRACT_SCRIPT` would close the class.


-
## GA round-10 — re-captured, and the remaining gap handed to REQ-96

Re-captured GA against BUG-25 / BUG-27 / REQ-94 and this ticket's form work, which
had **never actually run on the page** (`forms.json` is written by the fold at
*capture* time, so the previous round's `1c repro` could not pick it up).

**Result — the page is reproduced:**

- `1c l1-gate` **PASS** — maxΔ 0.9px, 0 residuals, 0 unmatched, **0 fold residuals**
- `1c gate` **PASS** — perceptual mean 2.61/255, 2.8% of pixels over threshold,
  both eyes agreeing (no cross-gate disagreement to explain)
- `labelMode: placeholder` derived for all four controls; both submit buttons
  claimed by the right form; neither duplicated
- hero visually identical — BUG-27's CSS-background fix works

Two reporting artifacts worth recording, neither a reproduction defect:

- **`unreferenced-image` on `AlchemistLabWithTech.png` is a false positive.** The
  hero image is a section `background-image`, folded by `foldSectionBackgrounds`,
  so no *element* in the manifest references it — which is what the coverage
  check looks for. The image renders correctly.
- **`values-diff`'s 26 deltas are unreadable on this page.** Our a11y and
  anti-spam scaffolding (visually-hidden labels, honeypot inputs, Turnstile divs)
  contributes **15 repro-only objects**, sliding the control pairing so every
  field mispairs against its neighbour. The perceptual eye is currently the only
  trustworthy instrument on the form region. Tracked in [[request-3a064234]]
  §10.3 and [[request-16253634]].

**The remaining gap is not REQ-88's to close.** The three surviving form deltas —
field surface, field height, and Subscribe stacked rather than inline — share one
root cause: the behavior module's stylesheet deciding presentation the capture had
already measured. That is a **contract** defect, not a fold or repro defect:
[[DOC-25]] §1.3's slot model assumes every behavioural element is a container L1
can fill, which is structurally impossible for leaf controls (`<input>` is void).

Raised as [[request-3a064234]] (REQ-96) with the [[DOC-25]] §10 amendment. REQ-96
also recovers the submit button's exact per-width position that this ticket
knowingly traded away.