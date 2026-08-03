---
uid: bundle-b486324c
id: BUNDLE-9
type: bundle
title: REQ-102 + BUG-27 + REQ-94 + REQ-97 + REQ-101 + 6 more
created_by: xgd
created_at: '2026-07-29T06:05:52.985110+00:00'
updated_at: '2026-08-03T00:05:10.179942+00:00'
completed_at: null
last_field_updated: commits
status: ready_to_reconcile
fields:
  commits:
  - working_sha: 2841b23a0d3e19952bfc372ea3590555c7148565
    reconcile_sha: null
    main_sha: null
  - working_sha: 5f4ee435d29dac064f2d00f8c5bab2bb3c4edcf0
    reconcile_sha: null
    main_sha: null
  - working_sha: 3a441b677eafd4e58f11d2a28e7194592e9fe257
    reconcile_sha: null
    main_sha: null
  - working_sha: 96ad91cd2f218ec1d62e97b7a073fd89634c10db
    reconcile_sha: null
    main_sha: null
  - working_sha: a1de7d8f94a220ebfe8282cc63b4a3c71f468344
    reconcile_sha: null
    main_sha: null
  - working_sha: 03419618763ef4e3fc30dbbe4fb437615e47f31d
    reconcile_sha: null
    main_sha: null
  - working_sha: d7a20c41490170ac1475b9ee559662c747e0265d
    reconcile_sha: null
    main_sha: null
  - working_sha: decf88a40e26af52968b7a0b3123f1abdcb37175
    reconcile_sha: null
    main_sha: null
  - working_sha: 62807c328c1bc7d12334213c728e6553d9fd34e3
    reconcile_sha: null
    main_sha: null
  - working_sha: f6f620689f9c489540bfa3fdf80f9daf7f480f62
    reconcile_sha: null
    main_sha: null
  - working_sha: ad11d769425bc0e444341d7cc70b39f31e99d47c
    reconcile_sha: null
    main_sha: null
  - working_sha: 742f1a48a6d5e7142cb79c6b7b5f057552099ea2
    reconcile_sha: null
    main_sha: null
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-102: 1c new scaffolds no L1 document: authored sites start from nothing

## The gap

`1c new <slug>` scaffolds a page with `{ "modules": [] }` and **no `l1` block**:

```jsonc
{ "id": "home", "slug": "home", "title": "Home",
  "seoMeta": { … }, "modules": [] }
```

So authoring a site begins by hand-writing the entire L1 document from nothing —
the `widths` ladder, `background`, `resources`, and the `root` container — before
a single pixel exists. Every authored site pays this, and every author must know
the ladder convention by heart or copy it from an unrelated site.

Confirmed while authoring xgd.dev ([[request-d41fd017]], REQ-95), which
anticipated this as a candidate gap in its Dependencies section.

## Proposed change

