---
uid: acceptance_criterion-c57b85c7
id: AC-2460
type: acceptance_criterion
title: Widening to a site asset places the bytes on the business's site through the
  same placement path the upload uses; zero or several sites means not placed, not
  a failure
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:55:14.287394+00:00'
updated_at: '2026-11-08T13:55:14.287394+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Changing an uploaded material's role to *Site asset* also puts its bytes on the business's site,
through the same placement the upload performs. A successful placement records the site under
*Placed on*. Placement failing does not undo the role change.

- **The site is resolved by the server from the business's own sites**, never sent by the client:
  the Library does not know which site is open. When the business holds exactly one site, the
  bytes are placed there and the response names the placed asset. The returned row is read after
  the placement, so its *Placed on* lists the site and the not-on-the-site warning does not show.
- **Zero sites, several sites, or a site store that will not open all mean "do not place"**, and
  none of them is a failure. The role change stands, the response is a 200 with no placed asset,
  and the row is honestly unplaced, so it shows the not-on-the-site warning.
- **A placement attempt that fails also leaves the role changed.** The response is a 200 that
  reports the placement failure beside the changed row, with the failure message scrubbed exactly
  as the route's other failures are. A site store that refuses the write must not read as the
  correction not having happened.
- Changing the role to *Background information* never places anything.

## Verification

For a business with one site, change an uploaded `reference` image to `site`. Observe a 200 that
names the placed asset, the bytes present in that site's asset library, and *Placed on* listing
the site. For a business with no site, make the same change: observe a 200 with `role: 'site'`,
no placed asset, an empty *Placed on*, and the not-on-the-site warning on the row. Make the site
store refuse the write: observe a 200 with `role: 'site'` and a placement-failure message, and a
stored role of `site`.
