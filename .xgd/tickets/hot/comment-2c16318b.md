---
uid: comment-2c16318b
id: COMMENT-915
type: comment
title: Comment on chat CHAT-21
created_by: xgd
created_at: '2026-08-11T21:32:20.668310+00:00'
updated_at: '2026-08-11T22:44:27.445034+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-2aaa79f4
  kind: chat_transcript
---

<!-- xgd-turn id="2a98ebbc-a997-4268-9cbe-7a49521d8b5e-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T21:32:16.623723+00:00" -->
#### You
Please read DOCs 31 and 32 and CHAT-20.

In this chat we are going to design a playbook for the core interaction that our AI builder will have with a client. We will create the playbook as a system document to be included in the system build and we will build it into the knowledge base of the product (see REQ-123).

We need to anticipate mutiple different starting points for the conversation:
 - User has an existing site - provide the URL use messaging and assets and look and feel as a starting point - aim is to improve it
 - User has some content, documents, pictures, a logo etc 
 - User has a brand and positioning
 - User is really starting from scratch - we assume that the at least have a product - but don't even have branding.

We want to create a template to get the AI to guide the user through the decision making process of creating a site. As the user makes decisions the AI adds them to the draft site that they can both see - the user can watch this grow over time.

AI resources are costly so the conversation needs to be bounded - my guess is that we have a LOT of headroom - I am thinking we could reasonably charge $200 for a 4-5 hour session that would create a site - I think the cost of that session's tokens would be >$20. Obviously these figures need to be explored - I may be charging too much and I may be underestimating costs.

I imaging the conversation goes through stages like:

1. Agree on the purpose of the site - customer acquisition? Email capture? Lead generation?
2. Agree on the product concept and key differentiation
3. Agree on brand philosophy and high level messaging
4. Initial content creation - brand messaging
5. refinenment
6. Design and layout
7. refinement
8. Special effects

?

<!-- xgd-turn id="2a98ebbc-a997-4268-9cbe-7a49521d8b5e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-11T21:35:34.856474+00:00" -->
#### Claude
I'll read the referenced documents first.Read DOC-31, DOC-32, CHAT-20, plus the current builder priming (`tools/generate/src/cli/ai/roles.ts`, `instances.json`) and REQ-123 (which is empty — body just says `(new ticket)`).

Here's my proposed design. I've pushed back in a few places.

---

## 1. First, the numbers — because they change the design

I checked current pricing rather than guessing. Opus 5 is $5/$25 per Mtok, cache reads ~$0.50/Mtok, cache writes 1.25×. High-res images cost up to ~4,800 tokens each.

A 4–5 hour session, modelled roughly:

| Term | Estimate |
|---|---|
| ~300 model requests (conversation + tool turns) | |
| Cache reads @ ~200k avg context | ~$30 |
| Cache writes | ~$5 |
| Output incl. thinking (~800k tok) | ~$20 |
| **Opus 5 total** | **~$55** (range $35–90) |
| Same on Sonnet 5 | ~$33 |

So **$20 is optimistic by 2–3×**, but $200 still holds a ~70–75% gross margin. The number isn't the problem. Two things about its *shape* are:

**Cost is roughly quadratic in conversation length.** Context is re-read every turn, so 300 turns × a context that grows all session is the dominant term — not output. Anything that truncates context is worth more than anything that shortens replies.

**Screenshots are the sleeper cost.** If the AI looks at the render after every design change, 60 screenshots × 4.8k tokens = ~290k tokens sitting permanently in context — larger than the entire transcript. That single line is most of the difference between a $30 session and a $90 one.

Both point at the same mechanism, which is the core of the design:

---

## 2. The decision ledger

> The conversation is expensive and lossy. The ledger is cheap and durable.

A structured record of **what has been decided**, written as the session proceeds. Each stage ends by committing its decisions to it. It is not a summary of the chat — it's the accumulated state of the design.

Why it's load-bearing, in order of importance:

