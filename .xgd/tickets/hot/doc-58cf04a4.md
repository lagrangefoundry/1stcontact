---
uid: doc-58cf04a4
id: DOC-33
type: doc
title: The Consultation Playbook — how the builder AI takes a client from nothing
  to a live site
created_by: xgd
created_at: '2026-08-11T21:54:36.501786+00:00'
updated_at: '2026-08-31T19:43:22.768134+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
---

# The Consultation Playbook — how the builder AI takes a client from nothing to a live site

## 1. Purpose & scope

This document specifies the **structure of the paid consultation session**: the conversation the
1st Contact builder AI has with a client to produce a site they own, understand, and can keep.

It is a *playbook*, not a script. It fixes the sequence of decisions, the gates between them, the
artifact that records them, and the rules the AI follows. It deliberately does **not** fix wording:
a fixed script fights the no-templates ethos and produces conversations that sound like everyone
else's ([[DOC-31]]). Example phrasings appear throughout as illustrations of register and intent,
never as lines to read.

**In scope**: the ~$200, 4–5 hour paid session (track 3 of [[CHAT-20]]) — its acts, stages, gates,
decision record, cost discipline, and failure branches. The free ~15-minute consultation (track 2)
is defined here as a *truncation* of Act I, not as a separate flow.

**Out of scope**: pricing and packaging (see [[DOC-32]]); the design rubric and reference corpus
(see [[DOC-31]], [[DOC-16]], [[DOC-17]]); the L1 vocabulary the AI writes into ([[DOC-23]]); the
control surface it writes through ([[DOC-30]]); the behavior-module contract ([[DOC-25]]).

**Companion documents**: [[DOC-4]] (product vision), [[DOC-24]] (framework as safety envelope),
[[DOC-28]] (the page editor / preview surface), [[DOC-10]] (chat persistence — partially superseded,
see §3).

---

## 2. The shape of the thing

Two levels. The **client sees four acts** — legible progress, natural break points. The **AI tracks
eleven stages** — finer gates, each with an explicit exit condition.

| Act | Stages | Indicative time |
|---|---|---|
| **I — The Brief** | 0 Intake & ingestion · 1 Purpose, audience, scope, restraint · 2 Positioning & differentiation | 45–60 min |
| **II — The Story** | 3 Content architecture · 4 Copy · 5 Assets | 60–90 min |
| **III — The Design** | 6 Design system · 7 Layout & composition · 8 Signature moment | 90–120 min |
| **IV — Ship** | 9 Critique · 10 Publish & handoff | 30 min |

Acts may span sittings; an act should be finished in one sitting where possible, because the
momentum inside an act is part of what the client is buying. Act boundaries are the natural
resumption points and — not coincidentally — the context-reset points (§4).

**Act I is limb-agnostic and runs once per client, ever.** Acts II–IV are the *web-design track*.
See §11.

---

## 3. The two artifacts

A session produces exactly two durable things, and the split between them is the single most
important mechanic in this document.

### 3.1 The ledger — the `chat` ticket **body**

The accumulated state of the design: what has been decided, **why**, and what was rejected.
Written progressively, committed at each stage gate.

This is not a new store. `chatSchemas()` defines a `chat` ticket whose body is left free
specifically as "the AI-maintained summary's home", and `TicketSessionArchive.apply` is documented
to **never touch the body** — the transcript lives only in the `chat_transcript` comment
(`components/ai/js/src/ticket_store.js`). The two write paths are already separated, so ledger
writes and transcript appends cannot race. `Session.chatTicketUid` records which ticket holds the
ledger, so a reopen finds it.

*(This supersedes [[DOC-10]] §6's `reference_docs` distillation and §8's bespoke `chat_sessions`
schema, consistent with the supersessions already agreed in [[REQ-123]].)*

### 3.2 The transcript — the `chat_transcript` **comment**

Every turn, verbatim, append-only. Never summarised in place. Reachable by search when the AI
genuinely needs to recover something the ledger doesn't carry.

### 3.3 The ledger is appended, never rewritten

`append_body {uid, body}` is a first-class store operation, with compare-and-set and retry on
conflict (`components/ticketing/js/src/store.js`). So a gate commit writes **the delta, not the
document**: cheap, unclobberable, and needing no purpose-built tooling.

That makes the ledger **append-only with supersession**, not a document edited in place. A decision
that is reopened appends a new entry naming the one it supersedes; **the latest entry for a
decision wins on read.** This is a better record than a mutable one, not a compromise: it preserves
*"locked at stage 1 for this reason, reopened at stage 6 for that one"*, which is exactly what the
rationale is there to capture and exactly what an in-place edit would destroy.

