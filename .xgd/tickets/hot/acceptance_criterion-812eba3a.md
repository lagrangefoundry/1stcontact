---
uid: acceptance_criterion-812eba3a
id: AC-1587
type: acceptance_criterion
title: After either route the new material is in the Library without a reload, showing
  what was recorded rather than what was sent
created_by: xgd
created_at: '2026-09-04T04:52:19.498622+00:00'
updated_at: '2026-09-04T05:01:58.241244+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

After an upload through either entry point, the new material is present in the Library without the
client reloading anything. The listed row shows what was actually recorded — what the file is for,
whether it is on the site currently open, whether it can yet be found by its contents — read back
from the store rather than echoed from what the upload sent, since those are decided after the bytes
leave the browser.

## Verification

Upload through the conversation and through the Library in turn, and confirm in each case that the
Library list re-reads from the store and shows the new row, carrying the recorded role, site
placement and findability rather than values assumed by the browser.