---
uid: request-2dcd47ec
id: REQ-284
type: request
title: The consultant can see its own context pressure, and the recovery advice stops
  making it worse
created_by: EPIC-19
created_at: '2026-09-19T18:55:09.022310+00:00'
updated_at: '2026-09-19T19:02:11.636944+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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
