---
uid: acceptance_criterion-d902db4f
id: AC-1783
type: acceptance_criterion
title: 1c crop accepts PNG only, naming the format it was actually handed
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:55.869823+00:00'
updated_at: '2026-09-14T05:16:32.657184+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
`1c crop --input <file>` crops PNG images and refuses everything else. The refusal
names the format the file's own bytes say it is, states that the verb handles PNG
only, and suggests converting — including when the file is *named* `.png` and is
not one, which is the case worth catching.

This is a deliberate, stated narrowing: the verb previously accepted whatever the
native imaging module could read. The trade is that an operator is told what they
handed over, instead of watching a PNG parser fail on a header it was never given
and going to look for a corrupt file.

## Verification
Write a file with a JPEG's leading bytes under a `.png` name and run the crop verb
against it; assert it fails, that the message names JPEG, and that it says PNG
only. Repeat for the other named formats at the decode boundary.