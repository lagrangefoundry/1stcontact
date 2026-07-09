---
uid: comment-a92a23dd
id: COMMENT-66
type: comment
title: Comment on doc DOC-21
created_by: xgd
created_at: '2026-07-08T19:20:57.060279+00:00'
updated_at: '2026-07-08T19:20:57.060279+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: doc-27a1e5be
  kind: note
---

## Worked-example findings — run 1 (joyfulculinary, REQ-36)

Ran the loop by hand end-to-end. Numbers and lessons to fold into the process:

**Fidelity trajectory:** config ceiling 64.57 → 46.20 / 255 across 3 framework changes
(bare cards −18, gold headings ≈0 on the mean but a real correctness fix, uppercase+CTA −0.5 but a big *hero* win).

**§4 (Good-Enough) — validated the design, exposed a calibration gap:**
- Region-worst matters more than the mean: gold headings barely moved the mean (small area) yet are a genuine eye-fix. Confirms the vector gate + saliency weighting; a pure scalar-mean gate would have mis-ranked this work.
- **Thresholds are still un-calibrated** — no anchor set yet, so "good enough" can't be declared automatically. This run's 46.20 is clearly *not* good enough by eye, but we have no calibrated T to prove it. Priority: build the anchor set.
- **A confound the doc must call out: vertical misalignment poisons the metric.** The diff is pixel-aligned and single-viewport; when our page height ≠ the reference (4504 vs 4744), every band below the first drift compares against the wrong reference pixels, so per-band colour edits can *raise* the mean even when locally correct. The gate needs either band-anchored comparison or a pre-align step before per-region scores are trustworthy. **Tooling gap.**

**§5 (attribution ladder) — self-correction worked:**
- The green testimonials: I jumped to `surface: panel` (rung 4) without reading the structure. The diff *regressed* (46→53) and the overlay showed the band is an **inset** card on white, not a full band — a rung-6/structural gap, not a surface value. Reverted. **Lesson: read the region overlay for STRUCTURE before attributing a colour/surface gap — add an explicit "check structure (inset/bleed/position) first" step to §5.**

**Process ergonomics:**
- Each framework change = ~1 dial across 1–3 modules + a colocated UAT + re-diff. Clean and fast. The `values-diff`/`1c diff` seam works.
- Missing a `headingWeight` dial surfaced immediately (Oswald-200 reference vs hardcoded bold) — the kind of gap the loop is meant to enumerate.
