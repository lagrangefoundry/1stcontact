---
uid: acceptance_criterion-ceaed855
id: AC-2333
type: acceptance_criterion
title: The apex and every path outside /site/ serve the configured apex site, and
  answer not-found when none is configured or it is unpublished
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T06:56:49.540124+00:00'
updated_at: '2026-11-07T07:16:35.735706+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

The root of the host serves a published site, not a holding response. Which site
that is comes from deployment configuration and never from the URL, so no request
can ask the root for a different site. The root address is that site's index page,
and every path outside `/site/` addresses a page or asset of the same site's live
revision — under the same grammar, clean-URL mapping, typing, not-found and
freshness rules as any other published site — so the apex page's document-relative
stylesheet and images resolve. `/site/` stays reserved: a request under it is never
the apex site's.

A deployment that configures no apex site, or whose configured site has never
published, answers the root and every apex path with the same plain not-found an
unpublished site gives.

The platform's own front page is authored in the repository as an ordinary site
definition that declares accounts and mounts the account chrome in a header slot,
carrying the shipped preset unmodified.

## Verification

With an apex site configured and published, request `/` and assert it serves that
site's index page; request an apex asset and an extensionless apex page path at the
root and assert each serves the corresponding object of the live revision. Assert a
`/site/<key>/` request still serves the site it names. With no apex site configured,
request `/` and an apex path and assert each answers the plain not-found. Validate
the authored front-page definition and assert it declares accounts, binds the
account chrome to a slot its tree contains, and carries the preset unmodified.