---
uid: request-95b2b06a
id: REQ-345
type: request
title: Words typed during a turn reach the consultant before her report
created_by: EPIC-19
created_at: '2026-09-28T19:44:09.354358+00:00'
updated_at: '2026-09-28T19:44:09.354358+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Parent: [[EPIC-19]] (Finding 14.10). Design: [[DOC-61]] §F3, item 5.
**Blocked on** LF REQ-180 (the channel) and LF REQ-182 (the cursor).

## What changes

The client can type while the consultant is working, see that it is queued, and have it
**reach her before she reports** — not four minutes after the work it was about to
redirect.

## What already exists, and what is missing

The affordance is **built upstream** in `webui-chat`: a `queued[]` list, pending bubbles
painted `is-pending is-queued`, everything queued during a turn run **as one batch**, and
the rule that text queued while *this* turn runs is already too late for it and belongs to
the next round. None of the transport exists in this repository, which is why the words
are dropped today — and it is the neighbourhood of [[BUG-122]], though BUG-122's own fault
is narrower: the composer clears its persisted draft at submit, before anything durable
holds the text.

**Upstream's delivery point is wrong for us.** It delivers the batch *after* the turn, as
a new turn. A consultant would then announce a finished homepage into a conversation that
abandoned that homepage four minutes ago — the client watching it happen is the whole
problem this is meant to fix.

## Scope

- **Durable first.** A queued message is durable before the bubble is the only copy of it
  — BUG-122's lesson, and the reason the queue cannot live in the DOM alone.
- **Notified, not injected.** Delivery is LF REQ-180's signal carrying **a count and a
  cursor**, and LF REQ-182's `pull` fetching the text. The consultant learns *2 messages
  are waiting* at her next tool call and chooses when to spend context on them.
- **Before the report.** The mid-turn notification is the point; falling back to
  after-the-turn delivery is the failure mode, not the design.
- **Coalesced.** Everything queued during one turn is one arrival, as upstream already
  does.

**Out of scope:** what the consultant does with an interruption — whether she abandons
work, folds it in, or answers and continues. That is prose and belongs with the role's
guidance, not the transport.

## Test plan

- Text submitted while a turn is running is **durable immediately** and survives a reload
  of the page mid-turn.
- The consultant's next tool call carries a notification naming the count; the text itself
  arrives only when she pulls.
- Two messages typed during one turn arrive as **one** batch.
- A message typed during a turn is delivered **before** that turn's final prose, in a
  session where the turn makes at least one further tool call.
- A turn that makes no further tool call after the message is queued still delivers it
  rather than dropping it — the fallback path exists and is observable as the fallback.
