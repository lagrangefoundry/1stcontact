---
uid: request-096194df
id: REQ-45
type: request
title: Framework last-mile fidelity primitives surfaced by the gigabytealchemy perceptual
  diff (left-aligned column, heading/wordmark tracking, hero subhead line-height,
  submit-label foreground, form subhead/caption size)
created_by: xgd
created_at: '2026-07-04T17:25:37.620345+00:00'
updated_at: '2026-07-09T23:59:26.440789+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  commits:
  - 111d3c5924e54c56f3ae8f8c3d49bc1f16142e65
  - a96677a7ecf66bf3c482678df92ac89bf13d53af
  version: 0.0.42
  bundled_in: bundle-df065afc
---

## Scope

Generic, reusable **framework capabilities** the gigabytealchemy repro needs to close the *last mile* of fidelity but cannot yet express. Surfaced *by* — not scoped *to* — the import: each applies to any site. Successor to [[REQ-32]] (which closed gradient / scrim / anchor / cool-neutral); this ticket covers the primitives the **perceptual diff** ([[REQ-38]] `1c diff`) and the **values-diff** ([[REQ-31]]) flag after config is exhausted.

**Explicitly out of scope: site-specific values.** Exact tracking (−1.8 / −0.9), exact line-heights, the exact white button label, exact column width — those are *config* under the site milestone [[REQ-20]] and are already flagged mechanically by the values-diff. This ticket is only the missing **expressiveness**.

## Evidence (config ceiling reached)

