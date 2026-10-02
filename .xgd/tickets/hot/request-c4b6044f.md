---
uid: request-c4b6044f
id: REQ-361
type: request
title: 'Consultant context: drop old tool results and stop oversized results entering
  it'
created_by: EPIC-20
created_at: '2026-10-02T18:49:38.862851+00:00'
updated_at: '2026-10-02T22:49:24.326314+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-503b8c6e
---

**Parent:** EPIC-20. **Evidence:** EPIC-20 § "Charlie's Plumbing session, 2026-10-01/02".

## Problem

In the Charlie's Plumbing session the consultant (Opus) cost $28.88 of $33.41. More than half was cache reads ($16.73): every request re-reads the whole conversation, which grew from ~50k tokens on the first turn to ~514k on the last. Nothing trims it within a session. About $12 of the consultant's cost was spent carrying old tool results forward.

Three outsized results did most of the damage:

1. **`Delegate` results carry whole subtrees.** The REQ-340 account lists a whole element tree as `before`/`after` when a worker creates a page or restructures a box. Four results were 62 KB, 70 KB, 53 KB and 54 KB (~76k tokens together).
2. **`capture_site` returned 241 KB**, almost all a list of `data:` URLs it refused to fetch (~69k tokens).
3. **Plan and ledger writes echo the whole document back.** `set_decision` and `set_task` return the full plan (11–24 KB) on every call. `set_standing_note` returns the full note.

## Required behaviour

### A. Old tool results leave the context after the turn that used them

- A tool result produced in an earlier consultant turn is replaced in later requests by a short stub naming the tool, the turn, and how to get it again (re-read, or the tool-transcript record by id). The result in the current turn is untouched.
- The stub is stable: the same result always renders the same stub, so the cached prefix stays valid from one turn to the next. The rewrite happens once, at a turn boundary, never mid-turn. Re-rendering history differently on every request would break the cache and cost more than it saves.
- The model's own text, the client's messages and the `Delegate` brief stay. Only tool *results* are stubbed.
- The stored transcript keeps every result in full. This is a change to what is sent, not what is recorded.
- This must stay compatible with Opus 5.5's preserved-thinking rule (thinking blocks are bound to an unedited history). If stubbing earlier turns would invalidate thinking blocks, the turn-boundary rewrite must use whichever form the API accepts, and the ticket must record which.

### B. The three oversized results are slimmed at the source

- **`Delegate` account:** a difference whose `before` or `after` is an element subtree is reported as an address, the operation (`created`, `replaced`, `removed`), the element kind and a child count, not the tree itself. Field-level differences (`padding.topPx: 32 → 56`) keep their values. A whole new page reports its id and element count.
- **`capture_site`:** refusals are summarised as a count per reason (`41 × scheme: data:`) plus at most five examples.
- **Plan/ledger writes** (`set_decision`, `set_task`, `record_decision`, `update_brief`, `add_note`, `set_standing_note`) return a confirmation: what was written and its id/version, not the whole document. A separate read returns the document when the consultant needs it.

## Acceptance

- Replaying the Charlie's Plumbing session's consultant tool calls through the new path, the context sent on the last request is under 150k tokens, against ~514k measured.
- A two-turn conversation where turn 1 calls a tool shows, on turn 2's first request, a cache read covering turn 1's (stubbed) history. Stubbing must not cost the cache.
- A `Delegate` that creates a page returns an account under 4 KB.
- The 241 KB `capture_site` refusal list renders as a per-reason summary under 2 KB.
- Each plan/ledger write returns under 1 KB.

## Not in scope

The step count (39 bookkeeping and 27 room calls out of 121). That is prompt and method, and is measured again after this lands.