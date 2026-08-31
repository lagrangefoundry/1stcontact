---
uid: acceptance_criterion-f8c14e88
id: AC-1442
type: acceptance_criterion
title: One instant renders as each zone's own local time, including across a window
  where two regions' daylight-saving transitions diverge
created_by: xgd
created_at: '2026-08-31T12:39:14.380831+00:00'
updated_at: '2026-08-31T12:47:20.655664+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

A single absolute instant formatted for two different zones produces each zone's
own local reading of that moment — differing not only in hour but, where the
instant falls near midnight, in calendar date.

The zone offset applied is the one actually in force at that instant, not a
fixed offset for the zone. Across a period in which two regions leave summer
time on different dates, the gap between their local readings of the same
instant narrows and then restores: it is one span before either transition, a
different span in the window between the two transitions, and the original span
after both. A stored fixed offset gets the middle window wrong by an hour; an
instant plus a zone id does not.

## Verification

Format one fixed instant for two zones on opposite sides of an ocean and assert
both the differing local times and the differing calendar dates. Then format
fixed instants from before, between and after two regions' known
daylight-saving transition dates, asserting the local hour in each zone at each
of the three instants and confirming the gap changes and returns. All instants
are fixed literals, so the assertions hold identically whenever the check is
run.