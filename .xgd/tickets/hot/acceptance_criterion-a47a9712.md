---
uid: acceptance_criterion-a47a9712
id: AC-1419
type: acceptance_criterion
title: Publishing an unchanged draft is a no-op that returns the live revision and
  mints nothing
created_by: xgd
created_at: '2026-08-31T11:34:03.089117+00:00'
updated_at: '2026-08-31T11:46:20.794223+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Publishing a draft that matches the live revision is a no-op: it returns the live
revision, reports that nothing was published, and mints nothing — the log is
unmoved, not rewritten with an identical entry. A second publish carrying a
different message changes nothing either, message included, because publish is a
toolbar button and buttons get pressed twice. The publish command says so in its
own words rather than printing a revision number an operator would read as newly
minted.

Forward-only is unaffected by this. A draft checked out from an earlier revision
differs from live, so its change list is non-empty and publishing it mints a new
highest revision as normal.

## Verification

Publish a site, then publish it again unchanged with a different message. Assert
the second call reports the same revision id and reports that nothing was
published, that the revision log still holds exactly one entry, and that the
publish command's own output names the existing revision as already published
rather than announcing a new one. Then check out an earlier revision of a site
with two revisions, publish, and assert a new highest revision was minted.