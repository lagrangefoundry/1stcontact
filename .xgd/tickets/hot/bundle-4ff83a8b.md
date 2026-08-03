---
uid: bundle-4ff83a8b
id: BUNDLE-10
type: bundle
title: BUG-12 + BUG-13 + BUG-14 + BUG-15 + BUG-16 + 11 more
created_by: xgd
created_at: '2026-07-29T18:34:41.203786+00:00'
updated_at: '2026-08-03T00:05:39.428889+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: 5f2d737ed8e41f286d3159af441e899d827875c1
    reconcile_sha: null
    main_sha: null
  - working_sha: 7d50250602281fcf82464fb3705e16ca8faff5ac
    reconcile_sha: null
    main_sha: null
  - working_sha: ea43b0dc79d688b366cbbddd84da9eb8d172cfc9
    reconcile_sha: null
    main_sha: null
  - working_sha: 2dd90350a148eec0788906e706be1209216e3dcb
    reconcile_sha: null
    main_sha: null
  - working_sha: e5cdf5218860e81ffcf046d3bce000d43e2d239c
    reconcile_sha: null
    main_sha: null
  - working_sha: 65fabad70b1d1755dcacc5faff93e1d5b0bf80d7
    reconcile_sha: null
    main_sha: null
  - working_sha: 357212e72a653c8b0a71117a5ad59023ed096bb9
    reconcile_sha: null
    main_sha: null
  - working_sha: afedab6853661e1031e8bd3f83452b531633fb1e
    reconcile_sha: null
    main_sha: null
  - working_sha: 7ad23a769c47296bae8b6b3d6df1bf0a1a775a67
    reconcile_sha: null
    main_sha: null
  - working_sha: 520850063a7f54782e6840d8d26c6d41a65edf94
    reconcile_sha: null
    main_sha: null
  - working_sha: 6dfe76ec52297089d771d87e2089d564c0991f40
    reconcile_sha: null
    main_sha: null
  - working_sha: 6d88486f651e066e8c26792d251eb24788db2433
    reconcile_sha: null
    main_sha: null
  - working_sha: 748bba035c7eecb836e3d5bf0de51bc7a2d6f7c6
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a53af05a53d21b2ae7081f3d776b1d2ccf2c8cd
    reconcile_sha: null
    main_sha: null
  - working_sha: a937783ac114b3a3cdf6806eceaa276f035a327a
    reconcile_sha: null
    main_sha: null
  - working_sha: f47cf0fffdefaf833e410c334a2fe7fba9f8728d
    reconcile_sha: null
    main_sha: null
  - working_sha: 26be4390e6bbd799af50bf0943a1ad2b402e2015
    reconcile_sha: null
    main_sha: null
  - working_sha: 91b86e5e84aa32e1d1a0d18b78203c2098d35d19
    reconcile_sha: null
    main_sha: null
  - working_sha: 9b0ceb6bbc9884015c7798b67d103d3302066767
    reconcile_sha: null
    main_sha: null
  - working_sha: 652248209f4c72e62af5d0287d8944b0ad2f33bd
    reconcile_sha: null
    main_sha: null
  - working_sha: e3cc471b40490abf4ec3bc720556896ba5f17a1b
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a62098e9aa5e2b9b5d6a3bb8385a31d13f40d20
    reconcile_sha: null
    main_sha: null
  - working_sha: 705140b23ee7905adeafc1fe609c7019d10f46dc
    reconcile_sha: null
    main_sha: null
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-12: Captured font faces never reach the fold — resources table empty, @font-face never emits, wrong font family

Scope under [[request-7ff1bacd]] (REQ-88). Completes the handle→substance wire for
fonts begun in [[request-bc4c1408]] (REQ-90) — the schema + `@font-face` emission
landed, but the captured face never reached the fold's resource table. See [[DOC-27]].

## Behavior (bug)
Font family renders wrong (system fallback for `Cinzel` / the body sans). The
folded doc has `doc.resources: null`, so no `@font-face` is emitted and every
`fontFamily` handle dangles — even though the family's `.woff2` was mirrored into
the bundle's `assets/`.

## Root cause (refined this session)
The fold already receives fonts via `fontResourcesFromTheme(capture.theme.fonts)`
(REQ-90, `capture.ts:82`) — but `theme.fonts[*].files` came back **empty**, so
that wire had no substance to carry.

The break is one layer up, in the capture: the in-page extractor reads `@font-face`
rules from the **live CSSOM** (`extract.ts:957` — `styleSheet.cssRules`). That access
throws a `SecurityError` on any **cross-origin** stylesheet (Google Fonts'
`css2?family=…`, most CDN font sheets), and the `catch { continue }` silently drops
those faces. So `signals.fontFaces` is empty for a Google-Fonts family, the
family→woff2 mapping (`pipeline.ts` `fontFilesByFamily`) never forms, `theme.fonts`
files stay `[]`, and the fold's resource table is starved.

The response **bytes** were captured and mirrored all along (DOC-13 §3) — only the
CSSOM reading of them was blocked.

## Fix
Parse `@font-face` from the cached **stylesheet response bytes** in the capture
pipeline (`pipeline.ts` `fontFacesFromStylesheets`) and union those with the
same-origin CSSOM faces before building `fontFilesByFamily` (`fontFilesByFamilyOf`,
dedup per family). The mirrored `.woff2` (`urlToLocal` hit) then connects to the
painted family → `theme.fonts.files` populated → `fontResourcesFromTheme` yields a
face → `foldToL1` populates `doc.resources.fonts` → renderer emits `@font-face`
(REQ-90). A family whose face never mirrored still contributes nothing.

Files: `tools/generate/src/cli/capture/pipeline.ts` (parser + wire).

## Coordination
`fold.ts` was **not** touched — the fix is entirely capture-side, so no churn
against [[bug-8431c17b]] (BUG-11) / the background-image bug on `fold.ts`.

## Test plan
`tests/bug12-cross-origin-font-faces.test.ts` — fake driver whose CSSOM is blind
(`fontFaces: []`) but whose intercepted responses carry the Google-Fonts CSS bytes +
the woff2:
- `test_UAT_FC_BUG-12_cross_origin_face_bytes_populate_theme_files` — theme carries
  the mirrored woff2 as the family's substance.
- `test_UAT_FC_BUG-12_unmirrored_face_contributes_no_files` — negative control: a
  face whose woff2 was never intercepted stays `files: []`.
- `test_UAT_FC_BUG-12_same_origin_cssom_faces_still_wired` — union (not replace),
  deduped.
- `test_UAT_FC_BUG-12_capture_folds_face_into_l1_resources` — full flow via
  `cmdCapturePage`: cross-origin bytes → theme → fold → `l1.resources.fonts`.

## Acceptance
`doc.resources.fonts` populated from the capture; `@font-face` emitted; the correct
face renders at all widths. Tests named `test_UAT_FC_BUG-12_*`.


---

## BUG-13: Section/CSS background-images aren't represented as foldable nodes — no imagery in the reproduction

Scope under [[request-7ff1bacd]] (REQ-88). Extends [[request-7a6766b0]] (REQ-92);
builds on [[bug-8431c17b]] (BUG-11)'s surface/box emission.

## Behavior (bug)
The reproduction showed no imagery. In the fold's input **0 of 59** elements
carried an image `src` — the page's hero/section visuals are CSS
`background-image`s on the bands, not `<img>` elements — so the fold's image
path (`fold.ts`) never fired and nothing represented the imagery.

## Root cause
A band's CSS `background-image` was captured (`RawBand.backgroundImage`) but never
projected into the value manifest the fold reads, and `SectionValues` carried no
geometry. The fold iterates the element table and the manifest sections, but
neither exposed the band background, so there was no image input to fold.

## Fix (implemented)
Carry the band background through the manifest as a section-level treatment and
fold it to an L1 `box` placed by the band geometry — no new element-diff surface.

- **Capture projection** (`values-diff.ts`): `SectionValues` gains
  `backgroundImageUrl?` + `box?`. `flattenSignals` extracts the first `url(...)`
  from `RawBand.backgroundImage`; `flattenCapture` reads the mirrored-local
  `section.background.image` (kind=`image`). Unsafe schemes (`data:`,
  `javascript:`, …) are dropped via `isSafeUrl` at projection time, so a
  disallowed URL can never reach — and throw in — the envelope validator. A
  gradient/solid band yields no background box.
- **Fold** (`fold.ts`): `foldSectionBackgrounds` matches section entries by
  ordinal `index` across the sampled widths and emits one `box` per section
  carrying `axes.backgroundImageUrl` + a geometry keyframe track (with
  `interpolate|snap` segments and a visibility rule) from the band boxes. These
  paint beneath everything — emitted before the panel/card surfaces and content
  (`root.children = [...sectionBg, ...surfaces, ...content]`).
- **Renderer** (`render.ts`): a box with a real `backgroundImageUrl` also emits
  `background-size: cover; background-position: center; background-repeat:
  no-repeat` — the faithful default for a hero/section backdrop (no tiling).

