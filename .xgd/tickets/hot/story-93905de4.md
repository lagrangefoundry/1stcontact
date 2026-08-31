---
uid: story-93905de4
id: STORY-105
type: story
title: See everything an assistant can do to my site declared in one place, granted
  narrowly, checked before it runs, and written down call by call
created_by: xgd
created_at: '2026-08-10T09:04:59.829319+00:00'
updated_at: '2026-08-31T10:41:13.415389+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-00e77e55
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-b3b7c399
---

## Story

**As a** person whose site something other than me can change, **I want** every
operation that can describe or change my site declared once in one place, granted
to a consumer in a deliberately narrower slice, checked before any value reaches
my site, and recorded call by call — durably, wherever it ran — **so that** I can
see exactly what is on offer, be sure nothing can reach past what I allowed, and
check afterwards what was actually done.

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
- **One declaration, two runtimes** — the operations that can be performed are
  supplied partly by a portable core that names no filesystem and partly by the
  host that is actually running: an operation genuinely needing the operator's
  own disk lives with the host that has one, and is absent where there is none.
  What is declared does not change with the host. So "everything declared is
  callable" is a claim about the *composition* of the two, and comparing the
  declaration against the portable half alone would assert that a declared
  operation is unimplemented — the exact opposite of the invariant.
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
  became of it afterwards. The record is durable: it survives the host that wrote
  it, it does not lose entries when two callers are working at once, and a turn
  that was abandoned or failed still leaves what it managed to do.
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
- The storage the audit is written through — its tenancy, atomicity and byte path
  belong to the site-store capability (capability-c4c7a854). What is claimed here
  is that the record survives, not how the store makes it survive.
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
- **The audit sink is a port with two adapters, and the durability argument
  differs between them.** The host that has a filesystem appends to one file, and
  appending is atomic there. The deployed host has an object store with no append
  at all, so it writes **one object per record** under distinct keys: a
  read-modify-write of a single object would let two concurrent turns overwrite
  each other's records, and an audit that drops entries under load is worse than
  no audit, because it reads as evidence. The write is flushed while the response
  is still open and inside a `finally`, so an abandoned or failed turn still
  records what it managed to do — the isolate can be taken away the moment the
  response completes, and a background continuation is not reachable from there.
- **Divergences from the intent, recorded rather than absorbed:**
  - The intent's scope says the builder-chat grant includes publishing, with asset
    add/remove declared but not granted. What shipped withholds **both** asset
    management and publishing. The mechanism used is the intent's own — declared,
    documented and validated, but not granted — and the operator publishes from
    the builder toolbar or the command line, unchanged. The criteria therefore say
    "an operation is declared and not granted" and name asset management and
    publishing as today's instances, rather than fixing the granted set.
  - The intent names sixteen operations; the surface in the tree carries more,
    because later work in this same bundle extended the same declaration. The
    criteria here are about the declaration's discipline and are deliberately
    independent of the count.
  - Worked examples ride inside operation descriptions and the declared sequences,
    because the upstream declaration format has no field for them. Recorded in the
    intent as a residual raised upstream, not worked around with a parallel format.
- **Known upstream gaps the intent files and this story does not claim closed:** a
  refusal rendered by the upstream toolbox reports the declared class meaning and
  drops the host's own pointer into the offending value.

## Reconciliation Decisions

Decisions taken on **2026-08-31** while reconciling BUNDLE-20 (REQ-146, and the
part of REQ-149 that moved an operation between the two halves).

- **"Everything declared is callable" is restated over the composition of the
  portable core and the host's own operations.** REQ-146 split the surface's
  implementation in two so that the deployed host carries nothing needing a disk.
  The intent's evidence section records that three landed assertions compared the
  declaration against the portable half alone and so asserted a declared
  operation was unimplemented; all three were corrected to compose both halves.
  The criterion is corrected to match, and the invariant it states is unchanged.
- **The reason publishing is out of the assistant's reach changed inside this
  bundle, and the criterion is deliberately not rewritten to the new reason.**
  REQ-146 recorded publishing as unreachable because it needed a filesystem;
  REQ-149 then put revisions on the storage port, so publishing is an ordinary
  port-driven operation in the portable half and runs wherever the surface does.
  It remains unreachable from the assistant for the reason the matrix already
  states and which is the load-bearing one: **it is declared and not granted**
  (AC-1074). Nothing in AC-1074 needed to change. What *did* change is which
  operation is the standing instance of "needs the host's own disk, so it lives
  with that host" — that is now asset management alone.
- **Durability is claimed as a criterion separate from the existing per-call
  record.** What is recorded (AC-1079) and whether the record survives the host,
  a competing caller and an abandoned turn are independently observable and fail
  independently. The intent states durability as its own acceptance criterion, so
  it is carried as its own.

## Dependencies

None. (Consumed by the assistant session host, CAP-90; the authoring stories build
on this contract. The storage the audit is written through is
capability-c4c7a854.)

## Story Points

3