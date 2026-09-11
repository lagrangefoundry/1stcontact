---
uid: story-e07c589b
id: STORY-128
type: story
title: 'Material Types: The Vocabulary Of What A Site Is Made From, With Rights And
  Provenance Stated Rather Than Inferred'
created_by: xgd
created_at: '2026-09-02T00:29:48.930229+00:00'
updated_at: '2026-09-10T02:22:31.195900+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** client whose site is built from material I own, material I licensed, and material that
belongs to somebody else,
**I want** every piece of that material recorded as one of a small, named set of kinds, each
carrying an explicit statement of who owns it, where it came from, whether it may be published
again and whether it may leave the platform — with a record that states none of those refused
outright, and with the one thing nobody can infer on my behalf, what I wanted the file *for*,
recorded where I was asked and absent where I was not,
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

**One thing the client may say about a file, and it can only narrow.** The block also carries what
the client said the file is *for* — for the site, or for the assistant to read. It is the only
question this product asks about a file, and it is askable precisely because it is not a legal one:
a client who cannot say whether they hold rights to a photograph can say instantly whether they
meant to publish it. The case that makes it necessary is a photograph and a competitor's screenshot
— identical bytes, identical sort of file, opposite intentions — which nothing about where the
bytes came from separates. What the client said narrows what provenance already inferred and never
widens it: where nobody was asked the record simply carries no answer and the provenance reading
stands unchanged, and an answer that is neither of the two is refused rather than quietly read as
one of them, because both silent readings publish or withhold something against the client's
wishes without anyone noticing.

**How a material came to be described is part of its record, and so is the name it arrived under.**
A material's body is the readable shadow of what the file says; the record states the outcome of
producing it — drawn from a named set covering the successful case and every way it can fall short
— together with whatever produced it, a model or an extractor by name. Both are recorded so that
material worth looking at again is *selectable* rather than guessable: asking which material has no
description yet is a question about a stated field, not a pattern nobody declared. The filename
joins them on the record itself, so listing a client's material costs nothing per row beyond the
row, and a client still recognises their own file when its description came out thin.

In scope: the set of kinds a client's material may be recorded as; the rights and provenance record
carried by material and references and the refusals that enforce it; the client-supplied role that
narrows those rights; the stated outcome of describing a material and what described it; the
filename carried on the record; what a brief must state; and that conversations and attachments
share the same vocabulary so one store serves both.

Out of scope: creating any of these records — ingestion is not defined here and this story defines
only what a valid record looks like; how a description is actually produced and what each degraded
outcome means, which belongs to the describing pipeline; any surface that lists, searches or
displays them (the Library); the knowledge base and corpus predicate built over these kinds; the
assistant's conversation behaviour, which is owned elsewhere and is unchanged by this story; and
moving existing conversations into this store.

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
- **The four later fields are all optional, and that is the same rule as the body's.** A reference
  created by a capture has no description when its bundle lands and nobody was asked what it was
  for, so a record carrying none of the four is an ordinary record rather than an incomplete one.
  Requiring any of them would make the capture path invalid at the moment it is most correct.
- **What the client said it is for is not derivable from whether it may be republished.** A capture
  of the client's own previous site is republishable and yet plainly reference material, so the two
  come apart the moment captures land — which is why the role is a field rather than a reading of
  one already present.
- **What described a material is a free string, not a closed set.** The value is a model identifier
  as the provider returned it or an extractor's own name; a closed set would have to be widened for
  every model release, turning "which describer wrote this" into a schema change. The *outcome* is
  the closed set, because its whole purpose is to be selected on.
- **The filename is carried twice on purpose.** The attachment record already names the file; the
  material carries it too because listing a client's material would otherwise cost one attachment
  lookup per row, and because it is the only handle a client recognises when the description came
  out thin.
- **No contradiction between intent and code in this item.** The intent's two open questions —
  whether a reference stays its own kind, and whether a brief is a kind or a well-known record of
  another kind — are settled in the intent body itself, both in favour of a kind of its own, and the
  landed code matches. The four added fields are likewise specified in the intents that add them
  (REQ-163 names the description pair and the filename and calls all three optional; REQ-161 names
  the role and states the narrowing, the absent case and the refusal of a malformed one). Nothing
  here needs a code fix.

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

**2026-09-10 — reconciling the four fields the vocabulary gained (BUNDLE-26 / REQ-163, REQ-161).**

- **The role is stated on the rights criterion rather than given a rights criterion of its own.**
  Both intents are emphatic that inference from provenance remains the rule and that asking "do you
  own this?" stays refused; a separate criterion asserting "the client sets the rights" would read as
  a second rights model. So AC-1492 keeps the provenance rule and names the role as the one narrowing
  input, and the narrowing itself — what it does, what its absence does, what a malformed one does —
  is a criterion of its own because those three cases are the whole of the decision.
- **The absent case is a criterion, not an implementation note.** It is what keeps this a narrowing
  rather than a new gate: every caller that predates the question must behave exactly as it did.
  Nothing about a record looks wrong when that stops being true — material simply starts arriving
  withheld — so it is asserted rather than described.
- **Declaring the description pair is the criterion, not merely recording it.** The validation
  engine tolerates an undeclared field, so the pair would work undeclared; the intent's own reason
  for declaring them is that a later re-describe pass should be a query over a stated field rather
  than a predicate over a convention. The criterion is therefore written over the published
  vocabulary and the values a listing returns, because that is where "selectable" is observable.
- **The outcome vocabulary is named here and explained elsewhere.** This story states that the
  outcome is drawn from a closed, named set and that every produced description records one; what
  each degraded outcome means, and which pipeline produces it, belongs to the describing story.
  Restating the six meanings here would put the same claim in two stories and let them drift.
- **The filename's duplication is formalised rather than flagged** (decided at reconciliation,
  2026-09-10): the intent gives the reason — a list of materials must not cost an attachment lookup
  per row — but states it as a rationale. It is formalised as a criterion because the property that
  matters is observable (a listing carries the name) and the failure when the field is dropped is a
  performance regression nothing would fail on.

## Dependencies

- Plan item 1 — STORY-126 (Product Ticket Store), for the account-scoped store these records are
  created through and validated by.

## Story Points

3