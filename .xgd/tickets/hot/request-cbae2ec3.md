---
uid: request-cbae2ec3
id: REQ-342
type: request
title: 'Delegate-first: the consultant commissions construction rather than performing
  it'
created_by: EPIC-20
created_at: '2026-09-27T22:31:29.639548+00:00'
updated_at: '2026-09-28T19:30:33.835400+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d0ca10c4
---

## Why

**DOC-60** §"F4 — Delegation is stated once, and the grant does not match the briefs",
and §"4. The primary stops writing L1".

`templates/delegation-method` is priming entry **[2] of 7, before the cache boundary**.
The consultant's per-turn reminder list has nine entries and **none of them is about
delegation**. So the instruction to delegate is read once and then sits roughly 186k of
prefix behind the model for the rest of a sitting — while `act-rather-than-narrate`, a
single corrective line, *is* in the per-turn tail, because standing behaviour needs
repeating. Delegating is standing behaviour and is not repeated.

The prose also still describes delegation as an option to be weighed, which will be the
wrong description once construction is commissioned rather than performed.

## Behaviour

1. **The method prose describes commissioning, not choosing.** Handing construction to a
   worker is how construction happens, not one of two ways it might. What the consultant
   keeps is the judgement: what the site should say, which arrangement is better, what to
   do about a request it thinks is wrong.

2. **The prose says what comes back, and which part is trustworthy.** The result carries
   the worker's own account *and* a structural diff of what changed that the host derived
   from the store. The diff is not the worker's word and does not need to be treated as
   such. The consultant should read the diff to see what happened and the report to
   learn why, and should not re-inspect the site to establish either.

3. **The prose says what the diff cannot settle.** It records what changed, not whether
   the change was right. Judging the result against the brief is still the consultant's
   work, and looking at the rendered page is still how that is done.

4. **The method is repeated in the per-turn tail**, not only stated at priming, so it
   survives a long sitting. What goes in the tail is short — the standing instruction,
   not the whole method — because the tail is re-assembled every turn and everything in
   it is paid for on every turn. Where a deployment commissions nothing — no worker
   configured, no surface composed — the tail entry says nothing at all, exactly as the
   method entry already says nothing, so the switch stays a true rollback and no session
   is told to reach for a capability it has not got.

5. **Nothing in the prose names a model, a backend or a price.** Which backend a worker
   runs on is configuration and stays there.

6. **What already works in the method is kept.** Writing the brief for a reader who
   cannot see the conversation, and asking for the checks the consultant would otherwise
   have made itself, are the two parts the measurements vindicate rather than indict.
   The rewrite changes what surrounds them. A check that comes back passed is still the
   worker's word and is still believed — a verdict the consultant re-makes itself is a
   verdict that saved it nothing.

## Dependency

Was blocked on the diff provider ticket: prose that promises a trusted diff before one
exists would be prose the consultant cannot act on. **Discharged 2026-09-28** — the
upstream hook and the host's own record have both landed, so the result the prose
describes is the result that now comes back.

## Not in scope

Removing the consultant's write tools — the gated final ticket. The worker's own priming,
which is a separate ticket under DOC-60.