---
uid: acceptance_criterion-086094c2
id: AC-1576
type: acceptance_criterion
title: A drag that is not carrying files never raises the question, at either entry
  point
created_by: xgd
created_at: '2026-09-04T04:51:51.484063+00:00'
updated_at: '2026-09-04T05:01:59.931556+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A drag that is not carrying files — selected text, a link, an element being dragged within the page
— never raises the question, at either entry point. The question appears only when the client is
actually offering the platform a file.

## Verification

Drag non-file content over the conversation and over the Library in turn, and confirm the question
surface stays hidden in both cases; then drag a file over each and confirm it appears.