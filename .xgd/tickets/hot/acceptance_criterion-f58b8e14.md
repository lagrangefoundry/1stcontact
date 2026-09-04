---
uid: acceptance_criterion-f58b8e14
id: AC-1584
type: acceptance_criterion
title: A conversation-route drop appears as the client's own turn, naming the file
  and what became of it
created_by: xgd
created_at: '2026-09-04T04:52:12.549815+00:00'
updated_at: '2026-09-04T04:52:12.549815+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A file given to the platform through the conversation appears in that conversation as the client's
own turn — attributed to them, because handing over a file is something they did — naming the file
and saying what became of it: that it was added, that it is on the site and under which name when it
was placed there, or that it will be read and will not appear on the site when that is the answer
they gave.

## Verification

Drop a file into the conversation under each answer in turn and read the transcript: a turn
attributed to the client, containing the file's name and a statement of the outcome that matches
what was actually recorded — including the site asset name when the file was placed on the site.
