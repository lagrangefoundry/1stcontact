---
uid: bug-2936cebf
id: BUG-27
type: bug
title: CSS background images and lazy-loaded media are not captured
created_by: xgd
created_at: '2026-07-25T21:14:17.767631+00:00'
updated_at: '2026-08-06T04:55:05.299998+00:00'
completed_at: '2026-08-06T04:55:05.299998+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a22f2f1670772c99206a6da8e909a34291b52abe
    reconcile_sha: null
    main_sha: null
  version: 0.0.206
  bundled_in: bundle-ee56a66e
  chat_comment: comment-fc659764
---

## Problem

On a page whose substance is photography, the capture records almost none of it.
The reproduction comes out as flat colour and the page is ~80% wrong by pixel
count, while every value-level gate stays green.

Measured on `joyfulculinarycreations.com` @1280:

| signal | value |
|---|---|
| elements extracted | 69 |
| elements with `src` | **4** |
| sections | **2** (one spanning y=0 to 4440) |
| `sections[].backgroundImageUrl` | **None** on both |
| assets mirrored | **86** |
| assets referenced by no node | 7 |
| perceptual diff | **mean 106.8 / 255, 80.3% of pixels over threshold** |

`repro` names the casualties directly in its fold-gap warning: the hero photo
(`HERO-AdobeStock_254767116-scaled.jpeg`), the site logo
(`JCC-WEBSITE-LOGO-350-x-100-px.png`), `market-vegetables-produce-6329164.jpg`,
and four icon-font `.woff2` files.

So the asset mirror *can see* these files — they are reachable from the page's
CSS — while the element/section extraction cannot. The gap is in what the
extractor looks at, not in what the page serves.

## Two distinct causes, likely both present

1. **CSS `background-image` is only read on bands/sections.** The extractor
   resolves a background image for a *section*, and this page reports `None` for
   both of its sections while visibly rendering a full-bleed hero photograph. Any
   painted background on a non-section element is invisible to the capture
   entirely.
2. **Lazy-loaded media is not settled before extraction.** This is an Elementor
   page (`eicons`, `fa-*`, `e-swiper`, carousel bundles); its imagery arrives
   through lazy loading and external stylesheets. Only 5 `<img>` tags and 3
   `background-image` declarations exist in the *rendered* HTML at extraction
   time, against 86 mirrored assets.

Cause 2 is the one already recorded as a known hazard in prior repro work; cause
1 is new and is what makes the hero unreachable even after settling.

## Why the section count matters too

Both captured sections are enormous (`0 to 4440`, `4440 to 4744`). REQ-88's band
reconstruction clamps band tops and bottoms to captured section edges; with no
interior edges there is nothing to clamp to, so the mechanism that fixed
gigabytealchemy's bands is inert here. A section detector that finds two sections
on a page with a dozen visually distinct full-bleed panels is a related, possibly
common-cause, failure.

## Acceptance

- The joyful hero background photograph reproduces.
- `repro` reports **0** mirrored assets referenced by no node for this page (or
  each remaining one is explained by a typed residual).
- Perceptual `diff` mean falls to a level where the ranked regions describe real
  defects rather than the absence of the page.
- No regression on `gigabytealchemy.ai` (text-led, currently mean 1.04).

## Provenance

Found importing joyfulculinarycreations into the sandbox during REQ-88 round 8.
Not caused by REQ-88 — the column fit declined this page outright, and the height
probe worked correctly (82/89 nodes carry a `yFactor`, y positions match the
reference exactly). Related: [[bug-fe8af80a]] (BUG-25, the shared-box overprint on
the same page).


Related: [[request-16253634]] (REQ-94 — gate calibration; this bug is the reason the value gates had nothing to compare against).


---

## Resolution

Both stated causes were investigated against the real bundle. Cause 2 (lazy
media) was **already fixed** by REQ-36's `settlePage` — with it, the mirrored
bundle yields all five `<img>` tags. The reproduction failure was cause 1, plus a
second blind spot of the same kind found while measuring.

### What was actually wrong

1. **Backdrops were only read off a top-level band root.** A *backdrop* is what a
   band paints behind its content — a `background-image` or a full-bleed
   `background-color`. Both were read only from `document.body`'s direct
   children. On a page-builder site the whole page is one wrapper and the panels
   are nested `<section>`s, so the hero photograph was absent from the manifest
   entirely, and every panel's fill had to be *inferred* downstream from the
   surfaces its runs sit on. That inference then chose the hero backdrop's black
   as the page base and reproduced the whole document in it.

2. **A top-level band was qualified on its OWN in-flow height ≥ 8px.** The
   `<header>` is `height: 0` (its children are absolutely positioned) while
   painting a full nav bar, so the entire subtree — logo and nav links — was
   dropped before extraction ran. This is BUG-15's failure mode when only *one*
   top-level child collapses, where that fix's all-collapse fallback never fires.
   This, not lazy loading, is why the logo was a fold-gap casualty.

