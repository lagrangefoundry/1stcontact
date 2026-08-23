---
uid: bug-c50fdfcc
id: BUG-24
type: bug
title: Colour alpha is not representable in the captured value set — translucent overlays
  (hero veil) flatten to opaque fills
created_by: xgd
created_at: '2026-07-24T22:51:43.884923+00:00'
updated_at: '2026-08-05T17:38:10.449242+00:00'
completed_at: '2026-08-05T17:38:10.449242+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 5140f4acc4c4e178da162224864d0a3b9cc5aa4a
    reconcile_sha: null
    main_sha: null
  version: 0.0.197
  story_points: 3
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-546ad063
---

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