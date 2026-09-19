---
uid: bug-350d7a6f
id: BUG-121
type: bug
title: An interrupted turn commits its work and discards its conversation
created_by: EPIC-19
created_at: '2026-09-18T23:11:24.573446+00:00'
updated_at: '2026-09-19T00:11:26.129478+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-10d48ce1
  commits:
  - working_sha: 0ff31ce19e930529b890a1d5947462296a50dff9
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a25bb80c04d9d2d34087dc85a56b516ffe26a7c
    reconcile_sha: null
    main_sha: null
  version: 0.2.276
  story_points: 5
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
---

## Correction — the store evidence re-read (2026-09-18, before implementation)

**The asymmetry above did not happen.** The two halves of that turn agreed; the
reading that said otherwise turns on how a folded assistant turn is stamped.

Read out of the live store (`comment-40c95649`, `comment-ca74b1b7`):

- The `record_decision` at `22:24:12.671Z` carries
  `turn="a2fd2b41a7fb45edade13b0274b67233"`.
- The chat transcript holds **that same turn id**, as a complete pair: the
  operator's long message (`role="user" ts="22:18:29.973Z"`) and the assistant's
  whole reply (`role="assistant" ts="22:18:34.139Z"`), ending on *"When you're
  out of the copy, tell me and I'll strip the full stops…"*.
- `applyRecords` (`session_log.js`) stamps a folded assistant turn with the
  timestamp of its **first delta**, not its `turn_end`. So a turn that starts
  talking at 22:18:34 and calls its last tool at 22:24:12 is archived reading
  `ts="22:18:34"`, which is what made the tool record look like it came after
  the conversation ended. It came *inside* the same turn.

Both artifacts were written 8ms apart at 22:24:46 because **one `apply` wrote
both**, at that turn's end — tool records appended, prose folded, same
increment. `_applyTools`'s `append_body` is not a continuous write: like the
prose, it lands only when `ArchiveSyncer` drains a *closed* turn (`closedPrefix`
holds back an open one). The two halves are already synchronous.

**What was actually lost is worse in a simpler way: a whole turn, both halves,
leaving nothing at all.** The turn the operator lost is the one between
22:24:46 and the next recorded prompt at 23:19:08 — and the store holds no
record of it of any kind: no user turn, no partial reply, and **no tool record
either** (the tool transcript jumps straight from `a2fd2b41…` to `ce853c31…`).
Their own next message says it: *"I was exploring the controls and lost a long
response of mine and a partial response of yours."*

So the defect is not divergence between the two halves. It is that **an
in-flight turn lives entirely in one isolate's RAM and nothing about it is
durable until it closes** — exactly what `ai.ts`'s junction comment says, with
no asymmetry to soften it. Item 1 as written ("either both are append-only as
they happen, or neither is") is already satisfied: *neither* is.

### What that does to items 1–4

- **Item 1** — restated rather than dropped. Nothing can be made
  append-only-as-it-happens without a durable junction, but the one record that
  matters most can be made durable **before** the model is ever called, so it
  leads the turn's side effects rather than trailing them. That is item 2, and
  it is now item 1's answer too.
- **Item 2** — unchanged and confirmed as the real fix. Implemented here.
- **Item 3** — unchanged. Implemented here.
- **Item 4** (a Durable Object per session) — unchanged, still the only thing
  that closes the window, still [[EPIC-19]] Finding 4's, still not this ticket.

## What was built

### 1. The client's words are durable before the model is called

A turn's prompt is written to the session's `chat` ticket — `fields.pending_turn`,
a JSON string carrying `{text, at, status}` — **before** `promptStream` is
reached, so it is on disk before the first token is generated and before any
tool can write to the site. It is the same find-or-create the corpus cursor
(`kb_cursor`) already performs on the same ticket, and an unversioned field
write for the same stated reason: a bookmark must never fail a turn.

An interrupted turn therefore costs the client the answer and never the
question.

### 2. A turn that did not finish says so

The record is cleared when the turn closes complete, and **kept, carrying its
outcome** (`aborted` / `error`) when it does not. So a turn that ends abnormally
leaves a mark rather than a gap, whether or not it managed to archive anything.

### 3. What the client sees on the next page load

`/api/ai/session` answers with `interrupted: {text, at, recorded}` when the
session holds such a record, reconciled against the transcript it also returns:

- **`recorded: false`** — the turn left nothing behind (the isolate went). The
  pane paints the operator's words as their own turn, says the turn was
  interrupted, and puts the text back in the composer so it is one keystroke
  from being re-sent. The record is **kept**, because it is the only copy of
  those words in existence.
- **`recorded: true`** — the turn's records did land (BUG-46's drain ran) and
  the reply above is incomplete. The pane says so and paints nothing else. The
  record is **cleared on read**: the words are safe in the transcript, so the
  notice is owed exactly once.