1. **It's the compaction artifact.** At each stage gate you can drop the transcript and the screenshots and carry forward only the ledger + current site state. This is what turns the quadratic into a linear cost curve, and it's the difference between hitting your 90%-net-positive target and not.
2. **It's the anti-relitigation mechanism.** Non-technical clients circle. "Locked" is a thing the AI can point at.
3. **It's resumability.** 4–5 hours will not be one sitting.
4. **It's the handoff to the $30–80/mo caretaker.** That's how the relationship persists rather than restarting cold.
5. **It's a deliverable.** A plain-English "here are your site's design decisions and why" document is the artifact that *demonstrates* judgment was applied — DOC-32 §2D's strategic-judgment driver, honestly, without implying a person.

---

## 3. Four starting points → one flow

Don't write four scripts. The four starting points differ in **what is already decided**, not in what needs deciding.

Intake produces a ledger with each decision marked **inherited** (already settled, must be honoured) or **open**. The main flow then visits only the open ones.

| Starting point | Inherited | Open |
|---|---|---|
| Existing site | brand, content, look — but *unarticulated*; the job is to surface and confirm them, and find what's actually broken | purpose (often), architecture, what to keep vs. kill |
| Content + assets | raw material, partial brand | positioning, architecture, design system |
| Brand + positioning | messaging, palette/type constraints | content, architecture, layout |
| Scratch | product only | everything — the most expensive session |

This also gives the free 15-min consult (CHAT-20 track 2) for free: it's **the first slice of Act 1**, same opener, same ingestion, stopping before the brief is locked. One flow, one entry point, two exit points.

---

## 4. The stage structure — revised

Your 8 stages are close. Four changes I'd argue for:

**"Special effects" must not be last.** That's exactly the "because we can" failure CHAT-20 flagged and DOC-31 measured. Restraint level is a **brief-stage decision**, locked before anything is designed — and for a plumber, the correct outcome may be *nothing*, recorded as a deliberate choice.

**"Refinement" isn't a stage.** It's a bounded loop inside each stage (2 rounds, then "your ongoing plan covers this"). As its own stage it's an unbounded cost sink.

**Content architecture is missing, and it's the highest-value stage.** DOC-31 Pattern 5: inventing a structural device instead of hero→cards→testimonials→footer is free technically and does most of the differentiation work. It needs its own gate.

**The ending is missing.** Critique, publish, handoff.

Two levels: the client sees **4 acts** (legible progress); the AI tracks finer gates.

| Act | Stages | ~Time |
|---|---|---|
| **I — Brief** | 0 Intake & ingestion · 1 Purpose, audience, scope band, **restraint level** · 2 Positioning & differentiation | 45–60 min |
| **II — Story** | 3 **Content architecture** · 4 Copy (site appears here, deliberately plain) · 5 Asset audit & gap plan | 60–90 min |
| **III — Design** | 6 Design system (palette + type, locked) · 7 Layout & composition · 8 **Signature moment** (one thing, or nothing) | 90–120 min |
| **IV — Ship** | 9 Critique pass · 10 Publish & handoff | 30 min |

---

## 5. Five mechanics that make it work

**Options, not iterations.** At every major decision, offer 2–3 *genuinely distinct* directions and have the client pick. Refining a single proposal drifts toward the model's default — which is the internet's statistical pull toward templatey that CHAT-20 named. Distinct options also extract real signal from someone with no design vocabulary. This applies hardest at stage 3 (architecture) and stage 6 (design system).

**The site appears ugly on purpose.** Structure and copy land as unstyled L1 before any visual decision. It forces the messaging conversation to be about messaging, it stops the client anchoring on early aesthetics, and it makes the Act III reveal genuinely dramatic — the before/after happens *inside the session*. The AI must frame it explicitly, or a non-technical client panics.

**One primary conversion action.** Purpose reduces to a single action from a fixed menu (call / book / buy / enquire / subscribe) plus how you'd know it worked. That's the spine everything else is judged against — including, later, whether a motion flourish earns its place.

**The one-push rule.** Strategic pushback is one of the four things DOC-32 says people actually pay designers for. Push back once, clearly, tied to their stated purpose. If they reaffirm, do it and record in the ledger that it was their call. Never twice.

**Critique against DOC-31's checklists.** Before handoff the AI runs Checklist A/B/C on its own output — including the structural diagnostic: *strip the copy, swap the photos — is the architecture still generic?* DOC-31's recommendation #4 is that we're **more** exposed to template DNA than a hand-built site, because a generation default replicates across every customer.

