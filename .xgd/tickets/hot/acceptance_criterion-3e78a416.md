---
uid: acceptance_criterion-3e78a416
id: AC-558
type: acceptance_criterion
title: Clean markdown and content render unchanged
created_by: xgd
created_at: '2026-07-10T00:33:54.451241+00:00'
updated_at: '2026-07-10T00:33:54.451241+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
Ordinary content — prose, safe links, and safe images (including `data:image/*`) —
in a markdown field renders to HTML with no content-safety error. A benign module
renders normally; the enforcement does not produce false rejections for safe content.

## Verification
Render markdown containing clean prose, an `https`/relative/`mailto`/`#` link, and a
safe image; assert the render succeeds and the expected HTML is produced with no
error raised.
