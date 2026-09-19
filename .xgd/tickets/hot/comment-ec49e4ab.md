---
uid: comment-ec49e4ab
id: COMMENT-3276
type: comment
title: Comment on request REQ-284
created_by: xgd
created_at: '2026-09-19T22:07:14.416078+00:00'
updated_at: '2026-09-19T22:07:14.416078+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-2dcd47ec
  kind: note
---


Parent: [[EPIC-19]] (Finding 5). Small, independent of [[REQ-283]], and landable
on its own.

## Two things the consultant is not told, and one of them it asked for

The consultant's own account, from the Lagrange Foundry transcript (2026-09-19):

> **I get no warning.** This is the part I would most want you to know. I do not
> experience the cutoff. There is no signal, no error, no sense of pressure — the
> turn simply ends […] I cannot budget, cannot wrap up early, cannot choose to
> skip the screenshot because I am running hot. From the inside it is
> indistinguishable from having finished.
>
> Right now I am driving with no fuel gauge.

## 1. The gauge itself is upstream — but name the cost where the choice is made

The occupancy figure is **lagrange-framework REQ-168 §4**, deliberately: only the
adapter knows the input-token count it just sent and the model's window, the
delivery mechanism (a volatile entry after the cache boundary) already exists
there, and every adopter of a long-lived session needs it. A gauge assembled in
this repository would be us re-deriving what the backend already holds.

**What IS ours is naming the cost at the point of the call.** The consultant's
third recommendation was *"make screenshots visibly costly, or make them
expire"* — REQ-168 does the expiring; this does the visibility:

> If an image could be dropped from context after N turns, or if the tool said
> what it costs, I would take a quarter as many. I have been treating looking as
> free. **It is the most expensive thing I do.**

The fidelity surface's own prose is ours to write. A session choosing between
`list_changes` and a screenshot should be able to read, in the one line it sees at
the moment of choosing, that one of them is roughly free and the other is not.
That is a prose change to a declared surface, not a mechanism.

## 2. Stop steering it into the wall

`priming.json:80`, the `interrupted-turn` reminder, verbatim:

> Your previous turn in this conversation did not finish — it was stopped, or it
> failed part-way. Your client may not have seen all of your reply, and anything
> you had already done is NOT described in the transcript you have just read.
> **Look at the site before you answer**, and pick up from what you find rather
> than from what the conversation says.

That advice is correct in isolation and exactly backwards under the failure it
responds to. It instructs the session to spend context in order to recover from
having run out of context — and *"look at the site"* is a screenshot, which is the
most expensive instrument available. The consultant followed it four or five times
in one session and named the result: *"Each recovery makes the next truncation
arrive sooner. It is a doom loop, and the system is steering me into it."*

**Name the cheap instrument instead.** `list_changes` answers *"what landed?"*
completely and costs almost nothing. The rewrite should tell the session to call
it, and to look at the site only if the answer is genuinely insufficient — because
*"the expensive one is the one that comes to mind"* unless the cheap one is
written down.

## Why these are one ticket

Both are prose on surfaces this repository owns, both are about what the session
knows at the moment it chooses an instrument, and neither needs [[REQ-283]] or the
upstream work to land. Together they make the cheap path visible and the expensive
path honestly priced; separately each is half an answer — a session told what
things cost but not what to reach for instead, or told what to reach for without
knowing why it matters.

## Out of scope

Anything that changes what is IN the context. Bounding the conversation is
upstream; the summary is REQ-283. This ticket only changes what the session knows
about its own position.

## What this lands, concretely

Four prose surfaces and one small seam in the code that selects between two of
them. Nothing here is a mechanism: no new operation, no new state, no change to
what any call does.

### The two lines read at the moment of choosing

The summary manual a session is primed with renders one line per tool — the
operation's `summary` — beside each group's prose and each surface's overview.
That line is the whole of what is in front of a session deciding which
instrument to reach for, so the pricing goes there and not only in the detail a
session would have to ask for.

- `screenshot`'s summary says it is the most expensive call available, that the
  image stays in every turn after this one, and — for the specific question a
  session most often takes a picture to answer — names `list_changes` as the
  thing that answers it for almost nothing.
- `list_changes`'s summary says it is the cheap one, and says it is what to
  reach for before taking a picture.

The fidelity surface's overview and its group prose carry the same pricing at
length, including the fact that `compare` measures two pictures and hands back
numbers rather than images — the cheapest way to ask *do these match* without
either picture entering the conversation.

### The interrupted-turn reminder names the cheap instrument

`interrupted-turn` stops saying *"Look at the site before you answer"* and says
to call `list_changes` first — it reports what landed and who landed it — and to
take a picture only if that is genuinely not enough.

**The settings assistant gets its own template.** `interrupted-turn` is rendered
for both roles today, and a session is never told about a capability it was not
granted: the settings assistant has no site, no `list_changes` and no camera, so
a rewrite that names `list_changes` would name a tool it does not have. The
template splits in two — `interrupted-turn` for the consultant and
`interrupted-turn-settings` for the settings assistant, which names the cheap
reads that role does have (`read_business`, `read_addresses`). The provider
registration chooses which; that is the only .ts change in the ticket, and it is
one argument.

## Test plan

UATs assert on what the configuration and the declarations actually ship, not on
a constant holding a copy of the words:

- the interrupted-turn reminder a consultant session renders names
  `list_changes` and no longer instructs the session to look at the site first;
- the settings session's interrupted reminder names neither `list_changes` nor
  the site, and names a read that role is granted;
- both roles still render nothing at all on an uninterrupted turn;
- `screenshot`'s one-line summary prices the call and points at the cheap
  alternative; `list_changes`'s one-line summary says it is the cheap one;
- the pricing survives into the summary manual a session is actually primed
  with, which is the only place it does any good.

---

## Correction: the "pays forever" claim is now false (2026-09-19)

lagrange-framework [[REQ-168]] landed after this ticket and **removed the
behaviour this ticket's prose asserts**. What shipped:

- `DEFAULT_IMAGE_TURNS = 2` — an image block is live for about two turns.
- `DEFAULT_MAX_LIVE_IMAGES = 3` — a ceiling for the burst case.
- `imageBlock({mediaType, data, label})` — an optional host-supplied name.
- Past that, the block becomes a pointer:
  `[image: IMAGE-9 (plate-i-loop.png), image/png, 48231 bytes, fp:1a2b3c4d]`

So the following, which this ticket landed, is no longer true:

- `fidelity-surface.json` overview — *"you pay for it again on every turn after
  this one […] it is carried into the next turn, and the one after that, for as
  long as this conversation lasts"*
- `screenshot`'s summary and description, the `SeeSite` group description, and
  `priming.json`'s `interrupted-turn`, which carry the same claim
- and two UATs pin the wording, so they keep passing while the statement is false:
  `test_UAT_FC_REQ-284_the_cheap_instrument_is_named.test.ts:193` and `:223`

**The error now runs the expensive way.** A screenshot costs roughly two turns of
context rather than all of them, so a session still told it pays forever will
avoid looking when looking has become affordable — this ticket's own failure mode,
inverted. That is worse than the original defect, because under-looking is
invisible: nobody notices a picture that was not taken.

**What stays true and should not be softened:** a screenshot is still the most
expensive single call, `list_changes` is still the right instrument for *what
landed?*, and recovery is still the worst moment to spend context. Only the
"forever" claim goes; the ranking it was supporting does not.

**The prose change is a new free-coded ticket** — this body is a record, not the
fix, and the two UATs move with it.
