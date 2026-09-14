---
uid: acceptance_criterion-5c438cc1
id: AC-1793
type: acceptance_criterion
title: A concurrent fold onto the same conversation is refused on the compare-and-set
  rather than silently overwriting the increment that won
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:52:57.305080+00:00'
updated_at: '2026-09-14T06:23:08.988552+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Two writers folding onto the same conversation conflict loudly rather than one
silently discarding the other's increment. A transcript write is made against the
version of the stored transcript it was folded onto; if that version has moved
since, the write is refused and the stored transcript still holds the increment
that won.

This is the better of the two available failures and it is chosen deliberately: a
store that overwrites unconditionally loses the later fold with no signal, and a
conversation that has quietly lost a turn cannot be distinguished afterwards from
one where the turn was never spoken. The tier in front of the archive serialises
writes upstream, so the conflict should stay theoretical — but "should" is why it
is stated as a refusal rather than left to the ordering.

## Verification

Establish a conversation with one turn. Hold two independent archives over the
same conversation, each having read the same stored transcript, and fold a
different increment through each: the first succeeds, the second is refused with a
conflict rather than returning success. Read the conversation back: it holds the
first writer's increment intact and well-formed — not a merge of the two, and not
an empty or truncated transcript — and re-opening the conversation replays it.