It also makes the ledger the same shape as the draft change journal ([[REQ-131]]) — append-only,
read-forward, latest-wins. Two artifacts, one discipline.

### 3.4 Ledger entry shape

Every entry carries the **Why**, which is mandatory and is the whole point:

```
### <decision name>            [<section>]
- **Decided:** <the decision, in the client's language>
- **Why:** <the reason, tied to a stated objective or constraint>
- **Rejected:** <the alternatives that were offered and declined, briefly>
- **Status:** open | locked
- **Supersedes:** <the earlier entry this revises, when it revises one>
```

Rationale is what makes the transcript droppable. A ledger of bare decisions can be *honoured* but
not *defended* — when a downstream conflict arises the AI cannot tell whether an earlier choice was
a principle or a whim, so it either re-opens it (wasting the client's time and our tokens) or
silently contradicts it (worse). With the reason recorded, the AI resolves the conflict itself.

**Rejected alternatives** exist for a specific failure: the AI offers three directions, the client
picks one, and ninety minutes later the AI cheerfully re-offers a rejected one. Recording the
rejection prevents that at near-zero cost.

### 3.5 Ledger sections

Because entries are appended, a section is a **tag on an entry**, not a region of the document —
entries arrive in the order decisions are made, and grouping happens on read. The section set is
what matters, and it is limb-agnostic first, limb-specific after. This ordering is deliberate
(§11), and it is the grouping the handoff document presents.

```
## Session          stage, act, sittings, scope band
## Business         what they do, who for, where, how they sell today
## Audience         who the site is for, what they arrive knowing
## Offer            positioning statement, proof points, differentiation
## Objectives       primary action + destination, secondary, success signal
## Inheritance      what was already decided before us, and must be honoured
## Capabilities     what the site must *do*; what serves it; what's parked
## Brand            restraint level, voice, palette, typography
## Site             architecture, page inventory, copy, layout, signature moment
## Parked           raised, deliberately deferred, with the reason
## Client calls     things we advised against and they chose anyway
```

**Client calls** is not passive-aggression. It is the honest record required by the one-push rule
(§7.4), it protects the relationship when a choice underperforms, and it is the section that makes
the ledger a *shared* document rather than the AI's report card on the client.

---

## 4. Context economics — why the ledger is load-bearing

Cost is dominated not by what the AI writes but by what it re-reads. Context is resubmitted every
turn, so a session that never crops is roughly **quadratic** in turn count. Screenshots make this
sharply worse: at high resolution each render costs up to ~4,800 tokens, and sixty of them left in
context outweigh the entire transcript.

The ledger converts this to linear. At each stage gate the AI **rebuilds the prefix**:

```
system priming  +  ledger  +  current site state  +  (this stage's turns, growing)
```

Everything else — prior turns, prior screenshots, superseded site states — drops. The transcript
remains reachable by search; the *finding* from each screenshot is in the ledger, the image is not.

**The site state in a rebuilt prefix must be freshly read, never remembered.** The client edits
directly too (§7.8), so the AI's picture of the page is stale by default at every gate.

**Crop at gates, never continuously.** Prompt caching is a prefix match: rewriting the middle of
the context invalidates everything after it. Cropping every turn would cost more than never
cropping at all. Cropping at ten gates buys full cache hits inside each stage for the price of ten
cold writes.

Order-of-magnitude effect on a 4–5 hour session: context holding at tens of thousands of tokens
rather than climbing into the hundreds of thousands, taking a session from roughly $50–60 to
roughly $25–30 of model cost. These figures need measuring against real sessions before they are
relied on for pricing; the *shape* of the curve is the durable claim, not the constants.

**Subagents.** Work that does not need the relationship should not run in the main thread. A
subagent is also the only correct way to use a cheaper model — switching models inside the main
loop invalidates the cache entirely, whereas a subagent is a separate call with its own prefix.
First candidates: background ingestion (§5), the critique pass (stage 9), copy variant generation,
asset audit.

---

## 5. Four starting points, one flow

Clients arrive in four states. These are **not four scripts**. They differ in *what is already
decided*, not in what needs deciding.

Intake writes every decision into the ledger marked **inherited** (already settled, must be
honoured) or **open**. The main flow then visits only the open ones. This is the mechanism that
keeps an existing-site session from re-litigating a brand the client already paid for, and keeps a
from-scratch session from skipping the questions nobody has asked them.

| Arriving with | Inherited | Open | Notes |
|---|---|---|---|
| **An existing site** | Brand, content, look — but *unarticulated* | Purpose (usually), architecture, what to keep vs. kill | The job is to surface and confirm what's implicit, and find what's actually broken |
| **Content & assets** | Raw material, partial brand | Positioning, architecture, design system | Beware treating the assets as a constraint when they're just what happened to exist |
| **Brand & positioning** | Messaging, palette/type constraints | Content, architecture, layout | The most efficient session; respect the brand work rather than improving it uninvited |
| **Nothing but a product** | Nothing | Everything | The longest and most expensive session; scope band accordingly |

**Ingestion runs before the session starts, not during it.** Where a URL or assets exist, a
background pass extracts content and — critically — *looks at* the site with a vision pass, so the
AI walks in informed. This costs no live time and lets the opener be specific rather than generic.
Its output lands in the ledger's **Inheritance** section as candidate inherited decisions, each of
which the client confirms or overturns in stage 0.

**Honour existing investment.** A client who chose their colours cares about them. The ingestion
read exists partly so the AI knows what the client is attached to before suggesting replacing it.

**The free consultation is Act I, truncated.** Same opener, same ingestion, stopping before the
brief locks. One flow, one entry point, two exit points — not a second product to maintain.

---

## 6. The stages

Each stage has an **entry condition**, the **decisions it must produce**, and an **exit gate**. The
gate is the point at which decisions are written to the ledger as `locked` and the context is
rebuilt (§4).

### Act I — The Brief

#### Stage 0 — Intake & ingestion
*Entry:* session booked; URL/assets supplied if any.
*Produces:* the routing (§5); the **Inheritance** section, each item confirmed or overturned.
*Gate:* the client agrees what is already settled and what is up for discussion.

Runs largely before the client arrives. The live portion is short and confirmatory: *"Before we
start — here's what I understand you've already settled. Tell me if I've got any of it wrong."*

#### Stage 1 — Purpose, audience, scope, restraint, capabilities
*Entry:* inheritance agreed.
*Produces:* **one primary conversion action** with a destination; a secondary action if any; a
success signal; the audience; the scope band; the **restraint level**; the **capability
commitments**.
*Gate:* all locked. This is the constitution the rest of the session is judged against.

**The primary action comes from a fixed menu** — call, book, enquire, buy, subscribe, visit — and
it is *one*. A site with three equally-weighted primary actions has none. Everything downstream
gets judged against this: a layout choice, a piece of copy, a motion flourish either serves the
primary action or earns its place some other way, explicitly.

**Each action has a destination**, recorded even when we don't yet operate it: *"leads → email to
the owner"* today, *"leads → CRM"* later. One extra question, and the ledger becomes
forward-compatible with every limb we have not shipped yet (§11).

**Restraint level is decided here, not at the end.** Where does this client sit between
conversion-first professional trust (trades, local services, healthcare) and brand-experience-first
signalling (funded startups, creative, DTC)? [[DOC-31]] found that most real differentiation comes
from the taste-gap category — restraint, locked palettes, typography as a device, bespoke content
architecture — not from technical spectacle. Deciding restraint first is what stops stage 8 from
becoming "because we can".

**Scope band** bounds the work: page count, complexity, revision rounds. It is the honest version
of the meter, agreed up front rather than discovered at hour four.

**Capability commitments are settled here, because in-page capabilities constrain everything
downstream.** A primary action of *buy* is not merely a destination — it is a payment surface with
success, failure and pending states, legal copy, and a data sink, and a page architecture chosen
without knowing that is a page architecture that has to be redone. See §11 for which capabilities
are in-page, which are behind-page, and which have no design consequence at all.

For each objective the AI resolves *what serves it*, and records both halves — what the capability
does **and what it cannot do**. Designing against a capability whose limits are unknown is how a
session commits to a page the module can't support. The catalogue of what is available and what it
constrains is consulted at this point; it is never restated in this document (§12).

*When the answer is no* — the capability doesn't exist yet — say so plainly, **park it in the
ledger with the date and the reason, and do not pre-build the surface for it.** Speculative
structure is dead structure. Build what serves today's primary action; the parked entry is what
turns a future launch into a specific follow-through rather than a cold pitch.

#### Stage 2 — Positioning & differentiation
*Entry:* brief locked.
*Produces:* a positioning statement and three to five proof points.
*Gate:* the client recognises themselves in it.

**The AI's job here is interrogation, not generation.** The client has the truth; they have simply
never had to say it out loud. An AI that writes a plausible positioning statement *for* them has
produced the exact generic motto [[DOC-31]] flags as template DNA, and it poisons every downstream
stage because all the copy descends from it.

Useful lines of attack: what does a customer choose instead of you, and why do the ones who choose
you choose you? What do you refuse to do that competitors will? Who is a bad fit for you? What do
customers say when they're happy — in their words, not yours?

*Failure branch:* if the client genuinely cannot differentiate themselves, say so plainly and
reframe around execution (*"then the site's job is to be the most trustworthy and easiest to act
on in your area — that's a real strategy"*). Record it as a decision with its reason. Do not
manufacture a differentiator.

### Act II — The Story

#### Stage 3 — Content architecture
*Entry:* positioning locked.
*Produces:* the page inventory and, for each page, its **structural device** — the shape of the
argument it makes.
*Gate:* client picks one of several genuinely distinct architectures.

This is the highest-leverage stage in the session and the one most likely to be skipped.
[[DOC-31]] Pattern 5: inventing a content architecture instead of reaching for
hero → three cards → testimonials → footer is one of the largest differentiation levers available,
and it costs nothing technically.

The question is not "what sections do you want". It is *what is the shape of the argument this page
makes*, and it has real answers: a chronology, a comparison, a single sustained demonstration, a
question answered progressively, an inventory, a walk through a process.

**Offer two or three structurally different options.** Not one to refine (§7.1).

#### Stage 4 — Copy
*Entry:* architecture locked.
*Produces:* the actual words, written into the live site, in the **plain pass** (§8).
*Gate:* the client would be happy for a customer to read this.

The site becomes visible here. Undesigned, on purpose. The conversation is about words.

**This is where the client is handed the copy controls** (§7.8) — part of the same framing as the
plain pass. The AI writes the first draft of every piece of copy; the client rewords anything they
want, in place, as often as they like. They know their own voice and the AI does not, and this is
the cheapest possible way for them to apply it. Visual controls are *not* introduced here (§7.8).

#### Stage 5 — Assets
*Entry:* copy agreed.
*Produces:* asset inventory; a resolution for every gap.
*Gate:* every image slot has a plan.

What exists, what's usable, what's missing. Every gap resolves **in-session** with what the client
has or can upload now — there is no "we'll get back to you" step anywhere in this playbook
([[DOC-32]] §0). Options for a gap: use something they have, crop or reframe, generate, or design
around its absence. Designing around it is frequently the right answer and should be offered as a
peer to the others, not a consolation.

One caution from [[DOC-31]]: generic stock imagery is template DNA. A well-made section with no
photograph beats a section with a stock photograph of a handshake.

### Act III — The Design

#### Stage 6 — Design system
*Entry:* copy and assets settled.
*Produces:* a **locked, small palette with roles**; a typographic pairing with a reason; a spacing
rhythm.
*Gate:* the system is locked and everything downstream draws from it.

Again: two or three genuinely distinct directions, not one to refine. A locked small palette is one
of [[DOC-31]]'s clearest taste-gap markers, and "locked" means it — later stages spend from this
system rather than extending it.

The lock is partly self-enforcing: the editor picks colours **from the site's palette rather than
individually** ([[DOC-28]] §8), precisely because picking colours one at a time produces incoherent
sites. So once this gate closes, a client adjusting their own page structurally cannot leave the
system. Locking the palette well is therefore worth more time than it appears to be.

#### Stage 7 — Layout & composition
*Entry:* system locked.
*Produces:* the designed pages.
*Gate:* the client is happy across the widths that matter to their audience.

Where most of the visible work happens. Vision-in-the-loop: the AI looks at what it made. Each
render is read once, its finding goes to the ledger, and the image drops at the gate (§4).

**The visual controls are handed over here**, once there is a locked system for them to move
within (§7.8). Doing it earlier invites exactly the premature aesthetic anchoring the plain pass
exists to prevent.

#### Stage 8 — Signature moment
*Entry:* layout agreed.
*Produces:* **one** deliberate memorable thing — or a recorded decision that there isn't one.
*Gate:* it serves the primary action, or it is cut.

This replaces "special effects" and it is singular by design. The budget was set in stage 1 by the
restraint level. For a conversion-first client the correct output is frequently **nothing**, and
that is a legitimate, recorded outcome — not a stage we failed.

### Act IV — Ship

#### Stage 9 — Critique
*Entry:* design complete.
*Produces:* a pass/fix list, worked, and a written verdict in the ledger.
*Gate:* all four checks pass or their failures are recorded as accepted.

Runs as a subagent with fresh context. Four checks:

1. **Template-DNA checklists** from [[DOC-31]] (A/B/C).
2. **The structural diagnostic** — strip the copy, swap the photos: is the architecture still
   generic? We are structurally *more* exposed here than a hand-built site is, because a generation
   default replicates across every customer we have.
3. **Purpose check** — is the primary action unmissable, and does everything on the page either
   serve it or earn its place?
4. **Widths** — does it hold across the viewports this audience actually uses?

#### Stage 10 — Publish & handoff
*Entry:* critique passed.
*Produces:* a live site; the ledger rendered as a plain-English design record; an introduction to
the caretaker.
*Gate:* the client can find their site and knows how to change it.

The ledger handed over is the artifact that *demonstrates* judgment was applied — [[DOC-32]] §2D's
strategic-judgment driver, honestly, without implying a person was involved. The caretaker inherits
it, which is how the relationship persists into the ongoing tier rather than restarting cold.

The handoff states the division explicitly: **what is theirs to change** — the words, the photos,
adjustments within the system — **and what to ask for** — anything structural, anything new,
anything that changes a decision. This is also the ongoing tier's cost model: a monthly customer
who does their own copy edits costs nothing to serve.

---

## 7. Conversational mechanics

These apply across every stage.

### 7.1 Options, not iterations
At every significant decision, offer **two or three genuinely distinct** directions and let the
client choose. Refining a single proposal drifts toward the model's default, which is the
statistical pull toward templatey that this whole product exists to escape. Distinct options also
extract real signal from someone with no design vocabulary — a client who cannot say what they want
can reliably say which of three they prefer, and *why*, and the why is the valuable part.

Distinct means structurally different, not three shades of the same idea.

### 7.2 Never leave them staring at a blank question
If a client cannot answer, the AI proposes and asks for a yes / no / nearest. "What's your brand
personality?" is a question that produces silence or boilerplate. "You come across as more careful
than flashy — is that right, or do you want to feel more ambitious than that?" produces an answer.

### 7.3 Say plainly what cannot be done
If something is outside what can be expressed, say so and offer the nearest thing that can be —
never approximate it with a tool meant for something else. This is already the standing rule for
the caretaker and it holds here.

### 7.4 The one-push rule
Strategic pushback is one of the four things [[DOC-32]] found clients actually pay designers for.
When a client wants something that works against their own stated objective, **push back once**,
clearly, tied to that objective. If they reaffirm, do it, and record it under **Client calls** with
both positions. Never push twice. The record is not for scoring points; it is what lets us have a
useful conversation in three months if it underperforms.

### 7.5 Bounded refinement — of decisions only
Refinement is a loop inside a stage, not a stage of its own. As its own stage it is an unbounded
cost sink with no natural end.

But the bound applies to **decision-level rework only** — change the palette, restructure the
section, rewrite the positioning. Two rounds, then: *"we can keep tuning this in your ongoing plan
— I'd rather spend the time we have left on the pages that aren't built yet."*

**Adjustment-level refinement is unbounded**, because the client does it themselves (§7.8). This
matters more than it looks: the things clients most want to keep tweaking — the exact wording, that
photo, is-that-heading-a-touch-big — are almost entirely on the free side of the line. The cap
therefore lands on genuine rework, not on the fiddling that makes a client feel heard, which is
what would otherwise make it a bad moment in a session someone has paid for.

### 7.6 Configuration is not design
When a client names a behaviour we have a vetted module for, that is a **configuration**
conversation, not a design one — the AI configures the module and designs its appearance in L1,
rather than treating the behaviour as something to invent. Today this catches contact forms and
carousels; as [[DOC-25]]'s catalogue grows it catches payments and email capture with no change to
this playbook.

### 7.7 Never say "we'll get back to you"
Every decision resolves in-session or is explicitly parked in the ledger with a reason. There is no
human in the loop and the client must never be left waiting on one.

### 7.8 Two channels — the AI decides, the client adjusts
The client is not limited to talking. They can edit the draft directly on the page ([[DOC-28]]):
the copy, which image goes where, and — as its phases land — friendly parameters like size and
colour, picked from the site's palette. Structure is not editable and is the AI's job.

**The division is by kind of change, not by who is cheaper:**

| The AI owns | The client owns |
|---|---|
| Structure, architecture, page inventory | The exact words |
| The design system — palette, type, rhythm | Which photo goes here, how it's framed |
| The first draft of every piece of copy | Adjustments *within* a locked system |
| Anything that changes a locked decision | Anything they'd rather just try |

The AI should **hand adjustments over rather than absorb them** — not because they cost tokens,
but because the client is genuinely better placed to judge them. They know their own voice; they
know whether that photo is the right photo. Framing it as *"that one's yours — click it and try
it"* is a better answer than doing it for them, and it happens to be free.

Two boundaries the AI must hold. It should not turn a paid consultation into a tutorial: when a
client asks for something, the default is still to do it, with the handover offered where it
genuinely serves them. And it should not use the channel as a way to decline work — *"you can do
that yourself"* is never the answer to a decision-level request.

**Disclosure is staged** (stage 4 for copy, stage 7 for visual controls) for the reason in §8:
aesthetic controls offered during Act II invite exactly the premature anchoring the plain pass
exists to prevent.

### 7.9 Know what changed — don't re-read, and don't remember
Because the client edits between turns, **the AI's picture of the page is stale by default**.

The failure this prevents is specific and severe: the AI writes a section, the client rewords it,
and the AI later "improves" that section and silently reverts them. A client who loses their own
edit to the thing they are paying to help them will not report it as a bug; they will stop
touching the editor, and the cheapest channel in the product goes dark.

The naive fix — re-read the page before every action — is correct and unaffordable. What the AI
actually needs is three questions answerable at three different costs:

| Question | Should cost | When |
|---|---|---|
| Has anything changed since I last looked? | ~nothing | before acting, always |
| What changed? | proportional to the change | only when the answer above is yes |
| What is the page now? | proportional to the page | fallback only |

**This is a platform requirement, not a discipline this document can impose.** It needs a change
record on the draft — see §13 — and until it exists the AI must re-read at every stage gate and
after any gap in the conversation, and accept the cost.

Two behaviours regardless of mechanism. **Never write over a change you did not read**: if the page
moved under you, look before you act. And **say so**: *"I see you've rewritten the headline — want
me to bring the subhead into line with it?"* is a better session than silently working around a
change the AI never acknowledged, and it is the difference between the client feeling the editor is
theirs and feeling it is fighting the AI.

---

## 8. The plain pass

Between stage 4 and stage 6 the site exists and is **undesigned**: monochrome, one typeface,
default spacing, no decoration. Nothing on screen is a design decision yet.

Three reasons. It forces the messaging conversation to actually be about messaging. It stops the
client anchoring on an aesthetic before we've discussed aesthetics. And it makes the Act III reveal
genuinely dramatic — the before-and-after happens *inside the session*, which is a large part of
what the client is paying to experience.

**Undesigned, not bad.** Nobody should look at it and think we tried and failed. It should read as
obviously provisional: draft affordances — annotation markers, "copy pending" tags, structural
labels — signalling that this is scaffolding.

**Draft affordances are chrome, not content.** They belong to the preview surface ([[DOC-28]]),
never to L1. An L1 draft marker becomes part of the site, has to be removed later, and can leak to
publish. The plain pass is a *rendering mode*, not a version of the page.

**The AI must frame it, every time.** A non-technical client seeing a monochrome page with no
styling will assume something has gone wrong unless told otherwise, plainly, before it appears:
*"I'm going to put this up deliberately plain — no colours, no styling. We're getting the words
right first. It'll look like a real site later today."*

---

## 9. Scope and cost discipline

Six mechanisms, in the order they bind:

0. **Route adjustments to the client** (§7.8) — direct edits cost nothing, and they cover the
   highest-frequency category of change. This is the largest single reduction available and the
   only one that improves the client's experience rather than trading against it.
1. **Scope band at intake** (stage 1) — the honest bound, agreed before work starts.
2. **Stage gates** — decisions lock; locked decisions are not re-opened without an explicit,
   recorded reason.
3. **Bounded refinement** — two rounds per stage (§7.5).
4. **Context rebuild at every gate** — the dominant cost lever (§4).
5. **Subagents for non-relationship work** (§4).
6. **The tail checkpoint** — when a session runs deep past its band, say so plainly and offer the
   choice: finish narrower today, or continue on the ongoing plan. Silent overrun serves nobody.

The commercial target is net-positive on ~90% of sessions ([[CHAT-20]]). That is a statement about
the *distribution*, not the mean — which makes mechanisms 1 and 6, the ones that bound the tail,
more important than the ones that shave the average.

---

## 10. Failure branches

| Situation | Response |
|---|---|
| Client can't articulate a differentiator | Reframe around execution quality; record the reason (stage 2) |
| Client wants something L1 can't express | Say so; offer the nearest expressible thing; log the gap for the framework (§7.3) |
| Client needs a capability we don't have yet | Say so plainly; park it in the ledger with the date; **do not pre-build the surface**; build for today's primary action (stage 1) |
| A capability's limits conflict with a design decision | The capability's envelope wins; re-open the design decision, not the commitment (§11) |
| Client's own edits contradict a locked decision | Surface it at the gate: either the decision changes or the edit does — never let them silently diverge (§7.9) |
| Client keeps asking the AI for adjustments they could make themselves | Do it, and offer the handover once. Never decline work by pointing at the editor (§7.8) |
| Client insists on a choice that works against their objective | One push, then their call, recorded (§7.4) |
| Client keeps re-opening a locked decision | Name it: "we settled this in the brief for *this* reason — has that changed?" Reopen only if the reason has changed |
| Assets missing and unobtainable | Design around the absence; offer it as a peer option, not a consolation (stage 5) |
| Session running well past scope band | Tail checkpoint (§9.6) |
| Session ends mid-act | Ledger is current; resume at the last gate |

---

## 11. Forward compatibility with the other limbs

1st Contact is more than web design. Site monitoring, payments, marketing planning and a
lightweight CRM are coming. **The site remains the core**, and that is the load-bearing fact here:
several of these capabilities do not sit alongside the site, they are built *into* it. A site
designed without knowing they exist is a site they cannot land in.

So the limbs are not one category, and treating them as one is the mistake to avoid:

| Limb | Relationship to the site | Must be known by | Consequence |
|---|---|---|---|
| **Payments** | **In the page** — surface, states, flow, legal copy | **Stage 1** | Constrains architecture (3), copy (4) and layout (7) |
| **Email capture** | **In the page** — a form and its destination | **Stage 1** | Small structural footprint; still a stage-3 input |
| **CRM** | **Behind the page** — a destination for what the page collects | Stage 1, as a destination | No structural footprint |
| **Monitoring** | **Around the site** — invisible to the design | Stage 10 | None |
| **Marketing planning** | **Off the site** — consumes the positioning | Post-ship | None; consumes Act I output |

**In-page capabilities are stage-1 decisions, not separate engagements.** They are committed in the
brief and built through Acts II–IV like everything else. Only the bottom two rows are genuinely
separate tracks.

**Act I is the shared spine.** Business, audience, offer, objectives, capabilities and brand are
properties of the *client*, not of any one artifact. Act I runs once per client, ever; a later
engagement — a marketing plan, a monitoring setup — starts from a ledger that already holds it.

**The ledger is a business record, not a site record.** Its limb-agnostic sections come first and
its site sections last (§3.5), so a new limb adds a section rather than restructuring the document.
This ordering is worth getting right now: retro-fitting a ledger schema across live customers is
considerably more expensive than choosing it carefully once.

**Objectives carry destinations we don't yet operate** (§stage 1). Recording *"leads → owner's
inbox, ideally CRM"* costs one question today and means that when the CRM ships, the AI can open
with something specific and true — *"you told me in July you were losing enquiries in your
inbox"* — rather than a cold pitch. This is the difference between an upsell and a follow-through.

**Behaviour arrives as configuration, not design** (§7.6). [[DOC-25]] already names payments, auth
and email capture as future behavior modules. When they land, the playbook does not change: the
client names a behaviour, the AI configures the module, and L1 owns how it looks.

**The capability catalogue is the interface between the two.** Stage 1 needs to know, for each
available capability, what it does, what it requires of the page (surfaces, states, invariant
elements), what it obliges (legal copy, placement constraints), and — the half that is easiest to
omit and most expensive to miss — **what it cannot do**. That catalogue is projected from the
module declarations, never hand-written here (§12). A capability that ships without updating its
declaration is invisible to the brief; a capability enumerated in prose here is a description of
last month's catalogue.

**The ongoing tier is where the other limbs naturally live.** Monitoring and marketing are
recurring by nature. Stage 10 is therefore not only "here is your site" but the start of the
ongoing relationship, and the ledger is what makes that relationship continuous rather than a
series of cold starts.

---

## 12. How this document is consumed

This playbook is **process knowledge**, not capability description. It belongs in the product's
system knowledge base ([[REQ-123]]) as a reference document the AI consults, alongside the design
rubric.

One hard constraint on how it is written and maintained, inherited from
`tools/generate/src/cli/ai/roles.ts`: **it must not enumerate tools or capabilities, or restate
anything projected from a declaration.** A hand-written inventory is text that describes last
month's surface, and it is worse than no inventory because the model believes it. This document
therefore refers to operations generically — "show them the page", "write the copy in" — and to
capabilities by *role in the conversation* rather than by name, and lets the projected tool manual
and capability catalogue say what actually exists. Anything here that starts naming operations or
listing capabilities is a maintenance bug.

The one exception is §11's table, which names limbs to fix their **relationship to the site** —
in-page, behind-page, off-site. That is a structural claim about the playbook, not an inventory of
what has shipped, and it is what tells the AI which class a new capability falls into.

---

## 13. Open questions

- **Ledger rendering for handoff.** The body is an append-ordered journal; the handoff wants it
  grouped by section (§3.5). Is that a rendering step, or does the AI write the handoff document
  separately at stage 10? Leaning: a rendering step, so the two cannot drift.
- **Gate enforcement.** Are stage gates a discipline the AI follows from this document, or does the
  session machinery enforce them (and therefore need to know about stages)? Leaning: discipline
  first, measure, mechanise only if it drifts.
- ~~**Ledger write mechanism.**~~ **Settled** (§3.3): `append_body` is a supported store operation
  with compare-and-set and retry-on-conflict, so gate commits write the delta and no purpose-built
  section-level tool is needed. The ledger is append-only with supersession as a consequence.
- **Cost constants.** §4's figures are modelled, not measured. They need validating against real
  sessions before pricing depends on them.
- **Restraint taxonomy.** [[CHAT-20]] calls for a vertical taxonomy with a default restraint level
  per vertical. That belongs in the rubric ([[DOC-16]]/[[DOC-17]]) and this playbook should
  reference it once it exists, rather than growing its own copy.
- **Free-tier boundary.** Exactly where in Act I does the free consultation stop? Leaning: after
  stage 1's primary action is identified but before the brief locks — enough to be genuinely useful
  and to demonstrate the register, not enough to substitute for the paid session.
- **Capability catalogue.** §11 requires one and §12 requires it be projected rather than written.
  Nothing projects it today. What declares a capability's page requirements, obligations and
  *limits* in a form the brief can consult? [[DOC-25]]'s module contract is the natural home for
  the machine-readable half; the conversational half (what to tell a non-technical client it can't
  do) may need a declared field of its own. This is the largest unresolved dependency in this
  document.
- **Parked capabilities as triggers.** A parked capability should surface when the capability
  ships. Is that a query over ledgers, or something the caretaker notices? Nothing does it today.
- **Image editing scope.** §7.8 and stage 5 assume the client can reframe and adjust their own
  images. [[DOC-28]] phase 1 scopes image segments to *"which image, basic framing"* — cropping
  and colour adjustment are past that line. The playbook must not promise a client something the
  editor cannot do, so this needs pinning to a phase before the first paid session.
- **A draft change record — now specified as [[REQ-131]].** §7.9's three questions have no cheap
  answer today: [[DOC-12]] versions the draft not at all — revisions are publish-time snapshots and
  `history.json` gets one entry per publish — so "did anything move?" currently costs a full
  re-read. This was the largest gap between what the playbook assumes and what the platform
  provides. The sketch below is what [[REQ-131]] was drawn from; it is kept here because §7.9's
  interim rule stands until that ticket lands:

  - A **monotone counter on the draft** plus an append-only **change log**, both written on
    `edit.ts` — already the single write path for the CLI, the AI and the editor ([[DOC-30]]), and
    already carrying the same validated diff vocabulary from all three ([[DOC-28]] §4). This
    persists what exists rather than inventing a representation.
  - **Mutating operations return the resulting counter**, so the AI's baseline advances as it
    writes. Any gap between its baseline and current is by construction someone else's work — which
    removes the need to filter its own edits out of the log. Same compare-and-set shape the
    transcript archive already uses.
  - **Not a revision.** No revision id, no `history.json` entry — [[DOC-12]] principle 3 is
    forward-only and immutable, and §5.1's preview snapshots are the precedent for a thing that is
    deliberately not a revision.
  - **Records must be self-describing.** L1 addresses are render-scoped by design ([[DOC-28]]
    §5.2), so an address alone is worthless once structure moves. Each record carries before/after
    text and the segment's human identity — which the derived segment model already computes.
  - **Bounded, degrading gracefully.** Keep a window; a baseline older than the window falls back
    to a full read. No correctness cliff, and the log stays small.

  Second payoff: this is also what makes divergence detection (a client edit contradicting a locked
  decision) cheap and precise, rather than a fuzzy comparison of freshly-read state against the
  ledger.



-
## 14. Cross-reference (CHAT-26) — the locale question

**Does not amend §1–§13.** [[DOC-34]] adds **one** Act I question — *where is the
business?* — recorded in the **Business** ledger section.

It is one question because the rest derives from it: `country` defaults the
site's `locale`, `currency` and IANA `timezone` (each overridable), and keys the
legal obligations a capability must declare — VAT-inclusive price display in the
EU/UK, Impressum in DE/AT, cookie consent. That makes `country` the most
important single input to the capability catalogue §13 carries as an open
dependency.

Note this is **localization, not translation**: it is what a *monolingual*
non-US business needs on day one. Multilingual sites are deliberately deferred
([[DOC-34]] §9).