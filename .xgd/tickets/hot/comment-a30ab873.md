---
uid: comment-a30ab873
id: COMMENT-2022
type: comment
title: Comment on chat CHAT-32
created_by: xgd
created_at: '2026-09-01T18:40:16.058476+00:00'
updated_at: '2026-09-01T19:53:35.671320+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-2fe4ef30
  kind: chat_transcript
---

<!-- xgd-turn id="98d7ba94-cbad-491d-b780-62d10657ea01-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T18:40:00.976168+00:00" -->
#### You
Take a look at the work on the Knowledge Management System. Particularly the "Site data model" chat transcript and REQ-158 and the related REQWs and docs.

What I want to do here is to review the documents that are doc_kind: system_kb. Do we have the right docs in system_kb? What are we not telling the production AI sessions that they need to know? At least we need to:
1) Explain the product - what is the value proposition - what is the role of the AI
2) Explain the tooling available to the AI chat: 1c site builder tooling? (may be out of date)
3) Website building scripts - I have a specific chat on this "The design conversation" - lets not go into that here this conversation is the broader one

<!-- xgd-turn id="98d7ba94-cbad-491d-b780-62d10657ea01-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T18:44:06.090989+00:00" -->
#### Claude
I'll start by surveying the current system_kb corpus and the referenced tickets.

## State of play

`doc_kind: system_kb` is exactly four documents — DOC-33 (Consultation Playbook), DOC-35 (Personas, Modes & Registers), DOC-31 (Differentiation Audit), DOC-17 (Design Lessons Log). That matches `kb/system/` on disk, so REQ-164's filter flip has taken effect.

Three more corpus members exist in code but not on disk: REQ-165's projections (`REF-behaviors`, `REF-l1`, `REF-surface`). `kb/system/` predates that commit, so the built index and awareness map are a corpus of 4, in 2 territories, both of them design-craft/consultation. **Nothing in the shipped corpus today says what the product is or does.**

## The structural problem with the four we have

All four fail DOC-39 §3.5's own test, and DOC-39 §10 admits it — "flagged for rewriting rather than treated as finished." But it's worth being specific about *how* they fail, because it changes what "rewrite" means:

- **They are addressed to us, not to the AI.** DOC-31 opens with an executive summary for a reader deciding product strategy. DOC-17 is a lab notebook with a "Read me first (successor)" preamble and distill-forward TODOs. DOC-33 and DOC-35 carry "Out of scope", "Open questions", "What this implies for DOC-33", and cross-references to tickets. An assistant reading DOC-33 §13 learns that the capability catalogue is an unresolved dependency — a fact about our roadmap, useless mid-conversation with a client.
- **They carry rationale for our engineering and product choices**, which §3.5 explicitly excludes. DOC-33 §4 is an argument about context economics and prompt caching. That is architecture wearing consultation clothes.
- **They teach register by example**, and the register they teach is ours. §3.5: "these are read by something that imitates."

And one that isn't a register problem at all:

- **DOC-35 §5 names real people and real businesses.** Sarah at Joyful Culinary Creations, her three offerings, her pricing, our diagnosis that her funnel leaks; killbill.io; the trainee shamans; you. The system KB is *above the tenancy barrier* — byte-identical for every client, searchable from every session. Right now every tenant's assistant can retrieve our diagnosis of a named prospect's business. That's not a rewrite item, it's a defect.

## The role mismatch — the biggest finding

`roles.ts` declares one role: `caretaker`. Its preamble is *"You are the caretaker of a website your user owns… Make the smallest change that answers the request."* `instances.json` grants that one role seven L1 groups.

DOC-33 and DOC-35 — half the corpus, and the larger half by weight — describe a **consultant** running a paid four-to-five-hour session with acts, gates, a plain pass, divergent option spreads, and a ledger. That role does not exist in code, and its behaviour directly contradicts the caretaker preamble it would be primed alongside. "Make the smallest change" versus "offer two or three structurally distinct directions" is not a nuance the model will reconcile gracefully.

