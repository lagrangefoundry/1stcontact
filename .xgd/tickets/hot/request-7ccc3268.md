---
uid: request-7ccc3268
id: REQ-283
type: request
title: 'The consultant keeps and consults its own memory: the summary store, the agent
  surface, and the product tier'
created_by: EPIC-19
created_at: '2026-09-19T18:54:44.485419+00:00'
updated_at: '2026-09-19T19:52:43.232524+00:00'
completed_at: null
last_field_updated: body
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

## DECIDED: the frame is a field on the chat ticket (operator, 2026-09-19)

> It makes more sense to me that it would be in the frontmatter of the chat
> ticket.

**Agreed, and it is a better fit than either framework placement.** The reason is
the framework's own structural argument, applied to the objects THIS host actually
has.

`summary.js` splits its two zones across a field and a body so that *"rewriting
the frame and appending to the log are then structurally different writes that
cannot clobber each other — a frame rewrite patches one field and never touches
the body, and an append goes through `append_body` and never reads-then-writes the
frame."* That property is what matters, and it is the placement that is
incidental.

**This host already has the log in the chat ticket body.** So putting the frame in
that same ticket's frontmatter reproduces the invariant exactly — a field patch
merges and never touches the body; the ledger appends and never reads the frame —
while collapsing the session's whole memory into **one object**:

| | chat ticket | |
|---|---|---|
| frontmatter | `fields.frame` | the standing frame, rewritten in place, bounded |
| body | `### Decision N` entries | the ledger — append-only, unbounded, **KB-indexed** |

Three further advantages, none of them cosmetic:

1. **It removes a full comment scan.** `SummaryStore` caches comment uids
   precisely because *"`comments` is a full scan of the subject's comments"*.
   `findChat` already fetches this ticket for the ledger, so the frame arrives in a
   read we are already doing — zero additional cost per turn.
2. **Compare-and-set is already there.** `update` takes `expected_version` on the
   ticket, so two sessions rewriting one frame still conflict loudly, which is the
   one place the framework insisted on CAS.
3. **The schema extension is the pattern already in use.** `tickets.ts:611`
   already spreads `chatSchemas().chat.fields` and adds this repository's own
   entries. A declared `frame` field is one more line in a list that exists.

**And keeping the frame OUT of the KB is correct, not a compromise.** `ticketText`
indexes title and body. The ledger is the durable record and belongs in the index;
the frame is a working note rewritten many times a session, and indexing it would
feed the corpus a stream of churn that supersedes itself. The split falls exactly
where searchability should fall.

### What this means we are not using

`SummaryStore` itself. That is a real cost and should be paid deliberately:

- **Its cap enforcement.** `checkFrame` raises rather than truncates, for a stated
  reason — a silently shortened frame *"loses the rejections first, which are the
  whole reason the zone exists."* Whatever writes `fields.frame` must keep that
  rule: **an error, never a truncation.**
- **`MaintainSummary`'s operations.** `summary_frame` / `summary_log` write through
  `SummaryStore`, so they do not apply. The frame needs a narrow verb on the
  LEDGER surface instead — beside `record_decision` and `name_engagement`, which is
  the pattern `ledger-core.ts` already argues for over granting generic write
  groups.
- **The `session.summary` provider.** A host provider delivers frame plus recent
  ledger tail instead. This is the piece that makes the memory readable at all, and
  it was going to be ours under either option.

`agent`'s `InspectContext` is still wanted, unchanged — reading past turns and the
work log is independent of where the frame is stored.

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