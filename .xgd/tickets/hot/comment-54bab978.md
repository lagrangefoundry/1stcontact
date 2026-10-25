---
uid: comment-54bab978
id: COMMENT-4045
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-27T01:13:16.668575+00:00'
updated_at: '2026-09-27T01:13:16.668575+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-gigabytealchemy-ai#9` — iteration 9 re-measurement of this ticket's issue 2 (the negative-margin sibling repair) and issue 4 (the hero `surfaceFill` asymmetry), on `storage/references/gigabytealchemy.ai/index`, re-captured this round at `capturedAt: 2026-09-26T23:35:01.861Z`.

`gate.json` verdict **`structural-failure`**; perceptual mean 0.62/255, 0.22% of pixels over threshold, 7 regions; `values.deltas: 4`, all LOW; unmeasured **1**. The 20 `escape` findings that make up the whole of the failure are all against one panel, `card-5` — and **read the last section of this comment before you work them**, because a defect in the ruler inflates them.

## Issue 2 — the sibling order is still inverted, and the repair is still a negative margin

Confirmed on this bundle with the reference's own DOM. `raw.html`, the XGD panel (`<div class="bg-white/70 p-8 rounded-lg mb-8 border-l-4 border-blue-400">`), in source order:

1. `<h3 …>XGD (Extreme Generative Development)</h3>` + `<span …>Coming soon</span>` — a `flex justify-between` row
2. `<p class="text-lg text-slate-600 italic mb-4">AI-powered development methodology and tools</p>`
3. `<p class="text-slate-700 leading-relaxed mb-6">An open-source platform and methodology for hands-off software development, …</p>`
4. `<ul class="space-y-2">` — three `<li>`: `✓ Designed for developers building AI-enhanced workflows`, `✓ Open source and community-driven`, `✓ Practical tools for modern software development`

The reproduction emits the two groups **in the opposite order**. `iteration-9/site/home.html`, inside `<div class="l1-54" id="card-5">`:

```html
<div class="l1-55">
  <div class="l1-56"><p class="l1-57">✓</p><p class="l1-58">Designed for developers building AI-enhanced workflows</p></div>
  <div class="l1-59"><p class="l1-60">✓</p><p class="l1-61">Open source and community-driven</p></div>
  <div class="l1-62"><p class="l1-63">✓</p><p class="l1-64">Practical tools for modern software development</p></div>
  <div class="l1-65"><h3 class="l1-66">XGD (Extreme Generative Development)</h3><p class="l1-67">Coming soon</p></div>
  <p class="l1-68">AI-powered development methodology and tools</p>
  <p class="l1-69">An open-source platform and methodology for hands-off software development, …</p>
</div>
```

— bullets first, heading fourth — and pays for it in leading:

```css
.l1-57 { … margin-top: 426px … }                                  /* the first ✓ */
@media (min-width: 375px) { .l1-57 { … margin-top: 400px … } }
@media (min-width: 768px) { .l1-57 { … margin-top: 204px … } }

.l1-66 { … margin-top: -598px … }                                  /* the XGD heading */
@media (min-width: 375px) { .l1-66 { … margin-top: -524px … } }
@media (min-width: 768px) { .l1-66 { … margin-top: -268px … } }

.l1-67 { … margin-top: -598px … }                                  /* 'Coming soon' */
.l1-68 { … margin-top: -486px … }                                  /* the italic tagline */
@media (min-width: 375px) { .l1-68 { … margin-top: -412px … } }
@media (min-width: 768px) { .l1-68 { … margin-top: -220px … } }
```

In the L1 (`iteration-9/page.json`, node `0.1.0.0.3`) the same thing reads as `place: "flow"` children whose `geometry.keyframes[].y` are `+426 / +400 / +204` on the first sibling and `−598 / −524 / −268` four siblings later. So on this bundle the repair costs **up to 598px** of negative lead — smaller than faelan.com's `−946` and joyfulculinarycreations.com's `−7160.51`, and the same defect.

