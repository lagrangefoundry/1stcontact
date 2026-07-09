---
uid: request-77be58e0
id: REQ-49
type: request
title: 'Hero front-door fidelity primitives: subhead content-width, fixed-top offset,
  subhead weight + finer leading (REQ-45 successor)'
created_by: xgd
created_at: '2026-07-07T18:39:57.787701+00:00'
updated_at: '2026-07-08T18:59:05.136866+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 6dfd74e26946ce76b3bc72fc4aec8f59631fa393
    reconcile_sha: null
    main_sha: null
  - working_sha: bc5c604bfc221ad77e300c2ed08c70743a5050a8
    reconcile_sha: null
    main_sha: null
  version: 0.0.63
---

## Scope

Framework **hero** primitives the gigabytealchemy import needs to make the **hero** (above-the-fold) pixel-faithful, surfaced by the perceptual diff after config was exhausted. Successor to [[REQ-45]] (left-aligned column / tracking / hero-subhead line-height / submit foreground / caption size); same shape — generic capabilities *surfaced by* the import, reusable by every site.

## Why hero-specific, and why now (operator directive)

**The hero is the front door. Every hero decision — content position, line width, weight, leading — was deliberately considered and chosen by the site author, so hero reproduction must be exact.** Lower down the page the operator is *much less sensitive* to absolute position / font-width / leading — small drift there is acceptable. This asymmetry is a standing fidelity-priority rule ([[hero-fidelity-front-door]]): spend the fidelity budget on the hero; tolerate sub-visual rhythm drift in the band stack below.

## Evidence — measured deltas, gigabytealchemy hero (not eyeballed)

Computed geometry, our render ⇄ reference `raw.html` (`getComputedStyle`/`boundingBox`), after the anchor+weight config fixes already landed under [[REQ-20]]. The Intentional Software band alone diffs at **mean 25.3 / 255** — worse than the page mean 16.25 — every line doubled in the `1c diff` overlay:

| property | ours | reference | root cause |
|---|---|---|---|
| body wrap width | **679px** (`.hero__subhead { max-width: 60ch }`) | **768px** (`max-w-3xl`) | hardcoded `60ch`, no dial → body wraps 1–2 words early, misalignment accumulates down the paragraph (dominant contributor to 25.3) |
| heading top | 306px (fold + `center` anchor) | **320px** (`pt-80` fixed top) | spacing scale tops out far below 320px and `contentAnchor` is a 3-value enum → cannot express "pin N px from top"; `center` lands ~14px high |
| subhead weight | 400 | **300** (`font-light`) | no subhead-weight dial |
| subhead line-height | 36px (1.5) | **32px** (~1.33) | `subheadLeading` enum = tight(1.1)/normal(1.5)/relaxed only; can't hit 1.33 |

Heading size/weight (36px/700), subhead size (24px), body size (18px) already match.

## Capabilities (generalize the hero module; no new module)

