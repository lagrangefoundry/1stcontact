---
uid: acceptance_criterion-a6e5401e
id: AC-1572
type: acceptance_criterion
title: The question offers exactly two answers, each saying what it means, and the
  reading answer promises the file stays off the site
created_by: xgd
created_at: '2026-09-04T04:51:41.369531+00:00'
updated_at: '2026-09-04T05:02:00.548196+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

The question offers exactly two answers and no others: one meaning the file is for the site, one
meaning it is for the assistant to read. Each answer states in plain, non-technical words what it
means — the first that visitors will see the file, the second that the assistant will read it and
that it will **not** appear on the site — and the surface carries a single top-level question above
them both.

## Verification

Raise the question surface and read what it offers: one question, two answers, and for each answer
a label and an explanatory line. Confirm the reading answer's line states that the file stays off
the site, since that is the assurance a client uploading a private document needs at the moment
they are deciding where to put it.