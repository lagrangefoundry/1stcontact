---
uid: request-5fb63a3a
id: REQ-38
type: request
title: 'Perceptual-diff eye: 1c diff (screenshot diff + ranked regions.json + crop
  triptychs) + 1c crop'
created_by: xgd
created_at: '2026-07-03T21:21:55.753022+00:00'
updated_at: '2026-07-08T18:58:54.608934+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - b76cf7f9232f559f46344e4c6140ce7a1c86cd16
  version: 0.0.38
  story_points: 3
---

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