So before asking *which documents*, the corpus needs to answer *for whom*. Three possibilities, and they produce different corpora:

1. The consultation material is for a **second role** that doesn't exist yet, and shouldn't be in the shipped corpus until it does.
2. The caretaker **is** the consultant and `roles.ts` is behind DOC-33.
3. They're one role at two register settings — plausible given DOC-35 §3, but then the preamble needs to say so.

This is worth settling in this conversation; it's upstream of everything below.

## Your three items

**1) Product, value proposition, role of the AI — genuinely missing, and not projectable.**

This is the largest hole. It cannot be a projection: positioning is a judgment, not a machine-readable fact, so it has to be authored — the one place §3.2's "generate, never author" rule doesn't reach.

What it needs to carry, all of it actionable in a conversation:

- What we sell and to whom, in the register we want the AI to use. Not "a typed layout substrate" — "we build you a website, properly, for a fraction of what a designer charges."
- **The commercial frame the AI is operating inside**, which is nowhere at all right now. DOC-4 says ~$50/month against agencies' $150–400; CHAT-20/DOC-32 have the ~$200 session and the $30–80/mo tier. The assistant currently has no idea what the client bought, what a scope band is, what "your ongoing plan" means when DOC-33 §7.5 tells it to say that, or what's free versus paid. It's being asked to enforce a boundary it can't see.
- **What the client owns and what persists** — draft versus published, that publishing is their decision, that revisions are immutable so a published site can't be silently changed. DOC-39 §3.5 names this exact example as the system-KB-appropriate version of an architecture fact.
- **What the AI is and isn't** — that there is no human behind it, that it won't come back with an answer later (DOC-33 §7.7), that direct access with no hand-off is the thing being bought (DOC-32 §2).
- The division of labour: what the client edits themselves, what to ask for (DOC-33 §7.8).

**2) Tooling — mostly solved, wrong layer for the remainder.**

The tool *inventory* is already handled twice and must not be written down a third time: layer 2 of priming projects the manual through the grant, and REQ-165's `REF-surface` projects the whole declared surface as a reference. `l1-surface.json`'s `absences` block is genuinely good and covers most of "what I can't do" — no HTML/CSS, no file upload, no new component kinds, no undo. CHAT-18's title is a warning that a hand-written version goes stale; DOC-33 §12 already forbids it.

The real gap is one level up: **capabilities, not operations.** DOC-33 §11 needs, per capability, what it does, what it requires of the page, what it obliges legally, and what it *cannot* do — and §13 calls that "the largest unresolved dependency in this document." Nothing projects it. Related and also absent: the limb map (payments/email in-page, CRM behind-page, monitoring/marketing off-site), and the honest answer when a capability doesn't exist yet — say so, park it, don't pre-build the surface.

So: the fix for item 2 isn't a system_kb doc, it's finishing REQ-165's shape one level higher — a projected capability catalogue, with a declared conversational half (what to tell a non-technical client it can't do) that DOC-33 §13 already anticipates needing.

**3)** Noted — leaving the design conversation to CHAT-21.

## What else is missing that you didn't list

- **The publishing rights rule.** DOC-38 §11 says quarantine sits at the write path and "the prompt states the constraint: form, never content," plus §5's invariant that capture-sourced assets may never be promoted into a site unless the source is republishable. That is an operational rule the AI must obey on every turn, and it currently lives only in an architecture document the AI can't read. It needs to be either in the preamble or in an authored system doc.
- **Locale obligations.** DOC-34 via DOC-33 §14 — one Act I question, from which VAT-inclusive display, Impressum, cookie consent all follow. Advisory knowledge, needed live, nowhere in the corpus.
- **DOC-39 §3.5's own "natural first set"**, none of which exists: opening with someone who has never commissioned design; talking about colour and type without jargon; what to do when a client asks for something that will look bad; how the web-design market works and what clients are comparing us to. DOC-31 has the *findings* for the last one but in the wrong voice for the wrong reader.

