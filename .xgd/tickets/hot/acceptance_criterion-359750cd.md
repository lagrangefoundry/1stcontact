---
uid: acceptance_criterion-359750cd
id: AC-890
type: acceptance_criterion
title: A reference whose first segment is empty or carries a colon keeps its base
created_by: xgd
created_at: '2026-08-06T18:27:16.045671+00:00'
updated_at: '2026-08-08T00:43:52.763043+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Dropping a leading slash is only a change of *shape* while what remains still reads
as a relative **path** reference. Two remainders stop reading that way, and both
keep their base by being emitted as an explicitly relative path rather than a bare
remainder:

- **An empty first segment** — a root link carrying only a fragment or a query
  (`/#how`, `/?q=1`, or a bare `/`). With no path left, the reference would resolve
  against the *current document* instead of the snapshot root, so a root fragment
  link authored once in a shared navigation would mean "this anchor on whatever page
  you happen to be on". The published behaviour is that such a link names the
  **snapshot root page's** anchor, and names the same target from every page in the
  snapshot. On a single-page site the two readings are indistinguishable, which is
  why the correct behaviour can only be demonstrated on a site with more than one
  page.
- **A colon in the first segment** (`/javascript:…`, `/a:b/c`). A leading `scheme:`
  is read as a URL scheme, so the strip would promote a path into a live scheme —
  and the safety check cleared that value *because* the leading slash made it
  relative. No emitted reference may be readable as a URL scheme, so a value the
  sink accepted as a relative path can never be handed back as an executable one.

## Verification
Render a two-page snapshot whose non-root page carries a root fragment link, a root
query link, and links whose first segment contains a colon. Resolve each emitted
href the way a browser would — against the URL of the page that carries it — and
assert the fragment link resolves to the snapshot root's anchor, resolves to the
same target from the root page, and does not resolve to the current page's anchor;
assert no emitted href matches a URL-scheme prefix, and that a colon-bearing
reference resolves to an ordinary path under the snapshot.