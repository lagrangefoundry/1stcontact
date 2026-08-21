---
uid: doc-edba99c9
id: DOC-35
type: doc
title: Personas, Modes & Registers — who we are talking to, and how
created_by: xgd
created_at: '2026-08-21T00:36:49.913725+00:00'
updated_at: '2026-08-21T00:36:49.913725+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
  system_kb: true
---

# Personas, Modes & Registers — who we are talking to, and how

## 1. Purpose & scope

This document records **who arrives at a 1st Contact consultation, what they actually need, and how
the AI should adapt to them**. It is the frame that sits *above* [[DOC-33]]: DOC-33 describes a
conversation, this describes the axes along which that conversation must vary.

**In scope**: the persona set, the three independent axes (persona / mode / register), the
cross-cutting capacity diagnosis, the elicitation rules, and the real populations we know.

**Deliberately out of scope**: per-persona playbooks. We are capturing the frame, not yet writing
the scripts. Naming the openings is enough for now.

**Status**: working notes, captured from a design conversation ([[CHAT-21]]). Several sections are
explicitly unfinished and marked as such.

**Companions**: [[DOC-33]] (the consultation playbook this reframes), [[DOC-32]] (why people pay —
the outcome-not-artifact thesis this leans on), [[DOC-31]] (differentiation audit), [[CHAT-29]]
(reproduction, the read-back, and the capture evidence).

---

## 2. The error this corrects

Two problems in the current framing, both structural.

**DOC-33 segments on inventory, not on diagnosis.** Its §5 has four "arriving with" states — an
existing site, content & assets, brand & positioning, nothing but a product — which sort clients by
*what is in the folder*. That is the wrong axis. Two clients can arrive with identical assets and
need opposite sessions. A first-timer's problem is *"I don't exist."* An established business's
problem may be *"my funnel leaks."* Inventory does not distinguish them; diagnosis does.

**DOC-33 is artifact-anchored, and DOC-32 already said not to be.** DOC-32 §2B is unambiguous: the
buyer is purchasing *an outcome, not an artifact*, this is "the single most important framing for an
autonomous provider," and it is where the offer should be anchored. DOC-33 then cites DOC-32 and
builds eleven stages every one of which produces a *site* and none of which produces a *result*.
Clients shop for outcomes; we built a flow that talks about artifacts.

A third problem, structural rather than conceptual, is described in §10: DOC-33 welds *what must be
decided* to *the order we say things in*, which is why it only fits one kind of customer.

---

## 3. Three independent axes

The single biggest simplification available: what looked like "different kinds of session" is
actually three orthogonal dials.

| Axis | What it governs | Set by | Stability |
|---|---|---|---|
| **Persona** | The **opening** — what we do in the first fifteen minutes | The job they're hiring us for | Stable within a session |
| **Mode** | **Agency** — who sets the agenda, and the pace | Demonstrated fluency | Continuous, reversible |
| **Register** | **Vocabulary, explanation depth, consent frequency** | Domain confidence and anxiety | Continuous, reversible |

They are genuinely independent, and the useful cases are where they come apart:

- A **fluent** client can want to be **driven** because they're busy.
- An **anxious** client can want **more** agency, not less — being surprised by your own website is
  the thing they're afraid of.
- A client can be **fluent about their business** and **novice about the web** simultaneously, and
  the register must differ between those two conversations *inside the same turn*.

This is what makes one product serve everyone. Persona picks the door; mode and register are
adjusted continuously once inside.

---

## 4. The personas

Four confirmed, defined by the **job**, plus one under active discussion. Deliberately kept small
and job-shaped: a persona list that grows past about six has started sorting on demographics rather
than on need.

### 4.1 The First-Timer
**Has a site?** No. **Job:** exist credibly.

No site, often no clear idea what one is for. Needs the generative flow — the divergent-sketch
opening described in [[CHAT-21]] and destined for DOC-33's restructure. The magic matters most here:
they have nothing, and watching something appear is the entire experience.

*Opening:* generative. Thin brief, then divergent heroes.

### 4.2 The Embarrassed Owner
**Has a site?** Yes, and dislikes it. **Job:** stop looking amateur.

An aesthetic problem they can name. Closest to DOC-33 as written, but with inheritance: they have
content, brand fragments, and opinions about what's wrong.

*Opening:* read-back ("here's what I see"), then *"what's bugging you?"*, then mostly rebuild.

### 4.3 The Underperformer
**Has a site?** Yes, and broadly likes it. **Job:** more qualified leads.

