---
uid: request-7756b2e8
id: REQ-80
type: request
title: 'Capture: extract per-element Elementor band backgrounds (values-diff blind
  to per-band bg)'
created_by: xgd
created_at: '2026-07-19T18:08:22.638123+00:00'
updated_at: '2026-07-20T21:05:12.858438+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
---

## Problem

The capture pipeline collapses an Elementor page (e.g. joyfulculinarycreations.com) to a single "section" because Elementor's per-band backgrounds live in element-id-scoped rules in `post-<id>.css` (e.g. `.elementor-element-abc123 { background-image/background-color }`), not on structural section elements. As a result:

1. Section segmentation sees one flat band → the whole page reads as one white section.

2. `values-diff` has no per-band background elements to compare → it is BLIND to per-band background colour/image/scrim differences.

## Impact (why this is NOT a fidelity blocker)

- The reproduction is authored correctly by hand-transcribing band backgrounds from the post CSS.

- The now-unblocked drift-aligned perceptual gate (`1c aligned-crops`, REQ-78/REQ-79) sees the rendered backgrounds pixel-wise, so correctness IS covered.

- This is a DIAGNOSTIC-COMPLETENESS gap in the mechanical values-diff, not a reproduction blocker. Lower priority than the perceptual gate.

## Proposed path

1. Teach the capture extractor to resolve element-id-scoped background rules from `post-*.css` (background-color / background-image / gradient / overlay scrim) onto the elements/sections they target.

2. Improve section segmentation so Elementor bands with distinct backgrounds become distinct sections.

3. Surface per-band background as a comparable axis in values-diff.

## Provenance

Surfaced during REQ-79 (joyfulculinary import) as blocker #3. Split out per operator instruction so REQ-79 stays scoped to the reproduction + the tooling fixes that unblock it (aligned-crops --sandbox, fontLoad false-positive). See [[REQ-79]].