`1c new` scaffolds a **minimal valid L1 document** by default — not behind a
`--l1` flag. L1 is now *the* way to author a site; a flag would be exactly the
mode-detection that `CLAUDE.md` forbids ("Do NOT auto-detect which mode to use
between old and new implementations").

Minimum useful skeleton: the standard `widths` ladder, a `background`, and a
`root` stack container with `align: center` and one placeholder text leaf — i.e.
something that **renders** immediately, so `1c render` / `1c shot` work on a
fresh site with no editing.

## One check before implementing

Confirm `1c repro <slug> --ref <bundle>` **overwrites** rather than merges the
page document. Its help text says "idempotent — re-import rebuilds", which
suggests overwrite, but verify: a scaffolded skeleton must not be able to
contaminate a reproduction import.

## Acceptance

- `1c new <slug>` produces a page whose `l1` block validates against
  `l1DocumentSchema`.
- `1c render <slug>` and `1c shot <slug>` succeed immediately on a fresh site
  with no hand editing.
- `1c repro` over a freshly scaffolded slug yields the same result as over a
  slug that never had a skeleton.
- No flag, no mode detection, no legacy path.

-


---

## BUG-27: CSS background images and lazy-loaded media are not captured

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


---

## REQ-94: Gate calibration: a clean value gate must not outvote a failing perceptual diff

## Problem

A reproduction that is **80% wrong by pixel count** passed the 3-probe gate with
zero residuals and reported only 91 counted value defects, none dispositioned
worse than `REVIEW`. An operator had to look at a screenshot to discover that the
page had not reproduced at all.

Observed on `joyfulculinarycreations.com`:

```
l1-gate      PASS   sample-fidelity maxD 1.0px, 0 residuals, 0 unmatched
values-diff  91 counted defects, 6 causes, fix 6 / review 85 / accept 0
diff         mean 106.84 / 255, 80.3% pixels over threshold
```

Each gate is behaving exactly as designed. The failure is that **nothing compares
them to each other.**

## Why each gate is blind here, structurally

- **`l1-gate`** grades geometry and envelope only; it is *deliberately* blind to
  colour, font, image and list styling (a documented REQ-88 design decision — "a
  green gate on a visually incomplete page is the designed behaviour, not a false
  pass"). The geometry genuinely is fine.
- **`values-diff`** compares elements present in *both* manifests. When the
  reference manifest itself omits the page's imagery ([[bug-2936cebf]]), there is
  nothing to raise a delta against. The absence surfaces only indirectly, as
  `41 x surfaceFill` — and is dispositioned `REVIEW`.
- **`diff`** was the only gate that saw it, and it was unambiguous.

This inverts `gigabytealchemy.ai`, where the value gates were the sharp instrument
(14 -> 7 deduped defects drove every fix) and the perceptual mean sat at 1.04.
**The discriminating gate depends on whether a page is text-led or image-led**,
and nothing currently encodes that.

## Proposal

1. **Make the disagreement itself a finding.** A large perceptual mean alongside a
   clean `l1-gate` and a low `values-diff` is not an ambiguous signal — it is a
   near-certain indicator that the *reference manifest is impoverished* relative
   to the reference screenshot, i.e. the capture missed page substance. Report it
   as a distinct, named failure with that interpretation attached, rather than
   leaving an operator to notice two numbers in different terminal outputs.
2. **A perceptual floor gates the pipeline.** A mean over some threshold should
   fail regardless of what the value gates say. The current arrangement lets a
   blank page pass.
3. **Report reference coverage.** `elements-with-src` vs `assets-mirrored`, and
   `sections` vs page height, are cheap proxies for "did we actually capture this
   page". 4 images against 86 mirrored assets, and 2 sections across 4744px, were
   both visible in the existing output and both diagnostic — but neither is
   surfaced as a signal.

Point 3 is the cheapest and probably catches the most: it needs no new
measurement, only reporting of numbers the pipeline already computes.

## Acceptance

- The joyful pipeline run **fails** rather than passing, with a message naming
  the perceptual/value disagreement and pointing at reference coverage.
- `gigabytealchemy.ai` (mean 1.04, text-led) continues to pass unchanged.
- The failure text distinguishes "the reproduction is wrong" from "the capture
  is incomplete" — these need different fixes and currently look identical.

## Provenance

Found importing joyfulculinarycreations into the sandbox during REQ-88 round 8.
This is the third consecutive round in which a defect reached an operator through
a screenshot while the numeric gates read clean; the previous two were REQ-88's
cross-engine wrapping (Chromium-only gates) and the mixed-anchor hero split
(exact at every sampled width, wrong between them). The pattern — a gate sharing
an assumption with the thing it grades — is worth addressing as a class.

Related: [[bug-2936cebf]] (BUG-27, the missing imagery this run exposed),
[[bug-fe8af80a]] (BUG-25, the shared-box overprint on the same page).

-


---

## REQ-97: L1 text leaves cannot declare a measure: add sizing to l1TextSchema

## The gap

`l1TextSchema` was the only leaf that could not size itself. `box`, `image`,
`container` and `control` all carry `sizing: l1AxisSizingSchema`; `text` did
not.

The consequence: **a text leaf could not declare its own measure** — the max
line length that is the single most fundamental control in typography.

Found while authoring the xgd.dev hero ([[request-d41fd017]], REQ-95). The
subhead had to be wrapped in a container (`sub-measure`) whose only purpose was
to cap line length:

```jsonc
{ "kind": "container", "id": "sub-measure",
  "sizing": { "width": { "mode": "fluid", "maxPx": 620 } },
  "children": [ { "kind": "text", … } ] }
```

That cost a wrapper node per constrained paragraph and filled the tree with
nodes that carry no semantic meaning.

## Why the asymmetry existed (and why it was not a decision)

Capture folds text as absolutely-positioned with a geometry track, so the
transcription face never needed `sizing` on text. The authoring face does. An
artefact of which face was exercised first, not a deliberate constraint —
`l1ImageSchema`, an equally leaf-like node, has `sizing`.

## Why it mattered beyond ergonomics

[[request-3a064234]] (REQ-96) makes L1 the sole owner of appearance — modules
ship zero CSS. Under that contract, anything L1 cannot express must be painted
by a module, which is the exact outcome REQ-96 exists to prevent. A missing
sizing axis stops being an authoring annoyance and becomes a hole in the
contract.

## What changed

**1. Schema — `packages/site-schema/src/l1/schema.ts`**

`l1TextSchema` gains `sizing: l1AxisSizingSchema.optional()`, documented as the
run's own measure. Units stay **px** (`maxPx`), consistent with L1 being
px-faithful throughout; no `ch` was introduced. Types propagate automatically
(`types.ts` infers from the Zod schemas).

**2. Renderer — `packages/framework/src/l1/render.ts`**

The `text` case now calls the existing `axisSizingCss(node.sizing)` helper, so a
measured run emits `width` / `min-width` / `max-width` exactly as every other
kind does. A run with no `sizing` emits no sizing declarations — the field is
strictly opt-in.

**3. Analytic gate — `tools/generate/src/l1/probes.ts`**

New `constrainWidth(node, avail)` narrows the extent a node was offered by its
own `sizing.width` (`fixed` px, then `minPx`/`maxPx` clamps), applied in
`layout()` for **every** node kind — mirroring the CSS the renderer emits.

This was not optional. A text leaf's *height* is a function of its width, so a
run declaring a measure wraps to more lines than the frame alone predicts; a
model that ignored the measure would have reported phantom drift against the
browser. Making it generic (rather than text-only) also closes a pre-existing
mirror gap: a wrapper container's `max-width` was previously invisible to the
probe, so the wrapper and direct forms did not evaluate identically.

## Design decisions made during implementation

- **`height` is admitted, not forbidden.** The ticket left this open. Accepting
  the shared `l1AxisSizingSchema` rather than minting a width-only variant is
  simpler and keeps one shape across all five node kinds. `height` on a text run
  is rarely what an author wants (a text leaf's height is natural, from flow) so
  the schema doc-comment says so explicitly instead of the type forbidding it.
- **`constrainWidth` is generic, not text-only.** See above — a text-only clamp
  would have left the wrapper form and the direct form modelling differently,
  which is the opposite of the mirror invariant the probe depends on.
- **No validator change.** `validate.ts` does not bound `sizing` for any node
  kind today; text is consistent with the rest rather than a special case.

## Test plan

`tests/req97-text-measure.test.ts` — 5 UATs, all deterministic (no browser):

- `test_UAT_FC_REQ-97_text_node_accepts_sizing_width` — the schema admits the
  whole axis-sizing shape (`fixed`/`fluid`/`hug`, `px`/`minPx`/`maxPx`), stays
  `.strict()` (bad mode and extra keys rejected), and `validateL1` passes a
  measured document end to end.
- `test_UAT_FC_REQ-97_renderer_emits_width_min_and_max_for_a_measured_run` —
  the emitted base rule carries `width: 100%` / `min-width` / `max-width` for a
  fluid measure and `width: 480px` for a fixed one; a run with no `sizing` gains
  no width declarations at all.
- `test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container` — the xgd.dev
  hero subhead both ways: one fewer `<div>` in the markup, the measure on the
  run itself, and the analytic gate reporting identical leaf width and height
  for the two forms.
- `test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame` —
  at 1440 a 620px measure narrows the box and increases the wrapped height; at
  320 the cap is inert (max-width caps, it does not stretch).
- `test_UAT_FC_REQ-97_folded_reproductions_are_unaffected` — a pinned,
  geometry-tracked run (the shape every capture-folded reproduction on disk
  carries) emits only its keyframe width, and the probe sees that width
  unnarrowed.

Regression scope run green: the L1 family (`req82`, `req83`, `req92`, `req93`,
`req96`, `reconciliation-3probe-gate`, `site-schema`) and then the full suite —
**826 tests, 117 files, all passing**. Clean workspace `tsc` across
`site-schema`, `framework`, `tools/generate`, `public-site`, `control-app`.

## Acceptance — status

- ✅ A `text` node accepts `sizing.width` with `mode`/`px`/`minPx`/`maxPx` and
  the renderer emits the corresponding `width` / `min-width` / `max-width`.
- ✅ The xgd.dev hero subhead sets its own measure with no wrapper container.
  `storage/sites/xgd/draft/pages/home.json` was collapsed accordingly and
  re-rendered (`1c render xgd`): the `sub-measure` container is gone and
  `max-width: 620px` paints from the run. **That site is still untracked in
  git** — it belongs to REQ-95's session, so it was edited in the working tree
  but deliberately not committed under this ticket.
- ✅ Existing folded reproductions (gigabytealchemy, joyful) are unaffected —
  capture never populates the field, pinned by the fifth UAT and by the full
  suite staying green.


---

## REQ-101: No font-acquisition path or licence provenance: font registry + 1c fonts check

## The gap

There is **no font-acquisition path for an authored site**, and no record of
where any font came from or what its licence permits.

`l1FontFaceSchema` binds a family handle to a served `.woff2` under
`draft/assets/`. Every font currently in the repo arrived inside a **capture
bundle** — the reproduction path supplies fonts as a side effect. Authoring has
no library, no CLI verb to add a face, and no bundled default, so an authored
site silently falls back to a system stack.

Found while authoring xgd.dev ([[request-d41fd017]], REQ-95), where the page
read generic until Satoshi + JetBrains Mono were downloaded and wired by hand.
On a text-driven site, type is most of the impression.

## Operator direction (2026-07-25)

Development-time downloading of **free** fonts is approved. What is required is
**tracking**: what we have, where it came from, and what licence actions remain
outstanding.

## Why this is a compliance artifact, not documentation

These findings constrain the **1st Contact product**, not just this repo:

1. **1st Contact can never buy one commercial licence and serve it across
   customer sites.** Commercial webfont licences are per-licensee, typically
   per-domain or by pageview, and agencies / hosting providers are explicitly
   barred from sharing one licence across client sites. Adobe Fonts additionally
   forbids self-hosting *and* uploading to a website design platform.
2. **Three legitimate models**: free-only default (V1); customer brings their own
   licence and attests; platform/OEM licence negotiated per foundry (what
   Wix/Squarespace do — not V1).
3. **Serving a licensed font from a public CDN without access controls counts as
   redistribution beyond scope.** Self-hosted free fonts sidestep this and stay
   inside the DOC-24 / DOC-2 envelope as static assets rather than third-party
   runtime dependencies.

The distinction that matters operationally: *"may I use this on xgd.dev"* and
*"may I ship this to 10,000 customer sites"* are **different questions with
different answers**. The registry must force both to be answered at download
time, not discovered later.

## What changed

### 1. The registry — `fonts/registry.yaml`

A project-level provenance index over every font file in the repo. Project
level, not per-site, because a licence obligation attaches to the font, not to
the site that happens to reference it — and because this file is the seed of
1st Contact's eventual font menu.

Each entry records `family`, `foundry`, `source` URL, `downloaded` date,
`licence` (name, URL, `commercial_use`, `self_host`, `redistribute_in_product`),
outstanding `actions`, and the `files` list. YAML, so the licence reasoning can
live in comments beside the flags it explains.

Font **files** stay per-site under `draft/assets/` — a site must remain
self-contained and portable. The registry is the index over them, not their home.

**The load-bearing field is `licence.redistribute_in_product`**, a three-state
value rather than a boolean:

| value | meaning |
|---|---|
| `true` | settled — the licence permits product redistribution |
| `false` | settled — it does not |
| `REVIEW_REQUIRED` | asked, not yet answered |

Every gate treats `REVIEW_REQUIRED` as *no*, so an unresolved licence cannot
leak into product distribution by default. This is what forces the second
question to be answered at download time rather than discovered later.

Schema and validator live in `@1stcontact/site-schema`
(`packages/site-schema/src/fonts.ts`) — the canonical validator home.

### 2. A distribution marker on site config

`siteConfig.distribution: 'internal' | 'product'` (optional, defaults to
`internal`). `internal` is a site we build and serve ourselves, where a free
font with an unresolved product question is fine. `product` asserts the site
ships across customer domains, where a per-licensee licence cannot be shared.

### 3. Enforcement — `1c fonts check`

Without a gate the registry is documentation, and documentation drifts. The
check scans **both** site trees (`storage/sites/` and `storage/sandbox/` — the
sandbox is where capture-derived fonts land) plus the source trees on disk, and
raises four violations:

| kind | question it answers |
|---|---|
| `unregistered-family` | a page names a font we cannot account for at all |
| `unregistered-file` | family known, but not this particular file — a weight added by hand escapes the record |
| `unprovenanced-file` | bytes are in the tree that no entry records, even though nothing references them yet |
| `redistribution-not-permitted` | the site declares `distribution: product` and the licence does not permit that, or has not been resolved |

Outstanding `actions` **warn but do not fail** — that is exactly the state a
font legitimately sits in while cleared for this repo and not yet cleared for
the product. `redistribute_in_product` is the blocking gate.

A missing or malformed registry is a hard error, never a vacuous pass: silently
checking against nothing would report clean over completely un-provenanced fonts.

### 4. Backfill

All 23 font files on disk registered across 10 families, in two provenance
classes:

- **Authored** — Satoshi (400/500/700/900, ITF Free Font Licence) and JetBrains
  Mono (OFL 1.1), deliberately downloaded for xgd.dev.
- **Capture-derived** — Cinzel, Oswald, Lato, Raleway, Karla and others that
  arrived mirroring third-party sites. The bytes are a copy of someone else's
  serving infrastructure, usually a Google Fonts subset under a hashed filename.
  The underlying families are mostly OFL, but the *subsetting and delivery*
  provenance is unverified, so each carries an action to re-obtain from the
  canonical upstream release before product use. They are reproduction inputs,
  not product assets.

Seven families carry open actions today; the check reports them and passes.

## Design decisions made during iteration

**Provenance is demanded of the file, not of the reference to it.** The first
implementation joined only what a page referenced. That left the class this
ticket cares most about invisible: a capture bundle mirrors fonts into
`storage/references/`, and those bytes are in the repo whether or not any page
points at them — with exactly the redistribution status least likely to be
clear. Nothing failed when a new bundle brought unregistered faces in; their
registration was held only by a hardcoded filename list in a test, which is the
documentation-drift failure mode the registry exists to prevent. The source-tree
scan (`unprovenanced-file`) closes that, and turns "existing on-disk fonts are
backfilled" from a state asserted once into a live gate holding in both
directions.

**`storage/dist/` and `storage/node_modules/` are excluded from the scan.**
`dist/` is gitignored render output copied byte-for-byte from a draft; scanning
it would double every finding and make the check depend on whether anyone had
rendered recently. `node_modules/` is vendored.

**Registration is provenance, not approval.** A registered family with an open
action warns rather than fails, so the registry can honestly record a partially
resolved licence instead of forcing a premature `true`/`false`.

**Three-state `redistribute_in_product` rather than a boolean.** A boolean
cannot distinguish "we checked and the answer is no" from "nobody has asked
yet", and those need different follow-up.

## Test plan

`tests/req101-font-registry.test.ts` — 11 UATs, driven through the real CLI
entry point (`run(['fonts','check'])`) against real on-disk site trees in temp
workspaces, so file layout, YAML parse, site load and exit code are exercised
end-to-end:

- `registry_records_provenance_for_every_font_on_disk`
- `shipped_registry_accounts_for_every_font_file_in_the_repo` — both directions
- `check_passes_over_the_real_repo_trees`
- `unregistered_family_fails_the_check`
- `registered_family_with_unlisted_file_fails_the_check`
- `unreferenced_font_file_on_disk_fails_the_check` — including that `dist/` is
  not double-counted
- `product_distribution_gates_on_unresolved_redistribution`
- `outstanding_actions_warn_but_do_not_fail`
- `check_spans_both_site_trees_and_a_missing_registry_is_an_error`
- `site_config_accepts_the_distribution_marker`
- `asset_src_resolves_to_the_registry_file_key`

Regression scope: full suite 902 passing / 128 files; `tsc --noEmit` clean for
`tools/generate` and `packages/site-schema`; `1c fonts check` green on the real
repo (10 families, 13 references across 3 sites, 23 files on disk).

## Acceptance — status

- ✅ A registry file records family, source URL, download date, licence name +
  URL, commercial-use / self-host / redistribute-in-product flags, outstanding
  actions, and the file list.
- ✅ `1c fonts check` fails on an unregistered family referenced by any site.
- ✅ `1c fonts check` fails on a family whose `redistribute_in_product` is unmet
  when that site is marked as product-distributed.
- ✅ Existing on-disk fonts are backfilled, including capture-derived ones — and
  the backfill is now enforced, not merely done.

## Not done (deliberate)

No acquisition *verb* (`1c fonts add <url>`) was built. The ticket's gap
statement names one, but the operator direction and every acceptance criterion
are about **tracking**, not automation — and a download command is only useful
once the font menu it would draw from exists. Downloading by hand and
registering is a two-minute operation today; the gate is what was missing.


---

## REQ-106: L1 cannot express a link: typed link role + DOM id emission

## The gap

**L1 cannot express a link.** Verified:

- `grep href|anchor` over `packages/site-schema/src/l1/schema.ts` → nothing.
- The renderer's node switch handles `text`, `control`, `image`, `slot`, `box`,
  `container`. There is no anchor kind.
- `grep -c '<a '` over `packages/framework/src/l1/render.ts` → **0**.

So an L1 page has no navigation of any kind. On xgd.dev (REQ-95) that means
"Join the beta waitlist", "Read the whitepaper", all three nav items and the
footer are inert; the page's only interactive element is a capture form, which is
itself broken (BUG-28).

This is a functional floor, not an aesthetic ceiling. Unlike REQ-103 (texture) it
cannot be worked around, deferred, or compensated for with design.

It is an L1 gap by the CLAUDE.md test: navigation is presentation plus a URL, not
a behaviour with its own core. A behavior module for "being a link" would be
absurd, and `fold` maps captured node axes onto L1 nodes — a captured `<a>` has
nowhere to go today.

## Shape — a wrapper role, not a node kind

A link is not a *kind* of thing, it is a *role* any subtree can take: a text run,
a painted box containing a run, a whole card, an image. So it follows
`l1TransformSchema` / `l1InteractionSchema` and becomes a node-level field rather
than a seventh kind.

```ts
export const l1LinkSchema = z.object({
  href: z.string(),
  newTab: z.boolean().optional(),
  ariaLabel: z.string().optional(),
}).strict()
```

**The renderer retags rather than wraps.** Where the node already emits a single
element (`text` → `<p>`, `box`/`container` → `<div>`), that element becomes an
`<a>` and keeps its class verbatim. This matters: wrapping would put focus on an
outer element while `interaction.hover`/`focus` (REQ-99) target the inner class,
so a linked node would lose its focus ring — the one axis DOC-24 says taste may
not override. `image` is the exception: a void element cannot be an anchor, so it
wraps.

`control` is deliberately excluded — a submit button inside an anchor is a
malformed interactive nesting, and the module owns that element's semantics.

The renderer owns the safety attributes, as it owns every other sink:
- `href` clears the existing `isSafeUrl` allowlist — the same check that guards
  `image.src` and `backgroundImageUrl`, so `javascript:` is rejected with no new
  security surface. An unsafe href degrades to the un-linked element.
- `newTab` emits `target="_blank" rel="noopener noreferrer"`. There is no way to
  ask for `_blank` without the `rel`.
- `text-decoration: none` and `color: inherit` are pushed BEFORE the node's axes,
  so a link paints from L1 rather than from UA chrome, and an authored
  `textDecoration` still wins.

## In-page anchors need real DOM ids

`href: "#how"` requires the target to have that id. Most L1 nodes already carry an
optional `id`, but the renderer never emits it. It must — and because duplicate
DOM ids break both anchors and the `for`↔`id` association the `control` contract
depends on, the L1 envelope validator must reject a document with two nodes
sharing an id. REQ-95's own page has such a pair (the `visibility`-paired hero CTA
duplicates, the REQ-104 workaround), which is exactly how the rule earns its keep.

## Acceptance criteria

1. A `text`, `box` or `container` node with `link.href` renders as an `<a>`
   carrying that href, with its class and every paint axis unchanged.
2. An `image` with `link.href` renders wrapped in an `<a>`.
3. `newTab: true` emits `target="_blank"` **and** `rel="noopener noreferrer"`.
4. A `javascript:` (or otherwise unsafe) href renders the element with no anchor
   and no href — never a live unsafe link.
5. `interaction.focus.ring` still applies to a linked node (the focus indicator
   survives the retag).
6. A node's `id` is emitted as a DOM id, and `#anchor` navigation works.
7. The envelope validator rejects a document with duplicate node ids.
8. `control` nodes reject `link` at validation.
9. Every existing L1 page renders unchanged when no node declares `link`.
10. xgd.dev's nav, both hero CTAs and the footer navigate.


---

## BUG-28: contact-form: a mailto:/tel: action validates but client.js kills the submit, blocking the no-JS baseline

## The defect

`contact-form` accepts a `mailto:` / `tel:` action at validation and then makes
it unusable at runtime, with no error anyone can see.

`assertSafeUrl` explicitly permits those schemes:

```ts
// packages/framework/src/modules/safety.ts:25
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])
```

So `config.action: "mailto:hello@xgd.dev"` validates, renders a correct
`<form method="post" action="mailto:…">`, and would work exactly as intended
with JavaScript disabled.

But `client.js` intercepts **unconditionally**:

```js
// packages/framework/src/modules/contact-form/client.js
async function handleSubmit(form, event) {
  event.preventDefault()                       // ← always
  ...
  const action = form.getAttribute('action') || ''
  try {
    response = await fetch(action, { method: 'POST', ... })   // ← throws on mailto:
  } catch (_e) {
    showError(form, 'Could not reach the server. Please try again.')
    return
  }
```

`fetch("mailto:…")` rejects. The visitor gets **"Could not reach the server.
Please try again."** and the submit is already cancelled, so the native
`method="post"` navigation — the vetted no-JS baseline the module's own docblock
names as its degradation path — is never reached.

## Why it matters

The module's two halves disagree about what an `action` is. The safety layer
says a `mailto:` action is a legitimate endpoint; the client says every action is
a JSON API. Between them, the form is **silently dead in every JS-enabled
browser** while looking perfectly healthy in the rendered HTML.

This is not a corner case: it is the default state of any authored site that does
not yet have a backend. REQ-95 hit it on the first authored form on xgd.dev —
the only way to stub a capture endpoint is a `mailto:`, and that is exactly the
input that breaks.

It also violates the module's declared `isolation` obligation
(`meta.ts` → `conformance.obligations`), which promises that "a failure degrades
to the no-JS post baseline". Here the enhancement *prevents* the baseline.

## Behaviour required

`client.js` must enhance only the submissions it can actually enhance:

- Action is **http(s) or relative** (including empty, which posts to self) →
  intercept and `fetch` as today.
- Action carries **any other permitted scheme** (`mailto:`, `tel:`) → do not
  call `preventDefault()`; let the user agent perform the native submit.

The scheme already carries all the information needed, so no new `config` field
should be added for this — an `enhance: false` dial would be an aesthetic-style
escape hatch for something the data already determines, and DOC-25 §2 rules that
out.

Detection must be defensive in keeping with the rest of the file: an
unparseable action falls back to the native submit rather than throwing.

## Acceptance criteria

1. With `action: "mailto:…"`, a JS-enabled submit performs the native form post
   and shows no error banner.
2. With `action: "https://…"`, behaviour is unchanged: intercepted, JSON
   `fetch`, inline success swap, inline error on non-2xx.
3. With `action: ""` (post to self), behaviour is unchanged (intercepted).
4. With `action: "tel:…"`, native submit, as (1).
5. An action that cannot be parsed falls back to the native submit and does not
   throw.

## Evidence

Observed on xgd.dev's beta-capture form (REQ-95), rendered output:

```html
<form action="mailto:hello@xgd.dev" method="post" data-contact-form>
  <input id="cf-email" name="email" type="email" required placeholder="Email address">
```

Correct HTML; unusable in the browser.


---

## REQ-107: Authored L1 bypasses the envelope validator: validateL1 never runs outside the reproduction path

## The gap

**An authored L1 document never passes the envelope validator.**

`grep -rn validateL1` over the source tree returns exactly two call sites:

- `tools/generate/src/l1/fold.ts:2148`

- `tools/generate/src/l1/probes.ts:902`

Both are on the **reproduction** path (capture → fold → probe). Nothing on the authoring or render path calls it.

So for a hand-authored page, `pageSchema`'s `l1: l1DocumentSchema.optional()` runs — that is the **shape** check (zod, `.strict()`, closed enums) — while `validateL1` — the **envelope** — does not:

check

authored page

reproduced document

shape / unknown keys / enums

✅ `l1DocumentSchema`

✅

numeric range bounds (`L1_ENVELOPE`)

❌

✅

URL scheme allowlist (`src`, `backgroundImageUrl`, `link.href`, font `src`)

❌

✅

node-count cap

❌

✅

dangling `geometry.anchor` without a `column`

❌

✅

duplicate node ids (REQ-106)

❌

✅

## Why it matters

This is backwards. The reproduction path derives its values mechanically from a capture; the **authoring** path is the one with a human or an AI free-typing numbers and URLs into a JSON file, and it is the path with no envelope.

Observed on REQ-95: every document authored for xgd.dev over seven passes bypassed the envelope entirely. When REQ-106 added the duplicate-id rule, an authored page with two `id="signup"` nodes **rendered without complaint** — the rule existed and simply never fired. It was caught by reading the emitted HTML, which is not a control.

It is not a security hole. The renderer independently re-checks `isSafeUrl` at every URL sink and degrades rather than emitting an unsafe value, which is why REQ-106's unsafe-href UAT asserts on the renderer _and_ the validator. But defence-in-depth is the argument for keeping the renderer check, not for skipping the validator: an out-of-range numeric axis, a node-count blowout, or a duplicate id has no second line of defence at all.

It also means the envelope's error messages — which exist to tell an AI author exactly what to fix, per DOC-8 §6 — are never shown to the one caller written to consume them.

## Behaviour required

`validateL1` runs on `page.l1` wherever a site definition is validated, with its errors path-prefixed into the page's error list so a failure points at `/pages/<i>/l1/root/children/…` rather than at a detached `/root/…`.

## Risk — this is expected to surface existing failures

Turning an unenforced check on will fail documents that have been out of envelope all along. **That triage is the work**, not the one-line call:

- authored sites under `storage/sites/**`

- test fixtures carrying hand-written `l1` blocks

- any reproduced document whose fold-time envelope has since drifted

Each failure is either a real defect (fix the document) or an over-tight envelope bound (fix the bound, with the reason recorded). Neither should be resolved by weakening the check to make the suite pass.

## Acceptance criteria

1. A site definition whose `page.l1` violates the envelope fails validation, with errors path-prefixed to the page.

2. An out-of-range numeric axis, an unsafe `image.src`, an over-cap node count and a duplicate node id are each rejected at authoring time.

3. The renderer keeps its independent `isSafeUrl` degradation — this ticket adds a line of defence, it does not replace one.

4. Every existing `storage/sites/**` document either passes, or has been fixed and the fix recorded.

5. Any envelope bound relaxed to accommodate a legitimate authored document is changed deliberately, with the reason in the code comment — never widened just to turn a suite green.

-


---

## REQ-104: L1 rows cannot wrap or reflow: responsive layout track (no workaround exists for control nodes)

## The gap

A `row` container cannot wrap, and `layout` is not responsive.

```ts
// packages/site-schema/src/l1/schema.ts
layout: z.enum(['stack', 'row', 'grid']),
```

One value, all widths. There is no `wrap` axis and no per-width `layout` track,
so a horizontal run of peers has no way to become a vertical one on a narrow
screen — which is the single most common responsive behaviour on the web.

## The workaround, and where it runs out

The only expressible answer is to **author the subtree twice** under paired
`visibility.fromPx` / `visibility.untilPx`. REQ-95 used it three times on
xgd.dev: `cta-row`/`cta-stack` in the hero, `problem-items-row`/`-stack`, and
`how-steps-row`/`-stack`.

It is expensive but survivable for inert content. It costs duplicated tree
structure (every copy edited in lockstep, or they silently diverge), it doubles
the node count against the 2000 cap, and it puts both copies in the DOM so
`staggerMs` counts children the reader never sees — the exact hazard REQ-100's
`reveal.delayMs` docblock was written to describe.

**With `control` nodes the workaround does not exist at all.**

Since REQ-96, a leaf control is an L1 node that the module fills in with an
attribute bundle — `name`, `id`, `type`, `required`, the `for`↔`id` wiring.
Duplicating a `control` duplicates a *form field*: two `<input>`s with the same
`name` and the same `id`. That is not a responsive form, it is a malformed one —
duplicate IDs break the a11y label association the module exists to guarantee,
and the duplicate `name` corrupts the submitted payload regardless of which copy
is visually hidden (`visibility` is CSS, not `disabled`).

So a row of controls that must reflow to a column at mobile — a first/last name
pair, an email-plus-button signup, a postcode-and-country row — has **no
representation in L1 at any cost**. REQ-95's beta-capture form is authored as a
single column at every width for this reason alone, not by design choice.

This is the case REQ-96 makes common: it moved every control's presentation into
L1, and L1 has no way to lay controls out responsively.

## Proposed shape

**(a) `wrap: boolean` on `container`** (when `layout: 'row'`). Compiles to
`flex-wrap: wrap`. Smallest possible change; combined with `sizing.width.minPx`
on the children it produces the standard "cards reflow when they no longer fit"
behaviour with no duplication and no breakpoint authoring. Handles the card-row
cases directly.

**(b) A responsive `layout` track** — `responsiveLayout: { keyframes: [{ at, value }] }`,
matching the shape `responsivePadding` (REQ-88) and `responsive` scalars already
use. Strictly more expressive than (a): it covers row→stack, and it is the only
one of the two that solves the `control` case, since a control row that becomes a
control column is one subtree throughout.

Recommend **(b)**, with (a) as a cheap complement if it falls out. (b) is the one
that closes the hole; (a) alone leaves the form case unsolved, because wrapping a
row of one input and one button is not the same as stacking them.

## Acceptance criteria

1. A `row` container can be authored to lay out as a `stack` below a stated
   width, as ONE subtree.
2. A row of `control` nodes reflows to a column at mobile with exactly one
   `<input>` per field in the DOM, one `id` per control, and an intact
   `for`↔`id` association at every width.
3. `staggerMs` on such a container indexes only the children that exist once —
   no phantom peers.
4. xgd.dev's three duplicated row/stack pairs collapse to single subtrees, and
   the page re-passes REQ-95's AC3 (clean at 375/768/1280) and AC4 (content
   robustness) with node count materially reduced.
5. Every existing L1 page renders unchanged when it declares no responsive
   layout.

## Evidence

REQ-95 passes 1 and 2. Three duplicated subtrees in
`storage/sites/xgd/draft/pages/home.json`; one form authored single-column
because no other option exists.

-


---

## REQ-105: L1 slot cannot be sized: hoist sizing to a shared shape the way REQ-98 hoisted paint

## The gap

`l1SlotSchema` is the one box-rendering node kind with no `sizing`.

REQ-98 made the *paint* group uniform — `l1SurfaceAxesSchema` is spread into
`box`, `container`, `text`, `image`, `slot` and `control` alike, so a slot can be
filled, bordered, rounded and shadowed. But `sizing` was left declared per-kind,
and `slot` never got it:

| kind | `axes` (REQ-98) | `sizing` |
|---|---|---|
| `box` | ✅ | ✅ |
| `container` | ✅ | ✅ |
| `text` | ✅ | ✅ (REQ-97) |
| `image` | ✅ | ✅ |
| `control` | ✅ | ✅ |
| **`slot`** | ✅ | **✗** |

So a mounted behavior module cannot be given a measure or a maximum width. The
seam can be painted but not sized.

## Why it matters

This is the same asymmetry REQ-98 was written to remove, surviving in the one
axis group REQ-98 did not cover — and REQ-97 had already removed exactly this
wrapper tax from `text` one kind earlier. The pattern is now clear enough to
generalise rather than patch a third time.

The workaround is a container that exists only to size the slot: a node with no
content, no paint and no semantic role, present purely because the slot cannot
carry a number. REQ-95 pays it on xgd.dev's beta-capture form. It is cheap in
isolation and corrosive in aggregate — it is the "two nodes for one element"
shape REQ-98 names as the hole in the REQ-96 contract.

## Proposed shape

Hoist `sizing` the way REQ-98 hoisted the surface group: declare it once and
spread it into every kind that renders a box, `slot` included. That is a strictly
additive change — every kind that already carries `sizing` keeps the identical
`l1AxisSizingSchema` shape, and `slot` gains it.

The renderer needs no new logic: a slot already renders as a `div` with an L1
class, so the existing sizing emitter applies unchanged.

Worth checking the same way for the remaining node-level groups (`geometry`,
`visibility`, `transform`, `mask`, `padding`, `responsivePadding`, `interaction`,
`reveal`) — those already appear uniform, but they are declared by hand per kind
and so can drift again the next time a kind is added. A single shared shape ends
the class of bug rather than this instance of it.

## Acceptance criteria

1. A `slot` node accepts `sizing` with the same `l1AxisSizingSchema` shape as
   every other kind, and the renderer honours it.
2. xgd.dev's sizing-only wrapper container around the `signup-form` slot is
   removed, and the form renders identically.
3. Node-level axis groups are declared once and spread, not re-declared per kind,
   so a new kind inherits them.
4. Every existing L1 page renders unchanged.

## Evidence

REQ-95 pass 2 — `storage/sites/xgd/draft/pages/home.json`, the `signup` block.

-


---

## REQ-103: L1 cannot express texture: typed pattern axis (dot-grid, hairline grid, lines) and radial gradients

## The gap

**L1 could not express texture.** Every surface it could paint was a flat colour
or a single linear gradient, and there was no way to make a surface repeat,
radiate, or carry grain.

Two independent walls:

**1. Gradients were linear-only.**

```ts
// packages/site-schema/src/l1/schema.ts
export const l1GradientSchema = z.object({
  angleDeg: finite.optional(),
  stops: z.array(l1GradientStopSchema).min(2),
}).strict()
```

No radial, no conic, no `repeating-` form. A soft glow behind a headline — a
radial falloff, the single most common device in dark-theme marketing design —
had no representation at all.

**2. A background image could not tile.** The renderer pinned the sizing triple:

```ts
// packages/framework/src/l1/render.ts:284
if (hasBgImageUrl) {
  out.push('background-size: cover', 'background-position: center', 'background-repeat: no-repeat')
}
```

That is the right default for a hero backdrop (BUG-13, which set it), but it was
the *only* behaviour. A 24×24 dot-grid asset could not repeat across a section.

## Why it mattered

Dot-grids, hairline grids, radial glows and film grain are what separates a
premium page from a flat one. With both routes closed, an L1 page was flat colour
on flat colour everywhere, and the only remaining lever was contrast between
adjacent bands.

This bit REQ-95 directly. **XGD's own logo motif is a warped wireframe grid** —
the brand's defining graphic could not be drawn by the substrate that renders the
brand's site, so xgd.dev carried it as full-bleed SVG assets stretched by `cover`,
with stroke weights hand-tuned inside the asset files.

It is also a capability-gap of exactly the kind CLAUDE.md says belongs in L1: this
is presentation, it is not behavioural, and the fix is a typed axis, not a module.
There was **no workaround inside the substrate** — only a single full-bleed raster
which (a) distorts at every viewport it was not authored for, (b) costs a binary
asset per section, and (c) pushes design decisions out of L1 and back into
hand-authored files, precisely what the substrate exists to prevent (DOC-23,
DOC-24).

## What changed

Proposal (b) — the typed `pattern` axis — plus proposal (a), the radial gradient
branch named in the title. Proposal (c) (`backgroundRepeat`/`backgroundSizePx`)
was **not** taken: it re-opens BUG-13's default and still needs a real asset per
texture, so it is worse than (b) on both counts.

**1. `pattern` on the shared surface axis group** (`l1PatternSchema`, spread into
every box-rendering kind via REQ-98's `surfaceAxesShape`):

```ts
pattern: {
  shape: 'dots' | 'grid' | 'lines',
  spacingPx: number,          // the tile period
  thicknessPx?: number,       // line width; dot DIAMETER for `dots` (default 1 / 2)
  color: L1Color,             // hex only, incl. #rrggbbaa
  angleDeg?: number,          // tilts `lines`; inert elsewhere, as l1Mask.featherPx is
}
```

The renderer compiles it to repeating gradients — `dots` to one tiled
`radial-gradient`, `grid` to two tiled `linear-gradient` layers (a CSS gradient
runs along one axis, so a grid is one rule set per axis), `lines` to a single
`repeating-linear-gradient` which carries its own period and so tilts without the
tile shearing. No asset, no raw CSS: every token is re-derived from a number, a
hex colour or a closed enum.

**2. `l1GradientSchema` becomes `linear | radial`.** `l1LinearGradientSchema`
keeps `angleDeg` and takes `kind: 'linear'` as *optional*;
`l1RadialGradientSchema` requires `kind: 'radial'` and carries a typed `origin`
(the nine CSS box positions, never an `at 30% 40%` string) and `extent`. The
branch axes do not mix — a radial with an `angleDeg` is rejected by the schema
rather than silently ignored by the renderer. Linear-by-default is not a
compatibility shim: linear is what a capture folds to, and a discriminator every
folded gradient would have to restate is noise on the common case. `foldGradient`
is typed to the linear branch accordingly.

**3. The background sizing triple became positional.** `background-size` /
`-position` / `-repeat` are emitted as one value per layer, in layer order, when a
pattern is present — so a tiled texture and a `cover` backdrop coexist on one box.
With no pattern the renderer emits exactly the single value BUG-13 set, so no
existing surface changed by a byte.

**Layer order, top-most first: scrim → texture → gradient wash → image → fill.**
A dot-grid over a radial glow over a dark fill — the ordinary stack — is what the
axes say.

**4. Envelope.** `spacingPx` is bounded `[1, 1000]` and `thicknessPx` `[0, 1000]`,
checked inside the shared `checkSurface` so an interaction-state pattern delta is
bounded by the same rule as the base node. The spacing floor is a robustness rule,
not taste: a sub-pixel period tiles a full-bleed band millions of times and is a
way to hang a compositor. A rule wider than its own period saturates at the
spacing rather than bleeding into the next tile.

**5. xgd.dev.** The two untextured cream bands (`problem`, `close`) now carry the
grid motif from the axis — a 48px hairline grid in the brand brown at 10% alpha —
instead of nothing. The `papers` band stays clean so the pull-quote keeps its air.

## Residual: the warped grid is still an asset

`xgd-grid-hero.svg` and the two echo grids stay as assets, and the ticket's
framing ("the brand's defining graphic cannot be drawn by the substrate") is only
partly answered. Those grids are a **perspective projection** — a grid warped
toward a vanishing point, with a fade mask. A repeating gradient tiles a constant
cell by construction and cannot express a projection, so this axis reaches the
motif at rest but not the motif in perspective. Whether that warrants a further
L1 primitive (a projected/warped variant) is a separate design question, not a
gap in this axis. Grain/noise remains out of scope for the reason originally
given: it needs a generated asset, not an axis.

## Acceptance criteria

1. ✅ A `container` paints a dot-grid at a chosen spacing and colour with no image
   asset and no raw CSS.
2. ✅ A `container` paints a hairline grid, ditto (plus `lines`).
3. ✅ The pattern composes with `surfaceFill`, `surfaceGradient`, `overlay` and a
   `backgroundImageUrl` in the defined order above.
4. ✅ Every existing L1 page renders unchanged when it declares no pattern — the
   single-valued BUG-13 triple is preserved, asserted over every shipped page.
5. ✅ The envelope bounds `spacingPx` / `thicknessPx` and `color` goes through
   `l1Color`.
6. ◑ xgd.dev uses it to carry the grid motif on its previously-flat bands, and the
   page was re-shot and judged. The full Tier-1 re-judge is REQ-95's, and the
   warped-perspective grids remain assets (see Residual).

## Test plan

`tests/req103-l1-texture.test.ts` — 6 UATs through the real entry points
(`renderL1Document`, `validateL1`, the exported schemas):

- `test_UAT_FC_REQ-103_container_paints_a_dot_grid_with_no_asset`
- `test_UAT_FC_REQ-103_container_paints_a_hairline_grid_and_rules`
- `test_UAT_FC_REQ-103_texture_composes_with_fill_gradient_scrim_and_backdrop`
- `test_UAT_FC_REQ-103_a_radial_gradient_paints_a_glow`
- `test_UAT_FC_REQ-103_envelope_bounds_the_texture_numbers_and_its_colour`
- `test_UAT_FC_REQ-103_untextured_documents_render_unchanged`

Regression scope: full suite — 128 files / 900 tests, all passing. Clean
`pnpm -r build` + workspace typecheck (no new errors in the touched files).

## Evidence

REQ-95 pass 2, on `storage/sites/xgd/draft/pages/home.json` — 169 L1 nodes,
7 sections, zero textured surfaces available anywhere in the vocabulary.