---
uid: request-52fc5c06
id: REQ-53
type: request
title: 'values-diff: exact match by default for reproducible axes (supersedes REQ-35)'
created_by: xgd
created_at: '2026-07-12T23:16:00.331931+00:00'
updated_at: '2026-07-13T18:05:07.818399+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 1f625dff4fb8fdb731259dfe62a79394e4bee1f6
    reconcile_sha: null
    main_sha: null
  version: 0.0.97
  story_points: 3
  bundled_in: bundle-d9c2e655
---

## Goal

Make **exact match the default** in `1c values-diff` for every fidelity axis we
can precisely reproduce. Tolerance is retained **only** for values that are
genuinely not authorable — those that emerge from the browser/font in a way we
cannot set directly.

**This supersedes [[REQ-35]].** REQ-35 made the measurement axes *jitter-tolerant
by default* on the reasoning that a "clean" diff should hide sub-step noise. But
tolerance and a real-gap-we-chose-to-ignore are indistinguishable from the
outside: a 24px `position` tolerance silently hid an 8px left-margin error on the
gigabytealchemy re-import ([[REQ-52]]). The principle is inverted here:

> If we author an absolute value and the browser renders it verbatim, the diff
> must require an **exact** match. Fuzzy matching is justified **only** where we
> cannot reproduce what we see (font substitution we can't load, analog/measured
> art-direction). "Let's just get it right."

The behaviour already exists behind the `--strict` flag; this ticket makes it the
default and reclassifies the residual tolerant axes by reproducibility.

## Reproducibility classification

**Group A — directly authored scalars; browser renders verbatim; capture rounds
both sides identically → EXACT (default tolerance 0):**

| Axis | Old default | New default |
|------|-------------|-------------|
| `color` | 0.02 ΔEOK | 0 (exact hex) |
| `fontSizePx` | ±1 | 0 |
| `fontWeight` | ±100 | 0 (reported computed weight = authored, even if the painted face snaps) |
| `letterSpacingPx` | ±0.5 | 0 |
| `lineHeightPx` | ±2 / 12% | 0 (authored px renders verbatim) |
| `paddingLeftPx` | ±1 | 0 |
| `borderWidthPx` | ±1 | 0 |
| `borderRadiusPx` | ±4 | 0 |

**Group B — deterministic layout → EXACT (default 0, allow ±1 only for integer
rounding of the captured box):**

| Axis | Old default | New default |
|------|-------------|-------------|
| `position` (x, y) | ±24 | 0 (±1 rounding) |

**Group C — genuinely not authored; tolerance legitimate and RETAINED (documented):**

- `size` **height** — emerges from text wrapping × font metrics; only exact when
  the font itself is reproduced. **Split `size`:** width becomes EXACT (Group B —
  determined by the container), height keeps a small documented tolerance.
- gradient angle / overlay opacity / content anchor — art-directed, measured
  perceptually, never authored precisely (already excluded from `--strict`; stay).

## Requirements

1. Flip the default measurement tolerances for Groups A and B to exact (0), with
   an allowance of ±1px on `position` for integer rounding of the captured box.
2. Split the combined `size` axis into `width` (exact, Group B) and `height`
   (retains a small documented tolerance, Group C).
3. `lineHeightPx` is EXACT by default (author explicit px to close a genuine
   substitution gap; do not tolerate silently).
4. Retain the art-directed tolerances (gradient angle, overlay opacity, content
   anchor) — these are not measurement jitter.
5. Keep the per-metric override flags (`--color-tol`, `--line-height-tol`, …) as
   escape hatches for the rare unavoidable font-substitution case, and provide a
   single opt-out that restores loose matching (e.g. `--tolerant`) for that case.
   `--strict` becomes redundant with the new default (remove it or make it a
   no-op alias — no legacy dual-mode).
6. Update the [[REQ-35]] test suite to the new policy: jitter/measurement deltas
   are **caught** by default; the tolerant behaviour is asserted only under the
   explicit opt-out / per-metric override. Preserve the genuinely-useful REQ-35
   behaviours that are orthogonal to tolerance (dynamic-year mask, inferred-colour
   suppression, systemic-aggregation).

## Acceptance criteria (UATs)

- `test_UAT_*_exact_match_default_intrinsic` — a 1px font-size / 1-unit weight /
  1px line-height / near-neighbour colour delta all FAIL by default (were passing
  under REQ-35 jitter tolerance).
- `test_UAT_*_position_exact_default` — an 8px position (margin) delta FAILS by
  default; a 1px integer-rounding delta does not.
- `test_UAT_*_size_width_exact_height_tolerant` — a small width delta FAILS while
  an equal-magnitude height delta within the documented wrapping tolerance passes.
- `test_UAT_*_art_directed_still_tolerant` — gradient angle / overlay opacity /
  anchor within their tolerances still pass by default.
- `test_UAT_*_tolerant_optout_restores_loose` — the opt-out flag restores the old
  loose matching for an unavoidable substitution case.

## Notes

- No legacy dual-mode: replace the default, delete `--strict` special-casing;
  git history is the archive.
- Motivating evidence and the full split live in [[REQ-52]] (the gigabytealchemy
  re-import that surfaced the hidden margin) and the methodology in [[DOC-19]].

-