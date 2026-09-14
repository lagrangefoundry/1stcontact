---
uid: acceptance_criterion-ec235219
id: AC-1764
type: acceptance_criterion
title: A bundle is named from the captured URL and re-capturing the same URL replaces
  it in place
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:24.315398+00:00'
updated_at: '2026-09-14T05:00:56.667793+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
A bundle's name is derived from the URL that was captured, never from a location
the caller happened to choose, and is the same on every backing:

- `<host>/<path-slug>`, where the path is reduced to one safe name segment
- a root path yields the segment `index` (`https://faelan.com/` → `faelan.com/index`)
- a nested or query-bearing path yields one segment, not a nested one
  (`/about/team` → `about_team`; `/a/b?c=d` → `a_b_c_d`)
- on the operator's tree, that name is the directory
  `storage/references/<host>/<path-slug>/`

Re-capturing the same URL writes to the same bundle and replaces its members in
place rather than creating a second bundle or accumulating alongside the first.
The generation of a capture is distinguished by the `capturedAt` field inside the
capture record, not by the bundle's name.

## Verification
Capture two different URL shapes and assert the resulting names and, on the
filesystem backing, the resulting directories. Capture the same URL twice and
assert the store lists that bundle once, with the second capture's members in
place and the two capture records differing in `capturedAt`.