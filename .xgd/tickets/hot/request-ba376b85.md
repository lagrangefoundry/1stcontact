---
uid: request-ba376b85
id: REQ-273
type: request
title: 'The assistant can report a defect: adopt the upstream development surface'
created_by: EPIC-19
created_at: '2026-09-18T21:45:39.352452+00:00'
updated_at: '2026-09-18T22:49:44.390241+00:00'
completed_at: null
last_field_updated: body
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

---

# What was built

## The shape, in one paragraph

The assistant now has three verbs — `ReportBug`, `RequestCapability`,
`AddTicketDetail` — over a SECOND ticket store which is ours. The client's store
is unchanged and still read-only to it. The two surfaces share a package, a shape
and no store whatsoever, which is the whole reason this was worth building rather
than widening the grant that was already there.

## Answer to question 1 — which store, and how a Worker reaches it

**The store is the xgd project this repository is, reached through its own CLI.**
Not the tenant's D1, not a new table, not a queue harvested later: the place the
work is already recorded.

The reach was the substantive work, and the constraint is hard. The builder
assistant runs in workerd both deployed and under `wrangler dev`. Upstream's own
reach to a local project (`XgdProject`) spawns that project's CLI, and
`node:child_process` does not exist in workerd — upstream splits it behind a
`./node` subpath precisely so a Workers build fails at the import rather than at
the first ticket somebody files.

So the subprocess happens in the one Node process that is already sitting beside
the dev server for its whole life: `1c builder`, which starts `wrangler dev` and
waits on it. It now also starts a **loopback filing service** in its own process,
holding the real `XgdProject`. The Worker holds an HTTP client to it. Both halves
are small because everything that needs judgement — the two-call
create-then-read-back, the translation of xgd's error codes into the declared
ones, `WrittenButUnreadable` for the write that landed and could not be read —
stays upstream where it was written. Our side is a transport.

This is the shape upstream already anticipates in as many words: *"the same three
methods can be served over HTTP by a ticket server, and this file does not
change"*. The day there is a hosted ticket server, the answer is an address in
`[vars]` rather than a line of code.

Three consequences, stated because they are decisions rather than accidents:

- **It is a development capability, and a deployed builder has no filing tool at
  all.** No address means no surface — the assistant has never heard of the verbs
  rather than being offered ones that always fail. That is DOC-20's rule and the
  same `null`-is-ordinary shape a missing browser or image credential already has.
- **workerd can reach loopback**, which was measured before any of this was
  written rather than assumed. It is the one runtime fact the arrangement rests on.
- **Loopback plus a per-run bearer.** Loopback keeps other machines out; it does
  not keep out a page in the operator's own browser, which can POST JSON
  cross-origin without ever reading the answer. One header closes that, and the
  token is minted fresh per `1c builder` run so there is nothing durable to leak.

The address and the bearer reach wrangler as `--var` and are deliberately absent
from `wrangler.toml` and `.dev.vars`: both are minted per run, so a committed copy
would be a stale one pointing every clone at a listener that is not there.

## Answer to question 2 — the barrier the other way

The declaration is amended, not restated. Upstream's overview already says what
the surface is for and carries the discipline this ticket asked for in its own
words; what it cannot say is whose material this session is holding, because it
knows nothing about tenants, briefs or transcripts. So `CONFIDENTIALITY_NOTE` is
appended to the shipped overview through `DevelopmentToolbox`'s own
`declarationOverride` seam: *name the surfaces, operations, arguments and
outcomes; do not quote or summarise their brief, their material, their
conversation with you, or anything identifying them.*

**As an overview amendment and not a priming entry**, deliberately. Priming is
static per role and would tell a deployment with no filing service about a
capability it has not got. The override is composed exactly where the surface is,
so the sentence exists precisely when the tool does — and the same mechanism is
what carries "filing is not something to do on your own initiative" to the model,
which is what the ticket asked for in the priming.

## Answer to question 3 — rate and duplication

**The conversation is the registry, and no second one was built.** That is what
reading [[REQ-256]] first produced rather than a second answer: the console keeps
a file because a console is a sequence of separate non-conversational rounds with
no shared memory. A chat session is the opposite — the id comes back when the
ticket is filed, the transcript is replayed into every later turn, and filing
happens only when somebody asks for it. So within a session the assistant can see
what it filed and append to it, and `add_ticket_detail` is in the grant for
exactly that. Across sessions, a second ticket requires a second person asking.

No rate cap was added. A cap would have to refuse, and the only declared codes it
could refuse under mean things that are not true — `validation` says the project
declined the ticket, `project_unreachable` says nothing was filed and invites a
retry. A refusal that lies about which of those happened is worse than a
duplicate a human merges.

## Answer to question 4 — what the client sees

Nothing, and structurally rather than by policy. Their ticket views, their
Library and the project knowledge base the consultant searches are all
projections of the tenant store, and nothing on this path touches it: the filing
surface is constructed from a project handle and holds no `TicketStore`, no
tenant and no business. There is no argument anywhere on it that could name one.
A UAT asserts it against a real tenant store — file a bug, and their store's
ticket count is unchanged.

## What changed

| File | What |
|---|---|
| `apps/control-app/src/development.ts` | New. The `development` surface, its grant, the confidentiality note, and the HTTP reach to the project. |
| `apps/control-app/src/ai.ts` | A `development` wire on `workerHost`, composed into `extraSurfaces` beside the client's ticket surface. |
| `apps/control-app/src/router.ts` | `DevelopmentEnv` on `RouterEnv`; the `deps.development` seam; the wire assembled where every other one is. |
| `tools/generate/src/cli/filing.ts` | New. The loopback filing service, the dispatch onto upstream's `XgdProject`, and the `--var` names. |
| `tools/generate/src/cli/index.ts` | `1c builder` starts the service, hands wrangler its address, closes it in a `finally`; `--no-filing` opts out; help text and banner say which. |
| `tools/generate/src/cli/assets.ts` | Four more names on the ticket bridge's generated shim — the declaration, the surface class, the config builder, the group constant. The `./node` rung is still not named, so nothing can pull `node:child_process` into the Worker bundle. |

A failure to start the service is a **warning and never a refusal**: being able to
file a defect is not a precondition for building a site.

## Test plan

`tests/test_UAT_FC_REQ-273_report_a_defect.workers.test.ts` — the surface as a
session really gets it, in workerd, against the shipped bridge and a real
`forTenant` D1 store: the grant and the three tools; no operation lets the model
name a project, a type, a status, a business or a site; a report lands as a draft
`bug` and a capability request as a `request`; **the client's store gains
nothing** and is still read-only; the confidentiality note is in the manual and
the shipped overview survived the amendment; a second sighting appends rather than
files again; no address composes no surface; and "could not reach" and "refused"
render as different answers, because only one of them means nothing was filed.

`tests/test_UAT_FC_REQ-273_filing_service.test.ts` — the seam, over a real
loopback socket: the Worker's own client reaching the service and getting
upstream's shapes back; a declared failure surviving the wire with its own code;
a wrong bearer filing nothing and reading as a setup fault; three operations and
no others; and the `--var` names matching what the Worker reads.

Verified separately, outside the suite because it would otherwise file real
tickets into this repository: the whole path end to end — Worker-side client →
loopback service → upstream `XgdProject` → the real `xgd` CLI → a real ticket read
back, with `validation` surviving the wire on a bad identifier.
