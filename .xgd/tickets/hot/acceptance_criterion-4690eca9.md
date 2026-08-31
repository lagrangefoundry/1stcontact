---
uid: acceptance_criterion-4690eca9
id: AC-1423
type: acceptance_criterion
title: 'A site''s live revision is recorded in exactly one place: derived from the
  log, never stored beside the bytes'
created_by: xgd
created_at: '2026-08-31T11:53:15.172539+00:00'
updated_at: '2026-08-31T11:53:15.172539+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

Which revision a site serves as live is recorded in exactly one place: the
site's revision log. It is derived on read as the highest revision in that log
and is never stored as a pointer alongside it.

Observably, the per-site index object that used to sit beside a site's stored
bytes and record its live revision, its revision list and its snapshot list does
not exist after a publish — nothing writes it and nothing reads it. What the
published URL serves therefore follows the log and only the log: appending a
higher revision changes what is served with no second write anywhere, and
removing the highest revision returns the previous one to service. There is no
second record that could disagree with the log, and so no state in which the two
are out of step.

## Verification

Publish a site, then assert no index object exists at the location beside its
stored bytes where one previously did. Publish a second revision and assert the
published URL serves it with no further write made to storage beyond the
revision's own bytes. Remove the highest revision from the log and assert the
published URL returns to serving the previous one, with both revisions' bytes
still present in storage untouched — proving that what is served is computed
from the log rather than read from anywhere.
