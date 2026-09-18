---
uid: request-ba376b85
id: REQ-273
type: request
title: 'The assistant can report a defect: adopt the upstream development surface'
created_by: EPIC-19
created_at: '2026-09-18T21:45:39.352452+00:00'
updated_at: '2026-09-18T22:38:20.391199+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-01898991
---

Parent: [[EPIC-19]]. Asked for by the operator on 2026-09-18, after the builder
assistant reported in conversation that it had hit three defects and had no way
to file any of them.

## What the assistant reported

> No — I cannot create tickets of any kind, XGD bugs included. My ticket access is
> read-only: I can look tickets up, query them, read comments, backlinks and
> history. There is no create, no update, no comment-add. So when I hit a bug in
> this session, I have no way to file it — I can only tell you in conversation.

That is an accurate description of what it has, and it is exactly right about the
consequence: three defects reached the operator as prose in a chat pane, and a
person had to transcribe them.

## Why it is read-only, and what already exists

`sessionTicketSurface` (`apps/control-app/src/ai.ts:339`) composes the shared
`TicketToolbox` and grants `bridge.READ_GROUP` and nothing else. The comment
above it states the position plainly and correctly:

> `ReadTickets` AND NOT `WriteTickets`, which is a separate decision nobody has
> made. […] Reading what was decided is the capability being added here; creating
> and patching arbitrary tickets in the client's project is not.

That reasoning still holds and this ticket does not overturn it. **Granting
`WriteTickets` would be the wrong fix** — it lets the assistant create and patch
arbitrary tickets in the CLIENT's store, which is the client's data, in the
client's tenant, and is not where a defect in our software belongs.

**The right surface already exists upstream and has never been adopted.**
`@lagrangefoundry/ai-ticketing` ships a SECOND declaration beside `tickets`:

- surface `development`, group `FileDevelopmentTickets` (write)
- operations `report_bug`, `request_capability`, `add_ticket_detail`

Its own overview says what it is for, and answers the tenancy question this
project would otherwise have to answer for itself:

> What you file here goes to the people who build this product, into the project
> where its work is recorded. That is not the same place as anything this product
> stores for the people using it: nothing filed here reaches them, and nothing
> here is part of the work you were asked to do.

It also states the discipline that keeps it from becoming noise:

> Filing is not something to do on your own initiative. Someone asks for a
> ticket; your part is writing the good version of it.

And it names the reason a report from the assistant is worth more than a report
from the person who hit the defect:

> you know things the person who hit it does not — what you were attempting,
> which surfaces and APIs you were calling, what you expected them to do and what
> they actually did.

`scope_axes` is empty, so there is no axis this project has to get right.

## What this ticket wants

The `development` surface composed into the consultant, granted
`FileDevelopmentTickets`, writing into 1st Contact's own project store rather
than the tenant's — and the assistant told, in its priming, that filing is
something it does when asked rather than on its own initiative.

The three defects that prompted this are [[BUG-117]], [[BUG-118]] and
[[BUG-119]], each of which the assistant diagnosed well enough to have filed
itself.

## Questions the implementation has to answer

1. **Which store does it write to, and how does a Worker reach it?** The tenant
   store is `forTenant`-bound by construction; the product's own project store is
   a different thing entirely and this deployment does not currently hold a
   handle to one. This is the substantive piece of work, not the grant.
2. **The information barrier runs the other way too.** Nothing the assistant
   files may carry the client's material, their brief, or their transcript —
   those are the client's. A report names surfaces, operations, arguments and
   outcomes.
3. **Rate and duplication.** One defect hit in ten sessions should not be ten
   tickets. `add_ticket_detail` exists for exactly this and the repro console has
   already solved the same problem with its gap registry ([[REQ-256]]) — worth
   reading before inventing a second answer.
4. **What the client sees.** Nothing. A filed ticket must not appear in the
   client's own ticket views or their Library, and must not enter the project
   knowledge base the consultant searches.

## Not in scope

`WriteTickets` on the client's store. If some future capability needs the
assistant to write a ticket for the CLIENT, that is a different ticket with a
different justification, and the narrow-verb precedent (`record_decision` on the
ledger surface, see `ledger-core.ts`) is the pattern to follow rather than the
generic write group.