**The visible consequence a browser gets, not a probe:** because a flex column's height is the *sum* of its items' outer heights, a negative lead telescopes the column while leaving the earlier siblings where they were. At 637px, `1c l1-gate` reports `'XGD (Extreme Generative Development)'` at `{"x":60,"y":3369.667,"width":184.16,"height":53.33}` against `card-5` at `{"x":24,"y":3385.667,"width":327,"height":412}` — **16px above its own panel's top edge**, which is the arithmetic `3385.667 − 3369.667`. A run painted above the top of the surface that is supposed to back it is not a tolerance question.

## Issue 4 — the hero `surfaceFill` asymmetry, unchanged, and now 100% of the value deltas

All four of this round's `values-diff` deltas are this issue and nothing else:

| tier | axis | run | expected | actual | severity |
|---|---|---|---|---|---|
| LOW | `surfaceFill` | `Gigabyte Alchemy` | `#030717` | `#a39e9b` | 1060.363100579612 |
| LOW | `surfaceFill` | `Intentional Software` | `#030717` | `#a39e9b` | 1060.363100579612 |
| LOW | `surfaceFill` | `Tools for clarity, presence, and positive connection` | `#030717` | `#a39e9b` | 1060.363100579612 |
| LOW | `surfaceFill` | `We're a software studio building technology to elevate—no…` | `#030717` | `#a39e9b` | 1060.363100579612 |

`matched: 59`, `unmatched: 0`, `unpairedActual: []`, `worstTier: LOW`. The reference side of each pair carries `"surfaceFill": "#030717"` with `"surface": {"self": true, …}`; ours carries `"#a39e9b"` — the same 30% `#030717` scrim composited over an opaque body instead of recorded with its alpha, exactly the arithmetic already in this ticket from two other bundles. **The pixels agree**: `regions.json`'s `bands` over the hero read `0.73` and `0.70` out of 255 for the two 273px bands below the wordmark's own band, and all 7 ranked regions sit inside `'Gigabyte Alchemy'`'s own glyphs — accounted for by the Cinzel `@font-face` weight residual (REQ-334's class, re-measured there this round), not by any fill. So this remains a false delta describing a veil the reproduction paints correctly, and it is now 4 of 4 — the entire value-delta count on this bundle is this one issue.

## Correction to what was attributed here from this bundle before

`card-5`'s escapes were attributed to this ticket's issue 2 by iteration 8 (COMMENT-3942) and by REQ-324. **That attribution is at best partial, and the magnitudes are not usable.** The L1 evaluator resolves a surface's height through a segment-aware cascade but resolves the *content's* height through `measuredAt` (`tools/generate/src/l1/probes.ts:412`), which lerps the oracle's measured-height ladder with **no `snap` branch** — while this document marks the 375→768 window `snap` on all 69 of its geometry tracks. Inside `card-5` alone that shortens the modelled content column by **96.00px at 506px** and **192.00px at 637px** versus what the browser paints, and 506 and 637 are the only two off-sample widths inside that window — which is exactly and only where the escapes fire (338, 357, 853, 939, 1109, 1195, 1333, 1387 are all clean).

Filed separately this round as **BUG-160** (`probe-measured-text-height-ladder-ignores-snap-segments`), together with the round's gap ticket **REQ-337** (`recovery-padding-track-drops-its-segments`: `withContentInset` writes `responsivePadding.bottomPx` with no `segments`, so 12 of 12 padding tracks interpolate through the same snapped window — `.l1-2 { padding-bottom: calc(185.75px + (302.5 * (100vw - 375px) / 393)) }` beside `width: 375px` as a literal).

So: this ticket's issue 2 is confirmed real and independent — the `−598px` leads and the run sitting 16px above its panel's top edge are in the served CSS and in the ladder, not in a probe. What is **not** safe to read off this bundle is *how much* of the 20-escape count issue 2 owns. Re-measure once the ruler is fixed.
