---
uid: acceptance_criterion-cbeaf2ba
id: AC-2145
type: acceptance_criterion
title: Switching business moves every subsequent request, the displayed site and frame,
  the assistant session and the Library to that business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:05.949816+00:00'
updated_at: '2026-11-01T10:49:05.949816+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Selecting a business re-scopes the whole workspace in one act, not just the site
tab. From that moment every request the builder makes — API calls, the
displayed rendering channel, asset and material file URLs — carries that
business in its address; the selection is remembered; the pane shows that
business's site and its frame reloads even when the site's slug is unchanged
(the address changed because the business did); the assistant opens a fresh
session for that site; and the Library is cleared and re-read as that business's
material, so no row from the previous business can survive a re-read that
fails.

No surface outside the display panel asks the pane which site or business is in
scope: the assistant, the Library, uploads and the palette all follow the
shell's selection.

## Verification

Mount with two businesses, switch from the first to the second, and assert that
every subsequent request URL carries the second business, that the frame's
document address carries it and the frame reloaded, that the assistant session
is for the second business's site, and that the Library shows only the second
business's material. Repeat where both businesses hold a site with the same
slug and assert the frame still reloads. Make the Library re-read fail and
assert none of the first business's rows remain.