---

## 6. Two constraints on the artifact itself

**Where it goes.** `roles.ts` is emphatic that the hand-written preamble must not restate anything projected from the surface declaration — a hand-written tool inventory is text that describes last month's surface. The playbook is a **fourth layer**: process knowledge, not capability description. It must talk about *stages, questions, gates* and refer to capabilities generically ("show them the page"), never by tool name. Otherwise it rots the same way.

**Model routing has a caching trap.** Routing mechanical L1 emission to Sonnet/Haiku while keeping the conversation on Opus looks obviously right, but switching models mid-conversation invalidates the entire prompt cache — which would cost far more than it saves. Cheaper work has to run as a *separate call with its own prefix* (a subagent), never a swap in the main loop.

---

## Questions before I write it

1. **Ledger format** — is this a `.md` document in the site's storage, or structured data (a JSON sidecar the AI reads/writes via a tool)? Structured is enforceable and compactable; markdown is human-readable and handoff-friendly. I lean structured-with-a-rendered-view, but it's a real fork and it touches DOC-30's control surface.
2. **Does the playbook assume the ledger tool exists?** If yes, that's a REQ; if no, the playbook is aspirational in its central mechanism.
3. **REQ-123 is empty.** Do you want me to write its body (the KB ingestion requirement) in this session, or is that a separate pass?

If the shape above is right, I'll write it as a DOC (with the stage-by-stage detail: per-stage entry/exit conditions, the questions to ask, branch logic for each starting point, and the phrasings) and add the transcript to CHAT-21.

<!-- xgd-turn id="59b674e8-ba33-43b3-a264-2790dc021500-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T21:47:42.412217+00:00" -->
#### You
Read the chat transcript of REQ-123.

Our chat system already has a place to store summaries. I think the right thing here for this chat is to use that as the decision ledger.

I agree with your critique of my stages

**The site appears ugly on purpose.** <-- lets make it PLAIN not deliberately UGLY - it should be monochrome, perhaps we can use special indicators to show that it is a draft I'm thinking of depicting things like post notes or similar to make it clear that this is not the design look. But I do want to push back on your ugly I don't think that's what you really mean.

I'm not sure if this is why you are going I don't see you say it explicitly but with the decision ledger, perhaps we don't need to resubmit the entire context every turn. We could start to crop aggressively. The decision ledger should maintain not just the decision but the rationale for it if we hold that in this test form then perhaps we don't need to resubmit the entire conversation every time. The conversation could be available to the AI to access if it needed to but in this way we could keep the context smaller.

Perhaps we build tooling for subagents eventually to also keep the costs down.

<!-- xgd-turn id="1388ebfb-b250-41a8-9308-1b3f5840a832-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T21:49:52.436671+00:00" -->
#### You
Read the chat transcript of REQ-123.

Our chat system already has a place to store summaries. I think the right thing here for this chat is to use that as the decision ledger.

I agree with your critique of my stages

**The site appears ugly on purpose.** <-- lets make it PLAIN not deliberately UGLY - it should be monochrome, perhaps we can use special indicators to show that it is a draft I'm thinking of depicting things like post notes or similar to make it clear that this is not the design look. But I do want to push back on your ugly I don't think that's what you really mean.

I'm not sure if this is why you are going I don't see you say it explicitly but with the decision ledger, perhaps we don't need to resubmit the entire context every turn. We could start to crop aggressively. The decision ledger should maintain not just the decision but the rationale for it if we hold that in this test form then perhaps we don't need to resubmit the entire conversation every time. The conversation could be available to the AI to access if it needed to but in this way we could keep the context smaller.

Perhaps we build tooling for subagents eventually to also keep the costs down.

One other thought here, we are building out first contact. It has many limbs. The web design is the first limb. There will be site monitoring, payments, marketing planning and a lightweight CRM - we should design this playbook with a eye on the fact that these features will be available at some point and will need to be folded into what the AI can offer

<!-- xgd-turn id="1388ebfb-b250-41a8-9308-1b3f5840a832-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-11T21:55:39.301488+00:00" -->
#### Claude
Read it — and that settles the ledger question definitively.

