---
uid: request-7ccc3268
id: REQ-283
type: request
title: 'The consultant keeps and consults its own memory: the summary store, the agent
  surface, and the product tier'
created_by: EPIC-19
created_at: '2026-09-19T18:54:44.485419+00:00'
updated_at: '2026-09-19T18:55:45.676409+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---


Parent: [[EPIC-19]] (Finding 5).

## What this gives the consultant

A memory of its own conversation that survives the conversation falling out of
context, and the tools to keep it and consult it.

Today it has neither. There is no `SummaryStore` in this repository, there are
**zero `chat_summary` comments in the whole store**, and the consultant cannot
read its own past turns or its own work log. What it can do is search the
client's corpus — which is why, having lost the thread, it re-screenshots the
site instead of recalling what it already decided.

## All of it is built upstream and simply not consumed

Nothing here needs designing. Four pieces, all installed:

1. **`SummaryStore`** (`summary.js`, lagrange-framework REQ-124) — two zones,
   because the polarity differs. The **standing frame** is the `framing` field,
   rewritten in place, capped at 4,000 bytes, always delivered whole. The **log**
   is the body, append-only through `append_body`. They are different writes and
   cannot clobber each other. Stored as a `chat_summary` comment on the ticket
   that homes the session — beside the `chat_transcript` this host already writes.
2. **The `agent` surface** — `InspectContext` (`priming`, `reminder`, `context`,
   `history`, `summary`), `OperateContext` (adds `history_full`, `role_priming`)
   and `MaintainSummary` (`summary_frame`, `summary_log`).
3. **The shipped product tier** — `transcript-pointer`, `tool-transcript-note`,
   the cache-boundary marker, and `session-summary`. The ordering is load-bearing:
   the summary sits AFTER the boundary, so rewriting it every turn cannot
   invalidate the cached prefix in front of it.
4. **`summary_trigger`** — the per-turn nudge that makes the summary get written:
   *"Keep your summary current as you work […] The frame is what survives when the
   recent exchanges do not, so anything you would need after losing them belongs
   in it."*

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
