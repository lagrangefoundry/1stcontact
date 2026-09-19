---
uid: acceptance_criterion-43884850
id: AC-1831
type: acceptance_criterion
title: A bundle's name is derived from the captured URL, carries no capture time,
  and a re-capture replaces it in place
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:40.021163+00:00'
updated_at: '2026-09-19T13:37:40.021163+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

A bundle's name is derived from the **captured URL** — its host and its path —
and never from whichever directory or key a caller happened to choose, on every
backing. Specifically:

- the name is the captured host joined to a single safe segment derived from the
  path, and a root path yields the segment `index`;
- a nested or query-bearing URL path collapses to **one** safe name segment, so a
  deep URL never becomes a name an operator cannot type after `--ref`;
- the capture time is **not** part of the name: it is recorded inside the capture
  record, so re-capturing a URL replaces that bundle's members in place rather
  than creating a second one.

## Verification

Assert the derived name for a root URL and for a nested path, and assert the path
slug for a path containing separators and a query. Capture the same URL into two
different stores and assert both captures report the same bundle name. Assert the
capture record carries the capture moment, and that the name does not; replacing
in place then follows from the member-replacement criterion.