**This is the persona DOC-33 cannot serve at all.** The site is not a bad artifact; it is a
mis-tuned instrument. The work is diagnostic — positioning, funnel, calls to action, capture — and
redesign is incidental to it. Rebuilding the site because they asked for "a better website" would be
answering the question they asked instead of the one they have.

*Opening:* **diagnosis.** Read-back plus findings — not *"here's what I see"* but *"here's what I
see, and here are the three things costing you enquiries."*

**Critical property: this persona self-identifies as 4.2.** They say *"I want a better website"*
because that is the only vocabulary the market has taught them. They mean *"I want more customers."*
Mis-self-diagnosis is the norm, not the exception, and it is the entire reason the first two turns
must be diagnostic rather than order-taking.

### 4.4 The Grower
**Has a site?** Yes, and it works. **Job:** scale what already works.

Site changes are incidental; they want systems — capture, CRM, campaigns, payments. This is where
the other limbs ([[DOC-33]] §11) earn their keep and where recurring revenue lives.

*Opening:* funnel and limbs. The site is a surface for landing capabilities, not the subject.

### 4.5 The Solopreneur / Founder — **under discussion, not yet worked**

Identified in [[CHAT-21]] and deliberately left incomplete. What we know so far:

- **Not supply-capped.** Unlike 4.3, these businesses scale; the capacity diagnosis (§6) applies in
  reverse — more qualified traffic is straightforwardly good, at least until a different constraint
  binds.
- **The site must do the selling.** No time for direct sales, at least initially; conversion happens
  on content and site, with events as a supplement rather than the backbone.
- **Consumer-first, enterprise later.** Sales hires and enterprise motion are a later phase; the
  early requirement is self-serve conversion.
- **A bootstrap variant exists** — a real, growing business run by people with full-time jobs
  elsewhere (killbill.io is the worked example). Shoestring, technical, time-poor rather than
  money-poor in effort terms, and with very different constraints again.

To be developed in a follow-up session. It may split into two (funded-solo vs bootstrap-side-project)
or may turn out to be one persona at two register settings.

### 4.6 Not personas — cases the axes already cover

Two session shapes that feel distinct but resolve as combinations:

**The Relauncher** — has had websites before, maybe has one today, but needs a new site for a new
venture. Real, and must *not* get the First-Timer treatment; the failure mode is condescension,
which fluent people detect instantly and don't forgive. But their **job** is 4.1's — no site for
this thing, needs one — and what differs is **fluency**, which is mode. So: First-Timer's job in
client-driven mode.

They do carry one distinct opening move worth naming: **mine the prior experience.** *"What did you
have before? What actually brought people in? What drove you mad?"* Fast, high-yield, and available
whenever there is a previous site in the history.

**The technology-anxious novice** (see §5.2) — First-Timer's job at the most careful register
setting. Not a separate persona; a register setting that happens to be far from the default.

---

## 5. The populations we actually know

Personas invented in a room are worth little. These are real people with real businesses, and each
one anchors a different corner of the space.

### 5.1 Sarah — Joyful Culinary Creations (Underperformer, supply-capped)
Sole-proprietor personal chef and caterer; WordPress + Elementor site captured in
`storage/references/joyfulculinarycreations.com/`. Three offerings (personal chef, postpartum,
cooking classes). Was interviewing web consultancies at ~$300/month.

Presenting complaint: *"I want a better website."* Actual need: more qualified leads, but bounded —
see §6. Diagnosed issues visible from the capture alone: the only call to action is *book a
consultation*, which is the most expensive thing you can ask of a stranger, with no lower rung
beneath it; no local search presence; testimonials carrying the credibility but placed low on mobile.

### 5.2 The trainee shamans (First-Timer, careful register)
A known population, all needing sites, all enthusiastic about a tool that doesn't exist yet.
Intelligent, articulate, and genuinely frightened of technology. No web vocabulary; strong,
precise vocabulary about their own practice.

They are the **register extreme**, and §9 is written largely with them in mind. See §9.5 for the
argument that they are the design centre rather than an edge case.

### 5.3 Martin — XGD and 1st Contact (Solopreneur, fluent, client-driven)
Founder of two businesses that must convert on site content without a sales function. Fully fluent;
wants the AI's help without wanting it to run the conversation. Anchors the **client-driven mode**
requirement (§8) and the Solopreneur persona (§4.5).

### 5.4 Kill Bill (bootstrap variant of §4.5)
`killbill.io` — a real, growing business run by people who have full-time jobs elsewhere. Technical,
shoestring, severely time-constrained. Included because it represents a category we want to support,
and because it is a very different set of constraints from a funded solo founder.

---

## 6. Capacity — the diagnosis behind the diagnosis

