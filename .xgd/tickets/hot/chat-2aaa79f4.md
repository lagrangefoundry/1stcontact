---
uid: chat-2aaa79f4
id: CHAT-21
type: chat
title: The design conversation
created_by: xgd
created_at: '2026-08-11T21:19:47.614246+00:00'
updated_at: '2026-08-11T22:23:08.022868+00:00'
completed_at: null
last_field_updated: body
status: open
fields: {}
---

## The design conversation — playbook for the paid consultation session

Continues [[CHAT-20]]'s phase 4 (playbooks), pulled forward ahead of the example-pool phase.
Output: **[[DOC-33]]** — The Consultation Playbook.

### What was decided

**Structure.** Four client-facing acts (Brief / Story / Design / Ship) over eleven AI-tracked
stages with explicit gates. Revised from the operator's initial eight-stage sketch:
- Restraint level moves to the **brief** (stage 1), not the end — "special effects last" is the
  because-we-can failure [[DOC-31]] measures. Stage 8 becomes a single **signature moment**, and
  "none" is a legitimate recorded outcome.
- **Refinement is a bounded loop inside each stage** (2 rounds), not a stage — as a stage it is an
  unbounded cost sink.
- **Content architecture** added as its own gated stage — [[DOC-31]] Pattern 5, the largest
  taste-gap lever, free technically.
- Ship added: critique pass + publish/handoff.

**Four starting points converge.** Existing site / content+assets / brand+positioning / scratch are
not four scripts. They differ in *what is already decided*. Intake marks each ledger entry
inherited or open; the flow visits only the open ones. The free 15-min consult is Act I truncated,
not a second product.

**The decision ledger = the `chat` ticket body.** Operator's call, and it turns out to be exactly
what the store was built for: `chatSchemas()` leaves the body free as "the AI-maintained summary's
home" and `TicketSessionArchive.apply` is documented to never touch it — transcript lives only in
the `chat_transcript` comment. Two write paths already separated, no race, nothing to build.
Confirms the [[DOC-10]] §6/§8 supersessions already agreed in [[REQ-123]].

**Rationale is mandatory in the ledger.** Operator's point, and it is the load-bearing one: a
ledger of bare decisions can be honoured but not defended, so the AI either re-opens settled
questions or contradicts them. With the *why* recorded, the transcript becomes droppable. Entries
also carry **rejected alternatives** (stops the AI re-offering a declined option ninety minutes
later) and a **Client calls** section (the honest record required by the one-push rule).

**Context economics.** Cost is dominated by re-read, not output — quadratic in turn count without
cropping, and screenshots (~4,800 tokens each at high res) outweigh the transcript. The ledger
converts this to linear by letting the prefix be rebuilt at each gate from
`system + ledger + site state + this stage's turns`.
- **Crop at gates, never continuously** — caching is a prefix match, so mid-conversation cropping
  invalidates everything after it and costs more than not cropping.
- Modelled effect: ~$50–60 → ~$25–30 per session on Opus 5. Constants need measuring; the curve
  shape is the durable claim.
- **Subagents** are the only correct way to route to a cheaper model — a model switch inside the
  main loop invalidates the cache; a subagent is a separate prefix. First candidates: ingestion,
  critique pass, copy variants, asset audit.

