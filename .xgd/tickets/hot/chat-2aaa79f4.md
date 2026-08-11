---
uid: chat-2aaa79f4
id: CHAT-21
type: chat
title: The design conversation
created_by: xgd
created_at: '2026-08-11T21:19:47.614246+00:00'
updated_at: '2026-08-11T22:47:33.705786+00:00'
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


### Addendum — two channels: the client edits the draft directly

Operator raised the page editor ([[DOC-28]]): the client can change copy, image selection, and
basic parameters on the draft themselves, at any time, at **zero token cost**. Folded into
[[DOC-33]] as §7.8/§7.9 plus stage-level changes.

**The division is by kind of change, not by cost** — and it matches [[DOC-28]]'s own exposure rule
("copy, asset selection, friendly parameters… anything sophisticated is done by the AI"; "structure
is the AI's job"):

| AI owns | Client owns |
|---|---|
| structure, architecture, page inventory | the exact words |
| design system — palette, type, rhythm | which photo, how it's framed |
| first draft of all copy | adjustments *within* a locked system |
| anything changing a locked decision | anything they'd rather just try |

The AI hands adjustments over because the client is better placed to judge them, not because
they're cheap. Two guard rails: never turn a paid session into a tutorial (default is still to do
what's asked), and never use the channel to decline work.

**Fixes the weakest rule in the first draft.** §7.5's flat "two rounds then it's on the ongoing
plan" was a bad moment to hand a paying client. Refinement now splits: *decision-level* rework
stays capped, *adjustment-level* is unbounded and free. The things clients most want to keep
tweaking sit almost entirely on the free side, so the cap lands on genuine rework rather than on
the fiddling that makes someone feel heard.

**Disclosure is staged, and [[DOC-28]] makes the stage-6 lock self-enforcing.** Copy controls
handed over at stage 4 (part of the plain-pass framing); visual controls not until stage 7, because
aesthetic controls during Act II invite exactly the premature anchoring the plain pass prevents.
Then, because the editor picks colours *from the site's palette rather than individually*, a client
adjusting their own page structurally cannot leave the system once stage 6 closes. Locking the
palette well is worth more time than it looks.

**New bug class, now §7.9: the AI's picture of the page is stale by default.** The client edits
between turns, so the caretaker preamble's "read before you write, never from memory" stops being
hygiene and becomes load-bearing. Failure mode: AI writes a section → client rewords it → AI later
"improves" that section and silently reverts them. That is `CLAUDE.md`'s free-coded-overwrite
problem reproduced in the product, against a customer — and the client won't report it, they'll
just stop using the editor, which turns off the cheapest channel we have. Also constrains §4: site
state entering a rebuilt prefix must be *freshly read*.

**Cost discipline gains a new item 0** (§9): routing adjustments to the client is the largest
single reduction available and the only one that improves the client's experience rather than
trading against it.

Also added: two failure branches (client edits contradicting a locked decision; client repeatedly
asking for adjustments they could make); three open questions.

**Flagged for confirmation:** operator described cropping and colorization as client-editable.
[[DOC-28]] phase 1 scopes image segments to "which image, basic framing" — past that line. Needs
pinning to a phase before the first paid session, since the playbook must not promise something the
editor can't do.


### Addendum — the draft change record (staleness without re-reading)

Operator's proposal: the AI should know when the page last changed and when it last read it, and
read *diffs* rather than re-reading the site. Investigated and agreed; folded into [[DOC-33]] §7.9
(as a stated platform requirement) and §13 (as a design sketch awaiting its own ticket).

**Why it's needed.** [[DOC-12]] versions the draft not at all: revisions are publish-time
snapshots and `history.json` gets one entry per publish. So "did anything move since I last
looked?" currently costs a full re-read — and [[DOC-28]] measured a real page at 73 segments, 62 of
them copy.

**Why it's cheap to build.** Two things are already true: `edit.ts` is the **single write path** for
the CLI, the AI and the page editor ([[DOC-30]]), and the editor already emits *the same structured,
validated diff vocabulary the AI emits* ([[DOC-28]] §4). This persists what already flows through
one chokepoint; it does not invent a representation.

**Three questions at three costs:**

| Question | Cost | Mechanism |
|---|---|---|
| Has anything changed? | one integer | monotone draft counter vs. the AI's baseline |
| What changed? | proportional to the *change* | read the log forward from the baseline |
| What is the page now? | proportional to the *page* | full re-read — fallback only |

**Design points pinned:**
- **Mutating ops return the resulting counter**, so the AI's baseline advances as it writes. Any
  gap is by construction someone else's work — removes the need for an actor field or to filter its
  own edits out. Same CAS shape `ticket_store.js` already uses for transcripts.
- **Not a revision.** No revision id, no `history.json` entry. [[DOC-12]] principle 3 is
  forward-only/immutable; §5.1's preview snapshots are the precedent for a deliberately-not-a-revision
  artifact.
- **Records must be self-describing.** L1 addresses are render-scoped by design ([[DOC-28]] §5.2) —
  a path of child indices valid only for the render that produced it — so an address alone is
  worthless once structure moves. Each record carries before/after text and the segment's human
  identity, which the derived segment model already computes for the editor's outlines.
- **Bounded, degrading gracefully.** Keep a window; a baseline older than the window falls back to
  a full read. No correctness cliff; log stays small.

**Two payoffs beyond staleness.** It makes divergence detection (a client edit contradicting a
locked decision) precise and cheap rather than a fuzzy page-vs-ledger comparison. And it lets the
AI *narrate* the change — "I see you rewrote the headline, want me to match the subhead?" — which
is the difference between the editor feeling like the client's and feeling like it's fighting the
AI. The client's freedom to edit and the AI's correctness stop being in tension.

**Status:** not ticketed. This is the largest gap between what [[DOC-33]] assumes and what the
platform provides.


### Ticket filed — [[REQ-131]] Draft change journal

Operator's call: this needs a ticket, split as (1) business logic tracking these things, exposed as
an API, and (2) Toolbox config extended for the additional calls and data. Filed as [[REQ-131]]
(priority high), cross-linked from [[DOC-33]] §13.

Investigation confirmed the two halves land cleanly:
- `tools/generate/src/cli/edit.ts` — the single write path (`edit*` functions) for CLI, AI and
  page editor. One chokepoint to instrument.
- `tools/generate/src/cli/ai/toolbox.ts` `l1Operations()` — binds surface ops onto those functions;
  `l1-surface.json` declares them.

**Third part added during drafting: push the signal, pull the detail.** `caretakerReminder()` in
`roles.ts` is re-applied every turn through the system channel and never enters the transcript, and
`host.ts` knows turn boundaries — so the host can record the counter at end-of-turn, compare at
start-of-next, and put a one-line "the site changed" in the reminder for ~10 tokens. The tool is
then called *only* when the signal fires. In the common case (nothing changed) the cost is zero
tool calls and the AI never has to remember a baseline. This is materially cheaper than the
poll-every-turn design and uses infrastructure that already exists.

**Confirmed `status` does not already answer this** — it reports draft vs last *published*
revision, file-level added/modified/removed paths, with no ordering, actor, before/after, or
"since I last looked".

**Confirmed nothing versions the draft** — [[DOC-12]] revisions are publish-time snapshots;
between publishes the draft is an unversioned mutable working copy.

Surface-level details pinned in the ticket: new read op in the **ReadSite** group (already granted
to `caretaker` in `instances.json`, so no grant change); `returns.provenance: "untrusted"` because
the journal carries client-typed copy and is exactly the injection vector [[DOC-30]] S5 names;
`change` and `publish_result` shapes gain the counter; the cross-cutting rule goes in `overview`
rather than per-operation. Also flagged: the existing `absences` note on undo tells the AI to
"tell the user what the previous value was whenever you change something" — the journal makes that
unnecessary to carry in conversation, so the note wants adjusting (but undo stays out of scope).

Four decisions left to pin during implementation: where the journal lives (git-tracked `draft/`
churns badly — lean gitignored, since losing it degrades to a full read rather than to
incorrectness); window size; how the write path learns the actor (ship without it if it isn't clean
— the counter mechanism doesn't depend on it); per-site vs per-page counter (lean per-site).


<!-- xgd-chat-end -->