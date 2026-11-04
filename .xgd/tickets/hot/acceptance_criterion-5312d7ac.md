---
uid: acceptance_criterion-5312d7ac
id: AC-903
type: acceptance_criterion
title: A published URL serves the site's live revision, derived as the highest in
  its log, complete with every asset it references
created_by: xgd
created_at: '2026-08-06T18:48:21.095289+00:00'
updated_at: '2026-11-04T16:02:31.942238+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for a site's published address — which names the site only, never a
revision — returns the entry page of the revision that site currently serves as
live, with a success status and an HTML content type. Every asset the returned
markup references resolves under that same published address with its own
success status and correct content type: a page that answers while its
stylesheet does not is a broken page, not a served one.

Live is the highest revision in the site's log, derived on read. When the log
gains a higher revision the same unchanged URL returns the newer content on its
next uncached request; when the log is wound back, the same unchanged URL
returns the earlier revision's content again, with every revision's bytes left
untouched in storage. Nothing else is consulted, so nothing can disagree with
the log.

The site segment of a published address is the site's opaque key, so it
resolves to exactly one site's log by construction. No claim is consulted, and
no other business's site, whatever its slug, can be reached through it.

## Verification

Publish a revision, request the site's published URL and assert the success
status, the HTML content type, and that the body is that revision's. Extract
every document-relative reference from the returned markup, request each
resolved against the same URL, and assert every one succeeds; assert a named
asset's own content type as well. Publish a second, different revision, request
the identical URL and assert the response is the second revision's. Wind the log
back to the first revision, request the identical URL again, and assert the
first revision's content is served. With a second business holding a site of the
same slug, published or not, assert the first site's key-addressed URL serves
only the first site's revision and none of the second business's content.