1. **Hero subhead/body content-width** — a dial (token-backed closed set, e.g. reuse the `contentWidth` container scale) replacing the hardcoded `max-width: 60ch` on `.hero__subhead`, so the lead/body column can match a reference's measure (768px here). *Dominant — fixes the wrap divergence.*
2. **Fixed-top content offset for a `fold` hero** — express "pin content N px / a token step from the band top" (the reference's `pt-80`), not just top/center/bottom flex anchoring. Generalize `contentAnchor` (or add a top-offset treatment) so a large deliberate top inset is reproducible. *(Ties the anchor no-op noted in [[REQ-45]].)*
3. **Hero subhead font-weight** — a weight treatment on the subhead lead/body (reference uses `font-light` 300), independent of size.
4. **Finer subhead leading** — extend `subheadLeading` (REQ-45) with an intermediate step (~1.3/`snug`) so a reference between tight and normal is reachable.

All token-backed, `.strict()` preserved, no raw CSS reaching the page. Values remain **config** under [[REQ-20]]; this ticket is only the missing expressiveness.

## Acceptance

- On the gigabytealchemy hero, config can drive: body column to 768px (matching wrap), content top to the reference inset, subhead weight 300, subhead leading ~1.33.
- The Intentional Software band `1c diff` mean drops materially from 25.3 (doubled ghosts collapse) and the `values-diff` subhead line-height delta clears.
- `test_UAT_FC_<TICKET>_*` cover each dial's emitted CSS on a fixture plus an unchanged-pass control; no new module; strict schema preserved.

## Notes

- Bundled per "fewer, generic tickets"; split only if one grows.
- Runbook [[DOC-19]] should point here for hero last-mile primitives, alongside [[REQ-45]].
- Process lesson that surfaced this: read the `1c diff` **overlay** per region, don't eyeball crops or trust the aggregate mean ([[repro-gate-on-diff-overlay]]); the hero deltas sit over a dark image and barely move the page mean.


## Capability 5 (added 2026-07-07) — hero content horizontal inset

Measured after the operator flagged the hero left margin as too shallow. The hero content block sits **8px left of the reference, uniformly** across wordmark / heading / subhead / body (measured leftmost text pixel from the styled screenshot via sharp — the reference `raw.html` renders unstyled offline, so pixel measurement, not DOM):

| element | ours left | ref left |
|---|---|---|
| wordmark | 83px | 91px |
| heading | 82px | 90px |
| subhead | 80px | 88px |
| body | 81px | 89px |

Both sides centre a 1152px container at x=64; the delta is purely the inner horizontal padding: the reference uses `px-6` (**24px**) → content at 88px; our hero hardcodes `.hero__inner { padding-inline: var(--space-4) }` (**16px**) → content at 80px. No dial.

**Capability:** expose the hero content horizontal inset (gutter) as a token-backed dial, so the front-door column can align to a reference's chosen gutter (24px here) rather than the hardcoded 16px. Generalize `.hero__inner` padding; no new module. Per [[hero-fidelity-front-door]] an 8px indent on the wordmark/headline is a deliberate choice, not sub-visual — it belongs in the exact-hero budget. *(Band-stack sections show a mixed picture — some at 80px, some at 88px — tracked separately, lower priority; the hero is the driver.)*

Acceptance extends: config can set the hero content inset to 24px so all four elements' left edges land at ~88px matching the reference.


## Implementation (landed — free_coded)

Commit `6dfd74e` (version 0.0.62). All four capabilities are hero-module generalizations; no new module.

| # | Capability | Dial | Mapping / token |
|---|---|---|---|
| 1 | Subhead/body content-width | `contentWidth` (reused shared `CONTENT_WIDTH_DIAL`) | `narrow`/`wide` → `--container-narrow`/`--container-wide`; `default` fills the inner frame |
| 2 | Fixed-top offset (fold hero) | `contentOffsetTop` (new `CONTENT_OFFSET_TOP_DIAL`) | `margin-top` on `.hero__inner`; `sm/md/lg/xl` → `--space-16/32/48/80`; **`xl` = 20rem = 320px** (the `pt-80` reference) |
| 3 | Subhead font-weight | `subheadWeight` (new `SUBHEAD_WEIGHT_DIAL`) | `light`/`medium`/`semibold` → `--font-weight-*`; `regular` is a no-op default (inherited body weight) |
| 4 | Finer subhead leading | `subheadLeading` (added `snug` to `LINE_HEIGHT_DIAL`) | `--line-height-snug` = 1.33 |

**Token surface extended** (backward-compatible: `.optional()` in `site-schema` + `defaultTokens` fills, per the `shadow.xl` precedent; deep-merge preserves the new keys for sites with their own token blocks): `weights.light`=300, `lineHeights.snug`=1.33, spacing `32/48/64/80` (8/12/16/20rem). Token-count control updated 64→70.

**⚠️ Deliberate default change to re-verify:** capability 1 removes the hardcoded `max-width: 60ch`; a hero that omits `contentWidth` now has its subhead **fill the inner frame** rather than cap at 60ch. gigabytealchemy and the other flagship heroes should be re-diffed for the wider default (set `contentWidth` where a narrower measure is wanted). Caps 2–4 default to no-op (unchanged when the dial is omitted).

**Tests:** `test_UAT_FC_REQ-49_*` (13) — each dial's emitted class + unchanged-pass control + token-surface assertions (incl. a deep-merge survival test for `--space-80`). Green.

**Config vs capability:** values remain config under [[REQ-20]]; this ticket delivered only the missing expressiveness. Runbook [[DOC-19]] can now point here for hero last-mile primitives alongside [[REQ-45]].


## Post-implementation findings (2026-07-07) — applied to gigabytealchemy, 3 residuals

Dialed the hero to the measured reference targets under [[REQ-20]]. **Landed exactly** (playwright/getComputedStyle): heading top 306→**320px** (`contentAnchor top` + `contentOffsetTop xl` + `spacingTop none`), subhead lead weight 400→**300** (`subheadWeight light`), lead line-height 36→**32px** (`subheadLeading snug`). Intentional Software band diff **25.3→21.1**, full page 16.25→16.00; the overlay shows heading/subhead/position all dropped out — only the body paragraph still doubles. Three residuals remain, each a genuine limitation surfaced by pushing the hero exact:

1. **`contentWidth` shares one `narrow` token but the hero and body sections need different widths.** Hero body = `max-w-3xl` = **768px**; the reference *text* sections = `max-w-4xl` = **896px** (and `container.narrow` is set to 896 to serve them). `contentWidth: narrow` therefore gives the hero **896**, overshooting 768 by 128px — the sole remaining doubling in the band (body wraps wider than the reference). The 3-value shared scale {narrow, default, wide} can't express {768 hero, 896 text, full-width bands} at once. **Follow-up:** a hero-specific narrower width (map hero `narrow`→`max-w-3xl`/768, or add a 4th step), decoupled from the text-block narrow.

2. **Capability 5 (hero content horizontal inset) was not in the implementation.** The commit (`6dfd74e`) landed content-width / offset-top / weight / leading, but not the inset dial. Hero content is still `padding-inline: var(--space-4)` (16px) → left **80px**, vs the reference `px-6` (24px) → **88px**; 8px too shallow, no dial. **Still open** — see Capability 5 above.

3. **`subheadWeight` / `subheadLeading` are block-level; the reference splits lead vs body.** Reference: lead `font-light` 300 + `text-2xl`, leading ~32; body **400** + `text-lg`, leading **~29 (relaxed)**. Our single block dial forces both — so `light`+`snug` (correct for the lead) side-effect the body to weight **300** (want 400) and leading **24** (want 29). **Follow-up:** independent lead-vs-body weight/leading, or apply the dial to the lead paragraph only.

Values remain config once the knobs exist; the hero position/weight/lead-leading fixes are committed under REQ-20.


## Iteration 2 (2026-07-07) — Capability 5 + 3 residuals closed

Commit `bc5c604` (version 0.0.63). Implements the follow-ups the first pass surfaced on gigabytealchemy; all hero-module generalizations, no new module.

- **Cap 5 / residual 2 — hero content horizontal inset.** New `contentInset` dial on `.hero__inner` `padding-inline`: `sm` (default) = the prior **16px**, `md` = **24px** (the reference `px-6`), `lg` = 32px → `--space-4/6/8`. Config can now land the front-door left edge at ~88px. *(Was documented but not implemented in `6dfd74e`.)*
- **Residual 1 — `readable` content-width decoupled from `narrow`.** New `container.readable` token (**48rem/768px**, `max-w-3xl`) + a `readable` step on the shared `CONTENT_WIDTH_DIAL`, wired into hero + text-block + services-grid. The hero body now selects **768** via `contentWidth: readable` independently of `container.narrow` (896, serving the `max-w-4xl` text sections) — collapsing the last body-doubling.
- **Residual 3 — lead vs body split.** `subheadWeight` and `subheadLeading` now scope to the **lead paragraph** (`p:first-child`); the body (`p + p`) holds deterministic defaults (**regular** weight, **relaxed** leading). `light`+`snug` on the lead no longer leak onto the body (was forcing it to 300/24 when the reference wants 400/relaxed).

**Token surface:** `--container-readable` added (declCount 70→71); backward-compatible via `.optional()` + `defaultTokens` (shadow.xl precedent). **UATs:** +7 (`contentInset` class + default control, `readable` width class + `--container-readable` token, lead/body split structure). Full suite **412 green**; framework + site-schema typecheck clean.

gigabytealchemy application (config under [[REQ-20]]): set hero `contentWidth: readable` (768), `contentInset: md` (24px), keep `subheadWeight: light` + `subheadLeading: snug` (now lead-only). Expect the body-doubling and the 8px left-indent to clear on the next `1c diff` overlay.


## Applied to gigabytealchemy (2026-07-07, config under [[REQ-20]])

Config edits (site-def, exempt from free-coding): hero `contentWidth: narrow→readable` (768 not 896), added `contentInset: md` (24px `px-6`), and theme `lineHeights.relaxed 1.75→1.625` (Tailwind `leading-relaxed`, for the body copy). Rendered + measured (playwright/getComputedStyle) vs the capture manifest.

**Hero now matches the capture on every value that drove REQ-49** (measured ⇄ captured):
- heading 36px / 700 / #FBBA72 / letter-spacing −0.9px, top **320**, left **88** — exact.
- lead 24px / **300** / #F5E6A3 / line-height **32** — exact.
- body 18px / 400 / #F5E6A3 / **width 768** / line-height **29** (was 31.5) — exact.
- content top 320 (`pt-80`), left gutter 24px (`px-6`) — exact.

values-diff: the hero heading/lead/body carry **zero** value deltas. Perceptual overlay: heading is single/crisp; body lines no longer diverge after the leading fix.

**New residual surfaced — hero inter-element vertical rhythm.** The reference spaces the three hero lines with `mb-6` (24px, heading→lead) then `mb-8` (32px, lead→body); our `.hero__inner` uses a single uniform `gap` (16px) + `p+p margin-top` (16px). Net: the lead sits ~8px high and the body ~24px high — right size, right column, rides a touch high (perceptual region y=432 mean ~57). **No dial exists for per-element hero spacing** — candidate follow-up primitive (a hero content vertical-rhythm / gap dial), pending operator discussion. Out of scope of the current commits.

**Non-hero front-door note:** the header wordmark matches the capture on font/size/weight/tracking (Cinzel 72/600/−1.8) but sits lower vertically + renders faux-bold — a header-module placement/`@font-face`-weight item, not hero. Page mean 16.25→15.58.


## Residual surfaced by operator (2026-07-07) — hero heading is fluid, reference is fixed

Operator eye-caught the hero heading reading a different size at their window width. Diagnosed: at the diff/capture width (1280) our heading is exactly 36px = reference (verified by capture manifest, getComputedStyle, and a tight overlay showing single crisp glyphs — the mechanical gate matched, so the first pass missed this). But our hero heading is **fluid**: `size-sm` = `clamp(--font-size-2xl, 4vw, --font-size-3xl)` = clamp(24, 4vw, 36), reaching 36 only at ~900px+. Measured: viewport 820→**32.8px**, 1024+→36px. The reference is `text-3xl md:text-4xl` = **fixed 36px for all ≥768px**.

No `size` step reproduces a flat fixed size: `size-sm` is 24→36 (matches only wide), `size-md` is 36→48 (matches only narrow). The reference's flat 36 is unreachable — a real fidelity gap for any fixed-size reference heading across viewports.

**Candidate follow-up primitive:** a fixed (non-fluid) hero heading-size option (or a "fluid off" treatment) so config can pin the reference's exact desktop size at all widths. Same "new hero knob" class as the vertical-rhythm gap above. Pending operator go-ahead (framework code → free-coding).


## Same fluid-vs-fixed gap on the header wordmark (2026-07-07)

Operator side-by-side (two equal-width windows) caught our wordmark rendering wider than the reference (our "Y" under their "M"). Confirmed the same root cause as the hero heading, now on the **header** wordmark:
- Reference wordmark: `text-4xl sm:text-5xl md:text-7xl` = fixed steps **36 / 48 / 72px** (72 for all ≥768).
- Ours `logoSize: xl` = `clamp(--font-size-4xl, 6vw, --font-size-5xl)` = clamp(48, 6vw, 72), fluid, floor 48, reaching 72 only at ~1200px.
- Measured crossover: <640px ours 48 > ref 36 (**ours bigger** — what the operator saw); ~700px equal; 768–1200 ref bigger; ≥1280 equal.

**Why the perceptual diff missed the size:** `1c diff` runs at a single width (1280), where the two sizes coincide (72=72); the wordmark region is still #1 by *vertical position + gradient*, but size divergence only appears at other widths. Single-viewport diff is blind to viewport-dependent size deltas — a gate limitation worth noting (multi-viewport diff would catch it; cf. [[REQ-48]] multi-viewport axis).

**Fix (framework):** fixed (non-fluid) sizing to match the reference's breakpoint steps — hero heading `size` (REQ-49 scope) *and* header wordmark `logoSize` (header module). Both use `clamp()` today. Same "new knob" class as the vertical-rhythm gap. Pending operator go-ahead.