## The ledger already exists, by design

`components/ai/js/src/ticket_store.js:19-21`:

> **`apply` never touches the ticket *body*.** The body is the AI-maintained summary's home (REQ-35 §5); the transcript lives only in the comment.

So a session is a `chat` ticket: **body = ledger, `chat_transcript` comment = raw turns**, and `Session.chatTicketUid` records where the ledger lives so a reopen finds it. The two write paths are already separated, so ledger writes don't race transcript appends. Nothing to build — it's a discipline about what goes in the body.

This is also exactly the pattern CHAT-20 uses on itself: distilled body, verbatim transcript in the comment. We'd be applying our own dogfooding to the product.

## You're right, and I under-stated it

Yes — **the ledger's purpose is to make the transcript droppable.** I said "compaction artifact" and left it there; it deserves to be the headline. And your point about rationale is the load-bearing part:

> A ledger of decisions can be *honoured* but not *defended*. A ledger of decisions-with-rationale can be reasoned from.

Without the "why", the AI hits a downstream conflict, can't tell whether the earlier decision was a principle or a whim, and either re-opens it (wasting the client's time) or contradicts it (worse). With the "why", it resolves the conflict itself. That's what makes dropping the transcript safe rather than reckless.

Priming becomes: **system + ledger + current site state + this stage's turns**, with the transcript reachable by search when genuinely needed. That's DOC-10 §5.1's tail-prime shape, upgraded — tail-prime alone loses decisions made two hours ago; tail + ledger doesn't.

**One non-obvious constraint on cadence.** Caching is a prefix match, so cropping *mid-conversation* rewrites the prefix and invalidates everything after it — done continuously, aggressive cropping costs more than no cropping. So crop at **stage gates only**: rebuild the prefix from (system + ledger + site state), then let it grow untouched within the stage. Full cache hits inside a stage, ~10 cold writes across the session instead of 300 huge warm reads.

Re-running the model with that: context holds at ~40k instead of climbing to 400k → **~$25–30/session on Opus 5**, against ~$55 without. The ledger pays for itself several times over. Screenshots ride the same mechanism: read once, finding goes to the ledger, image drops at the gate.

Subagents: agreed, and they're the *only* correct way to route work to a cheaper model — switching models inside the main loop invalidates the cache, whereas a subagent is a separate call with its own prefix. Good first candidates: background ingestion, the critique pass, copy variants.

## Plain, not ugly — you're right, I overstated

"Ugly" was wrong. What I actually mean is **undesigned**: monochrome, one typeface, default spacing, no decoration — so that nothing on screen is a design decision yet. Nobody should look at it and think we tried and failed. Your draft-affordance idea is better than my framing, and I'd add one constraint:

**Draft affordances must be chrome, not content.** Post-it markers, "copy pending" tags, structural labels — those belong to the preview surface (DOC-28), never to L1. If they're L1 nodes they become part of the site, need removing later, and can leak to publish. The plain pass is a *rendering mode*, not a version of the page.

## The other limbs — this changes the spine

This is the most consequential thing you've said, and it lands before I write anything down rather than after. Three implications:

**1. It's not a site ledger, it's a business ledger.** Sections are limb-agnostic first (business, audience, offer, objectives, brand) and limb-specific second (site: architecture, copy, layout). When payments lands it adds a section; nothing restructures. Retro-fitting a ledger schema across live customers is the kind of pain worth ten minutes of thought now.

**2. Conversion goals get a *destination*, recorded even though it doesn't exist yet.** Today "leads → email to owner". Later "leads → CRM". Capturing the destination in Act I costs one question, makes the ledger forward-compatible, and means the upsell conversation is already half-had — the AI can later say "you told me in July you were losing enquiries in your inbox" rather than cold-pitching.

**3. The playbook is a shared spine plus per-limb tracks.** Act I (brief, positioning, objectives) is limb-agnostic and runs once per client, ever. Acts II–IV are the *web-design track*. A payments track, a marketing-planning track, a CRM-onboarding track hang off the same Act I and the same ledger. Same convergence trick as the four starting points, one level up.

