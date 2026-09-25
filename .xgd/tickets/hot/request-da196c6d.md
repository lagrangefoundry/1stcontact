---
uid: request-da196c6d
id: REQ-310
type: request
title: The system KB has two corpus producers and only one goes through the ticket
  store
created_by: EPIC-21
created_at: '2026-09-23T03:18:06.625158+00:00'
updated_at: '2026-09-25T01:07:49.715305+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2e0ecc50
---

## The gap

The system knowledge base has **two corpus producers, and only one goes through the
ticket store**.

`exportCorpus()` (`tools/generate/src/cli/kb.ts:353`) derives documents from doc tickets:
`readDocTickets()` shells `xgd ticket list --type doc --view --json --no-limit`, keeps the
ones whose `fields.doc_kind` is `system_kb`, and writes `kb/system/<ID>.md`. That is the
intended model and it works.

`writeProjections()` (REQ-165, `kb-projection.ts`) is the second producer. It derives
`REF-l1`, `REF-surface` and `REF-behaviors` from code — the behavior catalogue, the L1
schemas, `ai/l1-surface.json` — and writes them **straight into `kb/system/` with no
ticket at all**, sweeping its own filename namespace so the two producers cannot delete
each other's output.

The consequence is already documented in the code, as a deliberate choice rather than a
known defect — `index.ts:1367`:

> Named rather than counted, for the reason the skip list is: a projection has no ticket,
> so an operator who cannot find `REF-l1` in the ticket store needs to be told it was
> generated, not looked for.

## Why it matters

**The system KB should be doc tickets of kind `system_kb`, without exception.** Operator
direction, 2026-09-22. Populating a KB from documents rather than tickets is the older
model and is retired for 1st Contact. (It remains live in `xgd` itself — that change has
not propagated that far — so this ticket is about 1c's corpus, not xgd's.)

Three costs of the current split:

1. **A corpus member that cannot be inspected or referenced as a ticket.** The xgd
   artificer works through the ticket store; three of the system KB's documents are
   invisible to it.
2. **Two producers, two sweep rules, one directory.** The namespace partition exists
   solely to keep them from destroying each other's files — complexity that a single
   producer would not need.
3. **The rule reads as settled policy and gets cited as such.** It was cited during
   EPIC-21 as the reason the font catalogue should *not* be ticket-backed, which was the
   wrong answer.

## Wanted

`REF-l1`, `REF-surface` and `REF-behaviors` become doc tickets of kind `system_kb` like
every other corpus member, with `exportCorpus()` the single producer.

The projection property must survive the move. These documents are generated from code and
must not become hand-maintained prose that drifts from the schemas it describes — that is
precisely what `kb-projection.ts` argues at length and it is still right. So the generator
keeps running; what changes is its **sink**: it writes the ticket body rather than the
corpus file, and export carries it to `kb/system/` by the ordinary path.

Consequences to settle in design:

- How a generated ticket body is marked so nobody hand-edits it (`fields.projected: true`
  already exists on the frontmatter and may be the whole answer).
- Whether regeneration updates the ticket on every `1c kb export`, or on an explicit verb.
- Retiring the projected-namespace sweep and the two-producer partition once the second
  producer no longer writes corpus files.

## Not in scope

The `project` KB, which is a different source (tenant D1) and a different landscape.


## Decision — 2026-09-25: not needed, generated documentation stays ticketless

Operator: *"I'm ok with automatically generated documentation — I think there is nothing here
that is needed."* The projected reference stays as it is. `writeProjections()` keeps writing
`REF-l1`, `REF-surface` and `REF-behaviors` straight into `kb/system/`, with no ticket, and the
two-producer namespace partition in `exportCorpus()` stays with it.

This reverses the 2026-09-22 direction recorded in [[EPIC-21]]'s decision log ("the projection
convention is the defect, not the exception"), which is what filed this ticket. The rule that
stands instead is EPIC-21's *earlier* one: a projection is paired with an authored doc ticket
(`REF-l1` with [[DOC-23]]) rather than being one.

Investigated before the reversal, and worth keeping because it is what any future attempt has to
handle:

- The move itself is small and mostly deletion — `writeProjections()`, `projectedDocument()`,
  `corpusMembership()`, `isProjected()`/`PROJECTED_PREFIX`, the sweep exception in
  `exportCorpus()`, and `KbStatus.projected`. `1c fonts doc` ([[REQ-311]], `font-doc.ts`) is a
  working precedent for the ticket sink: resolve the target by `fields.source`, write with
  `xgd ticket update --body-file -`, compare bodies with trailing whitespace normalised because
  the store strips it on write.
- `ProjectedDoc.source` cannot serve as the resolver key. `REF-surface` declares
  "the declared control surface (version 14)" — prose carrying the version, so a surface bump
  would orphan the ticket. A stable key (the source path) and the reader-facing prose are two
  different values.
- `REF-surface`'s title is derived from `l1-surface.json`'s own title, so a ticket owning the
  title stops that propagating unless the generator writes `--title` too.
- The generator would have to run somewhere, and `xgd ticket update` auto-commits — so a build
  (`bin/kb-release`) would produce ticket-store commits where today it only writes gitignored
  output under `kb/system/`.
- Nothing reads `fields.projected`; it is frontmatter documentation, not a mechanism.

Three doc tickets (DOC-57/58/59) were created during the investigation to receive the projected
bodies and have been archived. [[DOC-56]] still carries `fields.projected: false` while being
projected by `1c fonts doc` — a one-field inaccuracy, unrelated to this decision.