## Two cheap fixes worth doing regardless

The KB's own description — in `kb.ts:583` and `kb/knowledge_bases.json` — still says the corpus covers "architecture, storage model, the L1 layout substrate, the behavior-module contract, the builder application, and the development method behind them." Against today's four documents that is false in every clause, and it's the first thing a session reads. After the projections land it's roughly true for three clauses and still wrong about the development method.

And `kb/system/` needs a rebuild: the shipped awareness map describes a pre-REQ-165 corpus.

---

Proposed corpus, if this shape looks right to you:

| | Source | How |
|---|---|---|
| What we are and what you're buying | authored | new |
| What the AI is, and how the work divides | authored | new |
| What can and can't be published (rights) | authored | new — or preamble |
| Consultation craft (the §3.5 first set) | authored | new; DOC-33/35 rewritten into it |
| Locale obligations | authored, thin | derived from DOC-34 |
| Modules, L1 vocabulary, control surface | projected | REQ-165, needs rebuild |
| Capability catalogue + limits | projected | new — the §13 dependency |
| DOC-31, DOC-17 | — | demote out of system_kb; they're our research, they feed the rubric |
| DOC-35 §5 | — | remove regardless |

Want me to file this as a ticket — or split it, since the role question (§ above) genuinely blocks the authored half but not the projected half?

<!-- xgd-turn id="a9e84671-b755-466b-9856-54eb412829a7-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T19:51:24.109950+00:00" -->
#### You
ok let not make point fixes here, we need to take a step back. I think we (1) keep the ref docs, they are doing a good job (2) remove all 4 system_bk docs - they should go back to being arch or product docs  (3) lets figure out what is need and write N docs to clearly meet those needs.

So assuming we start from scratch, what do we need?

<!-- xgd-turn id="a9e84671-b755-466b-9856-54eb412829a7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T19:53:35.648638+00:00" -->
#### Claude
Starting from scratch means starting from the delivery channel, not the topic list. There are four ways a fact reaches a production session, and most of what feels like "we should document this" belongs in one of the other three:

| Channel | Carries | Written by |
|---|---|---|
| Preamble / role purpose | what is true on every turn | hand, once |
| Per-turn reminder | the two or three things that decay | hand, tiny |
| Projections | anything with a machine-readable source | generated |
| **System KB** | **everything else the AI needs *sometimes*** | **hand, for the AI** |

So a document earns a place only if it passes four tests: the AI needs it *sometimes* (else it's preamble), no source of truth can generate it (else it's a projection), it changes what the AI says next (§3.5), and it's written in the register we want back out.

That filter is what keeps the set small. Applying it, here's what is explicitly **not** a document:

- **The staged process itself** — acts, gates, what must be established before what. Nobody searches for "what stage am I in." That's role purpose, in priming. DOC-33 conflating the process spine with the consultation craft is most of why it reads as a spec rather than knowledge.
- **Tool inventory, module dials, L1 vocabulary, the absences** — projected, and working.
- **Our architecture, our economics research, our lab notebook** — stay where they are.

## The eight

**Cluster 1 — what we are** *(1 doc)*

**1. The offer.** What the client bought, what happens after this conversation, and what they own. That there is no human behind you and none coming. That their site has a private draft and a public version, and publishing is their decision. What the ongoing tier is and what it costs. What they can change themselves afterwards and what to ask you for.

*Trigger:* "so if I want to change my prices next month, do I email someone?" — which can come at any point, and today has no answer at all. This is the single largest hole and the least optional doc in the set.

**Cluster 2 — running the conversation** *(3 docs)*

**2. Who you're talking to.** Personas as *observable signals*, not taxonomy — what it means when someone opens by sending a competitor's URL, or answers every question with "whatever you think." Registers and when to shift. What "non-technical" actually looks like in practice. How to handle the client who wants to be the designer.