Worth noting the technical counterpart already exists: DOC-25 lists "later payments, auth, email-capture" as behavior modules. So there's a standing rule for the playbook — **when a client names a behaviour we have a module for, that's a configuration conversation, not a design one.** Today that catches contact forms; later it catches payments and email capture without the playbook changing.

---

Let me write it up as DOC-33.

**DOC-33 — The Consultation Playbook** is written, and CHAT-21's body now carries the distilled ledger (dogfooding the pattern: distilled body, verbatim transcript in the comment).

### What's in it

Thirteen sections. The parts that carry real weight:

- **§3 The two artifacts** — ledger schema, entry shape (Decided / **Why** / Rejected / Status), and the section ordering that makes it a *business* record rather than a site record.
- **§4 Context economics** — the crop-at-gates rule, with the caching constraint spelled out so nobody later "optimises" it into continuous cropping and makes it worse.
- **§5 Four starting points, one flow** — the inherited/open table.
- **§6 The stages** — all eleven, each with entry condition, decisions produced, and exit gate. Stage 2 (positioning) is written as *interrogation, not generation*, because a plausible AI-written positioning statement is the exact generic motto DOC-31 flags, and everything downstream descends from it.
- **§7 Mechanics** — options-not-iterations, never-a-blank-question, the one-push rule, bounded refinement, configuration-is-not-design.
- **§8 The plain pass** — undesigned not bad, chrome-not-content, and the framing line the AI must say *before* it appears.
- **§11 Forward compatibility** — Act I as shared spine, destinations recorded for limbs we don't operate, behaviour-as-configuration.
- **§12** carries the `roles.ts` maintenance constraint forward: this document must never enumerate tools, or it becomes text describing last month's surface that the model believes.

### Two things I'd flag

**REQ-123 is still empty.** Its body says `(new ticket)` — the whole KB requirement (the five decisions the transcript asks you for: where the JS read-side lives, which store Python indexes, which docs go in, tenancy, index artifact location) is unanswered. DOC-33 assumes that KB exists as its delivery mechanism. That's the next real dependency, and it's a bigger piece of work than this playbook was.

**One open question is more load-bearing than it looks** (DOC-33 §13): does the AI write the ledger through the ordinary ticket-update path, or does it need a purpose-built tool with section-level semantics? Whole-body rewrites at ten gates per session are both expensive and easy to corrupt — a section-level write would make gate commits cheap and atomic. If you want that, it's a REQ, and it probably wants to land before the first real paid session rather than after.

<!-- xgd-turn id="ebe9a6b4-4646-4f61-bc6d-4f3ebde927be-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T22:20:27.090150+00:00" -->
#### You
REQ-123 read the CHAT TRANSCRIPT int the comment NOT THE TICKET BODY.

I like your idea of the modular playbook, but the reason for raising it is in many ways the site is the core. Capabilities like payments need to be built into the site so the site builder has to be aware of those capabilities and their limitations at site creation time. I'm sure we can figure out how to fold this in but I'm just calling it out now so that we're not surprised by it

<!-- xgd-turn id="ebe9a6b4-4646-4f61-bc6d-4f3ebde927be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-11T22:23:22.797535+00:00" -->
#### Claude
I did read it — COMMENT-831, the full transcript, and I quoted the five decisions it's waiting on. My closing line called REQ-123 "empty" and "unanswered", which mischaracterised it: the design work is *done* in that transcript (upstream JS read-side, Python indexes the XGD store, D1 index rows, the three KM tools replacing DOC-10's four), and what's outstanding is your calls on the five questions, not the thinking.

## On payments being *in* the site

That's a real correction to §11, not a footnote. I framed the limbs as parallel tracks hanging off a shared Act I. Some are. Payments isn't — it's **nested**, and if the site builder doesn't know about it at brief time it will produce a site the capability can't land in.

The useful move is to stop treating "the limbs" as one category:

| Limb | Relationship to the site | Must be known by |
|---|---|---|
| **Payments** | **In the page** — needs surface, states, flow | **Brief.** Constrains architecture and layout. |
| **Email capture** | **In the page** — form + destination | **Brief.** Small structural footprint. |
| **CRM** | **Behind the page** — destination for what the page collects | Brief, as a destination. No structural footprint. |
| **Monitoring** | **Around the site** — invisible to design | Handoff. Zero design consequence. |
| **Marketing planning** | **Off the site** — consumes the positioning | Post-ship. Consumes Act I; adds nothing to the build. |