**This is cross-cutting, not a persona.** It applies to any client with a delivery constraint, and
it changes what "success" means before any site work is scoped.

### 6.1 More leads is not an unbounded good
For a supply-constrained business at capacity, the marginal value of a lead is approximately zero —
negative once triage time and disappointed prospects are counted. Meanwhile the marginal value of a
price rise is the entire book: ten clients at +20% is +20% revenue, no extra delivery, no marketing
spend. No lead-generation campaign competes with that.

Selling lead generation into a capacity-constrained business is selling into a failure: we deliver,
they get nothing, they churn.

### 6.2 But the waitlist is safety stock, not surplus
The naive version of §6.1 is wrong, and the correction matters. A sole proprietor with ten sticky
clients has each client at ~10% of revenue, and churn arrives **lumpy** — lose three in a bad month
and income drops 30% with a replacement lead time measured in weeks.

So a waitlist is not excess demand going to waste. It is **the buffer that makes a concentrated book
survivable**, and like any safety stock it is sized by **churn variance × replacement lead time** —
not by capacity, and not by ambition.

### 6.3 It is computable, from facts they already know
Four questions, all inside the client's own expertise, all answered instantly and precisely:

1. How many are you carrying now, against how many you can take?
2. How many did you lose last year — spread out, or clumped?
3. From first enquiry to first paid job, how long?
4. Of the people who enquire, how many become clients?

The target lead rate falls straight out, and it will be a modest number — a few qualified enquiries a
month, not dozens a week. **Telling a client what "enough" looks like, in their own arithmetic, is
something nobody has ever done for them**, and it is what reveals a $300/month lead-gen proposal as
mis-sized rather than merely expensive.

### 6.4 The levers, in order
1. **Build the buffer** to its correct depth (this is the only genuinely lead-shaped lever).
2. **Then raise prices** — the waitlist is what makes the rise safe. Not a competing lever; a
   sequential one. Do not raise prices into a thin pipeline.
3. **Filter, don't just attract.** The scarcest resource is the owner's own time, so the funnel's job
   flips toward qualifying: service area, minimum spend, what they don't do, indicative pricing. A
   site that repels bad-fit enquiries is worth more than one that attracts more of everything.
4. **Steer the mix** toward higher revenue-per-hour offerings, and toward leveraged ones (classes
   scale past one pair of hands; personal chef work does not).
5. **Capture the overflow.** People turned away today are next quarter's pipeline and this year's
   referral network. Currently they vanish.
6. **Smooth demand** — filling troughs beats adding to peaks.

### 6.5 Two consequences
**The supply-constrained diagnosis produces *more* site work, not less** — just a different job for
the site. Qualifying, pricing, routing overflow and steering mix is a harder and more valuable design
problem than lead maximisation. What's wasted for this client is *paid acquisition*, not the site.

**Overflow capture is business continuity, not a mailing list.** For a client like §5.1 the highest-
value change may be the mechanism that creates and maintains the waitlist — because without one the
buffer cannot accumulate even when demand exists. That is a materially better pitch than "add a
newsletter signup," and it is the same feature.

### 6.6 The boundary
This is business advice and we can be wrong. Surface the **observation** — *"you're turning work
away; that's usually a price signal rather than a traffic one"* — not the prescription. One push,
then it is their call, per [[DOC-33]] §7.4.

---

## 7. Elicitation rules

Three rules, in increasing order of importance.

### 7.1 Ask questions inside the client's expertise; show artifacts for questions inside ours
*"What's your brand personality?"* is our domain → silence or boilerplate. *"How many enquiries a
week do you get, and would you like more?"* is theirs → instant, specific, true.

The test for whether a question is answerable is simply: **is it inside their expertise?** If it
isn't, don't ask it — show something instead and let them react. Verbal for their expertise, visual
for ours.

This also fixes DOC-33's own worst question: stage 1 asks the client to place themselves on a
restraint spectrum before they have seen anything, which is the blankest question in the document and
a direct violation of its own §7.2.

### 7.2 Ask for facts, not diagnoses
The client is the definitive authority on their numbers and their history. They are **not** the
authority on what those numbers mean — nobody is, about themselves.

DOC-33, like most consulting, asks the client to self-diagnose (*"what do you want to achieve?"*) and
then takes the answer literally. The correct move is to gather facts inside their expertise, do the
inference ourselves, and then **reflect the diagnosis back for confirmation** — which converts it
into a critique task, which humans are good at (§9.1).

Worked example: never ask a supply-constrained owner how many leads they need. Ask the four questions
in §6.3 and compute it.

### 7.3 The first question is about the outcome, not the artifact
*"What would have to be true in six months for this to have been worth it?"*

