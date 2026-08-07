---
uid: acceptance_criterion-bc7cc7f1
id: AC-1022
type: acceptance_criterion
title: The store answers from the command line without any editing gesture
created_by: xgd
created_at: '2026-08-07T04:30:06.593528+00:00'
updated_at: '2026-08-07T04:36:49.891572+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

Asking a site for its assets from the command line succeeds without rendering a
page, opening any editing surface, or naming any region — the site alone is enough
input. It reports success and returns the site's assets as a list of entries, each
carrying identity, handle, descriptive text, usage kind, present-on-disk and
declared-in-definition. A site with no files and nothing declared answers with an
empty list and still reports success — "this site has no assets" is an answer, not
a failure.

## Verification

On a site with a mix of declared and undeclared assets, invoke the listing from
the command line with the site as its only input and assert it succeeds and
returns every asset with the full entry shape. Repeat on a site with no assets and
assert an empty list and a success result rather than an error.