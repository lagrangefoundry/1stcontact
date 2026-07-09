---
uid: request-b68d501b
id: REQ-35
type: request
title: 'values-diff noise reduction: per-metric tolerances + bad-capture handling'
created_by: xgd
created_at: '2026-07-03T17:59:56.532044+00:00'
updated_at: '2026-07-08T18:58:52.938629+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 5151cf72dcfcc78c432e252cfe7b0d55427f2e7c
  version: 0.0.32
  story_points: 4
---

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