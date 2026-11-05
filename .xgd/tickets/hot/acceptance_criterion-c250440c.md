---
uid: acceptance_criterion-c250440c
id: AC-2324
type: acceptance_criterion
title: A material write made outside the Library appears on the open tab without a
  reload, replacing only that row and leaving selection, rail state and the detail's
  scroll on another row unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:06:56.680654+00:00'
updated_at: '2026-11-05T21:06:56.680654+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

With the Library open, a write to one of the business's material made somewhere other than the
Library — the AI description landing after an upload has returned, a background re-describe pass,
a material created or archived elsewhere — reaches the open tab with no operator action and no
re-read of the whole list:

- a material that comes into the list (newly created, or changed into it) appears as a row at the
  head of the list;
- a material that leaves the list (archived, or changed out of it) is removed from it;
- a material that changes in place has only its own row redrawn.

An incoming change for one material leaves the rest of the pane as it was: the selected row stays
selected, a list collapsed to its rail stays collapsed, and the open detail keeps its scroll
position. A change for a material the active filters exclude does not disturb the visible rows.

A change-reset signal from the feed falls back to re-reading the whole list, after which a new
subscription is open from the cursor that re-read returned. A Library whose transport offers no
change feed (for example a browser without `EventSource`) still lists and still redraws after its
own writes.

## Verification

Open the Library with two materials, select one, collapse the list to its rail and scroll the
detail. Write a description to the other material from outside the Library and observe its row
update with no list request made, while the selection, the rail state and the scroll are
unchanged. Create a material elsewhere and observe it appear; archive one elsewhere and observe it
leave. Deliver a reset and observe one list re-read followed by a new subscription at the returned
cursor. Open the Library with a transport lacking a feed and observe it list and redraw after an
upload.
