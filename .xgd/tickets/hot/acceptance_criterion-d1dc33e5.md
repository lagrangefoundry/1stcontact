---
uid: acceptance_criterion-d1dc33e5
id: AC-728
type: acceptance_criterion
title: Font resource entries are scheme-checked and weight-bounded by the envelope
created_by: xgd
created_at: '2026-07-29T03:50:35.256866+00:00'
updated_at: '2026-08-09T05:40:39.936927+00:00'
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
Every font-face entry in a document's resource table passes the **same URL
scheme allowlist as an image source** before the document is accepted: a source
that is relative or absolute http(s) is admitted, while `data:`, `javascript:`,
`vbscript:`, `file:` and any other scheme is rejected — so a face cannot be
smuggled through the `@font-face` sink to fetch or execute something the image
allowlist would refuse. A declared font weight outside the CSS font-weight range
(1–1000) is likewise rejected. Each rejection is reported with the path locating
the offending entry, so a caller can correct several entries in one pass, and an
entry with an allowlisted source and an in-range weight is accepted.

## Verification
Submit a document whose resource table declares a `data:` (and separately a
`javascript:`) font source and observe rejection naming that entry's source
path; submit one declaring an out-of-range weight and observe rejection naming
that entry's weight path; submit the same table with a relative served asset and
an in-range weight and observe acceptance.