---
uid: request-a7df66b6
id: REQ-339
type: request
title: A worker must not read the consultant's session record, and must not re-narrate
created_by: EPIC-20
created_at: '2026-09-27T22:31:18.721348+00:00'
updated_at: '2026-09-28T04:07:32.651991+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-015c4ce0
  commits:
  - working_sha: d5a1f5b48b2609dc501c1dba7a740d54e6ebbcc3
    reconcile_sha: null
    main_sha: null
  version: 0.2.395
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


## What landed

Two changes, one per cause, plus the facts each one implies.

**`roles.ts` — the record is delivered to the role that keeps it.** The
`session.summary` provider — the framework's product-tier entry, rebound by this
host to the standing note plus the ledger — now reads `ctx.role` and renders
`null` for any role that is not the consultant. `null` drops the entry and its
separator, which is exactly how a host with no ledger at all is already told
none of it; there is no second tier, no second registry and no branch in the
host.

*It is an allow-list, not a deny-list for the worker.* What the entry states —
*"your record of this engagement"* — is only true of a session that can keep
one, and the verbs that keep it (`set_standing_note`, `record_decision`) are on
the ledger surface, which `instances.json` grants to the consultant alone. So a
role added later gets silence until somebody says otherwise, rather than the
consultant's memory by default.

*The legacy role names are in the allow-list.* They are extra keys onto the same
consultant role object, and a conversation started before the rename resumes
under its stored name — so dropping its record there would be this same bug with
the sides swapped.

*The decision is taken before the store is touched.* The ledger is a ticket read
and it sits on the path of every worker this deployment opens, so the gate is
ahead of `source.record()` rather than after it: a worker costs the record not
even a read.

*It holds on every turn, not only the cold start.* The entry sits after the
product tier's cache boundary, so it is re-assembled per turn rather than
delivered once with the prefix — a gate applied only at session creation would
leave the record arriving on the worker's second turn.

**`priming.json` — two lines added to `builder_reminders`.**
`act-rather-than-narrate` is the consultant's own sentence, verbatim, spelled
again in this role's declared order rather than reached across from another's —
the settings role already carries its own copy on the same terms.
`no-status-narration` is the half only a worker needs: *do not restate what you
have already done at the head of a turn; the report at the end is the entire of
what the consultant receives.* Both are static, so they ride the per-turn tail
and cannot spoil the prefix every worker shares. The two providers already in
the tier — `site.line` and `site.digest` — are untouched, which is behaviour 4.

*The worker is still not nudged to keep a record.* `memory-trigger` stays out of
`builder_reminders`, because both verbs it names are on a surface the worker was
never granted. Pinned, since this ticket is what edits that tier.

**One existing assertion adjusted.**
`test_UAT_FC_REQ-295_every_worker_this_deployment_opens_sends_the_same_cacheable_prefix`
mapped every reminder entry to its `provider` and asserted none appeared in the
priming list. With static entries in the tier that map yields `undefined`, which
the priming list also contains — a match about nothing. It now filters to the
provider entries, which is what the case was always asserting.

## Test plan

`tests/test_UAT_FC_REQ-339_a_worker_is_told_to_act.test.ts` (node) — the cheap
half: the provider called directly for each role, and the reminder tier read
back out of `priming.json`. Localises a break to the provider or to the document
without booting workerd.

`tests/test_UAT_FC_REQ-339_the_worker_has_no_memory_of_a_conversation_it_never_had.workers.test.ts`
(workerd) — the evidence. A real conversation writes a real standing note and a
real decision through `set_standing_note` / `record_decision` into a real
D1-backed ticket store, then delegates on the next turn. The worker's requests
and the caller's are told apart by the model they are addressed to, so behaviour
1 and behaviour 3 are asserted on the same turn, off the same binding,
milliseconds apart. One double: the Anthropic client.

Regression scope: the priming, roles, memory and delegation suites — REQ-182,
REQ-171, REQ-123, REQ-239, REQ-280, REQ-283 (both), REQ-284, REQ-285, REQ-295
(both), BUG-65, BUG-118, BUG-145 (both), and the assistant-conversation
reconciliation suites. 124 + 45 pass.
`tests/reconciliation-assistant-conversation.test.ts` has one failure that
predates this change (a tool-name/grant comparison, verified against the
untouched tree).