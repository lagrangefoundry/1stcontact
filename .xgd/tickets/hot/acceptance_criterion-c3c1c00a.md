---
uid: acceptance_criterion-c3c1c00a
id: AC-800
type: acceptance_criterion
title: 'The import reports what it produced: node count, localized handles, and each
  mounted behaviour with its residuals'
created_by: xgd
created_at: '2026-08-03T03:47:33.541600+00:00'
updated_at: '2026-08-03T03:47:33.541600+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
A successful import prints a summary naming the bundle it read and the location
it wrote, the number of layout nodes on the imported home page, whether the
bundle's assets were mirrored into the site, the number of media handles bound
to that mirror, any assets reported as a fold gap, and one line per mounted
behaviour giving its behaviour name, the seam it is bound to, its field count,
and each residual the derivation recorded. A bundle with no behaviours prints no
behaviour lines; a bundle with no reported gaps prints no gap lines.

## Verification
Run the import on a bundle with mirrored assets, one unreferenced mirrored
image, and two recovered forms one of which has no captured endpoint. Confirm
the printed summary contains the destination, the node count, the localized
handle count, the unreferenced asset, both behaviours with their seam names and
field counts, and the missing-endpoint residual under the form it belongs to.
Confirm a bundle with no behaviours and no gaps prints neither section.
