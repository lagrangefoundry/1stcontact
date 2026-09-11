---
uid: acceptance_criterion-7e5ba7ab
id: AC-1643
type: acceptance_criterion
title: The control-surface reference covers every declared operation, group, refusal
  and declared absence
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:23.902643+00:00'
updated_at: '2026-09-11T02:51:26.393131+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The control-surface reference describes the whole declared surface — not the
subset any one session was granted: every declared operation appears under the
name a caller uses, grouped as the declaration groups them, with what each
operation takes, whether each input is required, what it returns and how it can
refuse; every declared refusal is named; and every capability the declaration
records as deliberately impossible is stated as a decision rather than omitted.

The declared absences are the load-bearing half: an assistant that does not know a
thing is deliberately impossible spends the conversation trying to route around it
and apologising.

## Verification

Read the control-surface reference and check it against the surface declaration
itself: every declared operation is named, every declared group appears as a
section, every declared refusal code is named, and every declared absence is
named with its explanation. Adding, renaming or withdrawing an operation in the
declaration and regenerating moves the document accordingly, with no hand edit.