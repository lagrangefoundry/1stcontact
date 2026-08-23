---
uid: chat-2aaa79f4
id: CHAT-21
type: chat
title: The design conversation
created_by: xgd
created_at: '2026-08-11T21:19:47.614246+00:00'
updated_at: '2026-08-21T02:16:32.848095+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  chat_comment: comment-2c16318b
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


### Addendum — the ledger is appended, not rewritten

Operator: append-to-ticket is a supported operation, so the decision log needs no bespoke write
tooling. Verified — `append_body {uid, body}` in `components/ticketing/js/src/store.js:274`, with
compare-and-set and **automatic retry on conflict**, so concurrent appends are safe rather than
clobbering. Available on the product side, not just the XGD CLI.

Closes [[DOC-33]] §13's "ledger write mechanism" question, and rules out the section-level tool
previously floated as a possible REQ. A gate commit writes **the delta, not the document**.

**Consequence: the ledger is append-only with supersession.** A reopened decision appends a new
entry naming the one it supersedes; latest entry wins on read. This is a better record than a
mutable one rather than a compromise — it preserves "locked at stage 1 for this reason, reopened at
stage 6 for that one", which is precisely what the mandatory rationale exists to capture and
precisely what an in-place edit would destroy.

Knock-on simplifications:
- **Sections become tags on entries, not regions of the document** (§3.5) — entries arrive in
  decision order, grouping happens on read. This also answers §13's other open question: grouped
  presentation is what the handoff rendering is for, so the remaining question narrows to "is
  handoff a rendering step or a separately-written document" (leaning rendering, so they can't
  drift).
- **`reopened-at-<stage>` drops out of the status values** — a superseding entry *is* the
  reopening. Entry shape gains `Supersedes:`.

Growth is not a concern at this scale: ~30–60 decisions at ~50 tokens each is ~3k in the prefix
even allowing for supersession. The cost worried about earlier was the *write*, and append removes
it.

Nice symmetry: the ledger now has the same shape as [[REQ-131]]'s draft change journal —
append-only, read-forward, latest-wins. Two artifacts, one discipline.



---

## Session 2 — the playbook doesn't fit real customers (→ [[DOC-35]])

Reopened DOC-33 under a different lens: motivation and fit, not decision quality. Six things came
out, and they compound into a restructure rather than an amendment.

**1. Anti-anchoring by plurality, not by deferral.** DOC-33 defers everything aesthetic to Act III
so the client can't anchor. But anchoring happens to a *single* artifact; six artifacts define a
space instead. DOC-33 already believes this (§7.1, options-not-iterations) and simply never applies
it to the *first* artifact. Plurality should open the session. Consequence: **the plain pass dies**
— it existed to solve anchoring-by-deferral, and its worst property (a novice seeing a monochrome
page and assuming we broke it) evaporates with it.

**2. Hard-to-reverse things earn conversation; easy ones get shown, not discussed.** The two biggest
differentiators sit at *opposite* ends of that curve — content architecture is the most expensive to
change, palette/type/restraint are nearly free — and that is the whole scheduling problem. So:
**diverge early on what's expensive, diverge continuously on what's cheap.** A first spread that
varies only palette and font is a wasted spread; the heroes must differ *argumentatively*. The hero
is not a section, it's the first sentence of the argument, so choosing between heroes *is* choosing
an architecture — by pointing, in fifteen minutes, instead of by discussion in forty.

**3. Fun is the extraction mechanism, not a nice-to-have.** Output quality is bounded by signal
quality, and a bored client gives short agreeable answers — *"yeah, that's fine"* is the sound of a
session failing. Also: DOC-33 banks all its drama on one reveal two hours in, which has to *repay*
two hours of tedium. Distributed delight is the more robust bet. Working mechanics: **every turn
moves the page**; **build by resolution not addition** (whole page in ghost from ~minute 20, real
headings, provisional bodies, sharpening section by section); the carousel as a standing comparison
surface; deliberately-wrong extremes to bracket the space. One refinement on the operator's
scaffold idea: **not Lorem Ipsum — plausible-but-wrong real English**, because it extracts
corrections where greeking extracts nothing.

**4. DOC-33 segments on inventory; it should segment on diagnosis.** Two clients with identical
assets can need opposite sessions. Also — DOC-32 §2B says the buyer purchases *an outcome, not an
artifact*, calls it the single most important framing, and DOC-33 then builds eleven stages all of
which produce a site and none of which produce a result.

**5. The playbook is a checklist wearing a script's clothes.** Its stages fuse *what must be
decided* with *the order we say things in*. Break the weld and one product serves everyone: the
decision set is invariant (the ledger, unchanged — append-only-with-supersession was already the
right shape); the **opening** is set by persona; **mode** and **register** float continuously.

**6. Three real populations, not invented ones** — a supply-capped caterer, a network of
technology-anxious first-timers, and a fluent solo founder. They break the single-flow assumption
in three different directions.

All of the above, plus the capacity/safety-stock diagnosis and the elicitation rules, is now
captured in **[[DOC-35]]**. DOC-33's own restructure is deferred and scoped in DOC-35 §10.

### Also established here

**Reproduction's job is consent, not fidelity.** It's how you show someone a change to their site
before they've agreed to move — which lowers the bar from pixel-perfect to *recognisable and
improvable*, and makes migration instrumental ("to fix this, I need to be able to change it") rather
than aspirational.

**Elementor is a transform, not an inference — and that unblocks the reproduction question.**
Checked against the real capture in `storage/references/joyfulculinarycreations.com/`:
- WordPress 7.0.2 + **Elementor 4.2.0**; the entire page is **eleven widget types**.
- The existing `l1.json` fold carries **all the copy** — 865 words against 859 in the capture.
- Images are where it breaks, exactly as [[CHAT-29]] predicted: the **hero and the logo are absent
  entirely**. The hero lives only in `assets/post-4401.css` as a `background-image` on an
  `elementor-background-overlay`; the logo comes via the `theme-site-logo` widget.