**Plain pass, not ugly.** Operator corrected the framing and was right: *undesigned*, not bad —
monochrome, one typeface, no decoration, with draft affordances (annotation markers, "copy
pending") signalling scaffolding. Constraint added: **draft affordances are chrome, not content** —
they belong to the preview surface ([[DOC-28]]), never to L1, or they become part of the site and
can leak to publish. The AI must frame the plain pass before it appears or a non-technical client
assumes something broke.

**Multi-limb forward compatibility.** Site monitoring, payments, marketing planning and a
lightweight CRM are coming. Consequences designed in now:
- **Act I is a shared spine** — business, audience, offer, objectives, brand are properties of the
  *client*, not the site. Runs once per client, ever; other limbs get their own tracks off the same
  Act I and the same ledger.
- **The ledger is a business record**, limb-agnostic sections first, site sections last — a new limb
  adds a section rather than restructuring. Chosen deliberately now because retro-fitting a ledger
  schema across live customers is expensive.
- **Objectives carry destinations we don't yet operate** ("leads → inbox, ideally CRM"). One extra
  question; turns a future cold pitch into a follow-through.
- **Behaviour arrives as configuration, not design** — [[DOC-25]] already names payments, auth and
  email capture as future behavior modules, so the playbook doesn't change when they land.

**Conversational mechanics** (§7 of [[DOC-33]]): options-not-iterations at every major decision
(refining one proposal drifts to the model's default — the templatey pull); never leave a blank
question (propose and ask yes/no/nearest); one-push rule on strategic pushback ([[DOC-32]] §2D);
no "we'll get back to you" anywhere.

**Maintenance constraint.** The playbook is process knowledge and must not enumerate tools or
restate anything projected from the surface declaration (`roles.ts`) — a hand-written tool
inventory describes last month's surface and is worse than none because the model believes it.

### Open (carried into DOC-33 §13)
Ledger rendering for handoff; whether gates are discipline or machinery; whether ledger writes need
a section-level tool; validating the cost constants against real sessions; restraint-by-vertical
taxonomy belongs in [[DOC-16]]/[[DOC-17]]; exactly where the free tier stops inside Act I.

### Not done in this session
[[REQ-123]]'s body is still empty ("(new ticket)") — the KB requirement itself remains unwritten.


### Addendum — capabilities are in the site, not alongside it

Operator correction to the first pass at §11: the site is the **core**, and capabilities like
payments are built *into* it — so the site builder must know them, and their limits, at creation
time. The original "parallel tracks hanging off a shared Act I" framing was right for only part of
the set. Revised into a taxonomy by *relationship to the site*:

| Limb | Relationship | Known by | Consequence |
|---|---|---|---|
| Payments | **in the page** | stage 1 | constrains architecture, copy, layout |
| Email capture | **in the page** | stage 1 | small structural footprint |
| CRM | behind the page | stage 1 (destination) | none structural |
| Monitoring | around the site | stage 10 | none |
| Marketing planning | off the site | post-ship | none |

Changes landed in [[DOC-33]]:
- **Capability commitments become a third decision class** (alongside content and design), settled
  in stage 1 — a primary action of *buy* is a surface with states, legal copy and a data sink, not
  merely a destination. Ledger gains a **Capabilities** section.
- **Both halves recorded** — what a capability does *and what it cannot do*. Designing against
  unknown limits is how a session commits to a page the module can't support.
- **When the answer is no** (payments doesn't exist yet): say so, park it with the date, and
  **do not pre-build the surface** — speculative structure is dead structure. The parked entry is
  what makes a future launch a follow-through rather than a cold pitch.
- **Capability catalogue must be projected, not written** — same `roles.ts` lesson as the tool
  manual. §12's constraint extended; §11's table is the declared exception (it fixes *relationships*,
  not an inventory of what shipped).
- Two new failure branches; two new open questions (§13).

**Largest unresolved dependency:** nothing projects a capability catalogue today. [[DOC-25]]'s
module contract is the natural home for the machine-readable half (page requirements, invariant
elements, obligations); the conversational half — what to tell a non-technical client a capability
*can't* do — may need a declared field of its own.

### Correction on [[REQ-123]]
Its `chat_transcript` comment carries a complete design: JS read-side upstream in
lagrange-framework, Python indexes the XGD file store, D1 rows for the index artifact, three KM
tools replacing [[DOC-10]] §5.2's four, and the DOC-10 §6/§8 supersessions. What is outstanding is
the operator's call on its five questions (read-side location, index target, doc boundary, tenancy,
artifact storage) — not the thinking. The empty body reflects the AI waiting on those answers.


<!-- xgd-chat-end -->