So: in-page capabilities are **stage-1 decisions with consequences through stage 7**. Behind-page ones are destinations (already covered). Only the last two are genuinely separate tracks. My §11 was right for the bottom of that table and wrong for the top.

Three consequences worth designing in now:

**Capability commitments are a third decision class.** Not content, not design. "This site takes deposits" ripples: a surface, success/failure/pending states, possibly auth, legal copy, a data destination. Recording it as `objective: buy` doesn't carry any of that.

**The limitations matter as much as the capabilities.** The AI needs to know what payments *can't* do while it's still designing, or it commits to a page the module can't support. That's the DOC-24 safety-envelope story, but the conversational consequence is new: the AI needs a **capability catalogue** to consult during the brief, not just a module list to configure during build.

**And that catalogue must be projected, not written here.** Same lesson as `roles.ts`: a hand-written capability list in the playbook describes last month's catalogue, and it's worse than none because the model believes it. The playbook says *"consult the catalogue at stage 1"* and never enumerates.

The case that matters today is the one where the answer is *no*: client wants deposits, payments doesn't exist. Correct behaviour is say so plainly, **park the capability without pre-building the surface** (speculative structure is dead structure), and let the ledger entry become the trigger for a real follow-through when it ships — the same mechanism as destinations we don't yet operate, generalised.

Let me fold this in.

DOC-33 updated, CHAT-21's ledger extended.

**What changed:**

- **Stage 1 gains capability commitments** as a third decision class, alongside content and design — with the rule that *both halves* get recorded, what a capability does and what it can't. The ledger gains a `## Capabilities` section.
- **§11 rewritten** around the in-page / behind-page / off-site taxonomy. In-page capabilities are stage-1 decisions that constrain stages 3, 4 and 7; only monitoring and marketing planning are genuinely separate tracks.
- **The "not yet" branch** is explicit: say so, park it with a date, don't pre-build the surface.
- **§12's projection constraint extended** to the capability catalogue, with §11's table as the declared exception — it fixes *relationships*, which is a structural claim the playbook owns, rather than an inventory of what has shipped, which it must never own.

**The dependency this surfaces**, now DOC-33 §13's largest: nothing projects a capability catalogue today. DOC-25's module contract is the natural home for the machine-readable half — page requirements, invariant elements, obligations. The half with no home is the *conversational* one: what to tell a non-technical client a capability can't do. A module declaring "`config.mode` accepts these three values" doesn't answer "can I take a deposit and the balance later?", and that's the question the brief has to answer while the client is sitting there.

That's probably a field on the module contract rather than anything new — but it's a DOC-25 amendment, and it wants deciding before payments is authored rather than after, since it's cheaper to require of a new module than to retrofit onto a shipped one.

<!-- xgd-turn id="6a8bcb1a-6d60-4dec-9190-2feaef42ed19-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T22:24:39.489899+00:00" -->
#### You
Also worth noting, the draft site can be edited directly by the user. The user can make changes to copy, change basic things like font size and color, also simple image editing, image selection, image cropping and maybe some aspects of colorization for example. All of this is effectively free - the user can make those kinds of changes at any time at no cost

<!-- xgd-turn id="6a8bcb1a-6d60-4dec-9190-2feaef42ed19-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-11T22:28:05.148453+00:00" -->
#### Claude
Read DOC-28. This is a bigger deal for the playbook than it looks, and it fixes its weakest part.

DOC-28 already draws the line — *"the user sees copy, asset selection, and friendly parameters… anything sophisticated is done by the AI"*, and *"structure is the AI's job… a deliberate scope wall"*. So the division maps straight onto the playbook: **the AI owns decisions and structure; the client owns adjustments inside them.** That it's free is a consequence, not the reason.

Three things follow.

**It dissolves my worst rule.** §7.5's "two rounds of refinement, then it's on the ongoing plan" was the weakest thing in the document — a bad moment to hand a client who has just paid £200. But the things clients most want to keep tweaking are the exact things the editor covers: the wording, which photo, is-that-a-touch-big. So refinement splits: *decision-level* rework stays capped, *adjustment-level* is unbounded and free. The cap stops being punitive.