The absolute URL is carried through exactly like a media `src` (REQ-92);
downstream asset mirroring (`repro`) localizes it. Text geometry
(`sampleFidelity`) is unchanged — the background boxes are not text.

## Test plan
UATs `test_UAT_FC_BUG-13_*` in `tests/bug13-fold-section-background.test.ts`
(real `foldToL1` / `renderL1Document` / `flattenSignals` / `flattenCapture` /
`sampleFidelityProbe`, synthetic multi-viewport captures):
- section background → a single `box` leaf with `axes.backgroundImageUrl`
- background box is the first child (paints beneath content)
- background box carries a per-width geometry keyframe track
- render paints `url(...)` with cover/no-repeat sizing
- `flattenSignals` projects `RawBand.backgroundImage` → `backgroundImageUrl` + box
- unsafe (`data:`) scheme dropped at projection (never reaches the fold)
- gradient/solid band gets no background box
- `flattenCapture` projects an image-kind section background
- `sampleFidelity` (text geometry) unchanged by the section background

## Acceptance
Hero and section background images render at the captured positions/sizes;
fidelity (text geometry) unchanged.


---

## BUG-14: Surface reconstruction is flat and per-run — fold must rebuild the section-band → card → text hierarchy to reach visual equivalence

Scope under [[request-7ff1bacd]] (REQ-88). Consolidated "next wave" of visual gaps
from the gigabytealchemy desktop comparison (ours vs the target screenshot).
Extends [[bug-8431c17b]] (BUG-11) — that wired *a* fill; this makes the surface
*structure* faithful.

## Context / bar
The **previous (semantic-module) architecture reached visual equivalence** on this
exact site. The L1 substrate is not there yet: the skeleton (geometry 0.5px),
header font, hero image and page background are correct, but the **surface
hierarchy is wrong**, so the page reads as clearly-not-equivalent. This bug closes
that gap. Measure with the perceptual `diff` + eyes — NOT `values-diff` (it cannot
parse L1 output; it reports stale/false "missing").

## Behavior (bug) — observed ours-vs-target at 1280px
1. **Per-paragraph boxes.** Every body paragraph gets its own tan rectangle. In the
   target those paragraphs sit transparently on a full-width **section band**. The
   fold is emitting each run's composited `surfaceFill` as a per-run box.
2. **Cards are the wrong colour.** "Our Mission" and "What We're Building" cards
   render beige (the band tone) instead of **white** panels — the run's
   `surfaceFill` is picking the band, not the card surface.
3. **Missing card treatments.** Target cards have a **coloured left border**
   (orange on Sanctum Voice, blue on XGD), a **drop shadow**, rounded corners and
   generous padding, plus the light-blue "What We're Exploring" card. Ours have
   none of these.
4. **Band structure absent.** No full-width alternating section bands
   (cream/tan) as distinct surfaces behind their content.
5. Header wraps to two lines at desktop (minor size/width) — include if cheap.
   (The contact form is intentionally absent — behavior-module residual, not this
   bug.)

## Root cause
The fold reconstructs surfaces **per text run** and **flat**, ignoring the captured
section/band/card nesting. The capture already carries it: the manifest has a
`sections` field (band candidates), and elements carry `surfaceFill` /
`surfaceGradient` plus `border` / `borderLeft` / `boxShadow` / `borderRadiusPx` /
padding. The L1 language already has the axes (REQ-91: `l1BorderSchema`,
`l1ShadowSchema`, box fills). The fold simply isn't building the hierarchy or
carrying the card treatments onto card boxes.

## Fix direction
- **Reconstruct the hierarchy** from the captured sections/bands: full-width
  **section-band** boxes (band fill) → **card** boxes (their own fill/shadow/
  border/radius/padding) → text. Nest, don't flatten.
- **Stop per-run boxing:** a run whose `surfaceFill` equals its section band sits on
  the band (no box); only a genuine card/panel surface becomes its own box.
- **Carry card treatments** onto the card box: `border` (incl. coloured left
  border), `boxShadow`, `borderRadiusPx`, padding.
- Co-design against gigabytealchemy (bands + white cards + left-border cards) and
  joyful.

## Acceptance
Perceptual `diff` at desktop drops substantially and the page reads as visually
equivalent to the target: full-width bands, white cards with shadow + coloured
left borders, no per-paragraph rectangles. `sampleFidelity` (geometry) unchanged;
`l1-gate` stays green. Tests named `test_UAT_FC_<this-ticket>_*`. Keep body current.


---

## Resolution (free-coded — commit `67d413df`)

Root cause confirmed and fixed in the fold (`tools/generate/src/l1/fold.ts`):
the fold rebuilt surfaces **per text run** and **flat**, so band paragraphs each
got a rectangle and cards lost their surface.

**What changed**

