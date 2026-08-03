---
uid: acceptance_criterion-bbf46516
id: AC-760
type: acceptance_criterion
title: A varying numeric axis carries a per-width track that owns it at render time
created_by: xgd
created_at: '2026-08-03T01:33:26.560025+00:00'
updated_at: '2026-08-03T02:03:12.732233+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A numeric axis that varies across the viewport ladder may be carried as a
**per-width track** instead of a single value, and the published page shows the
tracked value for the viewport it is being viewed at. A track is a list of
keyframes at declared ladder widths plus an optional per-segment
`interpolate | snap` flag, exactly as geometry keyframes are: the smallest
keyframe is the page's base value and holds below the ladder, each segment either
varies continuously between its two keyframes or holds the lower one until the
next breakpoint, and the largest keyframe holds above the ladder. The axes that
may be tracked are the numeric type axes — font size, line height, letter spacing
— and each padding side.

A track **owns its axis**: where one is present the single-valued form of that
axis is not also emitted, so the two can never fight in the cascade. An axis that
does not vary across the ladder stays a plain single value and gains no track, so
a static document is not bloated into a responsive one.

The envelope requires each keyframe to sit at a width the document declares, in
strictly ascending order, with its value inside that axis's own numeric range,
and the segment flags exactly one shorter than the keyframes.

## Verification
Render a document whose font size is tracked 36px at the ladder's smallest width
and 72px at its largest; observe the emitted CSS carries 36px as the base and the
per-breakpoint overrides above it, with no competing single-valued font-size
declaration, and that a viewport at the smallest width shows the mobile value
rather than the desktop one. Render a document whose line height is invariant and
observe a single value with no track. Submit a track keyframe at an off-ladder
width, one whose value is out of range, and a mismatched segment list, and
observe each is rejected.