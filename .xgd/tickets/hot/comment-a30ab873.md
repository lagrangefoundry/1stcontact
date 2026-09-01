---
uid: comment-a30ab873
id: COMMENT-2022
type: comment
title: Comment on chat CHAT-32
created_by: xgd
created_at: '2026-09-01T18:40:16.058476+00:00'
updated_at: '2026-09-01T19:51:24.214873+00:00'
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

<!-- xgd-chat-end -->