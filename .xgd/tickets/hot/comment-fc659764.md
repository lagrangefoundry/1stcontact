---
uid: comment-fc659764
id: COMMENT-523
type: comment
title: Comment on bug BUG-27
created_by: xgd
created_at: '2026-07-25T22:35:11.373028+00:00'
updated_at: '2026-07-25T23:23:34.985220+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2936cebf
  kind: chat_transcript
---

<!-- xgd-turn id="b2b4be6a-4396-4ab2-b5ef-b162bde56d26-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T22:35:08.977362+00:00" -->
#### You
Please free code a solution to this

<!-- xgd-turn id="b2b4be6a-4396-4ab2-b5ef-b162bde56d26-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:01:56.418129+00:00" -->
#### Claude
I'll start by reading the ticket and orienting in the capture code.

Cause 2 (lazy settle) already has a mechanism from REQ-36. Let me examine the element extractor.

Let me measure the real page before designing. I'll write a throwaway probe using the same Vite loader the CLI uses.

Confirmed both causes. Let me check the asset-localisation and fold-gap paths.

Now I'll implement. Starting with the capture extractor.

Now the two capture-side additions — the painted-subtree band extent and the background-image box index:

Now the band scan:

Now the `RawField` type and the downstream projection:

Now `values-diff.ts` — carry the handle onto `ValueElement` and make a missing background image a counted defect:

Now add the compared axis in the text-free field pairing:

Now the `assetBasename` helper:

Now the paint-order placement — background-image boxes belong in the background layer, not interleaved with content:

Now update the residual/axes reporting so an unfolded background image is described honestly:

Now let me typecheck and re-run the probe against the real bundle.

Typecheck is clean. Now let me re-extract the real bundle and see what the capture produces.

The band extent has a runaway box. Let me find the offending element before deciding how to bound it.

The runaway is an off-screen SEO-spam block — my extent walk lost the visibility gate on the band root itself. Let me separate the two concerns `visible()` conflates:

The extent now picks up overflow-clipped carousel slides. The honest bound is the document's own painted canvas:

Gigabytealchemy is unchanged (8 sections, identical boxes, zero new fields). Now let me regenerate the full ladder + fold offline and run the real gates.

Now the same regeneration with the pre-fix code, so the before/after is measured identically:

Only 101.6 → 97.3. Let me look at the actual render rather than trust the number.

The hero now reproduces. Let me check the rest of the page — region 1 spans y=0..3600 with meanDiff 121.

The remaining error is one thing: our page base fill is black. Let me compare the folded documents.

The remaining hero-brightness error is that our backdrop box carries the image but not its own black fill. Let me check the colour helper, then capture it.

Now let the newly-captured backdrop geometry bound the solid bands — the black hero fill currently tiles 3200px because there were no interior section edges:

The page base fill is the last dominant error — the fold infers it from run surfaces because the captured body background never reaches the manifest. Same family of gap; let me close it.

Now let the fold prefer the captured page base over its inference:

Ours is white-on-white there — the reference has a large grey band we place wrongly. Let me check what the capture actually recorded.

Let me check what actually paints that grey in the reference page.

<!-- xgd-turn id="7f906cc1-8d4f-4b65-8590-24af3eabf1d5-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:02:18.089667+00:00" -->
#### You
Sorry please continue

<!-- xgd-turn id="7f906cc1-8d4f-4b65-8590-24af3eabf1d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:23:34.953223+00:00" -->
#### Claude
Confirmed — the grey band is a nested `<section>`'s own background **colour**, invisible to the same top-level-only scan. Let me complete the fix symmetrically:

Huge move: mean 101.6 → **10.67**, and the ranked regions are now local defects. Let me look, then check gigabytealchemy for regression.

Now the acceptance check that matters most — gigabytealchemy must not regress. Let me run it both ways.

That's a regression on gigabytealchemy — 2.61 → 11.37. Let me find what the one new field did.

Two separate causes. Let me fix the full-bleed test first — it should mean "touches both document edges", not a width fraction (720px is 94% of the 768px rung).

