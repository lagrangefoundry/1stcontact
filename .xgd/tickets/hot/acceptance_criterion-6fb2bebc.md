---
uid: acceptance_criterion-6fb2bebc
id: AC-966
type: acceptance_criterion
title: View mode displays the operator's real rendered site, whole, over this origin
created_by: xgd
created_at: '2026-08-07T01:44:18.770079+00:00'
updated_at: '2026-08-20T01:54:28.747478+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

With a site selected, the display panel shows that site's actual rendered
output — the whole page as the platform renders it, with the stylesheet and the
images it references resolving over this same origin, so what an operator is
looking at is the site and not an approximation of it.

The bytes are produced when the request arrives, from the site's definition, and
they are equal *by construction* to what the platform's own render writes:
one production of a page, with a writer and a reader over it, not a placeholder
and not a differently-serialised second implementation that merely agrees today.
The equality itself — same file set, same bytes, across both draft-side channels
and every artifact a channel contains — is asserted by AC-1032, which owns it;
this criterion does not restate it in weaker form. What this criterion owns is
that the pane an operator is looking at is showing that rendering, whole.

## Verification

Open the workspace with a site selected and take the URL the pane is displaying.
Fetch it over the origin and assert it answers with that site's rendered home
page — its real content, not a placeholder — and then fetch the stylesheet and
image references that page carries and assert each resolves successfully over
the same origin. Assert the response is produced without requiring a rendered
artifact to have been written first: run the fetch against a site the platform
has never rendered to disk, so the panel's content cannot be coming off a shelf.
