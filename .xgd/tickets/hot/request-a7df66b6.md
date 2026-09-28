---
uid: request-a7df66b6
id: REQ-339
type: request
title: A worker must not read the consultant's session record, and must not re-narrate
created_by: EPIC-20
created_at: '2026-09-27T22:31:18.721348+00:00'
updated_at: '2026-09-27T22:33:26.798572+00:00'
completed_at: null
last_field_updated: epic_children
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-015c4ce0
---

## Why

**DOC-60** §"F1 — The worker is handed the consultant's memory, and it derails it".

`host-core.ts` resolves the ledger per *site* (`deps.ledger(slug)`), and
`registerMemoryProviders` registers the session-record provider on the single
`PrimingProviders` registry that every role is assembled from. The comment beside the
worker toolbox says a worker composes *"no ledger… no session context"* — true of its
**tools**, false of its **priming**.

So a worker on its first turn is handed the consultant's standing note and reads it as a
resumption:

> *"Thank you for the standing note. I see I'm in the middle of a multi-section spacing
> task. Let me pick up where I left off."*

It then re-narrates its entire state on every subsequent iteration — *"I'm picking up
mid-engagement. My standing note shows… I've completed:"* followed by the full list —
**14 times** in one worker, **34 times** in another, 9 and 5 in two more. The worker's
reminder set holds two entries and has **no instruction to act rather than narrate**,
which the consultant's set does have.

The measured cost: one worker spent **14,421 output tokens to make five element
writes**, about 2,900 output tokens per write, nearly all of it status narration.

## Behaviour

1. **A worker session receives no standing note and no recorded decisions.** The
   session-record priming entry renders nothing for a worker, in the same way it already
   renders nothing on a host that has no ledger at all. A worker's priming must contain
   no part of the consultant's record.

2. **A worker's per-turn reminders instruct it to act rather than narrate**, in
   substantially the words the consultant's reminders already use. A worker should not
   restate what it has completed at the head of each turn.

3. **What the consultant receives is unchanged.** The consultant still gets its standing
   note and its recorded decisions, on the same entry and in the same position, because
   delivering them is what stopped it re-deriving settled state.

4. **A worker still receives the facts about the site it is working on** — the site line
   and the page digest. Those are facts about the site, not about the consultant's
   conversation, and the worker needs them.

## Consequence, deliberately included

A worker that does not re-narrate spends fewer tool iterations on the same job. That is
the cheapest available mitigation of one half of DOC-60 §F2: a worker exhausted
`MAX_TOOL_ITERATIONS` at 51 calls, partly on re-narration, and was cut off before it
could report. This ticket does not fix the cap — that is upstream — but it makes
reaching it less likely.

## Not in scope

The cap itself, the report channel, the grant, and the consultant's prose. Each is its
own ticket under DOC-60.