---
uid: acceptance_criterion-5954a519
id: AC-1003
type: acceptance_criterion
title: A rendering too old to carry the page coordinate is refused before anything
  is sent, naming the re-render to run
created_by: xgd
created_at: '2026-08-07T02:17:00.422222+00:00'
updated_at: '2026-08-07T02:36:28.434544+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A rendering that carries region addresses and the editable marker but not the
page coordinate an edit needs is refused at the point of clicking: the operator
gets a message saying the rendering predates the editor and naming the exact
re-render command for their site, and **no edit request is sent**.

The refusal happens without contacting the write path, because an incomplete
request could only come back reporting a missing page — true, and useless, since
the page was never the problem.

## Verification

Take a real editable rendering with its page coordinate removed and everything
else intact. Click a copy region on it and assert exactly one message appears,
that it names the re-render command including the site, and that no request was
issued.