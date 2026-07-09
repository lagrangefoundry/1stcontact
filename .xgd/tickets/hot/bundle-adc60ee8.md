---
uid: bundle-adc60ee8
id: BUNDLE-3
type: bundle
title: REQ-26 + REQ-27 + REQ-28 + REQ-20 + REQ-31 + 5 more
created_by: xgd
created_at: '2026-07-09T21:43:05.246289+00:00'
updated_at: '2026-07-09T23:59:15.002263+00:00'
completed_at: '2026-07-09T23:59:11.936631+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: bccfc9591626446c85fece524346e82a9064a464
  auto_merge_back: true
  priority: medium
  orphan_commits:
  - old_sha: 6d7d92f63c45ad29311245620fb285c5ebcd4a33
    new_sha: 649bf24f765a2a1844e2a571dc7b33f0bcd054d8
  - old_sha: d7cdc1e68de2761dcf5790940f11abe66fd42944
    new_sha: a41e5c554283eeb26c8ed25029e3f41e9a84bd27
  - old_sha: 937d143bb776e48486bbcdcdaa4492e133cfcb33
    new_sha: 0536305f259869f591b7d1c9d73f4ca526c32134
  - old_sha: acc552122047c7d1857272f4ebf24d866f881df5
    new_sha: 1b6f98e936ce7e4ec732a89132e92130506e3c6c
  - old_sha: 10db72a659d11ac2709970cf64f8fcbea02435a8
    new_sha: 403f5c5e3dabd3878909f8d33803bf6bcce20a10
  - old_sha: 0c08c3300c290dae7395b49bb5027457d6c25da2
    new_sha: 01fba11509f18bd93390e9e6b13324018315cf49
  - old_sha: 7598eec029ce4430091fa6276f25f18cf024588d
    new_sha: 78330824481ebb2591d9336b34c64640967d729b
  - old_sha: 87539548a51c264f4103a5eb41530e87d2bb3902
    new_sha: 51fa3ccacfd4a68797d13faab6f1336776a9cd33
  merged_at_commit: bccfc9591626446c85fece524346e82a9064a464
result: pass
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-26: services-grid card treatments: accent border, status badge, ✓ checklist

## Scope — module capability (services-grid)

Add first-class card treatments to `services-grid` so cards can carry:

1. **Accent left border** — a colored vertical bar per card (e.g. gold, blue), driven by a semantic token, not raw CSS.
2. **Status badge** — a pill in the card's top-right (e.g. "In development", "Coming soon"), with a semantic color.
3. **Checklist items** — bulleted body items rendered as green ✓ checks rather than plain markdown `•` bullets.

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference "What We're Building" cards (Sanctum Voice, XGD) use all three. We currently fold status into the markdown body as italics and lists render as plain bullets, so the cards read flat.

## Acceptance criteria

- `services-grid` item schema gains structured fields for accent color, badge (label + variant), and checklist items — validated by `validateModuleContent`, no raw props.
- Framework emits the border/badge/check styling from those structured values (semantic tokens), scoped per instance.
- gigabytealchemy "What We're Building" cards match the reference: per-card accent border, top-right badge pill, green ✓ checklist.

## Notes

- Keep it within the closed content-value model (structured fields, not raw CSS/HTML).
- Green ✓ should key off the theme `primary` (or a dedicated success token), consistent with the reference.
- Blocks REQ-20 fidelity gap #3.

## Implementation (as landed)

Structured, closed-value, token-backed — no raw CSS/HTML at any layer.

**Content contract (`ContentFieldSpec`, generalized — not services-grid-specific):**
- Added `values?: readonly string[]` for `enum` fields and `itemSchema?` for `list`/`object` fields.
- `validateModuleContent` now recurses through `itemSchema` and enforces `required` + `enum` `values` to arbitrary depth. Violations report dotted/indexed paths (e.g. `items[0].badge.variant`). Any module can now declare structured, validated item fields — the reuse-first path, not a services-grid special case.

**services-grid meta (`items.itemSchema`):**
- `accent`: enum `CARD_ACCENT = [primary, accent, muted]` → palette-role name, resolves to `--color-<role>` in scoped CSS.
- `badge`: object `{ label (required), variant enum BADGE_VARIANT = [neutral, primary, accent] }`.
- `checklist`: list (max 8) of strings.
- All three optional — a card declaring none renders exactly as before (backward compatible).

