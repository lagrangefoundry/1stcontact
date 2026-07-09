---
uid: request-d06126ef
id: REQ-27
type: request
title: Section background rendered inert when surface dial is set
created_by: xgd
created_at: '2026-07-02T21:52:26.172199+00:00'
updated_at: '2026-07-09T21:43:05.368500+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - b2cef0786277e18bc8dec1a93f6f320d431f9e4f
  version: 0.0.19
  bundled_in: bundle-adc60ee8
---

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