**Disclosure should be staged, and DOC-28 makes it self-enforcing.** Introduce copy editing at stage 4 when the site first appears — it belongs in the plain-pass framing. Don't mention visual controls until stage 7, because premature aesthetic fiddling is precisely what the plain pass exists to prevent (and conveniently, monochrome offers nothing to fiddle with). Then DOC-28's *"colours are picked from the site's palette, not individually"* means that once stage 6 locks the palette, the client structurally cannot wander outside it. The editor enforces the gate.

**There's a real bug class here.** The client can edit between turns, so the AI's picture of the page is stale by default. The caretaker preamble's *"read before you write… never from memory or a guess"* stops being hygiene and becomes load-bearing: AI writes copy → client rewords it → AI later "improves" that section and silently reverts them. That's the free-coded-overwrite problem from `CLAUDE.md`, reproduced in the product, against a customer. It also constrains §4: the site state going into a rebuilt prefix must be *freshly read*, never the AI's last-known version.

One small factual note: DOC-28 phase 1 scopes images to *"which image, basic framing"*. Cropping and colorisation are past that — worth confirming whether they're phase 1 scope creep or phase 2, since the playbook shouldn't promise a client something the editor can't do yet.

DOC-33 and CHAT-21 both updated.

**Landed:**
- **§7.8 Two channels** — the ownership table, the "hand it over because they're better placed, not because it's cheap" framing, and the two guard rails (don't turn a paid session into a tutorial; never decline work by pointing at the editor).
- **§7.9 Read the page, never remember it** — with the silent-revert failure spelled out, because the client won't report it, they'll just stop using the editor.
- **§7.5 rewritten** — decision-level rework capped, adjustment-level unbounded.
- **Staged disclosure** at stages 4 and 7, plus the note in stage 6 that the palette lock is self-enforcing once it closes.
- **§9 gains item 0** — routing adjustments to the client, ahead of everything else in the cost list.
- **Stage 10** now states the division explicitly as part of handoff, which is also the ongoing tier's cost model.

**Two things now want a decision before a first paid session runs:**

The image scope question above — cropping and colorisation sit past DOC-28 phase 1's "which image, basic framing", and the playbook is currently written as though the client has them.

And a subtler one I've logged as an open question rather than solved: §7.9 asks the AI to notice at a gate that a client edit contradicts a locked decision. Re-reading the page and diffing it against the ledger every gate isn't free, and doing it by re-derivation is exactly the kind of work the editor's structured-diff model could hand over cheaply instead — the editor already emits validated diffs, so *what changed since the last gate* is knowable without the AI reconstructing it. That's likely a small REQ against DOC-28/DOC-30 rather than anything the playbook can specify.

<!-- xgd-turn id="7ce8ea28-3bfc-44e5-95df-c40b98b00103-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T22:34:46.121170+00:00" -->
#### You
The client can edit between turns, so the AI's picture of the page is stale by default. The caretaker preamble's *"read before you write… never from memory or a guess"* stops being hygiene and becomes load-bearing: AI writes copy → client rewords it → AI later "improves" that section and silently reverts them.

I believe that we need a specific capability here - the AI needs to know when the last change was made and when it last read the side - read every time is costly in tokens but the freedom to make changes when needed is valuable - perhaps we create a diff history so the AI can just look at diffs??

<!-- xgd-turn id="7ce8ea28-3bfc-44e5-95df-c40b98b00103-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-11T22:37:19.923364+00:00" -->
#### Claude
Let me check what versioning already exists before proposing anything.

Checked both. The gap is real and the fix is cheaper than it looks, because two things are already true.

**DOC-12: the draft has no version at all.** Revisions are publish-time snapshots; `history.json` gets one entry per *publish*. There is nothing tracking intra-session change — so today the AI genuinely has no way to ask "did anything move?" short of re-reading.

**DOC-30 §: `edit.ts` is already the single write path.** The `1c` CLI, the AI, and the page editor all go through it, and DOC-28 §4 says the editor emits *the same structured, validated diff vocabulary the AI emits*. So there is exactly one place to record a change log, and the records are already flowing through it — this is persisting something that exists, not inventing a representation.

## The shape I'd propose

**A draft change log on the single write path**, with three primitives layered by cost:

| Question | Cost | Mechanism |
|---|---|---|
| Has anything changed since I last looked? | one integer — effectively free | monotone draft counter vs. the AI's baseline |
| What changed? | proportional to *the change* | read the log forward from the baseline |
| What is the page now? | proportional to *the page* | full re-read — fallback only |

The property that makes it work: **every mutating tool returns the resulting draft revision**, so the AI's baseline advances automatically as it writes. No bookkeeping, and no need to filter its own edits out of the log — any gap between its baseline and current is, by construction, someone else's work. That's the same compare-and-set shape `ticket_store.js` already uses for transcripts.

Four constraints worth pinning now:

**It must not be a revision.** DOC-12 principle 3 is forward-only, immutable, live-equals-latest. A draft counter mints no revision id and never enters `history.json` — the precedent is §5.1's preview snapshots, which are deliberately not revisions for the same reason.

**Records must be self-describing, because addresses aren't.** DOC-28 §5.2 makes L1 addresses render-scoped by design: a path of child indices, valid only for the render that produced it. A log entry saying `set_copy at children[3].children[0]` is worthless if structure has since changed. So each record carries the before/after text and the segment's human identity — which DOC-28's derived segment model already computes for the editor's outlines.

**The log is bounded and degrades gracefully.** Keep a window (last N, or since last publish); if the AI's baseline predates it, fall back to a full read. That keeps the log small and means there's no correctness cliff.

**Is it actually cheaper?** DOC-28 measured a real page at 73 segments, 62 of them copy. A between-turns client edit is typically a few reworded lines — a handful of short records against re-reading all of that. But the property that matters isn't the constant factor, it's that cost becomes proportional to *change* rather than to *page*, which holds as sites grow.

## The payoff is bigger than staleness

Two things fall out that I'd been treating as separate problems.

**§7.9's divergence detection becomes cheap and precise.** Diffing a freshly-read page against the ledger is expensive and fuzzy. Reading *"client changed the hero headline from X to Y"* is neither.

**And it makes the AI's narration honest.** *"I see you rewrote the headline — want me to bring the subhead into line with it?"* is a materially better session than silently working around a change it never noticed. Right now the client's freedom to edit and the AI's correctness are in tension; this is what resolves it rather than trading one off.

Let me fold the requirement into DOC-33 — the mechanism itself belongs in its own ticket, not the playbook.

Both updated. DOC-33 §7.9 now states the requirement (three questions, three costs) and is explicit that it's a platform capability rather than a discipline the playbook can impose — with an interim rule to re-read at gates and accept the cost until it exists. §13 carries the design sketch.

I haven't created a ticket for it — you haven't asked me to, and it isn't obvious to me whether this is a REQ in this repo or belongs upstream, since `edit.ts` is 1stcontact's but the pattern is general. Say the word and I'll file it.

**Three open items now stacked up from this session, in rough order of urgency:**

1. **The draft change record** — the largest gap between what DOC-33 assumes and what exists. Blocks nothing today (the fallback is "re-read and eat the cost"), but it's the difference between the editor being safe and being a hazard.
2. **The capability catalogue** — needs a DOC-25 amendment before payments is *authored*, since it's cheap to require of a new module and expensive to retrofit. The machine-readable half has a home; the conversational half ("what do I tell a non-technical client this can't do") doesn't.
3. **Image editing scope** — DOC-28 phase 1 says "which image, basic framing"; the playbook currently promises cropping and colorisation. Smallest of the three, but it's a promise made to a paying client, so it wants pinning before a first session rather than after.

And REQ-123's five questions are still the thing standing between DOC-33 and being deliverable to the AI at all — the playbook has no route into the product without that KB.

<!-- xgd-turn id="0d4b0eaa-d5c0-411c-8a69-f0f52917d444-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T22:44:27.246187+00:00" -->
#### You
This is important. We already have an L1 "tool" so we need a ticket to (1) add the business logic to track these things exposed as an API and (2) extend the Toolbox config to support the additional calls and data

<!-- xgd-chat-end -->