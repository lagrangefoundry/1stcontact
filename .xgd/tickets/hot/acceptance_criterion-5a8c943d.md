---
uid: acceptance_criterion-5a8c943d
id: AC-840
type: acceptance_criterion
title: An image declaring a link is navigable while keeping its own paint and measure,
  and the enclosure the link needs occupies no layout box
created_by: xgd
created_at: '2026-08-06T02:47:55.070818+00:00'
updated_at: '2026-08-09T05:41:12.238405+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2e4e2c45
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A media leaf cannot itself be a link, so an image declaring a link target is
presented enclosed by one. The enclosure takes up no layout box of its own, so
adopting the link role does not move the image or anything around it: the image
keeps its own styling identity, its object-fit treatment, its paint axes and its
measure exactly as it would un-linked. Activating the image navigates to the
declared target.

## Verification
Publish a page with an image declaring a link target, a fit treatment and a
measure. Assert the published markup presents the image inside a link carrying the
target, that the image itself retains its styling identity and attributes, and
that the enclosure contributes no layout box. Compare the image's own published
style declarations against the same page with the link removed and assert they are
identical.