Let me isolate: is the residual gigabyte delta entirely the page-base choice? I'll re-fold without a full re-capture.

Found it: I captured the hero scrim as an **opaque** fill (alpha dropped), double-painting over the hero image. Scrims already have a dedicated axis — let me exclude them.

Backticks in the comment again — inside the extract template literal:

The captured canvas is the wrong primary — the inferred dominant band is better because it covers band gaps. Let me use the newly-captured backdrops to *improve* that inference instead, and keep the canvas as a last resort.

Close but not identical. Let me find the residual 0.31 on gigabyte.

That difference is my refold probe dropping the font resources — an artefact of the probe, not the fix. Let me rebuild gigabyte through the real pipeline.

Gigabyte's folded L1 is now byte-identical to the baseline — 2.61, no regression. Now the final joyful measurement.

Joyful: **101.55 → 13.56**, gigabyte unchanged. Let me look at the two worst remaining regions to confirm they're real, local defects.

Both reproduce the backdrop; the residuals are a blend-mode veil and a spurious card — real, local defects. Now let me check the existing test suite.

All 786 tests pass. Now the UATs — let me check the fixture idiom first.

Now let me write the fixture and the UATs.

12 of 13 pass. Let me find why the fixture's header links aren't captured when joyful's were.

The capture is right — the nav links land in `items` (a detected repeated group), not `content`. My assertion was too narrow; let me check what actually reaches the manifest.

All 13 pass. Let me clean up the throwaway artefacts and check what's staged.

Done. BUG-27 is fixed, tested, and free-coded.

## What was actually wrong

Cause 2 in the ticket (lazy media) was **already fixed** — REQ-36's `settlePage` reveals all five `<img>` tags. The failure was cause 1, plus a second blind spot of the same kind I found while measuring:

1. **Backdrops were only read off a top-level band root.** A backdrop — what a band paints behind its content, image *or* full-bleed colour — was read only from `document.body`'s direct children. On a page-builder site the page is one wrapper and the panels are nested `<section>`s, so the hero photograph was absent from the manifest entirely, and every panel's fill had to be *inferred* from the surfaces its runs sit on. That inference then picked the hero backdrop's black as the page base and reproduced the whole document in it.

2. **A band was qualified on its own in-flow height ≥ 8px.** The `<header>` is `height: 0` (children absolutely positioned) while painting a full nav bar, so the entire subtree — logo and nav links — was dropped before extraction. This is BUG-15's failure mode when only *one* top-level child collapses, where that fix's all-collapse fallback never fires. This, not lazy loading, is why the logo was a fold-gap casualty.

The section count was a symptom of (2), not an independent cause.

## Measured

Both sides regenerated offline from the committed mirror, so before/after use identical bytes (numbers differ from the ticket's live-capture figures for that reason):

| | before | after |
|---|---|---|
| joyful — perceptual mean | 101.55 | **13.56** |
| joyful — % over threshold | 78.2% | **16.8%** |
| joyful — unreferenced assets | 7 | **4** |
| gigabytealchemy — mean | 2.61 | **2.61** |

Gigabyte's folded `l1.json` is byte-identical to the pre-fix fold. Full suite: 114 files / 799 tests pass.

## Two things to flag

- **The 4 remaining unreferenced assets are icon fonts** (`fa-*`, `eicons`). Their glyphs are painted by `::before` pseudo-elements, which aren't text nodes and so never become runs. That's a genuinely distinct capture gap, not this one — I left it as an honest typed residual rather than papering over it.
- **I went beyond the filed scope in one place.** Clamping the hero's black band to its real extent exposed that the reference's *nested* panel colours were never captured either — leaving white-on-white text. Capturing full-bleed colour backdrops was needed to make the fix coherent; without it the perceptual mean stalls at ~97 and the page is unreadable. Two of my intermediate attempts regressed gigabyte (2.61 → 11.37) before I found the right tests: full-bleed must mean *touching both document edges* (a fraction of width is unstable across the ladder), and translucent full-bleed fills must be skipped as scrims (their alpha lives in the colour, so the second copy landed opaque and blacked out the hero).

<!-- xgd-chat-end -->