At the current config ceiling the gates read **perceptual mean 19.12 / 255** (12 regions) and **12 values-diff deltas**. Every remaining delta is framework-level, not config:
- Hero fold anchor is a no-op (content already exceeds the fold — no empty band to anchor into).
- Wordmark size already matches (72px) and the gradient stops are an exact match; residual heat is tracking + weight.
- The dominant perceptual heat (regions #1/#2/#3/#5 — the Building/mission blocks and the footer strip) is **cumulative vertical drift**: our centered 72rem column is wider than the reference's left-aligned column, so text wraps into fewer lines and the page runs ~90px short.

## Capabilities

1. **Left/start-aligned constrained content column** *(dominant — fixes the vertical drift lighting up 6+ regions).* Today a narrower container (`narrow`/`default`/`wide`) is always **centered**, so constraining the column shifts it inward, away from the page's left gutter — which is why narrowing regressed the diff. Add a **start-aligned** option so a section can carry a narrower content max-width that stays pinned to the left gutter (aligned with the header/hero content edge). Reference content is a ~896px column left-aligned at the gutter; ours is a centered 1152px column. Matching width + alignment makes the paragraphs wrap identically and the page height converge. *(Driver: gigabytealchemy body column; generalizes the container/section, no new module.)*

2. **Structured letter-spacing (tracking) on hero heading + header wordmark.** Both are currently hardcoded to `0`; the reference uses tight tracking (wordmark −1.8 `tracking-tight`, hero heading −0.9). Add a token-backed `tracking` treatment (closed enum → em) on the hero heading and the header wordmark. *(Value is config; this is the knob.)*

3. **Hero subhead line-height control.** The hero subhead line-height is hardcoded (`--line-height-relaxed`); the reference reads a tighter value. Expose the subhead line-height as a dial/treatment so it can be set independently of the global relaxed token.

4. **Contact-form submit label foreground.** The submit button label inherits a surface tint (renders cream `#e8dfd3`/`#f7f4ee`) where the reference is a legible on-primary **white**. Generalize `submitTreatment` to carry a proper foreground role rather than deriving the label color from the surface. *(Value config; the gap is that a legible foreground can't be expressed.)*

5. **Contact-form subhead / caption size.** The form subhead ("Join our mailing list…") and small captions ("More to come…") are fixed at one size; the reference varies them (18 / 14). Add a size dial on the contact-form subhead (and the caption slot) so these can be set per the reference.

## Notes

- Bundled per the "fewer, generic tickets" preference; each is a small primitive. Split only if one grows.
- Capability 1 is the high-leverage item — it collapses the cumulative vertical drift that dominates the perceptual heat. Capabilities 2–5 are localized typography/color fidelity.
- Reusable across all sites and the future builder; gates [[REQ-20]] / [[REQ-21]] fidelity. The runbook [[DOC-19]] points here for "known still-missing capabilities."

## Implementation note

Implement each by **generalizing the existing module/primitive**, not by adding a new one (CLAUDE.md "Generalize Modules Before Adding New Ones"): (1) start-aligned column → a container/section alignment option; (2) tracking → hero-heading + wordmark treatment; (3) subhead line-height → hero dial; (4) submit foreground → generalize `submitTreatment`; (5) subhead/caption size → contact-form dials. No new modules expected. All token-backed, `.strict()` preserved, no raw CSS reaching the page.

## Acceptance

- A section can render a **start-aligned narrower column** pinned to the left gutter; the gigabytealchemy body column matches the reference's width + left edge, and the perceptual mean drops (vertical drift regions collapse) — measured via `1c diff` as the guardrail.
- Hero heading + wordmark can carry token-backed `tracking`; hero subhead line-height is settable; contact-form submit label can render a legible on-primary foreground; contact-form subhead/caption size is settable.
- `test_UAT_FC_<TICKET>_*` cover each capability's emitted custom property / class, with default fallback unchanged when the dial is absent.


## Implementation (delivered — commit 111d3c5, v0.0.41)

All five capabilities landed as generalizations of existing modules (no new modules), token-backed, `.strict()` preserved, each dial defaulting to prior behaviour so a site that omits it is unchanged:

1. **Start-aligned content column** — `contentWidth` dial (`default`/`narrow`/`wide`) on **text-block** and **services-grid**. Caps the content *within* the section's full-width frame; the flex cross-start pins a narrow column to the left gutter (the header/hero content edge). `default` fills the frame → unchanged fallback.
2. **Tracking** — `tracking` dial (`normal`/`tight`/`tighter`) on the **hero heading** and **header wordmark**, backed by new `--tracking-*` typography tokens (`0 / -0.025em / -0.05em`). `normal` emits no override, so a display wordmark keeps its font-face tracking.
3. **Hero subhead line-height** — `subheadLeading` dial (`tight`/`normal`/`relaxed`) on the hero, mapped to `--line-height-*`. `relaxed` preserves the prior value.
4. **Submit-label foreground** — `submitForeground` dial (`auto` + palette roles incl. `bg`) on **contact-form**; paints the label a framework-computed `var(--color-<role>)` (e.g. `bg` = legible white) instead of inheriting a surface tint. `auto` keeps the treatment's colour.
5. **Contact-form subhead / caption size** — `subheadSize` + `captionSize` dials and a `caption` markdown content slot.

Token surface: +3 `--tracking-*` custom properties. The `tracking` typography-token group uses a schema `.default()` so themes predating it keep validating while the resolved type stays required.

**Tests:** `tests/req45-fidelity-primitives.test.ts` (19 UATs, `test_UAT_FC_REQ-45_*`) — each capability's emitted class/inline-property + the unchanged default; plus the `--tracking-*` token emission. The REQ-4 token-count UATs were updated 61→64 for the new tokens. Full suite green except two **pre-existing** REQ-20 failures (`framework-content-modules` card-count, broken by REQ-20's `card-size-*` class in ef43bea — confirmed failing at HEAD independent of this work).

**Guardrail note:** per the ticket's own out-of-scope clause, the gigabytealchemy site JSON was **not** modified here — wiring these dials with the exact site values (56rem column, −1.8/−0.9 tracking, white label, 18/14 sizes) and re-measuring `1c diff` is REQ-20 config.


## Follow-up (commit a96677a, v0.0.42)

Fixed the two `framework-content-modules` card-count UATs that were failing at HEAD: REQ-20's per-card `card-size-*` class made the card attribute `class="services-grid__card card-size-md …"`, breaking their exact `class="services-grid__card"` match. Now matched by the leading class token. **Full suite green (268 passed, 0 failed).** Folded into REQ-45 per operator direction ("if you break it, you fix it, in this ticket").