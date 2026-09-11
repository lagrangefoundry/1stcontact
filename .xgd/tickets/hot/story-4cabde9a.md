---
uid: story-4cabde9a
id: STORY-141
type: story
title: 'Material Description: What The System Understands A File To Be'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:21:12.885489+00:00'
updated_at: '2026-09-11T04:21:12.885489+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-20802191
  story_kind: feature
  story_points: 3
---

## Story

**As a** client who hands the platform my files, **I want** the system to work out and record
what each file actually contains — and to say honestly when it cannot — **so that** I can find
my material later by what is in it rather than by remembering what I called it, and a file the
system could not read is never lost, never silently blank, and never reported back to me as an
upload that failed.

## Description

Description is the step that makes material findable at all. Every piece of material carries a
written account of itself as its body, so the corpus is one uniform body of text: a photograph
is retrieved by *"the kitchen at dusk"* through exactly the path that retrieves a positioning
paper, and there is no second retrieval route for pictures, fonts or PDFs. A weak description
is therefore not cosmetic — it is material that cannot be found.

Four kinds of file are understood in four different ways:

- **Documents that carry text** yield their own words, and a PDF's own declared title where it
  has one. A document with nothing extractable — a scan — is *stored and honestly described*,
  never refused: refusing a client's scanned brand book is by a wide margin the worse failure.
  There is no character recognition in this capability.
- **Images** are described by what they *depict*, in the ordinary words someone would type
  looking for them, by a describer the platform is configured with rather than by anything
  derived from the filename.
- **Fonts** are read from the face's own name records — family, style, the designer and often
  their own sentence about what it is for — rather than guessed at by a model, because the file
  already carries the answer. Compressed web-font wrappers, whose tables the platform cannot
  decompress, degrade honestly rather than being half-read into a confident wrong answer.
- **Anything else** is still stored and still listed, with an account of why it could not be
  read.

Every pass records exactly one of **six outcomes** and the identity of whatever produced the
description: described; no describer configured; nothing extractable; a type nothing here can
read; an image past the ceiling for looking at one; and reached-but-failed. One mechanism
rather than three special cases, so the material needing another attempt later is a *query*
over the record rather than a migration. Re-describing is out of scope here; being able to
select what would need it is not.

The contract that binds all of it: **description never fails an upload.** A describer that is
missing, refuses, or breaks costs the material its findability and nothing else — the bytes are
stored, the record is created, the client is told their file arrived, and the record says what
is missing.

**In scope**: what each kind of file yields, the six outcomes and the recorded describer, the
title each description carries, the bounded body, and the never-throws contract.

**Out of scope**, each covered by its own story: the ingestion pipeline that stores the bytes
and creates the record (STORY-140); the guard in front of material fetched on the client's
behalf; the gate in front of promoting material into a site's public asset library; the declared
field vocabulary the outcome and describer are written into; the Library surfaces that show a
description and let a client correct it; and the description of a capture bundle, which belongs
with capture ingestion.

## Technical Context

- Belongs to CAP-112 (Material Ingestion), which names description as one of its four concerns.
  STORY-140 owns the surrounding pipeline and calls into this step exactly once per created
  material; this story owns what that step produces.
- The uniform-body simplification this rests on is the reason the knowledge base never learns
  that images exist: the project knowledge base (CAP-111) indexes bodies, so the description is
  the retrieval handle for every kind of material.
- Description is the platform's concern, not the ticket store's: the store holds bytes and
  metadata, and turning a PDF into prose is product behaviour.
- The image describer is a configured seam. The intent records that the platform's own AI host
  surface is text-only today, so the image path reaches a vision model separately; the intent
  further records (2026-08-31) that this consolidates onto the AI host's own surface when that
  surface grows image content, at which point only what sits behind the seam changes. No
  acceptance criterion here asserts which model or which path is used, so that consolidation
  cannot falsify this story.
- The per-image ceiling for *looking at* an image is far below the per-file ceiling for
  *storing* one. A file between the two is kept whole and simply not looked at, which is why
  this is an outcome rather than a refusal.
- Description quality itself is not asserted anywhere: the claims are about what the platform
  does with a description and with its absence.

## Reconciliation Decisions

- **Every description carries a title, derived by the describer** (decided at reconciliation,
  2026-09-11): the intent speaks only of the description body and is silent on titles. The
  landed code always produces one — a PDF's own declared title, an image describer's opening
  line, a font's family, the first substantial line of decoded text, and the filename only as a
  last resort — and the knowledge base's enumerated landscape is built from titles, so an
  absent or filename-only title has downstream consequences the intent did not foresee.
  Formalized in the per-kind criteria and in the degraded-outcome criteria. This is
  reconciliation filling a gap in the spec, not an operator request.
- **Text-shaped documents are decoded directly** (decided at reconciliation, 2026-09-11): the
  intent's four sub-pipelines name PDFs, images, fonts and capture bundles, and say nothing
  about plain text, Markdown, JSON, XML or SVG. The landed code decodes them rather than
  marking them unreadable, which is plainly the intended spirit — the whole point of the step
  is that the body carries what the file says. Formalized as its own criterion.
- **A description body is bounded, and the bound is stated in the text** (decided at
  reconciliation, 2026-09-11): the intent is silent on any length limit. A body is re-read on
  every index pass, so an unbounded one is paid for repeatedly; and a description that simply
  stops mid-sentence reads as corruption rather than as a known limit. Formalized as its own
  criterion.
- **A capture bundle is not described here** (decided at reconciliation, 2026-09-11): the
  intent's step-3 table lists a capture bundle as a fourth sub-pipeline, while the same ticket's
  Out of Scope section defers capture ingestion entirely to its own ticket. Nothing in this
  capability creates capture material, and material of that kind reaching description yields the
  honest "nothing here can read this" outcome. No separate criterion is raised: it falls under
  the unreadable-content criterion, and the real capture description belongs with capture
  ingestion.

## Dependencies

- Plan item 7 — the ingestion pipeline (STORY-140), which is where a description is produced
  and recorded.

## Story Points

3
