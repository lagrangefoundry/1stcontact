---
uid: acceptance_criterion-b5e594c1
id: AC-917
type: acceptance_criterion
title: 'An exactly-matching page or asset always wins: every URL that resolved before
  the mapping resolves identically'
created_by: xgd
created_at: '2026-08-06T19:02:32.474165+00:00'
updated_at: '2026-08-09T13:50:13.733371+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The clean-URL mapping is consulted only after an exact match has failed, so it
can never displace an existing resolution. In both environments the explicit
`.html` URL, the site root, and an asset carrying its own extension all serve
exactly the bytes and type they served before the mapping existed. In local
preview, a trailing-slash directory and a bare directory that has its own index
page both still resolve to that index page rather than to a same-named page file.

## Verification

Over a rendered site containing a page, a nested directory with its own index
page, and an asset: request the explicit `.html` path, the root, the
trailing-slash directory, the bare directory, and the asset. Assert each returns
success with the content it returned before, and specifically that the bare
directory returns the directory's index content, not the same-named page.