**3. Consultation craft.** How to open with someone who has never commissioned design. How to get a brief out of someone who doesn't have one. How to present two or three options so the choice is real. How to close a decision with someone who won't make one. How to say no well. Everything DOC-33 knows that isn't the state machine.

**4. Talking about design without our words.** How to describe colour, type, spacing and hierarchy to someone who has none of the vocabulary. What "professional", "modern", "clean", "make it pop", "not too corporate" actually mean, and what to ask to find out. The preamble already forbids naming framework concepts to the user — it gives no alternative words. This doc is that alternative, and it's the most frequently hit thing in the set.

**Cluster 3 — doing the work well** *(2 docs)*

**5. What makes a site look considered.** The operative successor to DOC-31 and DOC-17: the tells that read expensive versus template, the failure modes (too many typefaces, everything centred, the stock-photo hero, the gradient), and what to do instead. Not the research and not the notebook — the version you can act on mid-turn. DOC-31 and DOC-17 stay ours and feed it.

**6. Getting the words and the pictures.** The hardest practical problem in a real session and currently uncovered anywhere. The client has no copy — how to interview a business owner into having some, and how to write it. The client has no photographs, and `absences` says you cannot take a file from the conversation — so what you actually do: what's already registered, what you can draw, and how to ask for the rest without making it sound like homework.

**Cluster 4 — the limits** *(2 docs)*

**7. What we can and can't do for a business.** Not the module list — the product-level answer to "can you do an online shop / a booking system / a newsletter." What each capability requires of a page, what it obliges, and where the edge is ("payment for a few fixed-price things, yes; a stocked shop with variants and inventory, no"). Plus the limb map and the pattern for parking something honestly instead of pre-building a surface for it. This is DOC-33 §13's unresolved dependency.

*The drift risk is real and manageable:* this states what business problems we solve, and points at `REF-behaviors` for the dials. Product scope and module configuration move at different rates and shouldn't share a source.

**8. What may go on a published page.** DOC-38 §11's rule addressed to the AI — what the client's own material is, what a reference is, what "form, never content" means when a client says "just copy that one" — plus locale obligations: Impressum, VAT-inclusive display, cookie consent, privacy policy, and the single Act I question they all hang off. Split this into two if the legal half grows; the trigger is the same shape either way (rarely, per client, never always), which is why it's retrieval and not preamble.

Four clusters is roughly four territories, which is a healthy map at this corpus size.

## What happens to the four

DOC-33 and DOC-35 become product documents — the process specification and the persona model, which is what they are. DOC-31 goes back to research, DOC-17 stays our lab notebook. None of them is deleted or diminished; they stop being handed to the AI and start feeding the docs above.

Removing them also disposes of the DOC-35 §5 problem without a scrub: real client names in an internal product doc are fine, and it was only the shipped corpus that made them a defect.

## Two rules to hold the set honest

**For each document, name the question a session asks and the sentence the AI says differently because of it.** If you can't, don't write it. That's §3.5's "actionable" test made checkable, and it's what stops this growing back into a shelf.

**No document states a fact a projection states.** REQ-165's acceptance already asserts this by review; with eight authored docs it needs asserting in both directions.

And an authoring constraint that will feel unnatural: these get written in the voice we want the AI to use with a client — plain, warm, concrete, second person. Not spec voice, no "out of scope" sections, no ticket references. Write each section so it stands alone with its trigger in the first sentence, because chunk retrieval will hand it over without its neighbours.

## The one thing that changes this shape

Docs 2, 3 and 4 assume the consultation role exists. Today `roles.ts` has only `caretaker`, primed to make the smallest change — the opposite instinct. If it stays one role at two register settings, doc 2 absorbs the switch and the set is eight. If it becomes two roles, the process spine forks in priming and the corpus is still eight, but docs 1 and 8 are shared while 2–6 are consultant-only, which the grant should reflect.

Want me to file this — one ticket for the corpus with the eight as acceptance items, or split into "retire the four / reclassify" and "author the set"?

<!-- xgd-chat-end -->