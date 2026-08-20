---
uid: acceptance_criterion-b5cd02d4
id: AC-1316
type: acceptance_criterion
title: A band overlay in any browser-understood colour syntax is captured with alpha
  preserved, via the lossless-serialization probe
created_by: xgd
created_at: '2026-08-20T04:39:15.823530+00:00'
updated_at: '2026-08-20T06:58:46.826762+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A band's overlay scrim is captured through a **browser-accepted-colour probe**, with alpha preserved, for any colour syntax the engine understands — not a legacy `rgba(...)` regex.

- A band overlay authored in each modern syntax — `color-mix(in oklab, …)`, `oklab()`, `oklch()`, `color()` — is captured as the band's overlay **with its alpha preserved**, not silently skipped. Under the regex, every such veil (what a `bg-slate-950/30` utility now computes to) was unreadable, so the band recorded `overlay: null` and a captured value set contained no colour carrying alpha anywhere. An absent scrim reads as "no veil" rather than "unknown", which is the silent-skip failure this closes.
- The probe **prefers the colour's lossless serialization** over a painted pixel read-back: painting a translucent fill stores premultiplied bytes, and un-premultiplying loses up to a level per channel. A serialization the probe cannot read falls through to the pixel probe, so the preference only ever adds precision and never narrows what resolves.
- A string that is not a valid colour resolves to nothing rather than to a default.
- Fully opaque and fully transparent fills are still not scrims, so neither is recorded as an overlay.

This is what AC-816's translucent-fill backdrop exclusion depends on: if the overlay is null, the scrim is not "already recorded" as the band's overlay, and the exclusion drops it entirely.

## Verification
Capture a page whose hero band carries a translucent overlay authored, in turn, as `color-mix(in oklab, …)`, `oklab(… / .3)`, `oklch(… / .3)` and `color(srgb … / .3)`; assert each is recorded as the band's overlay with a non-1 alpha. Assert the recorded channel values for a translucent overlay are exact against its declared colour (the lossless-serialization path), not the premultiplied-round-trip values a pixel read-back would produce. Assert an opaque fill and a fully transparent fill are not recorded as overlays, and an invalid colour string resolves to none. Then capture that same modern-syntax scrim as a full-bleed fill and assert AC-816's translucent-fill exclusion drops it from the backdrop index *because* it is present as the band's overlay.
**Evidence gating.** Only a real engine resolves `color-mix()` / `oklab()` /
`oklch()` / `color()` (jsdom's `getComputedStyle` returns a modern-colour-space
token verbatim), so the modern-syntax bullet and the lossless-serialization
precision bullet are browser-gated and skip where no Chromium is provisioned. The
engine-independent half — alpha preserved on a resolvable translucent fill, an
opaque fill and a fully transparent fill refused, an invalid colour string
resolving to nothing, and a veil that does not blanket the band refused — runs
headlessly over the real `EXTRACT_SCRIPT`, so this criterion contributes
assertions in every run.