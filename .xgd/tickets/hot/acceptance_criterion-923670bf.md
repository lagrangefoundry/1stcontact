---
uid: acceptance_criterion-923670bf
id: AC-910
type: acceptance_criterion
title: Every preview-channel response asks crawlers not to index it, including its
  redirect and its not-found
created_by: xgd
created_at: '2026-08-06T18:49:35.867698+00:00'
updated_at: '2026-08-16T07:23:46.339356+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every response on the preview channel carries a directive instructing crawlers
not to index it — not only successful page and asset responses, but also the
trailing-slash redirect and the not-found. Responses on the published channel
carry no such directive. Preview privacy therefore does not depend on a crawler
having stopped at the entry page.

## Verification

Request a preview page, a preview asset, a bare preview root that redirects, and
a preview path that does not exist; assert the no-index directive is present on
all four. Request the corresponding published-channel responses and assert the
directive is absent from each.