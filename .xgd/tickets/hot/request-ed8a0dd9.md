---
uid: request-ed8a0dd9
id: REQ-295
type: request
title: Delegate construction to a cheaper worker, behind a switch
created_by: EPIC-20
created_at: '2026-09-21T23:11:05.910693+00:00'
updated_at: '2026-09-21T23:11:05.910693+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c5518a8b
---

## Why

The builder's consultant runs on `claude-opus-5` at $5/$25 with thinking on by
default (BUG-67). That is the right model for judgement — what the thing is,
what it means, which direction to take — and the wrong one for the mechanical
majority of the work, where the payload is large and the decisions are small.

On the measured Lagrange Foundry build (EPIC-20), construction dominated: 140
`set_l1`, 127 `get_l1`, 110 `list_changes`, 71 `screenshot`, 26 `describe_page`.
Modelling puts delegation of that work to Haiku 4.5 at roughly **half** the
session's cost — the largest single lever in the epic, and larger than every
configuration change combined. That figure is a model and the models in this
epic have been wrong by 4.5× and 2.4×; REQ-292 and REQ-293 exist to replace it
with a measurement, and this ticket is what gives them something to measure.

## What is already in place

Verified against the installed shared store, not the framework source:
`node_modules/@lagrangefoundry/ai/src/delegation_toolbox.js` is present and
`delegationInstanceConfig` is exported from `core.js`.

- The surface (lagrange-framework REQ-148): `delegate` and `report`,
  `DelegationRuntime`, `WorkerConfig`, the one-level floor, the spend roll-up.
- `createL1Toolbox` already takes `role`, `config`, `extraSurfaces`, `session`
  and `audit`, so a second role's toolbox is an argument change rather than a
  refactor.
- A second role already exists end to end — `settings` (REQ-239) — with its own
  prose, priming config, reminders, manager and backend name. This follows it.
- `backends.json` is the seam for naming a second model (BUG-49 / BUG-67).
- REQ-292's record already holds `attributed`, so a worker's spend rolls into
  the caller's row without a schema change.

## What this ticket does

### The consultant keeps everything it has today

The delegation grant is **additive**. `delegationInstanceConfig(['builder'])`
composes beside the consultant's existing `l1` and `fidelity` entries and
removes nothing: the consultant can still author a page itself, and delegating
is a decision it makes per piece of work rather than a capability it lost.

This is a deliberate choice between two designs and the other one is not taken
here. Narrowing the consultant's own grant — moving ReadSite, AuthorPages,
ManageComponents, MeasureDrawings, DrawImages and SeeSite to the worker and
leaving the consultant ManagePages, WriteConfig and ManagePalette — would make
delegation compulsory for construction and guarantee the saving. It is held in
reserve, because **the risk of the additive design is real and worth measuring
rather than arguing about**: the model does not see the bill and has no
incentive to hand work away, so the whole lever rests on the method prose. What
fraction of spend actually moves is exactly what REQ-293's split by model
reports. If it is low, the lever is prose, and if prose cannot fix it the
narrowed grant is the answer — but that is a decision for data.

### A `builder` role

A role of its own, with its own prose and its own grant: ReadSite, AuthorPages,
ManageComponents, MeasureDrawings, DrawImages from `l1`, and SeeSite from
`fidelity`. Its priming is assembled by the normal path — the framework opens
the worker with `manager.createSession(role, …)`, so the worker reads the
builder's prose and never the consultant's.

The prose is small but not optional. Tool schemas tell a worker what it may
call; they do not tell it what this product considers finished, what house
constraints it cannot infer, or what to do when the brief and the site disagree.
That text is written once, sits in a prefix stable across every delegation, and
is the thing that decides whether the work comes back usable.

### A switch, and what "off" means

A new `delegation.json` beside `backends.json` and `instances.json`, holding
whether the feature is on and which backend each worker role runs on.

**Not a key in `backends.json`.** That file's keys are the framework's schema,
validated at start-up by `configureBackends`, which rejects anything it does not
declare — a non-backend key there would fail the very validation that file
exists to pass.

**Off means the surface is never composed, not that `delegate` refuses.** This
is the pattern this codebase already applies to a missing browser, a missing
image credential and a missing ticket store: *absent rather than
present-and-throwing, so the manual never mentions it and the model cannot
propose an operation it has not got.* A deployment with delegation off must be
indistinguishable from this repository today — same tools offered, same prompt,
same behaviour — so that turning it off is a true rollback and not a new state
to debug.

Deployment-wide, read at start-up. Per-tenant is **out of scope**, but the
config is shaped as a map so adding a scope later is an extension rather than a
rewrite.

### The worker's backend

A second entry in `backends.json` naming `claude-haiku-4-5` and its own ceiling.
`delegation.json` binds the `builder` role to that entry by name. The framework
registers the adapter under a derived per-session name but builds it with the
*configured* name, so the model and the ceiling come from the entry rather than
from the derived one.

### The wiring

A `DelegationRuntime` composed into the consultant's toolbox, with a
`workers.builder.build` closure that constructs a `ClaudeAPIBackend` around a
builder toolbox. This is the only genuinely new code and it is small, because
`createL1Toolbox` already takes the role and the grant as arguments.

### The consultant's method prose

When to hand work over, and — load-bearing — how to write `accept`. The
surface's own overview states the failure mode: *"If you re-inspect everything
the worker did, the tokens have been moved rather than saved — and moved to the
more expensive side."* A run where every check passed should cost the consultant
a short summary and nothing else.

## What must be true when this is done

1. **With the switch off**, the consultant offers no `delegate` tool, and the
   tools and prompt it sends are unchanged from this repository today.
2. **With the switch on**, the consultant offers `delegate` **in addition to**
   every tool it offers with the switch off — nothing is withdrawn.
3. A delegated piece of work opens a worker session on the configured backend,
   runs the worker's own tool loop, and returns a summary, what changed, the
   decisions recorded and a verdict per requested check.
4. The worker's turn-by-turn conversation does not enter the caller's context.
5. The worker's capabilities are the **builder role's** grant and nothing else:
   a brief asking for something the role cannot do produces a refusal, not a
   wider worker.
6. A worker cannot delegate again.
7. **The worker's spend is attributed to the caller's turn on every exit path**,
   including a worker that failed, was stopped, or never reported — a delegation
   whose spend vanished because the work went wrong would be the one accounting
   hole this could introduce. It lands in REQ-292's `attributed` and appears in
   REQ-293's split by model.
8. The worker's tool calls are audited under the worker's own session id, so an
   auditor can tell which side of a delegation made a change.
9. A misconfigured `delegation.json` — a worker role bound to a backend
   `backends.json` does not declare — fails at start-up naming the offending
   key, rather than at the first delegation.

## Not in scope

Per-tenant or per-plan control of the switch. Narrowing the consultant's own
grant — held in reserve, pending REQ-293's measurement. Any change to
`backends.json`'s schema. Effort levels, which are a separate lever in EPIC-20
and touch the caller rather than the worker.

## Sequence

This should land **after** REQ-292 and REQ-293 are reconciled and a week of
records exists, so that the before and after are measured on the same
instrument. Building it earlier is acceptable; enabling the switch before there
is a baseline is not, because the saving it exists to produce would then be
unobservable.