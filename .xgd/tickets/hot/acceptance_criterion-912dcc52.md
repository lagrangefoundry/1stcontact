---
uid: acceptance_criterion-912dcc52
id: AC-1034
type: acceptance_criterion
title: A draft that no longer validates is reported where the operator is looking,
  naming the offending field
created_by: xgd
created_at: '2026-08-10T07:29:18.175064+00:00'
updated_at: '2026-08-10T07:39:49.024974+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

When a site's draft definition stops describing a valid site, requesting a
draft-side channel answers with a failure the operator can read *in the pane they
are looking at* — a page, not a machine envelope — that names the field at fault.
The last rendering that did validate is not served in its place.

Once the definition validates again, the next request succeeds, with no restart
and no manual re-render.

## Verification

Make a site's stored draft definition invalid by removing a required part of it.
Request a draft-side channel and assert the response is a failure status carrying
an HTML document whose text names the missing field. Restore the definition and
request again, asserting a successful response — so the failure is reported while
it is true and stops being reported when it stops being true.