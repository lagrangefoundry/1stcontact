---
uid: doc-58cf04a4
id: DOC-33
type: doc
title: The Consultation Playbook — how the builder AI takes a client from nothing
  to a live site
created_by: xgd
created_at: '2026-08-11T21:54:36.501786+00:00'
updated_at: '2026-08-11T21:54:36.501786+00:00'
completed_at: null
last_field_updated: created_at
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

### 3.3 Ledger entry shape

Every entry carries four things. The **Why** is mandatory and is the whole point:

```
### <decision name>
- **Decided:** <the decision, in the client's language>
- **Why:** <the reason, tied to a stated objective or constraint>
- **Rejected:** <the alternatives that were offered and declined, briefly>
- **Status:** open | locked | reopened-at-<stage>
```

Rationale is what makes the transcript droppable. A ledger of bare decisions can be *honoured* but
not *defended* — when a downstream conflict arises the AI cannot tell whether an earlier choice was
a principle or a whim, so it either re-opens it (wasting the client's time and our tokens) or
silently contradicts it (worse). With the reason recorded, the AI resolves the conflict itself.

**Rejected alternatives** exist for a specific failure: the AI offers three directions, the client
picks one, and ninety minutes later the AI cheerfully re-offers a rejected one. Recording the
rejection prevents that at near-zero cost.

### 3.4 Ledger sections

Limb-agnostic sections first; limb-specific sections after. This ordering is deliberate (§11).

```
## Session          stage, act, sittings, scope band
## Business         what they do, who for, where, how they sell today
## Audience         who the site is for, what they arrive knowing
## Offer            positioning statement, proof points, differentiation
## Objectives       primary action + destination, secondary, success signal
## Inheritance      what was already decided before us, and must be honoured
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

#### Stage 1 — Purpose, audience, scope, restraint
*Entry:* inheritance agreed.
*Produces:* **one primary conversion action** with a destination; a secondary action if any; a
success signal; the audience; the scope band; the **restraint level**.
*Gate:* all four locked. This is the constitution the rest of the session is judged against.

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

#### Stage 7 — Layout & composition
*Entry:* system locked.
*Produces:* the designed pages.
*Gate:* the client is happy across the widths that matter to their audience.

Where most of the visible work happens. Vision-in-the-loop: the AI looks at what it made. Each
render is read once, its finding goes to the ledger, and the image drops at the gate (§4).

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

### 7.5 Bounded refinement
Refinement is a loop inside a stage, not a stage of its own. Two rounds, then: *"we can keep
tuning this in your ongoing plan — I'd rather spend the time we have left on the pages that aren't
built yet."* As its own stage, refinement is an unbounded cost sink with no natural end.

### 7.6 Configuration is not design
When a client names a behaviour we have a vetted module for, that is a **configuration**
conversation, not a design one — the AI configures the module and designs its appearance in L1,
rather than treating the behaviour as something to invent. Today this catches contact forms and
carousels; as [[DOC-25]]'s catalogue grows it catches payments and email capture with no change to
this playbook.

### 7.7 Never say "we'll get back to you"
Every decision resolves in-session or is explicitly parked in the ledger with a reason. There is no
human in the loop and the client must never be left waiting on one.

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
| Client insists on a choice that works against their objective | One push, then their call, recorded (§7.4) |
| Client keeps re-opening a locked decision | Name it: "we settled this in the brief for *this* reason — has that changed?" Reopen only if the reason has changed |
| Assets missing and unobtainable | Design around the absence; offer it as a peer option, not a consolation (stage 5) |
| Session running well past scope band | Tail checkpoint (§9.6) |
| Session ends mid-act | Ledger is current; resume at the last gate |

---

## 11. Forward compatibility with the other limbs

1st Contact is more than web design. Site monitoring, payments, marketing planning and a
lightweight CRM are coming. This playbook is structured so they fold in rather than fork it.

**Act I is the shared spine.** Business, audience, offer, objectives and brand are properties of
the *client*, not of the site. Act I runs once per client, ever; every subsequent engagement — a
payments setup, a marketing plan, a CRM onboarding — starts from a ledger that already holds it.
Acts II–IV are the **web-design track**; other limbs get their own tracks hanging off the same
Act I and writing into the same ledger.

**The ledger is a business record, not a site record.** Its limb-agnostic sections come first and
its site sections last (§3.4), so a new limb adds a section rather than restructuring the document.
This ordering is worth getting right now: retro-fitting a ledger schema across live customers is
considerably more expensive than choosing it carefully once.

**Objectives carry destinations we don't yet operate** (§stage 1). Recording *"leads → owner's
inbox, ideally CRM"* costs one question today and means that when the CRM ships, the AI can open
with something specific and true — *"you told me in July you were losing enquiries in your
inbox"* — rather than a cold pitch. This is the difference between an upsell and a follow-through.

**Behaviour arrives as configuration, not design** (§7.6). [[DOC-25]] already names payments, auth
and email capture as future behavior modules. When they land, the playbook does not change: the
client names a behaviour, the AI configures the module, and L1 owns how it looks.

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
`tools/generate/src/cli/ai/roles.ts`: **it must not enumerate tools or restate anything projected
from the surface declaration.** A hand-written tool inventory is text that describes last month's
surface, and it is worse than no inventory because the model believes it. This document therefore
refers to capabilities generically — "show them the page", "write the copy in" — and lets the
projected tool manual say what the operations actually are. Anything here that starts naming
operations is a maintenance bug.

---

## 13. Open questions

- **Ledger rendering.** The body is markdown. Does the client-facing handoff render it directly, or
  is there a second, friendlier presentation? Leaning: render directly, and write it well enough
  that this is not a problem.
- **Gate enforcement.** Are stage gates a discipline the AI follows from this document, or does the
  session machinery enforce them (and therefore need to know about stages)? Leaning: discipline
  first, measure, mechanise only if it drifts.
- **Ledger write mechanism.** Does the AI update the body through the ordinary ticket-update path,
  or does it need a purpose-built ledger tool with section-level semantics? A section-level tool
  would make gate commits cheap and hard to corrupt.
- **Cost constants.** §4's figures are modelled, not measured. They need validating against real
  sessions before pricing depends on them.
- **Restraint taxonomy.** [[CHAT-20]] calls for a vertical taxonomy with a default restraint level
  per vertical. That belongs in the rubric ([[DOC-16]]/[[DOC-17]]) and this playbook should
  reference it once it exists, rather than growing its own copy.
- **Free-tier boundary.** Exactly where in Act I does the free consultation stop? Leaning: after
  stage 1's primary action is identified but before the brief locks — enough to be genuinely useful
  and to demonstrate the register, not enough to substitute for the paid session.
