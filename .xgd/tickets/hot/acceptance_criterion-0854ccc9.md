---
uid: acceptance_criterion-0854ccc9
id: AC-892
type: acceptance_criterion
title: A draft deploy ships the complete artifact under a content-addressed preview
  location and returns its shareable URL when the tree is servable
created_by: xgd
created_at: '2026-08-06T18:39:17.424059+00:00'
updated_at: '2026-08-07T22:18:04.475525+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Deploying a site with no channel given (the draft default) places, in shared
storage under a location named by the snapshot's content id, both halves of the
artifact: the rendered output (at minimum the site's entry page document and its
stylesheet) and the site definition it was rendered from (at minimum the site
record and each page record). The stored bytes are the real rendered bytes, not
placeholders. The site's deploy index records the snapshot as a **preview**,
carrying its content id, the time it was deployed, and which published revision
the draft descended from (or an explicit "none").

The returned shareable URL is qualified by the store tree the definition came
from: a draft deploy from the servable tree returns a single shareable URL that
addresses the preview by its content id. What a deploy from the non-servable tree
returns instead — the same shipping and indexing, no URL, and a report that says
why — is AC-925's criterion and is not restated here.

## Verification

Run the deploy command for a freshly created site in the servable tree against
shared storage. Assert that both the rendered-output and definition halves are
present under the content-addressed preview location, that reading back the entry
page yields real rendered markup, that the deploy index lists exactly one preview
entry with the returned content id and a "based on" value, and that the returned
URL contains the slug and that same content id.