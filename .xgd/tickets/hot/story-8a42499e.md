---
uid: story-8a42499e
id: STORY-71
type: story
title: Prose text block fills the content container by default with an opt-in narrower
  measure
created_by: xgd
created_at: '2026-07-13T20:31:37.512159+00:00'
updated_at: '2026-07-13T20:35:20.554241+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-19bef07f
  story_kind: feature
  story_points: 1
---

## Story
**As a** site author, **I want** a prose text block to fill the standard content
container by default — the same full-width, gutter-aligned geometry as the other
page sections — while still being able to opt into a narrower reading measure,
**so that** my prose lines up with adjacent full-width content instead of
appearing as a narrow, off-centre column.

## Description
A text block rendered in the `prose` variant lays its content column out at the
standard content-container width (full container width, horizontally centred so
that on a wide viewport it is pinned at the page gutter — the same geometry a
services-grid produces), rather than a hard-capped narrow column that floats
off-centre.

The narrower reading measure remains available as a deliberate, per-block choice:
setting the `contentWidth` dial caps the block's content to that width. This
opt-in works on an ordinary (non-panelled) prose block, not only on a panelled
one. The narrow measure is never the base — a block that does not set
`contentWidth` is never narrowed.

In scope:
- The default column width of a `prose` (and `landing`) text block.
- The `contentWidth` dial taking effect on a plain, non-panelled prose block.

Out of scope:
- The set of named width steps / literal values the `contentWidth` dial accepts
  and how they resolve — that scale is a separate capability (REQ-55 content-width
  dials).
- Panel/surface treatments and other text-block dials.

## Technical Context
Realised in the `text-block` module's scoped CSS. The variant base width was
changed from a narrow container to the default container (later repointed by
REQ-55 to the Tailwind `6xl` step, applied via `--fc-content-width`), and the
content-child width cap was made to apply without requiring a panel, so it is no
longer inert on a `panel-none` block.

The `contentWidth` value-resolution mechanism this story exposes belongs to the
content-width dial capability (REQ-55, plan item 6); this story asserts only the
default full-width geometry and that the dial is honoured on a plain prose block.

Surfaced by the ADA / The-Alchemy full-width fidelity residual: their prose blocks
had been forced narrow and off-centre against a full-width reference.

## Dependencies
None.

## Story Points
1