### 4. The assistant is told, on its next turn

A reminder entry (`turn.interrupted`, prose in `priming.json` like every other
line a session is told) reports that the previous turn was cut. The client may
not have seen the whole reply, and work the assistant had already done may not
be described in the transcript — so re-orienting is cheaper than re-asking, and
this is the channel REQ-131 and REQ-160 already deliver on. Absent when the
previous turn completed, and it costs nothing: a `null` provider drops its entry
and its separator.

### What is NOT fixed here, stated plainly

An in-flight turn is still driven by the fetch request and its records still
live in one isolate's RAM. An eviction mid-turn still loses the assistant's
partial prose and the turn's tool records together. This ticket bounds the
damage — the question survives, the interruption is visible, and the assistant
knows — it does not close the window. Only [[EPIC-19]] Finding 4's Durable
Object does that.

## Test plan

`tests/test_UAT_FC_BUG-121_interrupted_turn.workers.test.ts` — real D1, real
ticket store, real session manager and junction, the Anthropic client the only
double (`pacedClient`, so a test can stand inside an open turn):

1. The prompt is in the store before the model has answered a word.
2. A turn whose isolate never comes back is reported to the next page load, with
   the operator's words, and is still reported on the read after that.
3. A turn that was abandoned but drained is reported as interrupted **once**,
   with `recorded: true`, and not on the next read.
4. A completed turn leaves no record and reports nothing.
5. The next turn's model request carries the interrupted-turn reminder, and a
   turn following a complete one does not.

`tests/test_UAT_FC_BUG-121_interrupted_prompt_returns.test.ts` (jsdom, against
the installed `webui-chat`) — the pane paints the unanswered prompt, says the
turn was interrupted, and restores it to the composer only when the composer is
empty.


## Details settled during implementation

Behaviour that follows from the above rather than being asked for separately,
recorded here because each one is asserted by a UAT.

**A turn that is still running is not an interrupted one.** A reload in the
middle of a turn is the ordinary case [[BUG-46]] exists for — the pane paints the
fold and reattaches to the rest — so a session whose transcript reports a live
turn at the cursor is answered with no `interrupted` at all. Reporting it would
tell the operator that the reply arriving in front of them had been lost. The
one false positive this cannot rule out is a turn being driven by *another*
isolate, which this host cannot see; a shared junction is what would let it.

**The composer is only filled when it is empty.** The chat component restores its
own per-conversation draft, and a draft is something the operator typed more
recently than the lost message. Overwriting it to hand back the older text would
turn a rescue into a second loss, so the restore stands down and the message stays
on screen to copy from.

**The settings conversation is treated identically.** A customer can close the tab
mid-rename exactly as an operator can navigate away mid-build; the words are on the
same junction in the same RAM. `openBusinessSession` reports `interrupted` the same
way, and the settings role reaches the reminder under the same provider name — the
signal is about the conversation, which both roles have in the same shape.

**A safety net never fails the turn it protects.** Every read and write of the
record is a ticket-store round trip, and every one of them is swallowed: a store
that cannot answer costs the conversation a notice, not the turn. A corrupt value
reads as no value, for the same reason. The write carries no `expected_version`,
so two turns racing to replace the record both succeed rather than one being
refused.

**The record is a declared field.** `pending_turn` is added to the `chat` ticket
type beside `kb_cursor` ([[REQ-160]]), merged onto the imported schema rather than
restating it, and holds JSON in one field for the cursor's reason: the text, when
it was asked and what became of it are one fact about one turn.