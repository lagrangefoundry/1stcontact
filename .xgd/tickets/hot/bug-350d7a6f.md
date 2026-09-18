---
uid: bug-350d7a6f
id: BUG-121
type: bug
title: An interrupted turn commits its work and discards its conversation
created_by: EPIC-19
created_at: '2026-09-18T23:11:24.573446+00:00'
updated_at: '2026-09-18T23:11:24.573446+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-10d48ce1
---

Parent: [[EPIC-19]]. Hit by the operator on 2026-09-18 on the Lagrange Foundry
site (`site_936dd7c92e5e14df694dd9a80433aa4f`, session
`site-site_936dd7c92e5e14df694dd9a80433aa4f`, chat ticket `chat-50932534`).

## What is wrong

An interrupted turn does not merely stop. **Its work is committed and its
conversation is discarded**, so the record of what the assistant DID survives
while the record of what was SAID does not.

That is not a lost message. It is the transcript and the world disagreeing about
what happened.

## The evidence, from the store

Two comments hang off `chat-50932534`:

| comment | kind | bytes | version | last written |
|---|---|---|---|---|
| `comment-40c95649` | `chat_transcript` | 57,348 | 21 | **22:24:46.649Z** |
| `comment-ca74b1b7` | `tool_transcript` | 350,925 | 18 | **22:24:46.641Z** |

The last *message* in the chat transcript is an assistant turn at
**22:18:34.139Z**. The last *tool record* is at **22:24:12.671Z**.

So between 22:18:34 and 22:24:12 — **nearly six minutes** — a turn ran, called
tools, and produced work. At 22:24:46 both artifacts were written. The tool
transcript grew. **The chat transcript's version went from 20 to 21 and gained
nothing**: no user turn, no partial reply.

The turn's work is not hypothetical. The tail of the tool transcript is a
`record_decision` against the engagement ledger carrying a substantive decision
about the site's recursion diagram, returning `{"entries": 6, "title": "Lagrange
Foundry — initial website build"}`.

**So the ledger now records a decision that the transcript has no memory of
anyone making.** The operator's prompt is gone, the partial reply they watched
being written is gone, and the consequences are permanent.

## Why the two halves behave differently

They are written by two different mechanisms with two different durability
properties, and nothing makes them agree.

**The tool record is append-only and lands as it happens.** `_applyTools` in
`@lagrangefoundry/ai/src/ticket_store.js` states it:

> `append_body` rather than a read-modify-write: the artifact is append-only, so
> no earlier byte is rewritten and there is no version to lose a race on.

**The prose transcript is a read-modify-write folded from the junction**, and in
this Worker the junction is RAM — `ai.ts:202` and `:598` pass
`lib.memoryJunctions()`. The drain that [[BUG-46]] holds open with
`ctx.waitUntil` (`router.ts:5326`, and `ctx` IS supplied at the one call site,
`router.ts:4761`) therefore ran against a junction that no longer held the turn's
prose records. It folded an empty increment and rewrote the same file — which is
exactly what a version bump with no content change looks like.

BUG-46 anticipated the remaining hole and named it:

> It does not make an in-flight turn durable — that is the junction's business,
> and in this Worker the junction is RAM (`ai.ts`), so an isolate evicted
> mid-turn still loses it. […] only a Durable Object would close it.

What that note did not anticipate is the **asymmetry**: losing the junction does
not lose the turn, it loses only half of it, and the half it keeps is the half
with consequences.

## Why this is more serious than an interrupted turn

Stopping work when the client leaves is a policy choice that can be argued.
Committing the work and discarding the conversation is not a policy — it is
divergence:

- **The assistant's own memory is now wrong.** The next turn loads the transcript
  and cannot see the decision it recorded six minutes ago. It will re-ask, or
  contradict itself, and the client will watch it do so.
- **The client has no account of a change they can see.** The site counter moved
  and the pane re-rendered; the transcript offers nothing that explains it.
- **The operator lost their own words.** Not the reply — the prompt. There is
  nothing to re-send and nothing to read back.
- **It is silent.** No error, no gap marker, no "this turn was interrupted".

## What this ticket wants

1. **The prose record must be at least as durable as the tool record.** Whatever
   the eventual answer for running turns to completion, the two halves of one
   turn must not have different survival properties. Either both are append-only
   as they happen, or neither is.
2. **Fold the user's message before the model is called.** Independent of
   everything else and worth doing on its own: an interrupted turn should never
   cost the client the words they typed.
3. **An interrupted turn must say so.** A turn that ends without `turn_end` is
   knowable. The transcript should carry that fact rather than leaving a gap the
   client reads as being ignored.
4. **Then decide the policy** — whether a turn should run to completion after the
   client leaves. That is [[EPIC-19]] Finding 4 and the operator's position is
   that it should. It needs a durable driver (a Durable Object per session) and a
   durable junction; the reattach half already exists as `tailSession`. **That
   work is larger and should not block 1–3.**

## Order

1, 2 and 3 are worth landing before the Durable Object work, because they bound
the damage of every interruption between now and then — and because 1 is the
integrity defect, which does not stop being one if turns later run to completion:
a turn can still fail, and its two halves must still agree.