**services-grid render + scoped CSS:**
- Accent: `border-left` thickened and coloured via `--color-<role>` (`accent`→gold, `primary`→green on the gigabytealchemy palette).
- Badge: absolute top-right pill; variant maps to a token background/foreground pair.
- Checklist: `✓` pseudo-element keyed to `--color-primary` (the reference's green check).

**Applied to gigabytealchemy** `draft/pages/home.json` "What We're Building": Sanctum Voice (accent border + "In development" badge + ✓ list) and XGD (accent border + "Coming soon" badge + ✓ list). Rendered draft verified: 2 distinct accent borders, 2 badges, 6 ✓ items. (The `storage/sites/gigabytealchemy/` tree is untracked seed data from the REQ-20 session, so it is not part of this ticket's commit; the demonstration content is captured inline in the AC3 UAT.)

## Test plan (UATs — `tests/framework-services-grid-cards.test.ts`)

- **AC1 (schema):** accepts structured accent/badge/checklist; rejects accent outside `[primary, accent, muted]`; rejects badge variant outside `[neutral, primary, accent]`; requires `badge.label`; untreated card still validates.
- **AC2 (render):** emits accent-border class + `border-left-color: var(--color-<role>)`; emits status-badge pill with label + variant class (defaulting to `neutral`); emits checklist items with `::before` `✓` keyed to `--color-primary`; untreated card emits no treatment markup.
- **AC3 (fidelity):** the two "What We're Building" reference cards render with per-card accent border, top-right badge, and green ✓ checklist.

Full suite: 130 passed (44 in the services-grid + schema + tokens regression scope). Framework/site-schema typecheck clean.


---

## REQ-27: Section background rendered inert when surface dial is set

## Scope — framework rendering bug/capability

When a section sets both a `background` (REQ-14: color/image/gradient) **and** a `surface` dial (e.g. `inverse`/`subtle`), the `surface` fill paints over the `background`, making the background inert. A module author must choose one or the other; they don't compose.

Surfaced by the **gigabytealchemy.ai** import (REQ-20): the reference is a warm-cream **band stack** where each band is a flat `surface` tone, but any band that *also* wants a background image/gradient (e.g. hero over the lab photo) can't keep its surface-derived text-color contract at the same time. The workaround this session was to lean entirely on `surface: inverse` for the hero and drop the background compositing — legible, but not how the primitive is supposed to work.

## Why this matters beyond one site

This bites **every band-stack site**, not just gigabytealchemy: band-stack is the *conventional* half of the founder-site range (REQ-20), so the compose-background-with-surface case is the common path, not an edge case.

## Acceptance criteria

- `background` and `surface` compose predictably in one section: the background paints, and the surface establishes the text-color/contrast contract over it (or a documented, structured precedence rule exists — not "last one wins by accident").
- No raw CSS in the site definition to work around it.
- gigabytealchemy hero can carry the lab image background **and** an inverse text-color contract simultaneously.

## Fix (as implemented)

**Root cause**: `wrapWithBackground` stacks a background layer (z-index 0) behind the module's content (z-index 2), but each module's `surface-*` class sets an opaque `background` on the module's own `<section>` (e.g. `.hero.surface-inverse { background: var(--color-surface-inverse); color: var(--color-bg) }`). That opaque fill paints over the background layer. The `surface` dial conflates a **fill** with a **text-color contract**; only the text-color contract should survive when a background is present.

**Change**: one structural precedence rule added to `SECTION_CSS` (`packages/framework/src/modules/background.ts`):

```css
.fc-bg-section > .fc-bg-section__content > * {
  background-color: transparent;
  background-image: none;
}
```

When a background wrapper is present this suppresses the wrapped band's own `background-color`/`background-image` (so the REQ-14 background paints), while leaving `color` untouched (so `surface` still supplies the text-contrast contract). The two-class selector is specificity (0,2,0), tying the `.<module>.surface-*` rules; `SECTION_CSS` is emitted **after** the module CSS in the per-site stylesheet, so it wins the tie deterministically. No `!important`, no per-module edits, no raw CSS in the site definition.

**Precedence rule (documented)**: *background paints; surface contracts.* When a section has both, the background is the paint and the surface provides only the text-color/contrast contract.

**No regression to surface-only bands**: a module with no background wrapper has no `.fc-bg-section` ancestor, so its surface fill paints normally.

## Test plan

`tests/req27-background-surface-compose.test.ts` (UATs, no internal mocking):

- `test_UAT_FC_REQ-27_section_css_suppresses_band_fill_keeps_color` — the precedence rule suppresses background but never sets `color`.
- `test_UAT_FC_REQ-27_wrapped_band_is_direct_child_of_content` — locks the structural contract the selector depends on (module band is a direct child of `.fc-bg-section__content`).
- `test_UAT_FC_REQ-27_hero_composes_background_with_inverse_surface` — end-to-end via the `1c` CLI: a hero with `surface: inverse` + an image `background` renders both, the precedence rule reaches `theme.css` after `.hero.surface-inverse`, and the surface `color` contract is preserved (the gigabytealchemy hero case).

Regression: full suite green (133 tests); REQ-14 background UATs unchanged.


---

## REQ-28: Small module dials for gigabytealchemy import (hero heading / header align / stacked grid)

## Scope — module capability

`hero` has no dial to set the heading colour/treatment independently of the surface text colour. Under `surface: inverse` the heading renders white; there is no structured way to make it the site accent (gold) as the reference does.

Surfaced by the **gigabytealchemy.ai** import (REQ-20): the reference hero heading is **gold** (site accent `#fbba72`), not white. Our reconstruction renders it white because the only lever is the inverse surface's default text colour.

## Acceptance criteria

- `hero` exposes a structured heading colour/treatment dial (e.g. `theme` token or `plain`/`accent`/`gold` treatment) selectable per instance.
- No raw CSS in the site definition.
- gigabytealchemy hero heading renders in the site accent gold over the inverse hero band, matching the captured value.

## Related

Sibling of REQ-24 (`logoTreatment: gold` on `header`) — if a shared text-treatment dial is generalised there, this hero heading case is a natural consumer.


## Consolidated scope (2026-07-02)

Per operator steer ("use fewer reqs"), this ticket is the **umbrella** for three small module dials surfaced by the gigabytealchemy.ai import (REQ-20). It **subsumes REQ-29 and REQ-30** (both archived, pointing here). All three are structured dials/variants — no raw CSS in the site definition.

1. **Hero heading treatment** (was this ticket) — `hero` gains a `headingTreatment` dial (`plain`/`accent`/`gold`) that sets the heading colour independently of the surface text colour; `gold` reuses the header wordmark's metallic gradient (REQ-24). Reference hero heading is gold over the inverse band.
2. **Header alignment** (was REQ-29) — `header` gains an `align` dial (`left`/`center`, shared `ALIGN_DIAL`); `center` groups the wordmark/nav centrally. Reference wordmark is centered.
3. **services-grid stacked variant** (was REQ-30) — new `stacked` variant holds each card full-width in one column at every breakpoint (multi-col variants only spread from `md` up). Reference "Building" cards stack.

## What was implemented (free-coded — commit recorded in fields.commits)

- `dials.ts`: new `HEADING_TREATMENT_DIAL` (`plain`/`accent`/`gold`); header reuses existing `ALIGN_DIAL`.
- `hero/meta.ts` + `hero/index.astro`: `headingTreatment` dial → `treatment-*` class on `<h1>`; `accent` = solid accent fill, `gold` = gradient clipped to glyphs.
- `header/meta.ts` + `header/index.astro`: `align` dial → `align-*` class; `.header.align-center .header__inner { justify-content: center }`.
- `services-grid/meta.ts` + `index.astro`: `stacked` added to `variants`; explicit single-column rule.
- gigabytealchemy `draft/pages/home.json`: hero `headingTreatment: gold`, header `align: center`, "Building" grid `variant: stacked`.
- UATs: `tests/req28-module-dials.test.ts` (9 tests: meta, per-module render, full render pipeline). All pass; quality gate green (lint/typecheck/coverage 95%).


---

## REQ-20: Milestone: indistinguishable import of the founder sites: gigabytealchemy.ai

## Scope — milestone / acceptance benchmark

The standing **import-fidelity** benchmark: the capture → reproduce → eyes pipeline reproduces the two **founder sites** — [faelan.com] and [gigabytealchemy.ai] — **indistinguishably to the eye** (not pixel-counted). Both are the operator's own sites (IP-clean fixtures) and they bracket the range: **faelan = art-directed** (photo montage, treatments, motion), **gigabytealchemy = conventional** (band stack). Passing this proves the _import pipeline_, complementing REQ-19 (which proves the _ceiling_).

This ticket is specifically an import of gigabytealchemy.ai - (for faelan.com see REQ-21)

## Dependencies

REQ-12 (capture), REQ-13 (screenshot / eyes gate), REQ-14 (background/overlay), REQ-15 (`layer` + compositing), REQ-16 (motion).

## Acceptance criteria

- **Indistinguishable at the desktop reference** first, then interaction states (hover/motion), then mobile (via REQ-15 reflow). "Indistinguishable" is eyes-judged, per-viewport/per-state.

- Reproduced **only from our own modules** (Tier A + any hardened Tier-B bespoke modules — [[DOC-14]]); no raw CSS/HTML, no per-site hacks outside the model.

- Content/colors/fonts/assets are **exact** (verbatim copy, computed colors, same fonts, mirrored assets); layout/treatments/motion match the captured **structured values exactly**.

## Notes

- Milestone, not a single build — gated on the primitives above. faelan needs no bespoke module (its "torn" edge is a mirrored PNG asset); gigabytealchemy's status is "confirm once REQ-12 renders it."

- Drives the **capture fidelity bar** (exact values, not approximate) and the flashy-primitive backlog.

- Companion benchmark to [[DOC-15]] §4 / REQ-19.

## Progress / blocker (2026-07-02)

Import reproduction of gigabytealchemy.ai started. Site authored on disk at `storage/sites/gigabytealchemy/` (theme + 8-section home page, verbatim copy, hero image + cinzel.woff2 mirrored). All 8 captured sections mapped to Tier-A modules.

**BLOCKED** on **REQ-23** — the storage schema cannot persist structured list content (object content values), so `services-grid` items, `contact-form` fields, and `footer` links fail `validateSite`; `1c render gigabytealchemy` errors on 5 modules. REQ-20 resumes once REQ-23 lands.

Secondary fidelity gaps logged for the backlog (not blockers): Cinzel wordmark / `@font-face` emission; card badges + ✓ checklists in `services-grid`; side-by-side dual forms (subscribe + contact); narrow left-aligned content column (`contentMaxWidthPx: 448`); footer background captured as `#ffffff` vs actual dark navy; footer link hrefs not captured.

## Progress update (2026-07-02, cont.)

**REQ-23 blocker cleared.** With the structured-list schema change landed, `1c render gigabytealchemy` now renders all 11 modules cleanly (header, hero, 4 text-blocks, 2 services-grids, 2 contact-forms, footer) — verbatim copy, exact palette bands, mirrored hero image.

**Critical legibility fix (config-only).** The hero rendered black text over the dark lab image (illegible). Fixed by setting the hero `surface: inverse` dial → white text, legible. Also set header `surface: inverse` → dark navy band matching the reference's dark top. Both are pure site-definition dial changes; no framework code touched.

**Current state:** desktop reconstruction reads as a faithful band-stack — correct content, palette, hero legibility, and footer all match the reference. Screenshot compared side-by-side against `storage/references/gigabytealchemy.ai/index/screenshot.full.png`.

**Remaining gaps to "indistinguishable" — all genuine module-capability gaps (NOT config-fixable; each needs its own framework ticket before this milestone's AC is met):**

1. **Cinzel gold wordmark** — reference header is "GIGABYTE ALCHEMY" in gold Cinzel serif, centered over the lab image. Needs display-font slot + `@font-face` emission (`cinzel.woff2` already mirrored).

2. **Header-over-hero shared image band** — reference header sits over the same lab image as the hero (one continuous band); our header is a separate dark band above the image. Structural gap.

3. **services-grid card treatments** — colored left borders (gold/blue per card), badge pills ("In development" / "Coming soon" top-right), and green ✓ checklists. Currently folded into markdown body as italics + • bullets.

4. **Callout treatments (text-block)** — green left-border callout ("These aren't just features…"), gold-border italic callout ("The Alchemy"), and the light-blue "What We're Exploring" card nested in the Building section.

5. **Side-by-side forms** — reference places subscribe (left) + contact (right) in two columns in one band; ours stacks them vertically. Needs a columns/layout capability.

6. **Narrow content column** — reference body sits in a narrower left column; our `landing` text-blocks use default width.

None of 1–6 can be closed from existing modules without raw CSS/HTML (forbidden). They are the flashy-/treatment-primitive backlog this milestone is meant to drive out. The desktop _content_ reconstruction is otherwise complete and legible.

## Fidelity-gap tickets filed (2026-07-02)

Gaps from the desktop-reconstruction assessment now tracked as framework-capability tickets:

- Gap #1 (Cinzel gold wordmark) → **REQ-24** (display-font slot + `@font-face` emission)

- Gap #2 (header-over-hero shared image band) → **REQ-25**

- Gap #3 (services-grid card treatments: accent border, badge pill, ✓ checklist) → **REQ-26**

- Gap #4 (callout treatments — green/gold left-border callouts, light-blue "Exploring" card): **accepted as-is for now** (operator decision) — not filed.

- Gaps #5 (side-by-side forms) and #6 (narrow content column): not yet filed.

REQ-20 (indistinguishable bar) remains open pending REQ-24/25/26; desktop _content_ reconstruction is complete and legible.

## Session close (2026-07-02, cont.)

**Draft site config committed** — `storage/sites/gigabytealchemy/` (`.draft-base.json`, `draft/site.json`, `draft/pages/home.json`, mirrored `assets/`, `history.json`) committed in `6d7d92f`. Site data/config only, no framework code, so outside the free-coding UAT cycle. Comparison screenshot `ours.desktop.png` and the `.xgd/tickets/search/` embeddings cache deliberately not tracked.

**New framework-gap tickets filed** (remaining deltas to "indistinguishable", none config-fixable):

- **REQ-27** (high) — `background` rendered inert when `surface` dial is set; they don't compose. Highest-value: bites _every_ band-stack site, not just this one. (This was the hero legibility workaround's root cause.)

- **REQ-28** (med) — `hero` heading colour/treatment dial (reference heading is gold accent, ours white under inverse surface).

- **REQ-29** (low) — `header` content-alignment dial (reference wordmark centered, ours left).

- **REQ-30** (low) — `services-grid` stacked full-width card variant (reference "Building" cards stack, ours side-by-side).

**REQ-20 status:** desktop _content_ reconstruction complete, legible, committed. Milestone AC ("indistinguishable") still open pending the capability tickets: REQ-24/25/26 (filed earlier) + REQ-27/28/29/30 (this session).

## Three desktop deltas closed (2026-07-02, cont.)

Per operator steer to batch small gaps, REQ-29 + REQ-30 were **consolidated into REQ-28** (now the umbrella "small module dials" ticket; 29/30 archived). REQ-28 implemented + `free_coded` (commit `70ff182`, v0.0.20, 9 UATs, quality green):

- Hero heading → **gold** (`headingTreatment: gold`), independent of the inverse surface's white text.

- Header wordmark → **centered** (`align: center`).

- "Building" grid → **stacked** full-width (`variant: stacked`).

gigabytealchemy `draft` updated to use all three and re-rendered. Remaining open deltas to "indistinguishable": REQ-25 (header-over-hero shared image band) and REQ-27 (background/surface compose — in flight). Callout treatments + narrow column still accepted as-is.


---

### Cycle — services-grid type scale + accent-mid role (v0.0.40, commit `ef43bea`)

Config-driven fidelity for the gigabytealchemy repro plus the two framework primitives it depends on:
- **`accent-mid` palette role** (dials + schema) — the wordmark gold→orange gradient now passes through a distinct mid hue from a palette role, matching the captured reference exactly.
- **services-grid `size` dial + per-card `size`** — cards run at the reference's larger scale and can mix a featured card with a quieter companion; consistent with hero / text-block `size`.
- gigabytealchemy draft config: gradient stops, gold hero subhead, grid sizes.

**Config ceiling reached at perceptual mean 19.12 / 255** (12 values-diff deltas). Every remaining delta is framework-level, not config — captured as the successor ticket [[REQ-45]] (left-aligned constrained column, heading/wordmark tracking, hero subhead line-height, contact-form submit-label foreground, form subhead/caption size). REQ-45 to be implemented separately. Tests: 25/25 `test_UAT_FC_REQ-20_*` pass.


---

## REQ-31: Fidelity verification loop: capture computed per-element values + mechanical values-diff

## Problem

Import reproduction (REQ-20) drifts at the **value level** — exact colours, font sizes, gradients, and treatments — and nothing catches it mechanically. In the gigabytealchemy pass, six value-level deltas (gold subhead rendered white, wordmark `text-7xl` rendered smaller, vertical vs horizontal wordmark gradient, green/amber callout bars rendered bold, footer `text-slate-400` vs cream) were all **explicit in the captured DOM** yet shipped wrong. They were missed because the repro was built screenshot-first and the capture was consulted only selectively.

Root cause is structural: two authored representations exist (the original's rendered DOM vs our module config) and **nothing reconciles them field-by-field**. Screenshots hide exactly this class of delta (near-neighbour colours like #F5E6A3 vs #FBBA72, 7xl vs 4xl, gradient *direction*, subtle left-bars, opacity/scrims), so the eyes gate can't be the safety net for it.

## Two parts

**1. Capture records computed per-element values (REQ-12 extension).**
Today `capture.json` recorded only 2 of the 6 flagged values; `raw.html` carried all six as inline styles / utility classes. The capture must emit a structured, per-section **expected-values manifest**: for each text/box element — colour (resolved hex), font-size, font-weight, line-height, letter-spacing, gradient (with direction + stops), border/left-bar treatment, padding/indent, opacity/scrim. Resolve Tailwind utilities and `var()` chains to concrete values at capture time (headless computed styles).

**2. Repro emits the same values and diffs them (REQ-13 extension).**
Render our reproduction, read *its* computed styles, and diff field-by-field against the manifest. Emit a ranked delta report (element, property, expected, actual) **before** human review. Vision is then reserved for what the manifest can't encode ("does the gradient read intentional," "is the composition right"), not for reading a hex.

## Acceptance criteria

- Given `storage/references/gigabytealchemy.ai/index/` (capture) and our rendered draft, the values-diff **flags all six known deltas** (subhead colour, wordmark size, wordmark gradient direction, the two callout left-bars, footer text colour).
- The manifest is structured data (not prose) and is the single artifact both the diff and a human can read.
- No false "match" when a near-neighbour colour differs (#F5E6A3 vs #FBBA72 must diff).

## Why this is the anti-recurrence fix

This converts the whole class of "font-size and colour you could just read off" from *missed-by-eye* to *mechanically-flagged*. It is the mechanism the successor runbook (new DOC How-To) depends on. Companion to [[DOC-13]] (capture/eyes), gates [[REQ-20]] / [[REQ-21]] fidelity.


---

## Implementation (as landed — commit 6fdd574, v0.0.23)

**Part 1 — capture records per-element values.** `ContentRun` (persisted in
`capture.json`) and the raw extraction gained optional per-element fields:
`lineHeightPx`, `letterSpacingPx`, `gradient` ({angleDeg, stops} — a text-fill
gradient normalized from `background-clip: text` background-image), `borderLeft`
({widthPx, color}), and `paddingLeftPx`. All read from computed styles in the
headless browser; Tailwind/`var()` already resolved. Fields are optional so
pre-REQ-31 bundles still parse.

**Part 2 — mechanical values-diff.** New module
`tools/generate/src/cli/capture/values-diff.ts`:
- `flattenCapture(capture)` / `flattenSignals(signals)` project either side to a
  flat **value manifest** — one element per verbatim text run, carrying its
  resolved styling. Verbatim text (captured exactly, DOC-13 §5) is the join key.
- `diffManifests(expected, actual)` aligns by text (FIFO queues so repeated
  texts pair in document order) and diffs each field, emitting a
  **severity-ranked** `ValueDelta[]` (missing/colour/gradient/border rank above
  weight/family above line-height/padding/letter-spacing). Only fields present on
  the expected (reference) side are compared. Colour compare is exact hex
  (case-insensitive) so near-neighbour golds diff; gradient direction compares
  angle within a 20° tolerance plus stop colours.

**Command** (`tools/generate/src/cli/fidelity.ts`):
`1c values-diff <slug> --ref <captureBundleDir> [--source draft|published]
[--out <file>] [--json]` — renders + serves the draft over loopback, reads *its*
computed styles through the same BrowserDriver seam the eyes loop uses, and diffs
against the capture. `--actual <manifest.json>` short-circuits the browser
(offline re-diff / CI without Chromium). Exits non-zero when any delta remains.

**Evidence** — `tests/req31-values-diff.test.ts` (12 UATs): the six known
gigabytealchemy deltas all flagged through the real command; faithful repro →
zero deltas; near-neighbour `#f5e6a3` vs `#fbba72` diffs; ranking; missing
elements; repeated-text alignment; gradient normalization; and real-Chromium
capture of gradient + left-bar out of the DOM (`tests/fixtures/capture/values.html`).

**Note / follow-on:** the existing `storage/references/gigabytealchemy.ai/index/`
capture predates the Part-1 fields, so a *live* diff there catches colour/size
deltas but not gradient/left-bar until the site is re-captured (`1c capture page`).
The diff degrades gracefully — it only compares fields the reference carries.


---

## Extension — verbatim text/casing delta (commit c7219d6, v0.0.25)

**Gap found and closed.** The diff aligned elements on a case-folded,
whitespace-collapsed join key (`norm()`), then compared only *styling* fields —
so a pairing that survived could still differ in **casing**, and the diff was
blind to it. This is exactly the third-instance gigabytealchemy miss: small-caps
"Gigabyte Alchemy" rendered as literal "GIGABYTE ALCHEMY" — a content delta both
screenshots and computed styles miss (fontFamily matches; only the text casing
is wrong). `DeltaProperty` had no member that could represent it.

**Fix.** Split the normal form into `collapse()` (trim + collapse internal
whitespace, **case-preserving**) and `norm()` (= `collapse()` lowercased, still
the join key). After pairing, compare `collapse(exp.text)` vs `collapse(act.text)`
case-sensitively and emit a new `text` delta (severity 95 — below `missing` 100,
above every styling field, since wrong content outranks wrong styling).
Whitespace-only formatting noise stays ignored because both sides collapse first.

**Evidence** — three new UATs in `tests/req31-values-diff.test.ts`:
casing delta flagged while the pair still matches (not "missing");
whitespace-only difference not flagged; `text` delta ranks above a colour delta.
Full suite green (189 tests).

**Still eyes-only (out of this text-run diff's scope, tracked on [[REQ-32]]):**
non-text treatments — the hero **scrim/overlay** and **content vertical anchor** —
are not text runs, so the manifest can't encode them and the diff can't flag them.


---

## Extension — section-level scrim + vertical anchor (commit 6db3069, v0.0.26)

**Second gap closed.** The manifest was text-run only, so treatments that belong
to a whole section rather than a text run — the hero **scrim/overlay** and the
**content vertical anchor** — could not be encoded, and both slipped through
eyes-only (the remaining two gigabytealchemy hero misses). `flattenCapture`/
`flattenSignals` ignored `section.background` and any notion of layout position.

**Capture.** `extract.ts` now, per band: (1) detects a **scrim** — a visible
full-bleed (≥60% cover) descendant painting a semi-transparent (0<alpha<1)
background, i.e. a *separate* `bg-slate-950/xx` overlay div that the band's own
background can never reveal; (2) measures a **content anchor ratio** — the text
content-box centre as a fraction of band height, from geometry, so `pt-80`
padding and flex `justify-end` read identically. `sections.ts` routes the scrim
onto `Background.overlay` (taking precedence over the gradient-in-image overlay)
and the ratio onto the new `Layout.contentAnchorRatio`.

**Diff.** `ValueManifest` gains a `SectionValues[]` slice aligned by **ordinal
index** (the hero is always §0; the caveat is that a segmentation mismatch on a
lower section has no counterpart and is skipped, not mis-reported). `diffManifests`
emits two new deltas: `overlay` (severity 82; colour exact + opacity within 0.1)
and `contentAnchor` (severity 65; ratio within 0.15, reported as e.g.
`bottom (0.82)` → `center (0.50)`). Section deltas are labelled `§<n>` / role
`section`.

**Evidence** — 7 new UATs in `tests/req31-values-diff.test.ts`: missing-scrim
flagged; scrim opacity tolerance ok + colour diff; anchor delta flagged; anchor
tolerance ok; scrim outranks anchor; and two **real-Chromium** tests capturing
the scrim (`#020617 @ 0.45`) and a low anchor (>0.6) out of a hero fixture
(`values.html`). Full suite 196 green; `tsc` clean.

With this, every one of the known gigabytealchemy misses — the six value-level
deltas, the casing slip, and now the scrim + anchor — is mechanically flagged;
nothing in that class is eyes-only anymore.


---

## REQ-32: Framework fidelity primitives surfaced by import (gradient direction, callout left-bar, hero scrim/anchor, cool-neutral role)

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


---

## REQ-33: Fresh diff-driven re-import of gigabytealchemy.ai (re-capture + values-diff to zero deltas)

## Goal

Re-import gigabytealchemy.ai **from scratch**, driven by the mechanical values-diff loop ([[REQ-31]]) and the runbook [[DOC-19]], targeting **zero deltas** before eyes. The previous hand-built reproduction has been moved to the gitignored sandbox tree (`storage/sandbox/gigabytealchemy`) so `sites/gigabytealchemy` is clean for a fresh build. Closes the remaining gap on the [[REQ-20]] milestone.

## Why now

The on-disk capture bundle (`storage/references/gigabytealchemy.ai/index/`, captured 2026-07-02 09:32) **predates REQ-31**, so it never recorded gradient direction, per-element sizes/left-bars, the hero scrim, or the content anchor. The first job is to **re-capture** so the diff has a complete reference. REQ-31 (+ casing and section-level scrim/anchor extensions) and REQ-32 primitives have all landed since the last attempt.

## Known deltas the fresh loop must resolve

Observed on the current (sandboxed) draft vs the original front page — each should now be **mechanically flagged** by `1c values-diff` once the reference is re-captured:

1. Title (wordmark) text smaller than original and positioned higher → `fontSizePx` + `contentAnchor`.
2. Title colour **gradient** not reproduced → `gradient` (angle + stops).
3. Subtitle "Intentional Software" too large and mis-placed → `fontSizePx` (fine sibling-relative position is not manifest-encoded — eyes to confirm).
4. Paragraph below: font a little small and rendered **white**, original is **gold** → `fontSizePx` + `color`.

## Procedure (per [[DOC-19]])

1. `1c capture page https://gigabytealchemy.ai/` — re-capture (writes a REQ-31-complete bundle under `storage/references/`).
2. `1c new gigabytealchemy` — fresh site in the tracked `sites/` tree.
3. Structure → values → treatment passes, transcribing from `raw.html`/`capture.json` (not the screenshot). Verbatim text incl. casing.
4. `1c render gigabytealchemy --source draft` → `1c values-diff gigabytealchemy --ref storage/references/gigabytealchemy.ai/index` — fix every delta and re-run until it exits clean.
5. `1c shot` + eyes for what the manifest can't encode (composition, does the gradient read intentional).

## Acceptance criteria

- A re-captured, REQ-31-complete reference bundle exists for gigabytealchemy.ai.
- `1c values-diff gigabytealchemy --ref <bundle>` exits **clean (zero deltas)** on the fresh draft.
- The four known deltas above are each resolved (verified in the diff output, then by eye).
- No new framework module was created without first exhausting generalization (CLAUDE.md rule); any framework-code change follows the free-coding process. Most of the work should be site-def/config.

## Notes

- Site-def / config / theme edits are exempt from the free-coding ceremony; only framework *code* changes need scope-ticket + UAT + `[FREE-CODED]` + version bump.
- If the diff surfaces a genuinely new capability gap, generalize an existing module before adding one, and file it against [[REQ-32]].


---

## REQ-35: values-diff noise reduction: per-metric tolerances + bad-capture handling

## Goal

Reduce values-diff **noise** so a "clean" result reflects real fidelity gaps, not sub-pixel / sub-step measurement jitter or bad reference data. Surfaced during the gigabytealchemy re-import ([[REQ-33]]): after all visible deltas were fixed, ~84 deltas remained, almost all noise.

## What was delivered

All noise controls live in `diffManifests` (`tools/generate/src/cli/capture/values-diff.ts`) with jitter-tolerant **defaults** and are fully configurable; the source-level capture fix lives in `extract.ts`.

**1. Per-metric tolerances** (replaced the single `sizeTolerancePx`):
- `fontSize` ±1px (viewport-clamp rounding)
- `lineHeight` **proportional**: `max(2px, 12% × expected)` — the largest jitter bucket, and inherently scale-dependent (4px is noise on a 72px heading, a real delta on a 14px caption); a purely-absolute tolerance can't tell them apart
- `letterSpacing` ±0.5px, `padding` ±1px, left-bar `border` width ±1px

**2. Font-weight bucketing** — `fontWeightTolerance` default 100: a 1-step nearest-loaded-weight snap (400↔500) is suppressed; a real 2-step choice (400↔600) still flags.

**3. Perceptual colour tolerance** — `colorTolerance` (redmean ΔE approximation), default 3: kills imperceptible ±1-per-channel rounding while keeping the flagship near-neighbour case — gold-vs-gold `#f5e6a3` vs `#fbba72` (ΔE ~113) — flagged. Deliberately tight so real off-by-one colour errors survive.

**4. `strict` mode** — zeroes every measurement tolerance for an exact-match pass (colour → exact hex). Structural tolerances (gradient direction 20°, scrim opacity 0.1, vertical anchor 0.15) are unchanged — they are not sub-step jitter.

**5. Bad-capture handling at source** — `extract.ts` marks a run `colorInferred` when its painted colour is unresolvable (transparent → falls back to the `#000000`/`#ffffff` sentinel). `diffManifests` never emits a hard **colour** delta against an inferred *reference* value. This clears the dark-footer / over-image-header false deltas that could never otherwise reach zero. `colorInferred` is an optional field on `ContentRun` (schema) so pre-REQ-35 bundles still parse; it flows capture → `ContentRun`/`ValueElement` → diff.

**CLI** (`1c values-diff`): `--strict` plus per-metric numeric overrides `--color-tol`, `--font-size-tol`, `--line-height-tol`, `--letter-spacing-tol`, `--padding-tol`, `--border-tol`, `--weight-tol`.

## Design decisions

- **Severity tiers** are handled implicitly: tolerances remove sub-threshold deltas entirely, so the existing severity-ranked list already surfaces signal first — no separate tier system was added.
- **Colour tolerance defaults tight, not loose.** The ticket's colour-noise class is the `#fff`/`#000` capture fallback, which is addressed by `colorInferred`, NOT by loosening colour matching. ΔE default 3 only removes true rounding; the gold-vs-gold guarantee is preserved (regression-guarded by a UAT).
- **line-height ratio** (`lineHeightToleranceRatio`, default 0.12) is exposed on the API but not given its own CLI flag; `--line-height-tol` sets the absolute floor. A future refinement could tune the ratio against more captures.

## Calibration note (for the operator)

Defaults are a sensible starting point, not a final calibration. The genuine REQ-33 residual line-height cases span 1–4px; `max(2px, 12%)` clears the clearly-proportional ones but a borderline 15–17% drift on small text will still flag — tune with `--line-height-tol` / the ratio against REQ-33's known-good result by eye. Per the ticket, tolerances must stay tight enough to catch a real off-by-one-step design error.

## Test plan

`tests/req35-values-diff-noise.test.ts` — 13 UATs (`test_UAT_FC_REQ-35_*`):
- typography jitter suppressed by default (fontSize, lineHeight incl. proportional behaviour, letterSpacing, nearest-loaded weight)
- `--strict` restores exact matching (surfaces the suppressed jitter); per-metric override widens one tolerance
- colour ΔE scale + imperceptible-rounding suppressed + **near-neighbour gold still flagged** (anti-over-loosening guard)
- inferred reference colour skipped vs confident colour still flagged
- real-Chromium capture proving `extract` emits `colorInferred` for a transparent-colour run and not for a solid one

Fixture: `tests/fixtures/capture/req35-inferred.html`. Full suite green (225 passed); REQ-31/REQ-33/capture regression scope green.

## Notes

- Owner-adjacent to [[REQ-31]] (the values-diff mechanism). Framework-code changes follow free-coding.
- Do NOT 'fix' fidelity by loosening tolerances so far that real regressions pass — tolerances must be tight enough to catch a genuine off-by-one-step design error. Calibrate against REQ-33's known-good result.


---

## REQ-37: 1c launcher script + quiet HMR-port collision

## Behavior

Make the `1c` CLI easy to invoke and quiet under concurrent use.

### 1. `bin/1c` launcher

A `bin/1c` shell wrapper dispatches to `tools/generate/bin/1c.mjs` so operators
type `1c <cmd>` instead of `node tools/generate/bin/1c.mjs <cmd>`.

- Resolves the repo root from the script's own location → works from any CWD.
- Deliberately preserves the caller's working directory (no `cd`): the CLI roots
  Vite at the repo but resolves `sites/`/`dist/` paths relative to CWD, so the
  wrapper behaves identically to invoking node directly.
- To type bare `1c`, add `bin/` to PATH or alias it (documented in-script).

### 2. HMR WebSocket disabled in the launcher's SSR server

The launcher's Vite SSR server no longer opens Vite's HMR WebSocket. Under
Vite 8 the ws server is gated on `server.ws`, not `hmr` — so `hmr: false` alone
left the server binding the fixed HMR port 24678. A long-running `1c serve`
holds 24678, which made every *other* `1c` invocation log a non-fatal
`[vite] WebSocket server error: Port 24678 is already in use`. Passing
`server.ws: false` returns Vite's no-op WebSocket stub; the CLI never needs HMR,
and `ssrLoadModule` is unaffected.

## Acceptance

- `./bin/1c list` runs from the repo root and from a subdirectory (CWD preserved).
- With port 24678 occupied (as by a running `1c serve`), `1c list` exits 0 and
  emits no "Port 24678 is already in use" error.

## Coverage

- `tests/req37-launcher.test.ts` → `test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port`
  spawns the real launcher with 24678 occupied and asserts exit 0 + no port error.


---

## REQ-38: Perceptual-diff eye: 1c diff (screenshot diff + ranked regions.json + crop triptychs) + 1c crop

## Goal

Add the **perceptual-diff eye** — a screenshot-to-screenshot fidelity check that complements the value-manifest diff ([[REQ-31]]). It renders + shoots our reproduction (reusing the [[REQ-13]] `1c shot` seam), diffs it against the captured reference screenshot, and emits a **severity-ranked `regions.json`** of automatically-derived regions of interest plus zoomed **ref / ours / diff crop triptychs** — so composition and geometry deltas the value-diff is structurally blind to are surfaced mechanically, ranked, and pre-cropped for the eyes.

## Why now (evidence)

Proven live on the faelan reproduction this session. The value-diff ([[REQ-31]]) called a reproduction "clean/excellent" while the following were plainly wrong to the eye — because [[DOC-19]] records **section-level anchor only, not per-element geometry**, so the manifest cannot see them:

- portrait rendered as an **ellipse** vs a **circle** (aspect/border-radius),
- collage photos at wrong **rotation / position / scale**,
- footer subtitle at a **few-px vertical offset** (doubled in the diff),
- a **soft-mask feather** artifact absent from the original,
- `© 2025` (original, hardcoded) vs `© 2026` (ours, dynamic year).

A throwaway `sharp`-only prototype (region-averaged diff + horizontal-band localizer + region crops) surfaced **every** one of these and drove the reproduction from mean-diff **20.78 → 3.26 / 255** in one worker pass. This ticket productizes that prototype. This is the perceptual sibling of the value-diff ([[REQ-31]]) and the eyes ([[REQ-13]], [[DOC-13]] §6).

## Behaviour

### `1c diff <slug> [--source draft|published] [--ref <bundle>] [--sandbox] [--out <dir>]`
1. Render → serve → shoot the draft (same seam as `1c shot` / `values-diff`), or accept a pre-shot PNG via `--actual <png>` (offline re-diff, no Chromium).
2. Crop both images to a **common top-anchored height** (reference and reproduction rarely match exactly — faelan was 1195 vs 1184).
3. Emit:
   - `diff.png` — raw per-pixel diff heatmap (max-channel, amplified).
   - `diff-blocks.png` — block-averaged heatmap (de-noises sub-pixel/registration jitter).
   - stdout summary — overall **mean diff / 255**, `% pixels > threshold`, and the horizontal-band profile.
   - **`regions.json`** — severity-ranked regions of interest (contract below), each with an auto-emitted **crop triptych** (ref / ours / diff) for the top-N regions.

### Regions of interest — derivation (the "simple definition")
Regions are **derived mechanically, never hand-authored**:
1. block-average the diff into an NxN grid (default 16px);
2. threshold blocks above a cutoff;
3. **connected-components** (flood-fill neighbours) the surviving blocks into clusters;
4. each cluster → bounding box (union of blocks, lightly padded) + **score = sum of block-diffs in the cluster** (captures both "large & faint" and "small & intense");
5. rank by score, keep top-N.

### `regions.json` contract
```json
{
  "ref": "<path>", "actual": "<path>",
  "dims": { "w": 1280, "h": 1184 }, "blockPx": 16,
  "meanDiff": 3.26, "pctOverThreshold": 2.0,
  "regions": [
    { "id": 1,
      "bbox": { "x": 928, "y": 40, "w": 240, "h": 240 },
      "score": 64.3, "meanDiff": 22.1, "area": 57600,
      "crops": { "ref": "…/region-1-ref.png", "actual": "…/region-1-ours.png", "diff": "…/region-1-diff.png" } }
  ]
}
```
Regions ranked by `score` descending.

### `1c crop <image> --box x,y,w,h [--out <png>]`
The magnifying glass — crop an **existing** image (reference, our render, or a diff) to a box for close inspection. Deliberately separate from `1c shot` (which takes a *live* screenshot); this operates on files already on disk.

## Design decisions
- **Sibling command `1c diff`, not a `--perceptual` flag on `values-diff`.** They share the render→compare→rank→report spine (factor that out) but read different inputs (computed styles vs pixels); overloading one command muddies both. Reuse the shared reporting/ranking helpers.
- **`sharp` for image ops.** Already in the workspace (pnpm store, 0.35.x) — resolve it properly as a declared dependency of the generate tool. No new install decision beyond declaring the dep. **Flag to operator before adding it to `package.json`.**
- Generalize before adding surface (CLAUDE.md): only `crop` is a genuinely new small primitive; `diff` is the new capability. No new framework *module* — this is CLI/tooling.

## UATs (`test_UAT_FC_<TICKET-ID>_*`)
- `_diff_reports_mean_and_bands` — a known ref/actual PNG pair yields the expected mean-diff and band profile.
- `_regions_derived_by_connected_components` — two separated hot patches on a synthetic pair produce exactly two ranked regions with correct bboxes.
- `_regions_ranked_by_score` — a large-faint patch and a small-intense patch rank in the correct score order.
- `_block_averaging_reduces_registration_noise` — a 1px-shifted image yields a lower block-averaged mean than raw (de-noise property holds).
- `_crop_extracts_box` — `1c crop` writes a PNG of the requested box dimensions from an existing image.
- `_diff_emits_region_crop_triptychs` — top-N regions each get ref/ours/diff crop files referenced in `regions.json`.

## Out of scope (later / other tickets)
- **Ignore-region mask** for known-dynamic areas (e.g. a live year) — design the region format so a mask can layer on later; execution belongs with [[REQ-35]] (noise reduction / tolerances).
- Auto-*fixing* deltas (the worker loop) — this ticket only *sees*; closing gaps stays operator/worker-driven.
- SSIM/structural metrics beyond block-mean — add only if block-mean proves insufficient.

## Notes
- Framework/tooling **code** → full free-coding ceremony (scope ticket + UAT + `[FREE-CODED]` + `bin/project/xgd_version_bump`). The faelan `home.json` edits it verifies against remain config-exempt.


---

## Implementation status (free-coded 2026-07-03, commit b76cf7f)

Landed as specified. Both commands live in `tools/generate/src/cli/perceptual.ts`,
wired into the `1c` CLI (`diff`, `crop`) in `cli/index.ts`. Core diff logic is
pure and browser-free (`computeDiff` / `deriveRegions`); `sharp` handles PNG
decode/encode/extract. `sharp@^0.35` is now a declared dependency of the generate
tool (package.json + lockfile committed with this change).

Design/impl decisions made during the build:
- **`regions.json` = the full report object** — carries the documented contract
  fields (ref, actual, dims, blockPx, meanDiff, pctOverThreshold, regions[] with
  id/bbox{x,y,w,h}/score/meanDiff/area/crops) **plus** the `bands` profile
  (additive; the stdout summary and the JSON share one object).
- **Region derivation** is 4-connectivity flood-fill over the block grid;
  score = Σ block-average across a component's cells; ranked desc, capped at
  `--top` (default 12).
- **Tuning defaults**: `--block` 16px, `--threshold` (per-pixel over-threshold)
  32/255, `--block-threshold` (region seed) 24/255, `--bands` 16, `--pad` 0.
  `padPx` defaults to **0** (block-aligned, predictable bboxes); `--pad` opts into
  the "lightly padded" bbox if desired.
- **`1c diff` exit code**: non-zero when ≥1 region of interest is found (a
  perceptual delta the operator must clear), mirroring `1c values-diff`.
- **`--actual`** for `diff` is a pre-shot **PNG** (offline, no Chromium), distinct
  from `values-diff`'s `--actual` which is a value manifest.

De-noise property (block-averaging vs registration jitter) is proven honestly:
the UAT asserts block-level over-threshold density is strictly lower than
pixel-level for a 1px-shifted stripe pattern (thin edge columns dilute below the
block threshold), rather than claiming the raw mean changes (block-averaging
leaves the mean invariant).

6 UATs `test_UAT_FC_REQ-38_*` in `tests/req38-perceptual-diff.test.ts`, all
browser-free. Regression scope (shot / capture / values-diff families + new
suite) green: 53 tests pass.

Out of scope (per ticket): ignore-region mask (REQ-35), the auto-fix worker
loop, SSIM/structural metrics.