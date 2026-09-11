---
uid: acceptance_criterion-f64d9d6a
id: AC-1729
type: acceptance_criterion
title: Only a drag carrying files raises the overlay, and it stays up as the drag
  crosses the workspace
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:31.618330+00:00'
updated_at: '2026-09-11T05:32:31.618330+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The overlay is raised by a drag that is carrying files and by nothing else. A drag carrying only
non-file content — text selected and dragged inside the page, a link, a page element — never
raises it, so ordinary interaction inside the builder is not interrupted by a full-screen upload
surface.

Once raised by a file drag, the overlay stays raised while the drag moves across the panels and
controls beneath it; it does not flicker away as the pointer crosses from one region into
another.

## Verification

Drag non-file content over a watched region and assert the overlay is not showing. Drag file
content over the same region and assert it is showing. Move the drag across nested regions within
the watched area and assert the overlay remains showing throughout.
