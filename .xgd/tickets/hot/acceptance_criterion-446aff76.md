---
uid: acceptance_criterion-446aff76
id: AC-1463
type: acceptance_criterion
title: The browser session is released when a capture fails and when the run exceeds
  its time ceiling, and a time-limit exit is reported distinctly
created_by: xgd
created_at: '2026-08-31T22:53:31.688763+00:00'
updated_at: '2026-08-31T22:53:31.688763+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

The leased browser is released on **every** exit path, not only the successful
one:

- when navigation or capture throws, the browser and the failed capture's
  context are both released, and the original failure is the one reported —
  release does not mask it or replace it with a second, confusing error;
- when a run exceeds its time ceiling, the browser is released and the run fails
  with a **distinctly identifiable time-limit outcome**, separable by a caller
  from a page error, and stating the ceiling that was exceeded.

A default ceiling applies when the caller names none.

## Verification

Three scenarios, each asserting the browser was released:

1. a successful capture;
2. a capture whose navigation throws — assert the browser was released, the
   capture's context was destroyed, and the reported failure is the navigation's
   own;
3. a run against a page that never settles, with a short ceiling — assert it
   fails with the time-limit outcome (not the page's error), that the ceiling
   value appears in the report, and that the browser was released.

An unreleased session is not a leak that presents as a leak: it counts against a
remote concurrency cap until a reaper takes it, so wedged runs degrade into an
outage that reads as a hang.
