---
uid: request-342de4f4
id: REQ-32
type: request
title: Framework fidelity primitives surfaced by import (gradient direction, callout
  left-bar, hero scrim/anchor, cool-neutral role)
created_by: xgd
created_at: '2026-07-03T01:37:59.346134+00:00'
updated_at: '2026-07-08T18:58:50.987891+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
  commits:
  - b54f9f6c0ab4ef1667ee56c2baed9cf95fff75b1
  - 25f1c91afbba502e294a1481334667c59d3196a5
  - 502cbbc56a0db4a465764a8f362e08b57ba15572
  - 898d0ce367a03de3efc1cdac755d9c3dc234099d
  - 5e6dcd6d2e8276decad5c5d1c5c8d797b251deaa
  - d4fd3f7d1b5a7c9d0db9beef0cbc55b7828016af
  version: 0.0.39
---

## Scope

Generic, reusable **framework capabilities** the import pipeline needs but cannot yet express. Surfaced *by* — not scoped *to* — the gigabytealchemy repro; each applies to any site. Follows the framing of [[REQ-24]]/[[REQ-25]]/[[REQ-26]]/[[REQ-28]] (capabilities driven by the import, not named after it).

**Explicitly out of scope: site-specific values.** Exact colours/sizes (e.g. gigabytealchemy's wordmark size, hero body-text hex, footer text colour) are *config* under the site milestone [[REQ-20]], and are flagged mechanically by [[REQ-31]]'s values-diff. This ticket is only the missing **expressiveness**.

## Capabilities

1. **Heading / wordmark gradient treatment — arbitrary direction + multi-stop hues.** The current `gold` treatment is a fixed *vertical two-tone*; a gradient wordmark/heading with a horizontal (or any-angle) multi-hue sweep can't be expressed. Generalise the treatment to carry direction + stops as structured, token-backed values. *(Driver: gigabytealchemy wordmark, gold→orange, 90deg.)*

2. **`text-block` callout / left-bar treatment.** A semantic accent **left-bar + indent + optional italic** (blockquote-style emphasis) as a structured treatment, not markdown bold. Any site with pull-quote / callout emphasis needs it. *(Driver: gigabytealchemy emerald + amber callouts.)*

3. **Hero overlay-scrim + content vertical anchor.** A legibility **scrim** over the background image (opacity tint) plus a **content anchor** (top / center / bottom). Common to any text-over-image hero. *(Driver: gigabytealchemy slate scrim, content anchored low.)*

4. **Cool-neutral palette role.** The palette carries a single, often-warm `muted`; a site that mixes a **cool neutral (slate)** for panels/borders can't express it. Add a cool-neutral role (or let panel/border tints select a neutral independent of `muted`). *(Driver: gigabytealchemy slate exploring panel vs our warm-neutral derivation.)*

## Notes

- Bundled per the "fewer, generic tickets" preference; each is a small primitive. Split only if a single one grows.
- Reusable across all sites and the future builder; gates [[REQ-20]] / [[REQ-21]] fidelity.
- The runbook [[DOC-19]] points here for "known still-missing capabilities."


## Implementation note

Implement each capability by **generalizing the existing module**, not by adding a new one (project rule — CLAUDE.md "Generalize Modules Before Adding New Ones"): (1) heading gradient → generalize the hero/header `gold` treatment to carry direction+stops; (2) callout → a `text-block` treatment; (3) scrim/anchor → hero dials; (4) cool-neutral → a palette role. No new modules expected.


## Capability 5 — Layer art-direction treatments (surfaced by the faelan.com import, [[REQ-21]])

The `layer` primitive (REQ-15) can position/rotate/mask freely-placed children, but an art-directed photo-montage (faelan.com) needs three more **generic, token-backed** treatments before it reads as intended. All are generalizations of the existing `layer` child — no new module (CLAUDE.md rule). Site-specific values (exact shadow, which role, which size) remain config under [[REQ-21]]; this ticket is only the expressiveness.

1. **Layer text-child typography.** A positioned `text` child renders unstyled markdown (inherits body size), so a wordmark/label can't be sized. Add a structured, token-backed `typography` field to the layer text child — `size` (font-scale step), `weight`, `color` (palette role), `font` (heading/body/display), `tracking` (closed enum → em), `align`, and a legibility `shadow` (bool). Framework-computed custom properties only; no raw CSS. *(Driver: faelan "FAELAN" wordmark 64px/900 + subline over imagery.)*

2. **Layer image-child `shadow`.** Montage photos need to lift off the background. Add a `shadow` treatment on the image child = a step bound to the theme shadow tokens. Introduces an `xl` shadow token (optional; defaulted) for a lifted drop+glow — the exact value is per-site config. *(Driver: faelan photos `0 15px 50px …, 0 0 30px …`.)*

3. **Layer image-child `border`.** A framed/ringed photo needs a token-backed border — `{ width: none|thin|medium|thick, color: <palette-role> }` → `border: <px> solid var(--color-<role>)`. *(Driver: faelan circular portrait's light ring.)*

Deferred (note, not in scope here): per-child soft-mask feather amount — the fixed radial stop is close enough at the desktop reference; revisit if eyes flag it.

### Acceptance
- Layer text children can carry structured typography; image children can carry `shadow` + `border`; all token-backed, `.strict()` preserved, no raw CSS reaches the page.
- `test_UAT_FC_REQ-32_*` cover: text typography → font-size/weight/color/tracking/shadow custom props; image `shadow` → `var(--shadow-*)`; image `border` → `<px> solid var(--color-<role>)`.
- faelan montage renders the wordmark at display scale and the photos lifted/ringed (eyes vs the captured reference).


### Capability 5 follow-up — soft-mask `feather` (now in scope, was deferred)

Same-viewport eyes-diff against the faelan reference (REQ-21) showed the layer photos over-softened: the fixed soft-mask stop (`#000 55%`) feathers the outer ~45% of each image, vs the original's crisper 70–75% stop. Bringing the deferred per-child feather control into scope:

- `imageTreatment.feather: sm | md | lg` (soft-mask only) → the radial black-stop, emitted as a framework-computed `--fc-feather` custom property the mask reads (`sm`=82% crisp, `md`=70%, `lg`=55% = the prior default). Default unchanged when absent, so existing soft-mask behaviour is untouched.

Adds a `test_UAT_FC_REQ-32_*` for the feather custom property + default fallback.


### Capability 5 fix — motion breaks layer image sizing (found via pixel-diff, REQ-21)

A pixel-diff of the faelan reproduction showed the circular portrait rendering as an **ellipse** (`<img>` 224×184 inside a correct 224×224 child box). Root cause: `wrapWithMotion` inserts an `fc-motion` wrapper between the layer image child and its `<img>`, so `img { height: 100% }` resolves against an auto-height wrapper and collapses to the image's natural aspect ratio — `object-fit: cover` can never make the box square. Only affects image children that need a definite height (e.g. `shape: circle`); width-only children are unaffected.

Fix (framework, static CSS — no schema change):
- `.fc-layer__child--image .fc-motion { display: block; width: 100%; height: 100%; }` — the motion wrapper is transparent to image sizing, so `height: 100%` / `object-fit` work whether or not a child carries motion.
- `.fc-layer__child--shape-circle { aspect-ratio: 1; }` — a circle is square from its width alone, so it no longer depends on a fragile percentage height.

Adds a `test_UAT_FC_REQ-32_*` asserting both rules ship in LAYER_CSS.


### Capability 5 — layer geometry fidelity (pixel-diff driven, REQ-21)

A per-pixel diff (mine vs live faelan.com, 1280×800) drove three more layer fixes; whole-page mean diff fell 20.5 → 3.3 / 255 (pixels >20% : 14% → <1%):

1. **`transform-origin: center`** (was `top left`) — the single biggest gap. A layer child's top/left place its box; it must then rotate *in place* about its centre (the CSS default the original relies on). A corner origin swung every rotated photo away from its intended spot, mis-registering the whole montage.
2. **Box-sized soft-mask** — the mask is now `radial-gradient(ellipse 92% 92% at center, …)` (was a farthest-corner ellipse), matching the original's `ellipse 92% 92%` feather geometry; feather stops retuned (sm 78 / md 72 / lg 60). Removed the halos around the photos.
3. **`typography.leading`** on layer text children (theme line-height token) — a positioned wordmark/label now controls its box height, so it lands at the right vertical position (fixed the FAELAN wordmark sitting high).

Combined with the earlier motion-sizing + `aspect-ratio` circle fix, the montage now matches the original to the pixel. Residuals are non-layer: the about band's hero heading→subhead rhythm (~11px, shared-module, visually indistinguishable) and the footer build-year.


### Capability 5 — layer text link + shadow polish (pixel-diff, REQ-21)

Zoomed pixel-diff of the faelan header surfaced two fine text deltas:
- **Link underline** hugged the text (default markdown underline) vs the original's offset underline → added `text-underline-offset: 0.16em` to `.fc-layer__text a` (a tasteful general default for layer-text links).
- **Wordmark shadow** — the single boolean shadow can't serve both a luminous wordmark (drop + white glow) and a plain legibility line. Changed `typography.shadow` from `boolean` to a preset enum `soft | glow` (`soft` = dark legibility shadow; `glow` = drop + `0 0 40px` light halo). Framework-computed, no raw CSS. faelan: wordmark `glow`, subline `soft`.

Also nudged the faelan subline to its exact y (config). Header text now matches the original to sub-pixel.


### Known issue (deferred, not a priority) — layer percentage-position cross-browser

Reported: layer text children positioned by percentage `top` sit ~one line lower in **Safari/Firefox** than in Chrome/Chromium (e.g. faelan's "Artist • Musician • Creator" subline at `top: 21%`). Chromium renders correctly (verified: subline y=168).

Cause (structural, unverified in WebKit/Gecko — those engines aren't installed here): the layer band's height is derived up a `min-height: 100vh` chain (`.layer` min-height → `.fc-layer__content` height:auto → `.fc-layer` → `.fc-layer__stack` inset:0), and children resolve percentage `top` against it. Blink resolves the used height leniently; WebKit/Gecko are stricter about percentages against a `min-height`-derived (indefinite) height.

Likely fix: give the layer positioning context (`.fc-layer` / stack) an explicit definite height keyed to the band, so percentage `top` resolves identically across engines. Affects any art-directed layer, not just faelan. Verify in WebKit + Firefox before/after.


**Correction (could not reproduce):** installed Playwright's WebKit (Safari's engine) + Firefox and measured/screenshotted the faelan subline in all three engines — **all render it identically at y=168** (correct, matching Chromium). The min-height/percentage hypothesis above is therefore **not** the cause; layer percentage-positioning is cross-engine-consistent in these WebKit/Gecko builds. Most likely explanation for the original report: a **stale CSS/HTML cache** in the user's actual Safari/Firefox (recent fixes not picked up) while Chrome held the fresh version — a hard refresh should resolve it. If it persists post-refresh it would be specific to those app versions (not the bundled engines). Downgrading this from a framework bug to a likely-cache non-issue.


### Capability 5 — layer text "titled block" (multi-line, fixed gap) (REQ-21)

A layer band is `100vh`, so a text child positioned by percentage `top` moves proportionally with viewport height. When a wordmark and its tagline are **two separate** positioned children (e.g. faelan's FAELAN at `top:8%` + subline at `top:21%`), the gap between them = `~13% × viewport-height` — so on a tall browser window the tagline drifts a full line below the wordmark, while the source keeps them glued (one flow block, `<h1>`+`<p>`, fixed `margin`). Reproducible only at non-reference viewport heights (all engines agree at a fixed height — it is *not* a Safari/Firefox engine bug).

Fix (framework): a text child may carry `lines: [{ text, typography? }, …]` instead of a single `text` — rendered as one flowing block positioned once, so the inter-line gap is content-based (fixed) at any viewport height. Each line keeps its own token-backed typography. The single-`text` form is unchanged.

faelan: merge the FAELAN wordmark + "Artist • Musician • Creator" subline into one `lines` child. Verify with `1c diff` at viewport heights 800 / 1000 / 1080 that the wordmark→subline gap stays fixed.