DOC-33 asks for a "success signal" but buries it inside stage 1 behind the primary action. It should
be **first**, and it should be the frame everything else hangs from, because it is what separates *"I
don't want to be embarrassed"* from *"I want twelve more enquiries a month"* — and those are
different products.

It passes the §7.1 test: it is entirely inside their expertise.

---

## 8. Modes — who holds the wheel

### 8.1 The three settings
- **Directed** — the AI proposes, sequences, and drives. Default for low fluency.
- **Collaborative** — the AI proposes; the client redirects freely.
- **Client-driven** — the client sets the agenda; the AI executes and fills gaps.

### 8.2 Detected, not asked
Signals for fluency: correct use of design or marketing vocabulary; specificity of requests (*"two
columns with the image bleeding off the right"* vs *"make it nice"*); whether they answer questions
or redirect them; whether they volunteer their own sequence.

### 8.3 Reversible, per stretch
Mode is not set once. A confident client who hits a wall on typography should be able to hand the
wheel back for that stretch without ceremony, and take it again afterwards.

### 8.4 In client-driven mode the playbook becomes gap-filling
The AI stops sequencing the conversation and starts **keeping the checklist honest** — watching what
remains unsettled and raising it at the moment it becomes load-bearing: *"you haven't said what you
want people to do when they land — deliberate, or shall we pin it?"*

This also resolves an open question from [[CHAT-21]]: the "version with no playbook at all" is not a
separate product, it is the far end of this axis, which we need to support anyway.

### 8.5 Pushback is not modal
**Mode governs who sets the agenda, not whether we tell the truth.** A fluent client can still be
wrong about their own diagnosis — §4.3's mis-self-diagnosis is available to sophisticated people too,
and arguably more dangerous there, because fluency makes a wrong self-diagnosis more articulate and
harder to dislodge.

The diagnostic obligations survive every mode. We owe them the observation, once, clearly, then it is
their call. This is the strategic-pushback value [[DOC-32]] identifies as one of the four things
people actually pay designers for, and it is the one thing that must not be modal.

---

## 9. Registers — vocabulary, pace, and consent

### 9.1 What actually varies
- **Vocabulary** — *"hero"* vs *"the big picture at the top"*.
- **Chunk size** — how many decisions per turn.
- **Explanation depth** — whether we say why.
- **Consent frequency** — do we change things and let them undo, or ask first?
- **Reassurance** — *"nothing here is permanent"* is load-bearing for an anxious client and pure
  noise to a confident one.

### 9.2 Anxiety governs consent, not agency
**Fear does not reliably mean "take over for me."** Some frightened clients want us to handle it.
Others want *more* control precisely because they are anxious — being surprised by your own website
is the thing they are afraid of. Reading "terrified of technology" as "wants to be driven" will make
it worse for half of them.

Consent frequency is the dial anxiety actually moves, and it is independent of who sets the agenda.

### 9.3 Low web fluency is not low sophistication
The most likely failure. §5.2's population has a rich, precise vocabulary about their own practice; a
site that doesn't speak it is worthless to them. **The register adjustment is about web vocabulary
only** — everything else stays fully adult.

The tell for getting this right: the conversation about *their work* runs at full depth from the
first turn, and only the conversation about *the artifact* is scaffolded.

A naive "simplify for novices" instruction flattens both, and the result is patronising in a way that
intelligent people detect instantly and do not forgive.

### 9.4 Detection is asymmetric — and that sets the default
**Fluency is loud.** *"I want the nav sticky and the hero full-bleed"* tells you everything.

**Confusion is silent.** A lost client agrees, asks nothing, rejects nothing in a spread, volunteers
no detail — and those are the *identical* signals to a confident, busy client who wants us to get on
with it. They cannot be distinguished from the agreement itself.

Two consequences.

**Use their own domain as the control condition.** Ask something inside their expertise and watch the
difference. A busy fluent client is rich about their business *and* fast on the site. A drowning
client is animated about their work and flat on the site. That gap is the signal; it is measurable
turn to turn; and unlike *"are you following?"* it costs them no dignity.

**Default to the careful register and let fluency escalate it.** The errors are asymmetric:
over-explain to a fluent client and they say "just do it" — thirty seconds lost, self-correcting.
Under-explain to a frightened one and they never tell us: they feel stupid, agree with everything,
disengage, and leave, and we never learn why. Escalation is safe because it is requested;
de-escalation requires detecting something invisible.

### 9.5 The consequence for plurality
**Plurality has a dose.** Divergent-option spreads are the anti-anchoring mechanism and a large part
of what makes the session enjoyable — but six options is a delight to a confident client and an exam
to a frightened one. Choice overload lands hardest on exactly the people in §5.2.

So spread size is modal: six for §5.3, three for §5.1, two for §5.2, with more available *on request*
rather than presented up front.

Worth noting that this is the **only** mechanic from the [[CHAT-21]] design work that has to bend.
Every turn moves the page; build by resolution; show don't ask; critique over authoring; ask facts
not diagnoses — all of those get *better* the less fluent the client is. The plurality dial is the
single place where the design has to know who it is talking to.

### 9.6 Teach exactly enough vocabulary
Never introduce a term we don't need. When we genuinely need one, teach it once, in passing, off the
artifact rather than as a lesson: *"this big panel at the top — everyone calls it a hero, don't ask
me why."*

They must be able to talk about their own site after we are gone — to us in three months, to a
printer, to anyone. Leaving a client with zero vocabulary keeps them dependent, and DOC-33's handoff
already promises they will know what they have and how to change it. Five words is the whole
curriculum.

### 9.7 The design centre argument
**The technology-anxious novice is not the edge case; they are the design centre.**

- They have no alternative — Wix is theoretically available and practically not; a designer is
  thousands.
- Their businesses are typically the supply-constrained sole-proprietor shape of §6, so the capacity
  diagnosis lands on them perfectly.
- They are frequently a *network* that talks to itself, which is the referral dynamic a first market
  wants.
- And a flow that works for someone frightened of technology degrades gracefully toward fluency —
  getting out of a confident client's way is comparatively trivial. **The reverse is not true**: a
  flow designed for §5.3 does not degrade toward §5.2 at all.

Design for the anxious novice, detect fluency, escalate.

---

## 10. What this implies for DOC-33

Recorded here rather than acted on; DOC-33's restructure is a separate piece of work.

### 10.1 The weld to break
**DOC-33 is a checklist wearing a script's clothes.** Its eleven stages are simultaneously *what must
be decided* and *the order in which we say things*, fused. That fusion is why it fits exactly one
customer.

Separated:

- **The decision set is invariant.** Primary action, audience, positioning, capabilities,
  architecture, system, copy. Every good site has settled these, whoever it was built for. This is
  the ledger, and it does not change per persona.
- **The opening is set by persona** (§4).
- **The mode and register are set continuously** (§8, §9).

The ledger survives DOC-33's restructure unchanged — it was already append-only with supersession,
which is exactly the right shape for a session where decisions get revisited.

### 10.2 Specific changes indicated
- **§5 re-segmented** on diagnosis rather than inventory.
- **Stage 1 gains a second half**: not just *"what is your primary conversion action"* but *"is that
  the right one, and what is the rung below it?"* As written, DOC-33 would dutifully record
  §5.1's *"book a consultation"* and spend four hours building a beautiful page around a broken
  funnel, having asked every question on its list. **It currently has no mechanism for telling a
  client their objective is wrong.**
- **The free consultation is diagnostic when a site exists**, not a truncated Act I. For §4.3 the
  fifteen minutes should end with findings, not with a partial brief.
- **The restraint question** (§7.1) becomes a pointing exercise, not a question.

### 10.3 Why the playbook exists at all
An unguided AI does whatever the client asks. The client asks for what the market taught them to ask
for, which is *"make my site look nicer."* The playbook is where the product's expertise lives —
knowing the question behind the question, and redirecting. Without it we are a pleasant chat window
attached to a renderer.

---

## 11. Dependencies and open questions

**Open, for the next session:**
- §4.5 — the Solopreneur / Founder persona, and whether the bootstrap variant (§5.4) splits off.
- How far the diagnosis is allowed to go before it stops being web work and starts being business
  consulting we cannot stand behind (§6.6 is a first cut, not a settled boundary).
- Whether migration is genuinely mandatory for §4.3, and how it is framed. Current thinking from
  [[CHAT-21]]: required, but never the *ask* — motivated by a specific fix and demonstrated on an
  imported preview before the client commits. Reproduction's job there is **consent**, not fidelity,
  which lowers the bar to *recognisable and improvable*.

**Dependencies:**
- §4.3's opening needs the diagnostic checklist to exist. Most of it is derivable from the existing
  capture pipeline; local search presence is the one genuinely new input.
- The import path for §4.3 needs the page-builder importer discussed in [[CHAT-21]] — scoped to
  Elementor first, and explicitly *not* the [[DOC-21]] reproduction flywheel, which targets a
  different corpus for a different purpose.
- The divergent-sketch opening for §4.1 needs the design rubric, which does not yet exist
  ([[DOC-31]] has findings, not an encoded point of view). Rendering divergent options without one
  means rendering the model's default several times over.
