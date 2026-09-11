---
uid: acceptance_criterion-4bd36a69
id: AC-1090
type: acceptance_criterion
title: A refused change tells the caller nothing was written and what to do instead
  of resending it
created_by: xgd
created_at: '2026-08-10T09:20:12.311805+00:00'
updated_at: '2026-09-11T02:17:41.604824+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A refusal is correctable within the same exchange. It carries three things together:

- the **failure code**;
- a **recovery strategy** — that nothing was written, that the same call must not be sent
  again unchanged, and that the way forward is to read the element back and send a
  corrected replacement;
- the **offending field**, named as a pointer into the element, so the caller does not have
  to guess which part of what it sent was refused.

The strategy and the field are complementary, not alternatives: the declared meaning of the
code carries the strategy, and the write path's own account of the failure is appended to
it. A caller that receives both corrects in one step; one that receives either alone does
not.

## Verification

Send a replacement with a wrongly-typed value for a typed appearance property. Assert the
reply carries the schema-invalid code, states all three of: nothing was written, do not
resend unchanged, read the element back — **and** names the offending property (the
pointer into the element reaches the caller, e.g. the refusal for a bad `fontSizePx`
names `fontSizePx`).