- **Section bands** — full-width content runs with no card treatment define
  bands; consecutive same-fill runs group and **tile full-bleed**
  (`x:0`, `width:viewport`) from their top to the next band's top, so a band
  covers its whole section *including the cards on it*. A run that sits on its
  band emits **no box** (kills the per-paragraph rectangles, #1, #4).
- **Cards** — a run whose surface differs from its band folds into a **card**
  box, grouped by `same signature + x-overlap + vertical adjacency`: a card's
  stacked runs coalesce into ONE box (bridged by its wide body run), grid
  columns stay separate (3 mission cards), and a distinct badge is its own box.
  The card box carries the treatments + inferred padding (#2, #3).
- **`borderLeft` L1 axis** — added a typed box axis for the coloured card accent
  (`packages/site-schema/src/l1/schema.ts`) + renderer emit
  (`packages/framework/src/l1/render.ts`) — a real `border-left` rule, not a
  full box outline. Closes the layout gap *in L1*, per project policy.

Verified against the retained gigabytealchemy capture: rendered CSS now emits the
tan page base (`#e8dfd3`), the dark alternating band (`#d9ccba`), white product
cards (`#f8f5f2`) with orange (Sanctum) / blue (XGD) left accents, the hero
background image, and the 3-column mission grid — with `sampleFidelity`
(text geometry) unchanged and the `l1-gate` staying green.

**Known residual (not in this fix)**

- **Card drop-shadow** — the capture composites the card *fill* and the
  `borderLeft` accent onto runs (via ancestor walk) but not the card-container
  `box-shadow`; `borderRadiusOf`/`boxShadowOf` read the run's own style only. The
  fold already carries `boxShadow` onto the card box **when present**, so shadows
  will flow through once the capture composites the nearest-surface shadow (a
  separate capture-capability change requiring a re-capture). Deferred here.
- **Footer band** — the dark footer has only narrow runs (no full-width run), so
  it is not detected as a full-bleed band; its links get small dark boxes. Minor;
  the contact/footer area is a behavior-module residual outside this bug.

**Tests** — `tests/bug14-fold-surface-hierarchy.test.ts` (10 UATs,
`test_UAT_FC_BUG-14_*`): full-bleed tiled bands, no per-paragraph boxes, distinct
card fill, treatments carried, grid-column split, fidelity unchanged, no false
overlap, renderer border-left, and two real-capture checks. Supersedes the
BUG-11 per-run-surface tests (deleted).


---

## BUG-15: values-diff cannot read L1-rendered pages — reports stale/false 'missing', useless as an L1 reproduction scoreboard

Scope under [[request-7ff1bacd]] (REQ-88). Surfaced in the gigabytealchemy round:
our only appearance scoreboard was lying.

## Behavior (bug)
`1c values-diff --multi-viewport` returned **byte-identical** output (354 deltas,
54 Type-B, worst "Your email address") **across two renders that changed
completely** (text-only → hero image + bands + cards + served font). A scoreboard
that doesn't move when the render is transformed is not measuring the render. It
reported ~all target elements as `[B] missing (present → absent)` even though the
rendered page visibly contained them.

## Root cause (CONFIRMED)
Not the pairing (the original "suspected" note) — the **actual-side extraction
came back empty**, which is what makes the output byte-identical (position-based
pairing would tiebreak *differently* on two different renders; an empty actual
side reports every target "missing" identically).

The in-page extractor (`EXTRACT_SCRIPT`, `tools/generate/src/cli/capture/extract.ts`)
segments a page into style-scope **bands** = the top-level `<body>` children that
are `>= 8px` tall. The L1 renderer (`fold.ts:955` builds the root as a
geometry-less box → rendered `position: relative`) emits a **flat tree of
absolutely-positioned leaves under one wrapper**. Absolutely-positioned children
leave no in-flow box, so the wrapper **collapses to height 0**, is dropped by the
`>= 8px` scan → `bands = []` → actual manifest empty → every target element reads
`missing` → the diff freezes regardless of what we rendered.

## Fix (as implemented)
`extract.ts` band selection: when the top-level `>= 8px` scan finds **no** bands
yet the body still paints content, fall back to a single **body-spanning band** so
`runsUnder` / `fieldsUnder` / `itemGroup` still collect the flat tree (paired
downstream by text). General (any absolutely-positioned layout), not L1-specific.
Semantic sites always have real `>= 8px` top-level bands, so the fallback stays
**dormant** for them — no regression.

Pairing was left unchanged: once the actual manifest is populated, the existing
text-key pairing (with a geometry tiebreak for duplicate text) produces real
per-axis deltas. This is the simplest change that meets acceptance.

## Acceptance / evidence
`tests/bug15-values-diff-l1-flat-dom.test.ts` (runs the real `EXTRACT_SCRIPT`
under jsdom over a collapsed flat tree):
- `test_UAT_FC_BUG-15_extract_populates_content_from_collapsed_flat_tree` — the
  flat tree's runs are collected (were empty pre-fix).
- `test_UAT_FC_BUG-15_scoreboard_moves_when_render_changes` — a complete repro
  pairs every element (`matched=3, unmatched=0`); a partial repro genuinely misses
  the absent runs (`matched=1, unmatched=2`); the report MOVES (the frozen
  byte-identical output was the bug). Fails without the fix (`matched=0`).
- `test_UAT_FC_BUG-15_semantic_multiband_dom_bypasses_fallback` — a normal
  multi-section page still yields its real bands (fallback dormant, no regression).

Regression scope (all green): req63 / req47 / req31 / req35 / bug10 / capture
extractor + values-diff suites (82 tests).


---

## BUG-16: Capture extracts computed styles before webfonts load — value set records fallback fonts/metrics (fontLoaded:False)

Scope under [[request-7ff1bacd]] (REQ-88). A capture-fidelity bug that corrupts the
target value set at the source — relevant to [[request-bc4c1408]] (REQ-90) /
[[bug-61f43435]] (BUG-12) font work.

## Behavior (bug)
A run recorded `fontLoaded: false` for the only webfont ("Gigabyte Alchemy" /
Cinzel@600) — the box was rendered and measured against a **fallback** face. On a
font-heavy target this silently corrupts:
- **font-family** (records the stack's fallback instead of the intended face), and
- **glyph metrics** — box width/height/line-height measured with the wrong font,
  poisoning geometry keyframes and everything derived from them.

Per `local = value-render(target)`, a value set captured with fallback fonts makes
a faithful reproduction of the *wrong* thing.

## Root cause (refined by investigation)
The ticket's stated cause ("EXTRACT_SCRIPT runs before `document.fonts.ready`") was
already handled — the driver has awaited `document.fonts.ready` since 2026-07-09,
and `document.fonts.check()` returns true whenever the face is actually loaded. The
persisted `fontLoaded:false` is reproducible only via **offline re-extraction**:

- `rendered.html` references cross-origin webfonts (Google Fonts) by their live
  **absolute** URL (`https://fonts.gstatic.com/…/X.woff2`, plus the `css2`
  stylesheet). Those never reach reextract's loopback server, so offline the
  mirrored `@font-face` never loads → the run is measured against the serif
  fallback. This violates DOC-13 §9 ("capture once, re-map forever").

A second, live-capture FOUT path is hardened defensively: `settlePage()`'s scroll
reveals below-fold content whose faces load *after* the early `fonts.ready` await.

## Fix (as implemented)
1. **Offline reextract (primary, `reextract.ts`).** Rewrite every absolute
   `http(s)` URL inside served HTML/CSS whose basename is a mirrored asset →
   loopback-relative `/<basename>`, so the mirror is served instead of the dead
   live origin. Extensionless CSS mirrors (Google's `css2`) are served as
   `text/css` so the browser accepts the stylesheet. Precise by construction —
   only URLs we hold a mirror for are touched.
2. **Live FOUT barrier (`playwright-driver.ts`).** After `settlePage()`, force-load
   every visible run's exact face (family + real weight + style + the run's own
   text, so a subsetted webfont fetches its subset) and await `document.fonts.ready`;
   bounded so a face that genuinely 404s/times out can't hang the capture.
3. **`fontLoadedOf` precision (`extract.ts`).** The check now probes the ACTUAL
   painted face (real weight/style + the run's text), not a bare `<size> "family"`
   that implies weight 400. NOTE: this hunk landed on xgd-working inside commit
   3e0c49f7 (a concurrent BUG-15 `[FREE-CODED]` commit) — its `git add -A` swept my
   uncommitted working-tree edit in (FRAGILE-INTENT-LIFECYCLE.md gap #1). It is on
   the branch and correct; BUG-16's own UATs do not depend on it.

## Tests (`tests/bug16-webfont-load-before-extract.test.ts`)
- `test_UAT_FC_BUG-16_reextract_serves_mirrored_crossorigin_webfont` — real browser;
  a fixture bundle whose `@font-face` src is a non-resolving `.invalid` host, so the
  face can ONLY load via the served mirror. Deterministic regression (fails without
  the rewrite: `fontLoaded:false`).
- `test_UAT_FC_BUG-16_rewrite_maps_mirrored_absolute_urls` — pure-function unit for
  the URL rewrite (mirrored→/base incl. `css2?…&amp;…`; unmirrored untouched).
- `test_UAT_FC_BUG-16_live_capture_webfont_not_fallback` — real browser; a weight-600
  webfont fixture with an above- and a below-fold heading; no visible run reports a
  fallback.
- `test_UAT_FC_BUG-16_extract_script_stays_synchronous` — guards that the barrier
  stays in the driver (EXTRACT_SCRIPT must stay a sync IIFE; jsdom callers
  `win.eval()` it and use the result directly).

Fixtures: `tests/fixtures/capture/bundle-xorigin-font/` (synthetic bundle),
`tests/fixtures/capture/webfont.html`. Version bump 0.0.187 → 0.0.188.
Commit: 4d51e086.


---

## BUG-17: Fold drops element padding — badges/buttons render cramped (0 padding) and inter-element gaps inflate

Scope under [[request-7ff1bacd]] (REQ-88). From the round-3 gigabytealchemy
values-diff (now trustworthy via [[bug-9dafeb0b]]). Relates to [[bug-29b55835]]
(BUG-14 surface reconstruction).

## Behavior (bug)
Element padding was not folded. From `values-diff --collapse`, `paddingTop/
Right/Bottom/LeftPx` for the badges/buttons is captured but reproduced as 0
`@all`:
- "Coming soon" / "In development": 4 / 12 / 4 / 12 → 0
- "Send message": 12 / 32 / 12 / 32 → 0
- "Subscribe": 12 / 24 / 12 / 24 → 0

Two consequences:
1. **Cramped controls** — pill badges/buttons render as tight text with no
   pill/button shape or click target.
2. **Inflated gaps** — element box heights lost their padding, so many of the
   19 A-structural `gap` deltas were ours-larger-than-target by ~the missing
   padding.

## What changed (fix as implemented)
Added a **node-level `padding` structured axis** to L1 — `{ topPx, rightPx,
bottomPx, leftPx }`, all optional/non-negative — mirroring the existing
node-level `transform`/`mask` precedent so it applies to any leaf/box kind
(text/image/slot/box/container).

- **schema** (`packages/site-schema/src/l1/schema.ts`): `l1PaddingSchema`,
  strict, wired onto every node kind; `L1Padding` type exported.
- **envelope** (`.../l1/validate.ts`): `paddingPx` bound `0..10_000`; rejected
  out-of-range/negative before render (robustness by construction).
- **renderer** (`packages/framework/src/l1/render.ts`): emits per-side
  `padding-*` longhands through the numeric-only sink. Because the document
  reset sets `box-sizing: border-box`, padding **insets content inside** the
  pinned keyframe box rather than inflating geometry — so folding a captured
  (padding-inclusive) box is round-trip-safe. Only present sides emit; an
  absent side never resets the others.
- **fold** (`tools/generate/src/l1/fold.ts`): `foldPadding()` carries the
  captured `paddingTop/Right/Bottom/LeftPx` onto text/image/box leaves;
  zero / absent / out-of-range sides dropped.

### Scope note
The badges ("Coming soon" / "In development") are **text leaves** and now fold
+ render with their captured padding — the L1 mechanism this ticket adds. The
buttons ("Send message" / "Subscribe") are form controls (`a11yRole=button`),
which the fold correctly routes to a `contact-form` **behavior module** as
typed field residuals, not raw L1 leaves (DOC-25/26) — so their padding is a
behavior-module concern, out of L1's scope. The padding axis is nonetheless
available to any leaf a behavior module presents.

## Acceptance
Badges render with their captured padding; the padding axis is `box-sizing:
border-box`-safe (does not inflate the pinned geometry), so it does not regress
`sampleFidelity`. Tests `test_UAT_FC_BUG-17_*`
(`tests/bug17-fold-padding.test.ts`): validator accept/reject (typed,
non-negative, no freeform key), renderer longhands + border-box insetting, and
a design check that the real gigabytealchemy badges fold + render with padding.

## Verification
- `tests/bug17-fold-padding.test.ts` — 7/7 pass.
- Typecheck clean: `site-schema`, `framework`, `tools/generate`.
- L1 regression scope green except two **pre-existing** failures unrelated to
  this change (confirmed failing at baseline with this work stashed):
  `test_UAT_FC_REQ-92_form_controls_stay_residuals` (expects `surface-N` box
  ids) and `test_UAT_AC682_...` (uses slot `capability`, schema field is
  `behavior`).


---

## BUG-18: Flat text axes are single-valued at desktop — font-size not keyframed per width, text oversized at mobile

Scope under [[request-7ff1bacd]] (REQ-88). From the round-3 gigabytealchemy
values-diff. Realizes the "responsive behaviour applies to any property" point in
[[DOC-27]] — currently only geometry is responsive.

## Behavior (bug)
At mobile widths (320/375) text renders at **desktop size** (reference → actual):
- "Gigabyte Alchemy"  36 → 72
- section headings ("Our Mission", "The Alchemy", …)  30 → 36
- "Tools for clarity, presence…"  20 → 24

The target scales type down at narrow widths; we render one fixed (desktop) size at
all widths, so everything is oversized on mobile.

## Root cause
`foldToL1` takes a text run's axes from the **widest present cell** only
(fold.ts — axes from `framed[last]`), so `fontSizePx` (and other flat axes) are a
single desktop value applied at every width. Only `geometry` is keyframed per
width; flat axes are not.

## Fix direction
Keyframe responsive flat axes — at minimum `fontSizePx` — per captured width, the
same way geometry uses `interpolate|snap` between keyframes; the renderer emits a
fluid `calc()` / breakpoint value. Keep it to axes that actually vary across the
ladder (don't bloat static axes into tracks).

## Acceptance
Mobile (320/375) font sizes match the target within tolerance; no desktop-size text
at narrow widths; static axes stay single-valued. Tests named
`test_UAT_FC_<this-ticket>_*`. Keep body current.


## Resolution (free-coded 53fc6141)
Added a responsive scalar-axis track to L1 and wired it end-to-end:
- `l1ScalarTrack` schema + `text.responsive` (fontSizePx / lineHeightPx /
  letterSpacingPx), envelope-bounded per axis, keyframes at document widths.
- `foldToL1` emits a per-width track only for an axis that varies across the
  ladder (`responsiveTextTracks`); a static axis stays a scalar in `axes`.
- Renderer emits the track as media-queried CSS exactly like geometry (base =
  smallest-width keyframe, fluid `calc()` overrides), via the safe numeric sink.
- `evalScalarTrack` mirrors the renderer cascade; `expectedTextManifest` resolves
  each axis per viewport so the round-trip gate no longer expects desktop size at
  mobile.
Acceptance met: at 320/375 font-size folds/renders to the mobile value (36), not
the desktop value (72); static axes stay single-valued. UATs
`test_UAT_FC_BUG-18_*` cover fold, renderer, evaluator, and validator.


---

## BUG-19: Fold assigns page/band fill to every surface — 34 elements get the wrong surfaceFill (navy footer, white cards render tan)

Scope under [[request-7ff1bacd]] (REQ-88). Largest A-flat cluster from the round-3
values-diff (34 defects). Extends [[bug-29b55835]] (BUG-14): the surface *boxes*
are placed, but their *fill values* are wrong.

## Behavior (bug)
The full-width **footer** renders with the tan page tone `#e8dfd3` instead of navy
`#0f172b`. Root observed in the fold output: the footer's three navy runs
(`© Gigabyte Alchemy 2025`, `LinkedIn`, `GitHub`) each become a *tiny* navy card
box (~65–191px wide) instead of one full-bleed navy band, so the rest of the
footer section exposes the tan page background.

(Note verified against the current capture: the "Our Mission" / "What We're
Building" headings genuinely sit on the tan section bands `#d9ccba` / `#e8dfd3`
in the target — those are section headings, not white cards; the white panels
are "Sanctum Voice" / "XGD", captured `#f8f5f2`, which BUG-14 already folds
correctly. So the remaining defect in this cluster is the footer bar.)

## Root cause
The band reconstruction seeds a band fill only from a *single* full-width,
no-treatment run (`fold.ts`, `bandFills`). A footer/nav **bar** paints its fill
full-bleed edge-to-edge, but its text runs are individually narrow and
horizontally *distributed* (space-between: items hug the left and right edges
with a large empty gap between). No single run is full-width, so navy never seeds
a band and each run falls through to `cardRows`, producing tiny navy boxes.

## Fix
Detect a full-bleed bar: same-fill, no-treatment runs sharing a horizontal row
whose union spans full content width AND whose largest internal horizontal gap is
dominant (the empty bar showing between edge-hugging items). Fold such a fill as a
band (its runs become band rows → `buildSolidBands` tiles it full-bleed). This is
distinguished from an evenly-tiled card grid (small, even gaps — e.g. the
`#ece6dd` Presence/Positivity/Connection tiles), which stays as separate cards.

## Acceptance
`surfaceFill` defects → ~0: footer renders navy (full-bleed `#0f172b` band),
white cards stay white, bands keep their tone, evenly-tiled card grids stay cards.
Tests named `test_UAT_FC_BUG-19_*`. Keep body current.


---

## BUG-20: Fold carries surfaceFill but not the other box treatments — borderLeft, radius+shadow (pills), surfaceGradient all dropped

Scope under [[request-7ff1bacd]] (REQ-88). Second A-flat cluster from round-3
values-diff (27 defects). Extends [[bug-29b55835]] (BUG-14) / [[bug-8431c17b]]
(BUG-11): surface fill folds, but the decorative box axes do not.

## Behavior (bug)
The fold carries `surfaceFill` onto surface boxes but drops the rest of the box
treatments (reference → actual):
- **borderLeft ×20** — coloured left borders on cards/callouts: `4px #ffb900` → `none`
- **shape (radius+shadow) ×4** — badges ("Coming soon", "In development") should be
  fully-rounded pills with a shadow: `radius 33554400px, shadow …` → `radius 0px,
  shadow none`
- **surfaceGradient ×3** — gradient panels ("What We're Exploring"): `135° [#f1f5f9
  0%, #e2e8f0 …]` → `none`

## Root cause — ORIGINAL GUESS, CORRECTED BELOW
> `foldToL1` sets `surfaceFill` on the surface box but does not carry the other
> captured box axes — `border`/`borderLeft`, `borderRadiusPx`, `boxShadow`,
> `surfaceGradient`. The L1 axes all exist (REQ-91) and the renderer emits them;
> only the fold-side population is missing.

**This did not hold up.** Measured against the retained gigabytealchemy capture,
`foldToL1` *already* carries these onto card boxes: the folded `l1.json` has 7
boxes with `borderLeft`, 1 with `surfaceGradient`, 4 with `borderRadiusPx`.
`buildCards` has populated them since BUG-14. The real cause splits in two.

### The axis-attribution split (the key fact)
The capture reads the box treatments from **two different places**:
- `borderRadiusPx` / `boxShadow` / `border` — the element's **OWN** computed style.
- `surfaceFill` / `surfaceGradient` / `borderLeft` — an **ancestor walk** (up to
  4/12 levels), so a run reports the treatment of the card that *encloses* it.

In the reference all 25 `borderLeft` elements and all 3 `surfaceGradient`
elements are **text runs**, not boxes.

### Cause 1 — shape ×4: an L1 capability gap (FIXED)
A badge is ONE element that is simultaneously a styled run and a painted pill
(`<span class="rounded-full bg-blue-100">Coming soon</span>`). The DOM fuses them
routinely; L1 forced them into disjoint `text` / `box` leaves, so a badge folded
to a bare text leaf and lost its pill entirely (`radius 33554400px` → `0px`).

### Cause 2 — borderLeft ×20 + surfaceGradient ×3: an attribution artifact (OPEN)
The L1 tree is **flat** — 75 sibling nodes under root, 0 with children. The card
box paints the accent bar correctly, in the right place, at the right size; but
it is a *sibling* of the runs, not their ancestor. So on re-capture the runs'
ancestor walk finds nothing and reports `none`, while the reference (whose runs
are nested inside the card div) reports the bar on every run.

**No pixel differs.** This is the same class as REQ-64's derived-position shadow:
a diagnostic-attribution mismatch between two visually equivalent DOM shapes, not
a paint gap.

## What landed (commit `fec71a6f`)
1. **L1 text leaves gain a self-surface** (`surfaceFill`, `borderRadiusPx`,
   `boxShadow`, `border`), envelope-bounded exactly like the box axes, emitted by
   the renderer on the text element. Closed in L1 per the project rule — never a
   new module.
2. **The fold folds a chip run's own surface onto its text leaf**, and drops its
   card row so the pill is not also duplicated as a box behind it. The
   discriminator is **pill saturation** (radius ≥ half the run's painted height),
   not "has a radius" — a single-run *card* paints a modest rounding on itself
   too, and treating that as a chip deleted its card box and accent bar (caught by
   `bug14-fold-surface-hierarchy`).
3. **The values-diff stops comparing a saturated pill radius as a magnitude.**
   `rounded-full` computes to 33554400px; the clamped fold emits 100000px — both
   paint the identical pill. When both sides are pills only the shadow can still
   differ. A pill flattened to a square, a shadow delta, and non-pill radius drift
   all still flag.

Badges now render as rounded pills and the shape ×4 defects go to 0.

## Remaining work (borderLeft ×20, surfaceGradient ×3)
Two candidate fixes, both scoped but neither landed:

- **(a) Nest card runs under their card box in the fold**, rebasing each keyframe
  to the card origin. Structurally the honest answer — the L1 doc becomes a real
  tree matching the reference DOM, and attribution matches by construction. Cost:
  a pinned parent is a CSS containing block, so `evaluateLayout`
  (`tools/generate/src/l1/probes.ts`) must offset a pinned child by its pinned
  ancestor's origin or the analytic gate silently diverges from the renderer; and
  a painting box with children must still be pushed as a probe leaf. Touches the
  3-probe gate — the highest-risk option.
- **(b) Resolve the enclosing treatment geometrically at diff time.** When the
  actual side reports absent and the reference reports present, check whether a
  painting element on the actual side *encloses* the run. Low risk, no fold/probe
  change, and arguably more faithful (the eye reads "is there a bar at the left
  edge of the card containing this run", not "is it a DOM ancestor").

## Acceptance
borderLeft / shape / surfaceGradient defects → ~0: cards show coloured left borders
+ shadow, badges render as rounded pills, gradient panels render their gradient.
Tests named `test_UAT_FC_<this-ticket>_*`. Keep body current.

**Status against acceptance**: shape ×4 → 0 (done). Cards already showed their
left borders and the gradient panel already rendered its gradient (the card boxes
carry both) — the borderLeft ×20 / surfaceGradient ×3 *counts* remain, pending
(a) or (b) above.

## Test plan
`tests/bug20-chip-self-surface.test.ts` — 12 UATs over the real `foldToL1` /
`renderL1Document` / `validateL1` / `diffManifests` entry points:
- badge run folds to a text leaf carrying its own pill; bare runs gain no chip
  surface; no duplicate badge box behind the chip; the renderer emits the chip
  surface on the text element; card treatments stay on the card box; chip axes
  stay inside the L1 envelope (an unclamped sentinel radius is rejected)
- a modestly-rounded single-run card is **not** a chip (the BUG-14 regression guard)
- the real gigabytealchemy capture's badges fold as pills, accent bars intact
- diff: two pills with different sentinel radii → no defect; a pill flattened to a
  square → flags; a shadow delta between two pills → flags; non-pill radius drift
  → flags

Full suite: 687 passed, 2 failed — both pre-existing and unrelated
(`reconciliation-l1-substrate`, `req92-image-box-fold`, plus a
`reconciliation-capability-modules` import error), verified by stash-baselining
the same files on a clean tree.


---

## REQ-88: L1 reproduction pipeline: capture bundle → servable, gate-able site

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


---

## BUG-23: Reproduction hotlinks the captured origin instead of its mirrored local asset — hero renders only while the target site is up, hiding image regressions from the gate

Scope under [[request-7ff1bacd]] (REQ-88). Related to [[bug-ad50b1df]] (BUG-2, capture asset
loss) but distinct: the asset here *is* mirrored correctly — nothing referenced
it. Builds on [[bug-5908809a]] (BUG-13, section background-image nodes).

## Behavior (bug)
The reproduction hotlinked the live target instead of using its own mirrored
asset. Rendered output contained:

```css
.l1-7 { background-image: url("https://gigabytealchemy.ai/images/AlchemistLabWithTech.png") }
```

while the mirrored copy sat unused on disk at
`storage/sites/gigabytealchemy/draft/assets/AlchemistLabWithTech.png`.

`1c repro` copies bundle assets into the draft (`copiedAssets` path), and the
fold emits `backgroundImageUrl` as the **absolute remote URL** captured from the
source page. Nothing rewrote it to the local mirror.

## Why this matters
1. **It is not a reproduction.** The page rendered only because the original
   site was up and reachable.
2. **The perceptual gate was measuring the wrong thing.** Every `1c shot` /
   `1c diff` run compared the target against a page *serving the target's own
   image over the network*. Hero fidelity was guaranteed by hotlinking, not
   earned by the pipeline — so the gate could not detect an image-handling
   regression at all.
3. It silently egressed to a third-party host on every render and shot.

Point 2 is why this is high severity rather than cosmetic: a hole in the gate,
not just in the output.

## What changed

**`tools/generate/src/l1/assets.ts` (new) — `localizeAssets(doc, assets)`.**
One pure function that binds every asset-bearing axis in an L1 document to the
bundle's mirror, and accounts for what did not resolve on either side. It walks:

- `image` node `.src`
- `box` node `.axes.backgroundImageUrl`
- `doc.resources.fonts[].src`

Resolution uses the bundle's own origin→mirror map (`capture.json`'s
`assets[]`, `src` → `localPath`). An absolute handle resolves to `/<localPath>`;
a handle that is already site-local (mirrored font faces arrive this way) is
normalized to root-relative so it resolves identically from any page depth.
Returns `{ doc, rewritten, unmirrored, unreferenced }`.

**Unmirrored handles fail the import.** `cmdRepro` throws when any absolute
handle has no mirrored counterpart, naming each one and pointing at re-capture.
Falling back to the origin for "just this one asset" is exactly the defect —
a reproduction is self-contained or it does not exist. There is no partial
mode and no silent hotlink path.

**Unreferenced mirrored assets are reported (AC-4).** Assets of kind `image` or
`font` whose bytes are in the bundle but which no node references are returned
on `ReproResult.unreferencedAssets` and printed by `1c repro` as a fold gap.
Stylesheets/scripts/the document itself are page subresources, never
L1-referenceable, so they are excluded from the signal rather than reported as
noise.

**Supporting changes.** `readCaptureAssets(bundleDir)` in `capture/bundle.ts` —
a tolerant reader returning `[]` when a bundle has no `capture.json` (a bundle
with no remote handles reproduces fine; one with them fails loudly downstream).
`ReproResult` gains `localizedAssets` + `unreferencedAssets`, both surfaced in
the `1c repro` CLI summary.

## Design decisions

- **The rewrite lives in `cmdRepro`, not in the fold.** The fold stays a
  faithful transcription of what the capture read; the *site* — which owns the
  mirror — binds handles to it. This leaves `1c l1-gate` (which folds
  `multistate.json` directly) untouched.
- **Fail loud on an unmirrored handle** rather than dropping the node or keeping
  the remote URL. Keeping it preserves the gate hole for that asset; dropping it
  silently deletes content. Verified against both live bundles
  (gigabytealchemy, joyfulculinarycreations): every referenced handle has a
  mirror, so the strict path costs nothing today and names the gap the moment
  one does not.
- **Font faces are normalized too**, closing a latent depth bug: they arrived as
  relative `assets/…` and are now root-relative.

## Verification

`1c repro gigabytealchemy && 1c render gigabytealchemy` →
`grep -rEo "https?://" ` over the rendered HTML + CSS returns **nothing**; the
hero resolves to `/assets/AlchemistLabWithTech.png`, present on disk in the
render output. Same for `joyfulculinarycreations` (4 image leaves + 4 font
faces, zero absolute URLs). The gigabytealchemy repro now also reports its one
real fold gap: `assets/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2` — Cinzel is painted
but its face was never bound (a REQ-90 gap this made visible).

## Test plan

`tests/bug23-repro-local-assets.test.ts` — 6 UATs driving `1c repro` +
`1c render` end to end against a fixture bundle whose fold carries remote
handles:

- `test_UAT_FC_BUG-23_media_handles_resolve_to_local_mirror` (AC-1) — background
  image, image-leaf `src`, and font face all name the mirror; no origin URL
  survives in the written page.
- `test_UAT_FC_BUG-23_rendered_output_is_free_of_captured_origin` (AC-2) — no
  rendered HTML or CSS artifact contains the captured origin.
- `test_UAT_FC_BUG-23_reproduction_renders_without_reaching_the_target_host`
  (AC-3) — every handle the render emits resolves to a file that exists in the
  render output, and no absolute handle remains: the page cannot reach the
  target host because it never names it.
- `test_UAT_FC_BUG-23_unreferenced_mirrored_assets_are_reported_as_a_fold_gap`
  (AC-4) — the orphan image is reported; the stylesheet subresource is not.
- `test_UAT_FC_BUG-23_unmirrored_handle_fails_the_import_rather_than_hotlinking`
  — dropping the hero from the asset map fails the import, naming the handle.
- `test_UAT_FC_BUG-23_localize_is_pure_and_normalizes_already_local_handles` —
  the caller's document is not mutated, and a second pass is a no-op.

Regression scope (all green): `req88-l1-repro-pipeline`, `req86-e2e-repro`,
`reconciliation-l1-fold`, `reconciliation-l1-substrate`,
`bug13-fold-section-background`, `bug12-cross-origin-font-faces`, `capture`,
`naming`. Workspace typecheck clean.

## Acceptance criteria
1. `backgroundImageUrl` (and any other asset-bearing axis) resolves to the
   draft-local mirrored path, not the captured remote URL.
2. Rendered output contains no absolute URL pointing at the captured origin.
3. Reproduction renders correctly with no network access to the target host.
4. Assets present in the bundle but referenced by no node are reported (they
   indicate a fold gap), rather than silently mirrored and ignored.


---

## BUG-21: Control surface boxes double-apply padding — buttons render 2x target height, bleed past viewport edges at mobile

Scope under [[request-7ff1bacd]] (REQ-88). Regression surfaced by the round-4
gigabytealchemy reproduction. Interacts with [[bug-88dfa748]] (BUG-17, padding
axis) and [[bug-29b55835]] (BUG-14, card/band reconstruction).

## Behavior (bug)
Control surface boxes are outset from the control's **already-padded** box, so
every button renders at 2x its target height and ~50px too wide. At mobile the
Subscribe surface lands at `x=-1, width=322` on a 320 viewport and bleeds past
both screen edges.

Oracle (`multistate.json`) vs draft (`card-8`/`card-9`), all six widths:

| width | Subscribe target | card-8 repro | Send message target | card-9 repro |
|-------|------------------|--------------|---------------------|--------------|
| 320   | x=24 w=272 h=48  | x=-1 w=322 h=98  | x=24 w=272 h=48 | x=0 w=320 h=96 |
| 375   | x=24 w=327 h=48  | x=-1 w=377 h=98  | x=24 w=327 h=48 | x=0 w=375 h=96 |
| 768   | x=245 w=122.75 h=50 | x=220 w=173 h=100 | x=408 w=172.78 h=48 | x=384 w=221 h=96 |
| 1024  | x=349.25 w=122.75 h=50 | x=324 w=173 h=100 | x=536 w=172.78 h=48 | x=512 w=221 h=96 |
| 1280  | x=413.25 w=122.75 h=50 | x=388 w=173 h=100 | x=664 w=172.78 h=48 | x=640 w=221 h=96 |
| 1440  | x=493.25 w=122.75 h=50 | x=468 w=173 h=100 | x=744 w=172.78 h=48 | x=720 w=221 h=96 |

## Root cause
Padding is applied twice. The text nodes carry the correct BUG-17 padding axis,
matching the target exactly:

- `Subscribe`: `{top 12, right 24, bottom 12, left 24}`
- `Send message`: `{top 12, right 32, bottom 12, left 32}`

The surface reconstruction then expands the surface box by padding a *second*
time. The outset is uniform on all four sides and equals
`paddingTop + paddingBottom` (= 24), **not** the per-edge padding:

- `card-9` (Send message): outset 24 on all four sides. `272 + 24 + 24 = 320`,
  `48 + 24 + 24 = 96`. Note left/right padding is 32, so the horizontal outset
  is using the vertical sum.
- `card-8` (Subscribe): outset 25 on all four sides = 24 + 1px border (target
  h=50 vs Send message h=48 confirms the border).

Two defects compounded: (a) the surface box should not be outset at all — the
target box already includes padding; (b) the outset that is applied uses the
vertical padding sum on all four axes.

## Evidence
Highest per-pixel error on the whole page. From `1c diff` at 1280, the two worst
regions by mean intensity land exactly on these two boxes:

- `#3 score 10214.9 (mean 150.2) @ 384,3872 176x112` -> `card-8` (x=388 y=3875 w=173 h=100)
- `#2 score 10600.7 (mean 135.9) @ 640,4048 224x112` -> `card-9` (x=640 y=4060 w=221 h=96)

Both outrank every other region on mean; only region #1 outscores them on raw
area. Independent of `values-diff`, which does not report this at all (see the
companion tooling bug).

## Acceptance criteria
1. `card-8`/`card-9` geometry matches the oracle box within the gate's 0.5px
   tolerance at all six widths.
2. No surface box is outset by padding that its source box already includes.
3. Where an outset is legitimately required, per-edge padding is used per edge —
   never the vertical sum applied horizontally.
4. `1c diff` regions #2/#3 drop out of the top-3 by mean intensity.

## Exact origin (pinned after filing)
`cardPadding` — `tools/generate/src/l1/fold.ts:687`:

```ts
function cardPadding(rows: SurfaceRow[]): number {
  if (rows.length < 2) return clamp(Math.round(0.5 * rows[0].widest.height), 8, 28)
  ...
}
```

It returns a **single scalar**, outset on all four sides. A button is a
single-run surface, so `rows.length < 2` and the padding is
`0.5 x row height`, clamped to [8, 28]. Outsetting that on both vertical sides
of a box whose height already equals the row height gives
`h + 2*(0.5h) = 2h` — the 2x height is arithmetically guaranteed for any
single-row control in the 16..56px range, not an edge case.

Confirms every measurement in the table above:
- `Send message` widest height 48 -> pad 24 -> 48+24+24 = 96 (observed 96)
- `Subscribe` widest height 50 -> pad 25 -> 48+25+25 = 98 (observed 98 @320,
  where the target height is 48)

Note the scalar derives from the **widest** occurrence and is then applied at
every width, which is why the @320 Subscribe surface inherits the 50px-tall
desktop row's padding. Any fix must be per-width as well as per-edge.

A single scalar inferred from vertical rhythm is also the reason the horizontal
outset uses a vertical number — there is only one number.

-


---

## BUG-22: values-diff mis-attributes split text+box controls — phantom radius delta leads the repair order while the real geometry defect goes unreported

Scope under [[request-7ff1bacd]] (REQ-88). Tooling defect in the reproduction
scoreboard. Found alongside [[bug-24975383]] (BUG-21), which it concealed.
Extends [[bug-9dafeb0b]] (BUG-15, values-diff reading L1 pages).

## Behavior (bug)
The target represents a control as a **single** node — `role: "action"`, carrying
text, `surfaceFill` and `borderRadiusPx` together. The L1 fold represents the
same control as **two** nodes: a `text` node for the label plus a sibling `box`
carrying the surface treatment.

`values-diff` matches by text, lands on the `text` node, reads `borderRadiusPx`
off it, finds none, and reports a delta:

```
[A] shape  radius 8px, shadow no  ->  radius 0px, shadow no
```

The radius is in fact correct at every stage of the pipeline:

- oracle: `role:"action"` ... `borderRadiusPx: 8`
- draft: `card-8`/`card-9` axes `{surfaceFill, borderRadiusPx: 8}`
- rendered CSS: `border-radius: 8px` present, twice

## Why this matters beyond a false positive
The phantom is classified **Type-A flat**, which puts it at the head of the
printed repair order:

```
repair order (REQ-64): A-flat 2 -> A-structural 1 -> B 14
  (1) copy the 2 Type-A flat value(s); (2) author the 1 Type-A structural; ...
```

Step 1 is a no-op — there is no value to copy. Worse, the *real* defect at those
same coordinates (BUG-21: surface boxes at 2x target height, the two highest
per-pixel error regions on the page) is not reported by `values-diff` at all. The
scoreboard directs the next repair pass at a no-op and stays silent on the
largest visual error.

This is the known values-diff blind-spot failure mode ([[doc-e8a65bcc]], DOC-19): a matched axis is not
proof, and here a *mismatched* axis actively misdirected. It will recur on every
site that has controls, not just this one.

## Root cause (confirmed)
Node-identity assumed 1:1 text-to-node correspondence. `surfaceFill` /
`surfaceGradient` / `borderLeft` already resolve over the **geometric surface
chain** (REQ-88 — tightest-first, so a sibling backing box counts), which is why
the fill matched. `borderRadiusPx` / `boxShadow` / `border` are read from the
element's **own** computed style, so on the split shape they were read off the
label — which paints nothing.

## What changed

**Capture records the surface-BEARING box, not just the surface colour.**
`ValueElement.surface` (`SurfaceShape`, on `ElementGeometry` so both the bundle
and live-extraction projections carry it) is resolved tightest-first over the
same chain `surfaceFill` uses:

```
surface: { self, box, borderRadiusPx, boxShadow, border } | null
```

`self` is the discriminator: **true** where the run's own element paints the
surface (a conventional page: `<button class="rounded bg-…">`), **false** where a
different box does (the flat L1 tree). Null when nothing paints behind the run.

**The diff resolves a split control against that box.** When the expected side is
`self` and the actual side is not, `shape` (radius + shadow) and `border` compare
against the backing box, and the backing box's **geometry** is compared against
the reference control's box — the axis the phantom was standing in front of.

Deliberately narrow, so it fires only where the two sides genuinely disagree
about node identity:
- a self-painting chip (BUG-20) is `self` on both sides → own-axis comparison
  unchanged;
- an ordinary run sits on its band on both sides → no surface-geometry rows, so
  no per-run band noise;
- a reproduction that really did lose the rounding still reports `shape`;
- a pre-BUG-22 bundle has no `surface` → the resolution is inert.

## Measured outcome (gigabytealchemy, real bundle)

```
before   17 defects   A-flat 2 -> A-structural 1 -> B 14
           [M] shape  "Send message"  radius 8px -> radius 0px   @all   <- no-op
           [M] shape  "Subscribe"     radius 8px -> radius 0px   @all   <- no-op
after    17 defects   A-flat 0 -> A-structural 1 -> B 16
           [H] size   "Send message"  surface 272x48 -> surface 320x96  @all
           [H] size   "Subscribe"     surface 272x48 -> surface 322x98  @all
```

Both phantoms gone, the repair order no longer leads with a no-op, and BUG-21's
2x-height defect is now on the scoreboard.

## Operational note — existing bundles are inert until re-captured
`surface` is a new capture field, so a retained bundle's `multistate.json` does
not have it and the resolution stays dormant (no behaviour change, no new
phantoms). Re-run `1c capture page <url>` to pick it up. The offline
re-extraction path (DOC-13 §9) was used to *verify* the numbers above against a
copy of the retained bundle, but its output cannot be promoted into a bundle:
it bakes the ephemeral `http://127.0.0.1:<port>/` loopback origin into
`backgroundImageUrl`. That is a pre-existing gap in offline re-extraction, not
part of this fix.

## Test plan
`tests/bug22-split-control-surface.test.ts` — the real `EXTRACT_SCRIPT` under
jsdom (BUG-15's harness), then the real `flattenSignals` -> `diffManifests`
pipeline. Both fixture shapes are measured from the retained gigabytealchemy
capture (reference button 123x50 @1280, `#009966`, radius 8; reproduction as the
draft actually folds it — backing box 173x100 at 388,3875 plus a 123-wide label).

- `test_UAT_FC_BUG-22_capture_records_which_box_paints_the_surface`
- `test_UAT_FC_BUG-22_no_phantom_shape_delta_when_the_backing_box_carries_the_radius`
- `test_UAT_FC_BUG-22_surface_geometry_defect_is_reported`
- `test_UAT_FC_BUG-22_a_genuinely_square_backing_box_still_reports_the_shape_defect`
- `test_UAT_FC_BUG-22_self_painting_controls_on_both_sides_are_unaffected`
- `test_UAT_FC_BUG-22_band_runs_gain_no_surface_geometry_noise`

Regression scope: full `vitest run tests/` — 726 passed, 1 pre-existing unrelated
failure (`req92-image-box-fold` "form controls stay residuals", fails identically
on a clean tree). Workspace-wide `tsc --noEmit` clean across all five packages.

## Acceptance criteria
1. Surface axes (`borderRadiusPx`, `surfaceFill`, `boxShadow`, `border`) on a
   split control resolve against the surface-bearing node; no phantom
   `radius N -> 0` delta for a control whose surface box carries the value. ✅
2. Geometry deltas on a split control's **surface box** are reported — BUG-21's
   2x-height defect must appear in `values-diff` output. ✅
3. The Type-A flat count for gigabytealchemy drops by the 2 phantom control
   entries, and the repair order no longer leads with a no-op. ✅ (2 -> 0)
4. Regression test covers the split-node shape (one oracle `action` node vs a
   reproduction `text` + sibling `box`). ✅


---

## BUG-24: Colour alpha is not representable in the captured value set — translucent overlays (hero veil) flatten to opaque fills

Scope under [[request-7ff1bacd]] (REQ-88). Motivating instance found in the
round-4 gigabytealchemy reproduction. Adjacent to [[bug-5908809a]] (BUG-13,
section background-image nodes).

## Behavior (bug) — VERIFIED

A hero veil is a **colour carrying its own alpha**, not element opacity. Across
the whole of the gigabytealchemy `multistate.json`: `rgba(` 0, 8-digit hex 0,
`"alpha"` keys 0, `"opacity"` keys 354 — element opacity was captured, a colour
with alpha was not.

The gigabytealchemy hero composites a translucent dark veil over the photo
(confirmed present in `raw.html`):

```html
<section class="... bg-cover bg-center" style="background-image: url('...AlchemistLabWithTech.png');">
  <div class="absolute inset-0 bg-slate-950/30"></div>
```

Captured `sections[1]` (the hero band, y 0..800 @1280) recorded `overlay: null`.

## Root cause — TWO independent gaps (both diagnosed this session)

The original hypothesis was "L1 colour axes cannot express alpha". **That was
wrong** — the L1 envelope already accepted `#rrggbbaa`, `l1OverlaySchema`
already existed as a box axis, and `renderL1Document` already layered it above
the background image via `withAlpha`. The whole overlay axis was in place and
unreachable. The real gaps were upstream:

1. **Capture never detected the veil.** The scrim probe (`overlayOf` in
   `extract.ts`) matched the computed background against a raw
   `/rgba\(([^)]+)\)/` regex. The site's CSS is
   `bg-slate-950\/30{background-color:color-mix(in oklab,var(--color-slate-950)30%,transparent)}`
   — Chromium computes that to a modern-syntax colour that the regex cannot
   read, so **every** `color-mix` / `oklab` / `oklch` / `color()` scrim was
   silently skipped. `overlayOf` was the one remaining colour site still using
   the legacy regex instead of `rgbaOf`, the REQ-52 canvas probe.

2. **The fold never carried a captured scrim.** `SectionValues.overlay` was
   projected end-to-end (both `flattenCapture` and `flattenSignals`) but
   `foldSectionBackgrounds` read only `backgroundImageUrl`, so even a correctly
   captured scrim could not round-trip.

Either gap alone loses the veil; both had to be closed.

## Fix

- `tools/generate/src/cli/capture/extract.ts` — `overlayOf` resolves the scrim
  through `rgbaOf`, which understands any browser-accepted colour syntax and
  preserves alpha.
- `tools/generate/src/l1/fold.ts` — the section-background box carries
  `axes.overlay`; a section folds when it paints an image **OR** a scrim (so an
  overlay over a solid band is carried too). Each axis reads from the widest
  width that carries it.
- `extract.ts` — `rgbaOf` now prefers the canvas `fillStyle` **serialization**
  (lossless) over the pixel probe. Painting a translucent fill stores
  premultiplied bytes, and `getImageData`'s unpremultiply loses up to a level
  per channel — `rgba(2,6,23,.45)` read back as `#020716`. This surfaced as a
  regression in REQ-31's calibrated scrim UAT; fixing the precision was the
  right answer rather than loosening that assertion.
- The renderer needed **no change**.

## Evidence

Verified against the live motivating instance (captured to a temp dir — the
stored oracle bundle was not overwritten): the hero band now captures
`overlay={"color":"#030717","opacity":0.3}` where it previously captured `null`.

Each fix was proven necessary by reverting it independently: without the capture
fix the two real-Chromium UATs fail; without the fold fix the three fold/render
UATs fail.

**Known bounded residual**: Chromium serializes `color-mix(in oklab, …)` in a
wide-gamut form the exact parser does not read, so that path still falls back to
the pixel probe and lands on `#030717` rather than the authored `#020618` — ≤1
level per channel. At 30% alpha the composited error is ~0.3/255 (invisible),
and it is self-consistent: both sides of a values-diff go through the same
capture path, so it cancels. Extending the exact parser to `color(srgb …)` would
close it but is out of scope here.

## Acceptance criteria

1. ✅ Colour-with-alpha is representable and captured rather than dropped.
2. ✅ The veil round-trips: capture → fold → render emits
   `linear-gradient(#0206184d, #0206184d), url(...)` — a translucent layer over
   the image, not an opaque fill.
3. ⛔ **NOT DONE** — hero diff regions #7/#8/#9/#12 have not been re-measured.
   That needs a full reproduction round (re-capture the oracle, re-fold,
   re-render, `1c diff`), which is a separate pass on REQ-88's repro loop, not
   part of this code fix.
4. ✅ `tests/bug24-scrim-alpha.test.ts` (6 UATs) + `tests/fixtures/capture/bug24-scrim.html`
   cover a colour-with-alpha scrim over a background image, including negative
   controls (a plain band must not gain a scrim; a section with neither image
   nor scrim must fold no box).

## Test / regression scope

- `tests/bug24-scrim-alpha.test.ts` — 6/6 pass (4 fold/render, 2 real Chromium).
- Full suite: 732 pass, 1 fail — `req92-image-box-fold >
  test_UAT_FC_REQ-92_form_controls_stay_residuals`, confirmed **pre-existing**
  by stashing both fixes and re-running. Unrelated to this ticket.
- `tsc --noEmit` clean for `tools/generate`, `packages/framework`,
  `packages/site-schema`.


---

## REQ-93: L1 pages must be able to host behavior modules in their slots

## Problem

A captured marketing page is **100% L1 layout plus one behavior module**. That
combination is currently unrepresentable, so the behavioural part of every
reproduction is permanently stranded as a residual.

`pageSchema`'s `superRefine` (added by REQ-88) enforces a strict XOR:

> a page is either a module stack or a raw L1 document, not both

On gigabytealchemy.ai this shows up as four form controls the reproduction can
never render. It is **not** a folder-power gap — the capture already carries
everything the `contact-form` behavior module needs:

| field | a11yRole | accessibleName | nameSource | box @1280 |
|---|---|---|---|---|
| mailing list | textbox | `Your email address` | placeholder | 88, 3900, 313×50 |
| contact | textbox | `Your name` | placeholder | 664, 3784, 528×50 |
| contact | textbox | `Your email` | placeholder | 664, 3850, 528×50 |
| contact | textbox | `Your message` | placeholder | 664, 3916, 528×146 |

(plus `border: 1px solid`, `borderRadiusPx: 8` on each; two distinct forms.)

The fold correctly declines to synthesize raw `<input>` leaves — per DOC-25/26 a
form control belongs to a vetted behavior module, not to L1. So the fold is
right, the capture is sufficient, and the page shape is the only thing missing.

`l1SlotSchema` already anticipates the seam: it carries `name` and `behavior`.
What does not exist is the page's ability to **bind a module instance to a slot
inside its L1 tree**.

## Why the XOR was right, and what it should say instead

The XOR's real intent is *no two competing page bodies* — a page must not have a
module stack and a raw L1 document each claiming to be the whole page. That
intent is preserved by a narrower rule:

> modules may accompany `l1` when each is bound by name to a `slot` present in
> the L1 tree

The L1 document remains the single page body; modules are mounted *into* it at
declared seams, which is exactly the composition DOC-25/26 describe.

## Scope

1. **Schema** — relax the XOR to slot-bound mounting; validate that every module
   instance names a `slot` that exists in the L1 tree, and that no slot is bound
   twice. An unbound module or a dangling slot name is an error, not a silent
   no-op (same principle as REQ-88's `anchor`-without-`column` check).
2. **Fold** — emit a `slot` node (`behavior: 'contact-form'`) at the captured
   controls' union rect instead of a `field` residual. Group controls into forms
   by their enclosing `<form>` / geometric cluster: this page has **two**.
3. **`repro`** — derive the module config from the capture: `fields[]` from
   `accessibleName` + `a11yRole` (+ `type` from the control's input type where
   available, else `text`/`textarea` by height), `action` from the captured form
   action. Absent an action, record a residual rather than inventing an endpoint.
4. **`render`** — mount the module's rendered fragment into the slot, replacing
   the inert `data-l1-slot` placeholder. `renderL1Fragment`'s prefix namespacing
   already exists for exactly this.
5. **Conformance** — the mounted result carries the behavior module's declared
   obligations (safety / security / x-browser / responsive / isolation).

## Acceptance

- The gigabytealchemy reproduction renders both forms with real, a11y-labelled
  controls; `values-diff` reports **0** `missing` deltas for the four fields
  (currently 4 per cell, the worst delta on every cell of the ladder).
- `l1-gate` reports **0** `field` fold residuals for that page.
- A page binding a module to a non-existent slot fails validation with a
  machine-readable error.
- A page with `l1` and an *unbound* module still fails — the XOR's intent holds.

## Notes

Diagnosed in REQ-88 round 8 while closing the operator's list; recorded there in
full so this ticket starts from the diagnosis rather than re-deriving it. REQ-88
introduced the XOR, so this is its natural successor rather than a defect against
it: the XOR was correct for a pure-layout page and is now the binding constraint
on the first page that needs behaviour.


---

## Implementation (delivered)

Landed as one commit (`259f9eb8`, `[FREE-CODED]`, version `0.0.203`).

### Schema — `packages/site-schema`
- `moduleInstanceSchema` gains an optional `slot: string`.
- `pageSchema`'s REQ-88 XOR is replaced by the narrower rule: modules may
  accompany `l1` when **each** resolves to exactly one existing seam.
  `l1/slots.ts` walks the tree and collects slot names; the page refine rejects,
  each with a machine-readable `path`:
  - a module with `l1` present but no `slot` (the XOR's intent — an unbound
    module still fails);
  - a `slot` naming a seam that is not in the tree (dangling);
  - two modules binding the same seam (double-bound);
  - a seam present in the tree that no module binds (orphan);
  - a `slot` on a module when the page has no `l1` at all.
  Duplicate slot *names* inside one tree are rejected as ambiguous.

### Capture — `tools/generate/src/cli/capture`
A captured `field` now carries the two behavioural facts no painted axis can
hold: `controlType` (the resolved `<input type>` / `textarea`) and `formAction`
(the enclosing `<form action>`, absent when the form declares none). Both flow
through `extract` → `sections` → `bundle` and are ignored by `values-diff`
(behavioural, not painted).

### Fold — `tools/generate/src/l1/forms.ts` (new) + `fold.ts`
Captured controls cluster into the forms they visibly belong to — grouped by
`formAction` where present, otherwise by rect proximity at the widest sample —
and each group becomes an L1 `slot` node (`behavior: 'contact-form'`, name
`form-N`) pinned at the group's union rect across the width ladder. Previously
each control was dropped as a `field` fold residual.

### Repro — `tools/generate/src/cli/repro.ts`
The same fold that writes `l1.json` writes `forms.json` beside it, so the two
artifacts cannot disagree (an earlier attempt re-folded inside `repro` and had
too wide a blast radius on tests it does not own; a part-stale bundle now fails
loudly instead of silently stranding). `repro` reads `forms.json` and derives
each `contact-form` instance's config from the capture only:
- `fields[]` — `name` slugged from `accessibleName`, `label` verbatim, `type`
  from `controlType` (falling back to `textarea` by height, else `text`),
  `required` from the captured control;
- `action` from `formAction`. **An endpoint never seen is reported as a
  residual, never invented.**

### Render — `packages/framework/src/l1/render.ts`, `tools/generate/src/render`
`renderL1Document` accepts the page's module instances; a `slot` node emits the
bound module's rendered fragment inside the same positioned box instead of the
inert `data-l1-slot` placeholder. `renderL1Fragment`'s existing prefix
namespacing keeps per-instance CSS collision-free.

### Conformance — `tools/generate/src/conformance`
A new `mountInL1` fixture mode runs the universal ACs (safety / security /
x-browser / responsive / isolation) against the *mounted* shape, so a behavior
inherits its obligations in the position it actually ships in.

### Evidence
- `tests/req93-l1-slot-mounted-behaviors.test.ts` — 10 UATs
  (`test_UAT_FC_REQ-93_*`) covering each validation rejection, the fold's
  two-form clustering on the real gigabytealchemy capture, config derivation
  including the missing-action residual, the mounted render, the
  `l1.json`/`forms.json` consistency gate, and the conformance mount.
- `l1-gate` on gigabytealchemy: **0** `field` fold residuals (was 4),
  `contact-form@form-0` and `contact-form@form-1` mounted.
- Full suite green: 111 files / 773 tests.


---

## BUG-25: A multi-line text element splits into runs that all share one box

## Problem

A text element that wraps across lines is split into one run per line, but every
run is given the **same geometry** — the parent element's box *and* the parent's
glyph box. There is no per-line geometry anywhere in the capture, so a fold that
positions runs absolutely has no way to separate them, and they print on top of
each other.

Found on `joyfulculinarycreations.com`, where it lands on the hero `<h1>` — the
most prominent element on the site. Measured at 1280x800:

```
'Dreaming of healthier meals'  box={x:20, y:171.5, 1240x301.6}  glyphs={x:20, y:311.3, 815.2x172.4}
'on your dinner table?'        box={x:20, y:171.5, 1240x301.6}  glyphs={x:20, y:311.3, 815.2x172.4}
```

Identical `box` and identical `renderedTextBox`. The reproduction renders exactly
what that describes: two runs at one position, reading
`ONDYEOAUMRIDNIGNNEROATHAEBALLTEHIER MEALS`.

Scope check on that page: **exactly one** box is shared by more than one run — so
this is not endemic, but the one instance is the hero. `gigabytealchemy.ai` never
exposed it because its headings are single-run.

## Why it matters beyond the visual

The fold's REQ-88 `nowrapFromPx` axis derives a run's line count from
`renderedTextBox.height / lineHeightPx`. When two runs share one glyph box, that
ratio describes the *pair*, so both runs are classified as 2-line and neither is
pinned. A shared box therefore corrupts line-count reasoning as well as position.

## Direction (not prescriptive)

The browser already knows the per-line geometry — `Range.getClientRects()` returns
one rect per line box, which is how REQ-88's cross-engine UAT counts lines. The
capture has the mechanism; it is not being used to *split* geometry, only to
measure extent.

Two candidate shapes, to be decided in design:

1. **Per-line runs with real rects** — keep the split, give run *i* the *i*-th
   client rect. Faithful, and each line becomes independently positionable.
2. **One run with its line breaks** — do not split at all; carry the element's
   text with its natural wrapping and let the renderer re-wrap inside the box.
   Fewer nodes, but re-opens the wrap decision REQ-88 deliberately closed.

(1) is the better fit for a flat absolutely-positioned substrate; (2) trades a
correctness risk this project has already paid for once.

## Acceptance

- No two text runs in a capture manifest share an identical `renderedTextBox`
  unless the source elements genuinely occupy the same rect.
- The joyful hero renders as two stacked lines, not one overprint.
- Line-count classification (`nowrapFromPx`) is computed per line, not per pair.
- A single-line run is unchanged (no regression on `gigabytealchemy.ai`, whose
  values-diff and 3-probe gate must hold at their current numbers).

## Provenance

Found while importing joyfulculinarycreations into the sandbox during REQ-88
round 8. Independent of REQ-88's own changes — the column fit correctly declined
this page (`doc.column` undefined, 0 nodes anchored), so none of that work is
implicated.


Related: [[bug-2936cebf]] (BUG-27 — missing imagery on the same page), [[request-16253634]] (REQ-94 — the gate calibration that let both reach an operator via a screenshot).

-