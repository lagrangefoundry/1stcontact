---
uid: acceptance_criterion-3d3e3a8b
id: AC-1267
type: acceptance_criterion
title: The operator asks the same question from the command line and gets a readable
  listing
created_by: xgd
created_at: '2026-08-20T02:27:50.785668+00:00'
updated_at: '2026-08-20T02:27:50.785668+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

The operator can ask the same question from the command line — a site's changes, optionally since a given baseline — and gets a human-readable listing: the current change count, then one line per change carrying its count, who made it, the operation, the page where there is one, and the label, with the before and after text shown beneath it where words changed.

An empty result prints an explicit "nothing has changed" line rather than nothing at all. A truncated result prints an explicit notice that older changes are no longer retained. A slug with no draft exits non-zero with a not-found error naming the site.

## Verification

Make a copy edit, then run the changes command for that site and assert the output reports the current count, one line naming the actor, operation, page and label, and the before/after words.

Run it with a baseline equal to the current count and assert the "nothing has changed" line appears. Drive past the retained window and assert the truncation notice appears. Run it for an unknown slug and assert a non-zero exit with a not-found error.
