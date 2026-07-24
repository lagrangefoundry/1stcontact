---
uid: request-7ff1bacd
id: REQ-88
type: request
title: 'L1 reproduction pipeline: capture bundle → servable, gate-able site'
created_by: xgd
created_at: '2026-07-21T23:30:09.316183+00:00'
updated_at: '2026-07-24T20:53:00.164480+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - d98aab90e61097cca4ef59d200e4a9059460c31f
  - 6ede6a8eb525c00fa5a1038a6d6229e70af58d1c
  - 2c166b192aae8537bfd875799c7da5ec0ece8ea3
  version: 0.0.193
  story_points: 8
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