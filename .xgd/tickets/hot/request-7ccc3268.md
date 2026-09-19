---
uid: request-7ccc3268
id: REQ-283
type: request
title: 'The consultant keeps and consults its own memory: the summary store, the agent
  surface, and the product tier'
created_by: EPIC-19
created_at: '2026-09-19T18:54:44.485419+00:00'
updated_at: '2026-09-19T19:46:54.586522+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-074bab15
---

Parent: [[EPIC-19]] (Finding 5).

## Correction to this ticket's premise (2026-09-19)

An earlier draft said this host has no session memory at all. **That was wrong,
and the correction changes the shape of the work.**

**The decision log already exists and is working.** [[REQ-171]] built the
*engagement ledger* — `record_decision` on the ledger surface, writing
`### Decision N` entries into the CHAT TICKET BODY. On the Lagrange Foundry
session it currently holds **7,507 bytes** of real decisions. `DOC-33` §3.1
defines what the body is for, in words that match the intent exactly: *"not a
summary of the conversation but a **ledger** — what was decided, why, and what was
rejected."*

**And its placement is deliberate and well-argued** (`ledger.ts:9`):

> WHY THE BODY AND NOT ANOTHER COMMENT. The knowledge component indexes `title`
> and `body` (`ticketText`); comments are not indexed. A chat ticket whose body is
> empty contributes a content-free vector to the project KB, so every conversation
> this client has ever had is unfindable.

That reason is sound and must survive this ticket.

## So what is actually missing

**1. Delivery. The ledger is WRITE-ONLY.** Nothing in `priming.json` carries it,
and the ledger surface's only group is `KeepLedger` — `record_decision` and
`name_engagement`. There is no read operation and no provider. **The consultant
records a decision and cannot see it on the next turn.** That is the single
highest-value fix here and it explains the observed behaviour better than
anything else: a session that cannot read its own decisions has no choice but to
re-derive them, and re-deriving state is what the screenshots were for.

**2. The standing frame.** The ledger is append-only and unbounded. There is no
bounded, rewritten-in-place paragraph — *what we are doing, what is settled, what
is out of scope, what was rejected and why* — that can be delivered whole on every
turn regardless of how long the engagement runs. That is the zone the framework
calls the standing frame, and it is the part that survives when the window does
not.

**3. Self-inspection.** No `agent` surface, so the consultant cannot read its own
past turns (`history`, `history_full`) or its own work log.

## The design question this ticket must answer, not presume

The framework's `SummaryStore` puts its log in a `chat_summary` COMMENT body and
its frame in that comment's `framing` FIELD. **This host already put its log in the
ticket body, for the indexing reason above.** Adopting `SummaryStore` wholesale
would either duplicate the log or move it somewhere the KB cannot see.

Two coherent answers; pick one deliberately:

- **Extend the ledger.** Keep the log where it is and where it is searchable, add a
  bounded frame beside it (a ticket field, or the `framing` field of a
  `chat_summary` comment used for the frame alone), and write a host provider that
  delivers frame + recent ledger tail per turn. Keeps REQ-171's indexing property;
  costs a provider this repository writes and maintains.
- **Adopt `SummaryStore` and make the ledger its log.** Uses the framework's
  provider, its cap enforcement and its `MaintainSummary` operations unchanged —
  but only works if the indexing concern can be met another way, and that has to
  be established rather than assumed.

**The first looks right**, because the indexing argument is concrete and the
framework's placement choice was made without it. But the second should be
disproved rather than skipped, and whichever is chosen, `agent`'s
`InspectContext` is wanted either way.

## What to do

- Construct a `SummaryStore` over the tenant's ticket store and pass it to
  `SessionManager` as `opts.summary`. The archive already homes sessions on chat
  tickets, so the summary comment lands beside the transcript with no new storage.
- Compose `AgentToolbox` into the consultant, granted `InspectContext` and
  `MaintainSummary`.
- Adopt the product tier rather than declining it.

## The stale note that has to go

`priming.json`'s `about` says this host declines the product tier because
*"`session.summary` waits on lagrange-framework BUG-45."* **That is no longer
true.** BUG-45 is fixed in the installed code — `PrimingAssembly.offsets` filters
volatile sections before computing, which is exactly the defect. Delete the claim
rather than leaving a resolved blocker documented as live.

Re-check the tier's other two entries on their own merits while adopting it, since
the same note declined them for different reasons: `session.transcript_pointer`
and `session.tool_transcript_note` were declined because *"this host grants no
operation that reads them"* — which `InspectContext` changes. A session must still
never be told about a capability it was not granted, so the tier and the grant
land together or not at all.

## Why this is the one that matters

REQ-126's window is only safe because what falls outside it is *"reachable two
ways: the summary the session maintains, and the transcript it can address by turn
id."* **This host has neither, so its window is a cliff.** Until this lands,
bounding the conversation — in flight or anywhere else — is data loss rather than
context management. It is the precondition for lagrange-framework REQ-168 being safe.

## Out of scope

Bounding the live conversation. That is the framework's, and it is filed
upstream. This ticket makes that bound SAFE; it does not apply one.