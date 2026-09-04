---
uid: acceptance_criterion-2f5decf4
id: AC-1581
type: acceptance_criterion
title: A placement that fails is reported alongside a kept file, never as an upload
  that did not arrive
created_by: xgd
created_at: '2026-09-04T04:52:02.915918+00:00'
updated_at: '2026-09-04T05:01:59.189040+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

When placing a file on the site fails — an unknown site, a store that refuses the write — the upload
itself still succeeds: the file is kept, described and findable, and the answer carries both the
created record and a named reason the file is not yet on the site. It is never reported as an upload
that did not arrive, and the reason carries no configuration secrets.

## Verification

Give a file to the site answer against a site that cannot accept it. Confirm the answer reports the
created material, reports no asset name, and carries a placement failure stating why; confirm the
material record and its bytes exist afterwards.