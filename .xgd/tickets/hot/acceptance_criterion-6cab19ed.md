---
uid: acceptance_criterion-6cab19ed
id: AC-1259
type: acceptance_criterion
title: A baseline older than the retained window is answered truncated, with whatever
  records remain
created_by: xgd
created_at: '2026-08-20T02:27:11.701631+00:00'
updated_at: '2026-08-20T02:27:11.701631+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A baseline older than the retained window is answered with **whatever records remain**, the current count, and an explicit truncation indication — never with a silent partial answer and never with an error.

A baseline the window can still reach back to is answered with truncation absent, including on a site that has never been written to.

## Verification

Drive more writes than the window retains. Ask for changes since a baseline from before the window's oldest surviving record; assert the answer is marked truncated, reports the current count, and still carries the records that remain.

Ask on the same site since a recent baseline and assert truncation is false. Ask on an untouched site since zero and assert truncation is false with an empty list.