- Elementor's per-page CSS is **entirely keyed by element ID** (`.elementor-4401
  .elementor-element.elementor-element-8d3c33b`, 53 distinct selectors), and those IDs appear in the
  markup as `data-id`. The style↔element mapping is *handed to us*, not deduced.

So folding Elementor → L1 is ~15–20 deterministic per-widget mappings plus a section/column rule —
not the [[DOC-21]] flywheel, whose six XGD-level gaps (§8) target a different problem. Detection is
free (`<meta name="generator">`), coverage becomes countable (% of widget types, enumerable from
Elementor's docs), and the market concentration is enormous.

**Keep the two programs separate.** DOC-21/DOC-15's corpus is *sites we admire* and its output is L1
capability. The importer's corpus is *sites our customers actually have* and its output is
customers. We have built toward the first and nothing toward the second.

### Next

Solopreneur/founder persona (DOC-35 §4.5) — the one persona deliberately left as a stub.



---

## Session 2 (cont.) — data collection & deletion (→ [[DOC-36]], [[DOC-37]])

Split into two docs because the two questions have different shapes, though they are one design:
what you collect determines what you must be able to destroy.

**Collection ([[DOC-36]]).** The thesis is **matched pairs** — decision → outcome — which nobody
else can hold, because designers ship and leave and template platforms have traffic without
decisions. Consequence: the design rubric that [[DOC-31]] implies and doesn't yet contain could
eventually be *measured* rather than authored.

Four layers with very different value-to-sensitivity ratios, and **most of the product-improvement
value sits in the least sensitive one.** So the core principle is **emit, don't mine**: anything we
know we'll want is a typed event at the moment of production, never recovered from prose. The
transcript is raw material of last resort. This also reframes consent — the question isn't "how do
we get permission to mine transcripts," it's "instrument so we rarely need to."

Two named signals worth their own mention. **Capability refusals** are a feature backlog written by
paying customers at the moment of genuine need. **Spread rejection rate** is a health check on *us*:
if clients accept the first option most of the time, our "genuinely distinct" options aren't, which
is the cheapest early warning on the template-DNA problem available.

One catch on the "nothing private here" intuition: **our own elicitation deliberately extracts
commercial numbers** — [[DOC-35]] §6.3 asks for client counts, churn and conversion. That's revenue
concentration, not design preference, and it warrants stricter handling plus minimum cohort sizes on
anything fed back.

And the reframe that makes consent easy: **reciprocity.** Give the aggregate back as benchmarks a
sole proprietor cannot obtain any other way. Consent becomes a feature people opt into rather than a
legal chore, it's a retention mechanic, and it disciplines collection — if a signal can never be
given back, ask why we're holding it.

**Deletion ([[DOC-37]]).** One principle does all the work: **erasure severs the link between the
rows and the human; it does not remove the rows.** We delete the person and keep the accounting.

That resolves the apparent irony that everything on the day-one list — email, consent, billing —
turns out to be partly retained. Email is destroyed but a one-way hash survives *so we keep not
mailing them*; the consent event survives as the proof we complied; transactions survive because tax
law overrides erasure and the person is redacted to the statutory minimum. So the honest feature is
**"delete everything we're allowed to"** — promising more is worse than promising accurately.

Operator's framing on the two levels was better than the crypto-shredding-first framing:
**tenant-nuke handles level 1**, and the real question is the **escape boundary** — anything crossing
it is either irreversibly aggregated at the moment it crosses, or carries the tenant key and dies
with the tenant, never a third category. Crypto-shredding is then *narrow*: it's what makes
tenant-nuke true against backups and append-only history (relevant if the ledger and transcript
really do live in the git-backed ticket store per [[DOC-33]] §3), and against free text that can't be
reliably scrubbed.

On who acts: the operator is right that Sarah shouldn't touch it, and that's compatible with her
being controller — controller allocates *responsibility*, not *labour*. A standing instruction plus
the fact that a "delete my data" link on her site necessarily points at **our** infrastructure means
her customer self-serves, we execute, she's notified. Her forgetting stops being a liability because
no human is in the path.

Two architectural decisions that are nearly free now and migrations later:
- **Separate identity from record** — one identity store, everything else references an opaque
  `person_id`. Most stores then need *no deletion logic at all* because they were never identifying.
- **Registry-driven erasure** — every person-scoped store declares `delete` / `redact` /
  `retain-with-reason` / `no-identity`. Adding an unregistered store becomes a **test failure rather
  than a memory failure**, and the registry doubles as an always-accurate data inventory.

Day one is cheaper than it looks precisely because of the closed loop: one person ends up fragmented
across capture, list, billing, analytics and post-attribution. Trivial at one limb, a project at five.

Also noted as a now-or-never: **record the eight onboarding sessions** (audio, transcribed). That's
the register corpus [[DOC-35]] §9 currently asserts without evidence, including their own words for
things — unobtainable later, free now.

### Still outstanding

- The **8 × 1hr session protocol** (offered, not yet written) — arc for the hour, observation sheet
  tied to DOC-35's testable claims, don't-rescue rule, batching plan, pre-session form.
- **[[DOC-35]] §4.5** — the Solopreneur/Founder persona, now fully discussed: pre-PMF vs
  distribution-constrained as the real axis, the five limbs and the loop they close, the minimum
  sellable trio (site + capture + one-off invoicing), and the customer-zero discipline — design
  against Sarah or a shaman, validate against yourself, never the reverse.


<!-- xgd-chat-end -->