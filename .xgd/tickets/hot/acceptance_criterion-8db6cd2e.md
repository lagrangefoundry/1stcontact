---
uid: acceptance_criterion-8db6cd2e
id: AC-1009
type: acceptance_criterion
title: A run that cannot wrap treats its captured width as a floor, so longer copy
  grows the box instead of vanishing
created_by: xgd
created_at: '2026-08-07T02:57:01.841951+00:00'
updated_at: '2026-08-09T05:41:46.985287+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A **text-like run that cannot wrap** at a given viewport width takes its captured
per-viewport width as a **floor**, not as a fixed size: at that width the
published page carries the captured pixel value as the run's *minimum* width and
no hard pixel width survives on the run, so the box — and the area its background
paints into — grows with its content when the copy is longer than the copy the
geometry was captured from. Copy longer than the captured box therefore renders
in full rather than being drawn outside the painting area and disappearing.

A run that still **wraps** at that width keeps its hard pixel width, because that
width is what decides its line breaks.

A `control` leaf is a text leaf carrying the same axes and is relaxed on the same
terms as a run.

## Verification

Render a document folded from a multi-width capture containing (a) a run that
renders on a single line at every width on the ladder and (b) a run that wraps at
every width. Parse the width declarations for each run's own rule rather than
substring-matching the stylesheet (a floor's declaration contains the fixed
declaration's text, so a substring check passes with or without the behaviour).
Observe the single-line run carries the captured pixel value as a minimum width
with no surviving hard pixel width, and the wrapping run carries only hard pixel
widths. In a real browser, render the same document with the single-line run's
text replaced by a longer string and observe the run's box and its painted text
extend to the full length of the new string.