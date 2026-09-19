---
uid: request-2dcd47ec
id: REQ-284
type: request
title: The consultant can see its own context pressure, and the recovery advice stops
  making it worse
created_by: EPIC-19
created_at: '2026-09-19T18:55:09.022310+00:00'
updated_at: '2026-09-19T18:55:09.022310+00:00'
completed_at: null
last_field_updated: created_at
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

## 1. Show it the gauge — which we already have

lagrange-framework REQ-143 landed per-request token accounting.
`ClaudeAPIBackend.usage(ref)` returns one record per request, and `usage.js`
exposes `usageRecord`, `turnUsage`, `turnSpend` and `sessionUsage`. **The host
already knows what every turn cost in input tokens, which is the context size.**
Nothing reports it to the session.

Deliver it where the session will act on it — the per-turn reminder is the
natural home, since that is the tier re-delivered every invocation and the one
that already carries the change signal. What matters is that it is a figure the
model can budget against, not prose about being careful.

**Do not make this a tool it has to call.** A gauge you must ask for is not a
gauge; the whole failure is that the cost is invisible at the moment of choosing.

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

Both change what the session is told about its own situation, both are edits to
prose and one small piece of plumbing, and neither needs [[REQ-283]] or the
upstream work. Together they let a session behave well under pressure; separately
each is half an answer — a gauge with no cheap recovery, or a cheap recovery with
no idea when to use it.

## Out of scope

Anything that changes what is IN the context. Bounding the conversation is
upstream; the summary is REQ-283. This ticket only changes what the session knows
about its own position.