The section count was a symptom of (2), not an independent cause. With the band
extent fixed the page yields 3 top-level bands; they still coalesce to one
*style-scope* section, which is correct per DOC-13 §2.7 and no longer matters —
the panels are now captured as real elements with real boxes.

### Changes

- `extract.ts` — a band's box is the **painted extent of its subtree**, not its
  own border box. `visible()` split into `styleVisible` (does the style chain
  paint) + `onScreenBox` (does this box land on the page), because a collapsed
  band fails the second on its own box while its children pass both. The extent
  is clamped to the document canvas so overflow-clipped children (carousel
  off-stage slides) cannot inflate it.
- `extract.ts` — a document-wide **backdrop index**: every visible element
  painting a `background-image: url(…)`, or an opaque full-bleed
  `background-color`. Projected onto the existing text-free `Field` shape, so it
  reuses the whole field → fold → `box` leaf → `localizeAssets` path.
- `types.ts` / `sections.ts` / `values-diff.ts` — carry `backgroundImageUrl` and
  the box's own `surfaceFill` through to `ValueElement`.
- `fold.ts` — a backdrop folds to a `box` leaf carrying
  `axes.backgroundImageUrl`, placed in the **background layer** (the manifest
  lists text-free elements after their band's runs, so document order would paint
  the hero image over the hero's headline). Backdrop edges also feed
  `sectionEdges`, giving REQ-88's band clamp the interior edges this page never
  had, and backdrops count towards the page-base inference.
- `values-diff.ts` — new `backgroundImage` delta axis (Type A, `media` kind),
  compared by **mirrored basename**: the reference carries the captured origin
  URL and our render the site-local `/assets/…` mirror, so a verbatim comparison
  would flag every correctly-reproduced image.

Deliberately **not** captured as backdrops, each a way the capture could start
reporting things that are not there: `data:` payloads (widget chrome, never a
mirrored asset); non-full-bleed coloured boxes (cards, already reconstructed from
run surfaces); and full-bleed **translucent** fills — those are scrims, which
`overlayOf` already records as the band's `overlay` and the fold layers above the
image they veil. Indexing a scrim again painted it twice and, since a fill's
alpha lives in the colour rather than in `opacity`, the second copy landed opaque
and blacked out the photograph beneath it. Full-bleed is tested as *touching both
document edges*, not as a fraction of width: a fraction is unstable across the
viewport ladder (a 720px card is 94% of the 768px rung) and captured content
cards as bands at the narrow rungs only.

### Measurements

Both sides regenerated **offline from the committed mirror** (loopback server →
full `cmdCapturePage`), so before/after are measured identically and the live
site is never re-hit. Numbers therefore differ from the ticket's live-capture
figures; the comparison is old-code vs new-code on the same bytes.

| | before | after |
|---|---|---|
| joyful — perceptual mean | 101.55 | **13.56** |
| joyful — % pixels over threshold | 78.2% | **16.8%** |
| joyful — unreferenced assets | 7 | **4** |
| joyful — runs / fields captured | 61 / 4 | **70 / 16** |
| gigabytealchemy — perceptual mean | 2.61 | **2.61** |

Acceptance:

- **Hero reproduces** — confirmed on the rendered crop, along with the logo, nav,
  headline, subhead and button that the collapsed-header bug had removed.
- **Unreferenced assets 7 → 4.** The three page images (hero, logo,
  market-vegetables) are all bound. The remaining four are icon fonts
  (`fa-solid-900`, `fa-regular-400`, `fa-brands-400`, `eicons`) — a *typed
  residual*: their glyphs are painted by `::before` pseudo-elements, which are not
  text nodes and so never become runs. That is a distinct capture gap
  (pseudo-element icon glyphs), not this one.
- **Ranked regions now describe real defects** — the hero's remaining delta, a
  `mix-blend-mode` veil on the quote band, a spurious card behind the quote, a
  missing rule under the headline. Not "the absence of the page".
- **No regression on gigabytealchemy** — its folded `l1.json` is **byte-identical**
  to the pre-fix fold (its hero backdrop is on a top-level band root, so it stays
  a section background; its scrim is translucent and correctly skipped).

### Tests

`tests/bug27-nested-backdrop-capture.test.ts` (13 UATs) with fixture
`tests/fixtures/capture/bug27-nested-backdrop.html`, which reproduces the page
shape exactly: a collapsed header, a nested image backdrop over a black fill at
`opacity .49`, a nested full-bleed panel, a narrower card, a full-bleed
translucent scrim, and a hidden off-screen block at `left:-33554430px`. Part A
drives the real `cmdCapturePage` in real headless Chromium; Part B drives the real
`foldToL1` / `diffManifests`. Full suite: 114 files / 799 tests pass.