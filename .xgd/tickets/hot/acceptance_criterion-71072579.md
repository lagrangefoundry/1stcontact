---
uid: acceptance_criterion-71072579
id: AC-952
type: acceptance_criterion
title: Every segment is outlined by the render itself, hover included, and neither
  becoming a segment nor being hovered can move a box
created_by: xgd
created_at: '2026-08-06T21:26:20.789280+00:00'
updated_at: '2026-08-10T08:49:58.799121+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The edit render draws the outlines itself — it knows each region's box, so no
client has to hit-test for them. Two treatments are emitted and no more:

- a faint **resting** outline on every stamped editable region and on nothing
  else; and
- a **hot** treatment that strengthens that same outline on the one region a
  client has marked as being under the pointer.

Both are selected on the presence of a region stamp, so together they apply to
precisely the stamped set. The render owns what a hot segment looks like; a
client only says which segment is hot.

Both treatments are painted outside the page's layout: a region's position and
size in the edit render are identical to its position and size in the preview
render, and stay identical while it is hot. So a region cannot shift merely by
becoming editable, and cannot shift under the pointer either — the movement in
the hot treatment is the outline lifting off the box, never the box moving.

The preview render of the same page carries neither treatment.

## Verification

Render the edit channel of a seeded page. Assert exactly two outline treatments
are emitted — one selected on the region stamp alone, one on the region stamp
together with the hot-segment marker — and that the page carries at least one
stamped region for them to apply to. Assert each declares only outline
properties, and no box-model property (border, margin, padding, width, height)
that could displace anything. Assert the same page's preview render carries
neither treatment.