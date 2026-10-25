---
uid: request-2dcd47ec
id: REQ-284
type: request
title: The consultant can see its own context pressure, and the recovery advice stops
  making it worse
created_by: EPIC-19
created_at: '2026-09-19T18:55:09.022310+00:00'
updated_at: '2026-09-19T19:52:03.638936+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-29042f9e
  commits:
  - working_sha: 5c5795e10b0a02c7a167a010425f6c2ab741670f
    reconcile_sha: null
    main_sha: null
  version: 0.2.283
  story_points: 2
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