---
uid: acceptance_criterion-33a6622a
id: AC-894
type: acceptance_criterion
title: Publishing always renders from the current draft definition, so previously
  rendered output can never be published
created_by: xgd
created_at: '2026-08-06T18:39:26.493395+00:00'
updated_at: '2026-08-31T11:33:17.683360+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

There is no way to publish stale bytes. A publish renders from the draft
definition it has just validated and frozen, and never treats previously rendered
output as an input. If rendered output already exists and disagrees with the
current draft, the revision's stored output reflects the current definition, and
the stored output and the frozen definition beside it agree with each other.

## Verification

Publish a site, then change the site definition and overwrite the previously
rendered output with deliberately stale content. Publish again. Assert the new
revision's stored entry page carries the new content and does not carry the stale
content, that the frozen definition stored with it carries the same new content,
and — on the operator's filesystem store — that the local published output
directory was itself refreshed by the publish's own render.
