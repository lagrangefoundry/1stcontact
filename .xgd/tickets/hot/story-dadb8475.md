---
uid: story-dadb8475
id: STORY-68
type: story
title: Exact-match-by-default fidelity comparison tolerances
created_by: xgd
created_at: '2026-07-13T20:00:16.443995+00:00'
updated_at: '2026-07-13T20:09:23.042875+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-7c7e5ec4
  story_kind: feature
  story_points: 2
---

## Story
**As a** site-reproduction operator (or the AI reproducing a captured site),
**I want** the fidelity value comparison to require an **exact** match by default
on every axis I author directly and the browser renders verbatim — colour, font
size, font weight, line-height, letter-spacing, left padding, border width,
corner radius, element position, and box width — retaining tolerance only on the
genuinely emergent axes (box height from text wrapping, and the art-directed
gradient angle / overlay opacity / content anchor), with a single opt-out that
restores loose matching wholesale and per-axis override flags that loosen just
one axis, **so that** a real fidelity gap on a value I authored can never hide
behind a measurement tolerance (the way a loose position band once silently hid
an 8px hero-margin error).

## Description
Previously the comparison was jitter-tolerant by default: each measurement axis
carried a loose band so a "clean" diff would hide sub-step measurement noise. But
a tolerance and a real-gap-we-chose-to-ignore are indistinguishable from the
outside, so genuine errors on authored values were suppressed. This story inverts
the policy — **exact by default; fuzzy only where we cannot reproduce what we
see** — classified by reproducibility:

- **In scope:**
  - **Group A** (directly-authored scalars: colour, font size, font weight,
    line-height, letter-spacing, left padding, border width, corner radius) —
    exact by default: any perceptible difference produces a delta.
  - **Group B** (deterministic layout: element position, box width) — exact by
    default with a ±1px allowance for integer rounding of the captured box.
  - **Group C** (genuinely emergent: box height from text wrapping × font
    metrics; and the art-directed gradient angle, overlay opacity, content
    anchor) — a documented tolerance retained by default.
  - The combined width+height size axis is **split** so a real width gap cannot
    hide behind the wrapping allowance that height legitimately needs.
  - A single **tolerant opt-out** that restores the old loose bands wholesale for
    the rare unavoidable font-substitution case.
  - **Per-axis override** flags (colour, position, width, height, corner-radius,
    …) that loosen exactly one axis and take precedence over both the exact
    default and the tolerant opt-out.
  - Exact policy is the **default and only** mode; there is no separate
    strict/exact toggle (no legacy dual-mode).
- **Out of scope:** the object-grouped report layout and presentation
  (STORY-67); the orthogonal REQ-35/REQ-48 behaviours preserved independently of
  tolerance (dynamic-year mask, inferred-colour suppression, systemic
  aggregation).

## Technical Context
Supersedes the prior jitter-tolerant default policy (REQ-35). This story governs
**what counts as a mismatch**; it composes with the fidelity value-diff report
(STORY-67, same capability CAP-56), which governs **how** the comparison is
displayed. The art-directed Group C tolerances (gradient angle, overlay opacity,
content anchor) are perceptual/measured and are held tolerant regardless of the
opt-out. Box height retains a documented wrapping tolerance sized to absorb
per-line metric rounding while still catching a whole extra wrapped line.

Intent chain: REQ-53 body (primary) + COMMENT-96. Implementation is consistent
with the intent, including the requirement to remove the legacy exact-match flag
rather than keep a dual mode.

## Dependencies
Depends on plan item 1 (STORY-67, object-grouped fidelity comparison report) —
this story's exact defaults are surfaced through that comparison's per-object
parameter rows.

## Story Points
2