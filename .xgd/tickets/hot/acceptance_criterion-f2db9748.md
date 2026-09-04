---
uid: acceptance_criterion-f2db9748
id: AC-1573
type: acceptance_criterion
title: 'The answer decides the rights: ''for the site'' stays publishable, ''just
  to read'' becomes material no site may carry'
created_by: xgd
created_at: '2026-09-04T04:51:42.423001+00:00'
updated_at: '2026-09-04T05:02:00.383107+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

The answer the client gives decides what may be done with the file. Material created under "put it
on the site" is recorded as publishable on a site; material created under "just for you to read" is
recorded as material no site may carry, so it cannot reach a published site by any route rather than
merely not being routed there. Both are kept, described and findable either way — the answer changes
the rights, not whether the file is stored.

## Verification

Give the same bytes to each answer in turn. Two separate records result, with opposite
publishability recorded on them, and both retrievable. Attempting to place the reading-answer record
on a site is refused, while the site-answer record is accepted.