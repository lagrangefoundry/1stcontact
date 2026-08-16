---
uid: acceptance_criterion-1747535a
id: AC-1067
type: acceptance_criterion
title: An unsent, half-typed message belongs to one conversation and survives a trip
  to another site and back
created_by: xgd
created_at: '2026-08-10T08:47:04.532741+00:00'
updated_at: '2026-08-16T04:42:08.865726+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Text typed into the composer but not sent is retained per conversation. Switching to
another site and returning restores exactly that text in the composer, unsent. The other
site's composer does not contain it — each conversation holds its own draft, and one
site's unfinished thought never appears under another's.

## Verification

Type a distinctive message into the composer for one site without sending it. Switch to a
second site and confirm its composer is empty (or holds only its own draft). Switch back
and confirm the original text is present, unsent, and unchanged.