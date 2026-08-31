---
uid: comment-546ad063
id: COMMENT-518
type: comment
title: Comment on bug BUG-24
created_by: xgd
created_at: '2026-07-25T01:39:30.194435+00:00'
updated_at: '2026-07-25T01:57:20.979797+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c50fdfcc
  kind: chat_transcript
---

<!-- xgd-turn id="5b73ca2f-b25f-4980-aa2d-76c6e6eafa28-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T01:39:28.118573+00:00" -->
#### You
Please free code this fix

<!-- xgd-turn id="5b73ca2f-b25f-4980-aa2d-76c6e6eafa28-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T01:57:20.945596+00:00" -->
#### Claude
I'll start by reading the ticket and understanding the current state.

BUG-23 is already fixed (`e6073688`). Let me investigate the colour representation across the pipeline.

The L1 schema already permits `#rrggbbaa`. The flattening must be upstream. Let me trace capture → fold → render.

Key area found. Let me read the extract colour helpers in detail.

There's already a band-level `overlayOf` scrim capture. Let me check what the per-element value set records, and the state of the reproduction.

48 `overlay` keys exist in the capture. Let me look at what's actually recorded for the hero band and what the fold does with it.

Working directory drifted from my earlier `cd`. Let me use absolute paths.

Confirmed: section 1 is the hero (y 0..800 @1280) with `overlay: null`, yet `raw.html` has the veil. Let me find why `overlayOf` misses it.

Root cause confirmed precisely. The veil CSS is `color-mix(in oklab, var(--color-slate-950) 30%, transparent)` — computed as `oklab(… / 0.3)`, which `overlayOf`'s legacy `/rgba\(…\)/` regex cannot match. Let me verify the rest of the pipeline already supports overlay.

The L1 overlay axis exists end-to-end (schema + render). Let me check whether the fold carries capture's section overlay into it.

The fold ignores `sections[].overlay` entirely. Let me read both sides precisely.

The projection carries `overlay` end-to-end; capture never detects it and the fold ignores it. Let me check paint ordering and the current folded output.

Confirmed: `section-band-0` (opaque) paints *under* `section-bg-0` (the image), and no veil node exists. Let me check the test setup and confirm `overlayOf` is the sole producer.

Let me read the closest analogue test (BUG-13, same fold function) for conventions.

I have a complete picture. Let me confirm Chromium is available for the real-browser UAT, then update the ticket before coding.

Chromium is available and there's an existing `req52-oklch.html` fixture precedent. Now let me make the two fixes.

Now the fold, so a captured scrim actually round-trips into L1.

Now the UAT suite.

Five pass — including both real-Chromium capture UATs. The render assertion failed on shape: `renderL1Document` doesn't return a string.

All 6 pass. Let me prove the tests actually discriminate by reverting each fix in turn.

Both fixes are individually necessary. Now the regression scope.

All green. Let me verify against the real motivating instance — capturing to a temp dir so the stored oracle bundle isn't overwritten.

Let me run the live verification under vitest (which handles the `.astro` transitive import), using a temporary file I'll remove.

Direct confirmation on the real motivating instance — the hero band (y 0..800) now captures `overlay={"color":"#030717","opacity":0.3}` where it was `null`. Let me clean up and verify types.

Typecheck clean. Now the full suite.

Two failures. Let me see both in full and determine whether they're mine.

`req92` fails pre-existing (not mine). But `req31`'s existing scrim UAT is my regression. Let me look.

The existing REQ-31 fixture uses `rgba(2,6,23,0.45)`, which the old regex read exactly; the canvas *pixel* probe must unpremultiply and loses a level per channel. Rather than loosen a calibrated assertion, let me make the probe exact.

REQ-31's exact assertion passes again. Let me re-check the live site to see if the scrim now resolves exactly.

Chrome's `color-mix` serialization still isn't exact-parseable. Let me find out what it actually returns.

`playwright` isn't a root dep — and chasing wide-gamut serialization is beyond this bug. The residual is ≤1 level per channel (invisible, and self-consistent across both sides of the diff); I'll record it in the ticket. Let me confirm the full suite.

Only the pre-existing `req92` failure remains (confirmed unrelated by the earlier stash check). Now typecheck and version bump.

Now let me update the ticket body, preserving the original content and recording what was actually found.

Done — BUG-24 is at `free_coded`, tree clean.

## What the bug actually was

Your ticket's hypothesis was that **L1 colour axes can't express alpha**. That turned out to be wrong, and worth correcting: `l1Color` already accepted `#rrggbbaa`, `l1OverlaySchema` already existed as a box axis, and the renderer already layered it above the background image. The entire overlay axis was in place and simply unreachable. Two upstream gaps, either of which alone loses the veil:

1. **Capture never detected it.** `overlayOf` matched the computed background against a raw `/rgba\(…\)/` regex. The site's CSS is `color-mix(in oklab, var(--color-slate-950) 30%, transparent)` — Chromium computes that to a modern-syntax colour the regex can't read, so *every* `color-mix`/`oklab`/`oklch` scrim was silently skipped. `overlayOf` was the last colour site still using the legacy regex instead of `rgbaOf` (the REQ-52 canvas probe).

2. **The fold never carried it.** `SectionValues.overlay` was projected end-to-end all along, but `foldSectionBackgrounds` read only `backgroundImageUrl`.

No renderer change was needed. Per the CLAUDE.md rule I closed this in the existing L1 axis rather than adding a new one — the axis existed; the plumbing didn't.

## Verified on the real instance

Live re-capture of gigabytealchemy (into a temp dir — I did **not** overwrite your stored oracle bundle): the hero band now captures `overlay={"color":"#030717","opacity":0.3}` where it captured `null`. Each fix was proven necessary by reverting it independently.

## One thing I changed beyond the minimal fix

Routing `overlayOf` through the canvas probe broke REQ-31's calibrated scrim UAT (`#020617` → `#020716`): painting a *translucent* fill stores premultiplied bytes, and `getImageData`'s unpremultiply loses a level per channel. Loosening a pre-existing exact assertion to accommodate my change would have degraded evidence, so I made `rgbaOf` prefer the canvas `fillStyle` serialization (lossless) over the pixel probe. REQ-31 passes exactly again.

A bounded residual remains: Chromium serializes `color-mix(in oklab, …)` in a wide-gamut form the exact parser doesn't read, so that path still lands on `#030717` vs the authored `#020618` — ≤1 level per channel, ~0.3/255 composited at 30% alpha, and self-cancelling since both sides of a values-diff use the same capture path. Extending the parser to `color(srgb …)` would close it; I judged that gold-plating and recorded it in the ticket instead.

## Status against your ACs

AC1, AC2, AC4 are done. **AC3 is not** — the hero diff regions #7/#8/#9/#12 have not been re-measured. That needs a full reproduction round (re-capture the oracle, re-fold, re-render, `1c diff`), which is a REQ-88 repro pass rather than part of this code fix. It's flagged explicitly in the ticket body so it isn't mistaken for done.

## Tests

- `tests/bug24-scrim-alpha.test.ts` — 6/6 (4 fold/render, 2 real Chromium), plus negative controls so the probe is proved to discriminate.
- Full suite: **732 pass, 1 fail**. The failure is `req92-image-box-fold > test_UAT_FC_REQ-92_form_controls_stay_residuals`, which I confirmed **pre-existing** by stashing both fixes and re-running — unrelated to this ticket, and still failing on your tree independently of this work.
- `tsc --noEmit` clean across `tools/generate`, `packages/framework`, `packages/site-schema`.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->