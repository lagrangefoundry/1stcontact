---
uid: story-e07c589b
id: STORY-128
type: story
title: 'Material Types: The Vocabulary Of What A Site Is Made From, With Rights And
  Provenance Stated Rather Than Inferred'
created_by: xgd
created_at: '2026-09-02T00:29:48.930229+00:00'
updated_at: '2026-09-02T00:32:02.866259+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: feature
  story_points: 3
---

## Story

**As a** client whose site is built from material I own, material I licensed, and material that
belongs to somebody else,
**I want** every piece of that material recorded as one of a small, named set of kinds, each
carrying an explicit statement of who owns it, where it came from, whether it may be published
again and whether it may leave the platform — with a record that states none of those refused
outright,
**so that** the assistant building my site can tell at a glance what it is allowed to do with each
piece, a competitor's brochure is never mistaken for my own brand guide, and nothing is quietly
assumed on my behalf about material whose rights nobody ever wrote down.

## Description

The previous stories on this capability gave client material somewhere to live and somewhere to put
its bytes. This story is the vocabulary: *what a piece of material is*, and what must be true of it
before the platform will accept it.

**Three kinds, and the divisions are structural.** A piece of *material* is a single object with a
rights record — an uploaded PDF, a photo, a report the assistant fetched. One kind covers all three,
because they are one shape and differ only in what sort of file they are, which is a field rather
than a kind of its own. A *reference* is a captured bundle: many related files with a life of their
own, re-read selectively long after capture, which is why it stays a kind apart rather than being
folded into material. A *brief* is the per-site record of what was decided — a document rather than
a file, one per site rather than one per account.

**Rights and provenance are stated, never inferred, and this is the substance of the story.** Every
material and every reference carries the same block: who owns it, whether it may be republished,
whether it may be exported, where it came from, what sort of file it is, and the address it was
taken from where it has one. The block is identical on both kinds deliberately — the corpus is
queried across the two, and a field that meant something subtly different depending on which kind
answered would make every such query wrong in a way nothing reports.

**The two permission flags are required, and a default would be worse than a refusal.** Whether
material may be republished and whether it may be exported invert between a client's own site and a
third-party reference, so no rule derives either from ownership without being wrong for half the
corpus. Defaulting them to the safe answer was considered and is rejected: the failure it produces
is not a refusal anyone sees, it is a body of material silently marked unusable and
indistinguishable from material genuinely marked so. Requiring them is the only way "explicit"
means anything. They are true-or-false answers, so the text a web form would submit is refused too.

**Material that came from somewhere must say where.** Something captured or fetched has an address
it came from; something a client uploaded does not, and is not asked for one.

**A brief names its site and says something.** A site is not an account and an account may own
several, so the site is named on the record. The body is the document itself and must be present —
an empty brief is not a brief, and unlike a material there is no later extraction that fills it in.

**One store holds both halves of the platform's memory.** The same vocabulary also carries the
assistant's conversations, so a session is a ticket like any other: found by its session
identifier, with its transcript kept as a comment on it and its body left free for a maintained
summary. The conversation shapes are taken from the component that reads them back rather than
restated here, so they cannot drift from the code that depends on them; the attachment record is
taken the same way, under the name that component gives it.

In scope: the set of kinds a client's material may be recorded as; the rights and provenance record
carried by material and references and the refusals that enforce it; what a brief must state; and
that conversations and attachments share the same vocabulary so one store serves both.

Out of scope: creating any of these records — ingestion is not defined here and this story defines
only what a valid record looks like; any surface that lists, searches or displays them (the
Library); the knowledge base and corpus predicate built over these kinds; the assistant's
conversation behaviour, which is owned elsewhere and is unchanged by this story; and moving existing
conversations into this store.

## Technical Context

- **Depends on the store** (STORY-126, this capability): every refusal here is observed by asking
  the account-scoped store to create a record and watching it fail validation, so the vocabulary is
  only reachable through a store that built.
- **A different subject from CAP-89 (Site Materials & Starting Point), despite the vocabulary
  collision.** CAP-89 owns what a *site* references and where those bytes came from — its scaffold,
  its asset registry, the repository's font licences. These kinds are the *account's* source corpus
  feeding the assistant: held in the ticket store, scoped to an account, queried across, never
  rendered. Classified as a new bucket on this capability for that reason. The criteria below are
  self-contained, so if the CAP-89 owner reads the boundary differently this converts to an upgrade
  cleanly.
- **The conversation shapes are borrowed, not authored.** CAP-90 (AI Site Assistant) and CAP-91
  (Assistant Pane) own conversation behaviour and neither changes here. What this story claims is
  narrower: that the conversation shapes live in the same vocabulary as the material ones, and that
  a session consequently persists as a ticket (AC-1499). Migrating conversations that exist elsewhere
  is explicitly out of scope on the intent.
- **No lifecycle vocabulary on the three material kinds, deliberately.** The rights and provenance
  specification names six fields and no lifecycle, and a status vocabulary invented here would be a
  lifecycle nothing implements and every later story would have to honour. The component already
  ships the one lifecycle these need, and it is not a status. Stated as part of AC-1491.
- **No contradiction between intent and code in this item.** The intent's two open questions —
  whether a reference stays its own kind, and whether a brief is a kind or a well-known record of
  another kind — are settled in the intent body itself, both in favour of a kind of its own, and the
  landed code matches. Nothing here needs a code fix.

## Reconciliation Decisions

- **A material's record is valid before its text has been extracted** (decided at reconciliation,
  2026-09-01): the intent names the six rights and provenance fields but is silent on the body of a
  material or a reference. The landed code leaves it optional, because the record is created when the
  file arrives and the extracted text is written afterwards. Formalized as AC-1497, because the
  alternative reading — a record invalid until extraction ran — would make every ingestion a two-phase
  write and is not what the platform does.
- **A brief's body is required and must not be blank** (decided at reconciliation, 2026-09-01): the
  intent settles that a brief is its own kind carrying its site, and is silent on its body. The landed
  code requires a non-empty one. Formalized as the second half of AC-1496, because an empty brief is
  indistinguishable from an absent one to everything that reads it, and unlike a material there is no
  later extraction that fills it in.
- **Material may name the site it belongs to, or belong to the account at large** (decided at
  reconciliation, 2026-09-01): the intent names a site only on the brief. The landed code also lets a
  material or a reference name one, treating its absence as account-wide. Formalized as AC-1498,
  because an account may own several sites and material gathered for one is not automatically material
  for another; the landed suite does not yet exercise this field on its own, so it is stated here as
  the property it exists for.
- **How a conversation persists** (decided at reconciliation, 2026-09-01): the intent asks only that
  the conversation shapes be merged into the same vocabulary. The landed code proves the consequence —
  a session is a record found by its session identifier, its transcript is a comment on it, and its body
  is left for a summary. Formalized as AC-1499, because "merged into the pack" is a statement about a
  file and the reason the merge was wanted is that sessions can be stored; without the consequence
  asserted, the claim is unobservable.

## Dependencies

- Plan item 1 — STORY-126 (Product Ticket Store), for the account-scoped store these records are
  created through and validated by.

## Story Points

3
