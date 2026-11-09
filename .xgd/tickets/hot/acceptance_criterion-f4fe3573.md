---
uid: acceptance_criterion-f4fe3573
id: AC-2533
type: acceptance_criterion
title: The site document carries no delivery fields, and rendition URLs pass the same
  URL-safety sanitisation as any src
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:33:08.504155+00:00'
updated_at: '2026-11-09T17:43:13.496266+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
Delivery is not part of the site document. The asset reference schema stays
`{id, src, alt, focalPoint?}`, and the L1 image node gains no delivery field. A
document carrying a `srcset`, `sizes`, `renditions` or similar delivery key on
an asset reference or image node is refused as an unknown key. The renditions
reach the page only as a render input supplied by the publish.

Rendition URLs taken from the manifest get the same protection as any authored
`src`:
- Each `srcset` candidate must pass the URL-scheme allowlist (http/https or
  relative). It must also contain only URL characters, excluding commas and
  whitespace, so a manifest value cannot inject extra list entries or break out
  of the attribute.
- A candidate failing either check is dropped, and the attribute value is
  HTML-escaped.
- A background rendition passes the same `url()` sanitisation as an authored
  background URL.
- A manifest keyed by a prototype name (e.g. a `src` of `/assets/__proto__`)
  yields no ladder rather than a non-entry.

## Verification
Validate a document whose image node or asset reference carries a delivery key
and observe it rejected as an unknown key. Render with a manifest whose
renditions include a `javascript:` URL, a URL containing a comma and a URL
containing whitespace. Assert that each is absent from the `srcset` while the
safe candidates remain. Render an image whose `src` is `/assets/__proto__` with
a manifest present and assert there is no `srcset`.