---
uid: acceptance_criterion-9377b5ab
id: AC-1432
type: acceptance_criterion
title: A right-to-left locale renders direction rtl, decided by script subtag when
  present
created_by: xgd
created_at: '2026-08-31T12:28:34.549036+00:00'
updated_at: '2026-08-31T12:33:35.001074+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

A site whose resolved locale is written right-to-left renders with text direction
`rtl`. A site declaring `IL` renders `lang="he-IL" dir="rtl"`; a site declaring
`AE` renders `lang="ar-AE" dir="rtl"`.

Direction is decided by the locale's script when the locale states one, and by
its language otherwise: `az-Arab` is right-to-left, `az-Latn` is left-to-right,
and `en-IE` is left-to-right. An unrecognised locale is left-to-right, which is
both the overwhelming majority and what a browser assumes anyway.

## Verification

Render pages for sites declaring `IL` and `AE` and read the language and
direction each rendered document declares. Separately, resolve the direction of
`az-Arab`, `az-Latn` and `en-IE` and observe that the two same-language, different-script
tags get opposite answers.