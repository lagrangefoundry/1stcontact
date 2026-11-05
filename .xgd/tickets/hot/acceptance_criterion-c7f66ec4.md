---
uid: acceptance_criterion-c7f66ec4
id: AC-2325
type: acceptance_criterion
title: GET /api/material returns the cursor read before the list, and GET /api/material/changes
  streams SSE frames keyed by change seq, opening with a ready frame and resuming
  from Last-Event-ID in preference to ?since
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:07:07.124069+00:00'
updated_at: '2026-11-05T21:21:59.130259+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

`GET /api/material` answers `{material, seq}`, where `seq` is the change-log head read **before**
the list was read, so a write landing between the two appears in both the list and the replay
rather than in neither. The Library opens its subscription from that `seq`.

`GET /api/material/changes` answers `text/event-stream`. Every event frame carries its change
`seq` as the SSE `id:` and a JSON `data:` payload. The first frame is a `ready` frame whose `id:`
is the cursor the connection opened at, so a connection dropped before any event still leaves the
client a cursor to resume from. An idle connection is kept alive with SSE comment heartbeats.

The cursor is taken from the `Last-Event-ID` request header when present, otherwise from the
`since` query parameter; with neither, the feed starts from the current head. A cursor that is not
an integer is refused with HTTP 400 rather than treated as "from now". A reconnect presenting
`Last-Event-ID` resumes after that record with no cursor in the query string, and no event is lost
across the reconnect.

## Verification

Read `/api/material` and observe `seq`; write a material and observe the write arrive on a feed
opened `?since=` that seq. Observe the stream content type, the leading `ready` frame and its
`id:`, and that each event frame's `id:` equals its seq. Reconnect with `Last-Event-ID` set and a
different `since`, and observe resumption from the header's cursor. Request `?since=abc` and
observe a 400.