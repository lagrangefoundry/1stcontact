---
uid: story-93905de4
id: STORY-105
type: story
title: See everything an assistant can do to my site declared in one place, granted
  narrowly, checked before it runs, and written down call by call
created_by: xgd
created_at: '2026-08-10T09:04:59.829319+00:00'
updated_at: '2026-08-10T09:04:59.829319+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-00e77e55
  story_kind: feature
  story_points: 3
---

## Story

**As a** person whose site something other than me can change, **I want** every
operation that can describe or change my site declared once in one place, granted
to a consumer in a deliberately narrower slice, checked before any value reaches
my site, and recorded call by call, **so that** I can see exactly what is on offer,
be sure nothing can reach past what I allowed, and check afterwards what was
actually done.

## Description

This story owns the *contract* by which anything acts on a site on someone's
behalf. It is not a second way to edit a site: it is the declaration of the one
way that already exists, plus the discipline around it.

In scope:

- **The declaration** — the operations that describe or change a site, stated
  once as data: what each is for, what it takes, what comes back, and how it can
  fail. Alongside them, the error taxonomy with a caller-facing meaning per code,
  capability groups that are homogeneous in effect, worked sequences, the rule
  governing how a place on a page is addressed, declared absences, and the
  surface's own version. The declaration is checkable before anything runs.
- **The grant** — a separate statement of which capability groups a given
  consumer receives. Because it is separate, an operation can be fully declared,
  documented and validated while staying entirely out of a particular consumer's
  reach; today the builder's assistant is granted neither the management of image
  and font files nor publishing.
- **Effect, enforced** — every operation declares whether it reads or writes, and
  that classification gates independently of what is offered, so a consumer given
  only reading cannot reach a change however the operations happen to be
  implemented.
- **Validation before invocation** — arguments are checked against the
  declaration before any value reaches the site. A malformed call is refused on
  the declaration, not deep inside the write.
- **Refusal as information** — a refusal names its declared code and that code's
  caller-facing meaning (what to do about it), and leaves the draft byte-for-byte
  as it was.
- **Provenance** — site content coming back from a read is marked as third-party
  prose, because it is other people's words re-entering a model's context; the
  marking is explained to the consumer rather than left to be inferred, and a
  consumer's own change confirmations are not marked.
- **Audit** — one record per call: which operation, on which surface, with which
  effect and which arguments, allowed or refused and by which rule, and what
  became of it afterwards.
- **Self-documentation** — what a consumer is told about the surface is a
  projection of the declaration and the grant, never a document maintained beside
  them: it names every operation actually offered, the error meanings, the
  addressing rule, and the declared absences.
- **One write path, unbypassed** — a change made through this surface is the same
  validated, all-or-nothing, re-rendering write the command line and the
  click-to-edit form reach. This surface is a third caller of it and gains no way
  around it.

Out of scope:

- The conversation that consumes the surface, its transport and its persistence
  (CAP-90).
- The pane the operator watches it happen in (CAP-91).
- The write path's own validation, atomicity and re-render (CAP-86) — depended
  upon here, not redefined.
- How far the surface reaches into a page and beyond it, which the authoring
  stories build on top of this contract.

## Technical Context

- **Depends on CAP-86** (`story-37a3921b`, structured editing) for the single
  validated, atomic write path. That story already records the AI as a second
  producer of the same kind of change; this story records the declaration, grant,
  taxonomy, provenance marking and audit trail around it — none of which existed
  before, and three of which (grant narrowing, untrusted reads, per-call audit)
  the intent records as newly gained.
- **Consumed by CAP-90** (`story-a58a0974`): the assistant session host builds
  the surface for one site and one role, and its priming is a projection of what
  the grant actually offers.
- **Divergences from the intent, recorded rather than absorbed:**
  - The intent's scope says the builder-chat grant includes publishing, with asset
    add/remove declared but not granted. What shipped withholds **both** asset
    management and publishing, with the reason recorded in the tree: the upstream
    invocation path is synchronous, so an operation that awaits a published render
    cannot be hosted correctly yet. The mechanism used is the intent's own —
    declared, documented and validated, but not granted — and the operator
    publishes from the builder toolbar or the command line, unchanged. The
    criteria below therefore say "an operation is declared and not granted" and
    name asset management and publishing as today's instances, rather than fixing
    the granted set.
  - The intent names sixteen operations; the surface in the tree carries
    twenty-one, because later work in this same bundle extended the same
    declaration (its own version reads 3). The criteria here are about the
    declaration's discipline and are deliberately independent of the count.
  - Worked examples ride inside operation descriptions and the declared sequences,
    because the upstream declaration format has no field for them. Recorded in the
    intent as a residual raised upstream, not worked around with a parallel format.
- **Known upstream gaps the intent files and this story does not claim closed:** a
  refusal rendered by the upstream toolbox reports the declared class meaning and
  drops the host's own pointer into the offending value.

## Dependencies

None. (Consumed by the assistant session host, CAP-90; the authoring stories build
on this contract.)

## Story Points

3
