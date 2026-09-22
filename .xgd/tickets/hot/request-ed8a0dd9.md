---
uid: request-ed8a0dd9
id: REQ-295
type: request
title: Delegate construction to a cheaper worker, behind a switch
created_by: EPIC-20
created_at: '2026-09-21T23:11:05.910693+00:00'
updated_at: '2026-09-22T20:09:07.747050+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c5518a8b
  commits:
  - working_sha: 78e6a5463ba9a1006e8f886cbf837dd480c0221f
    reconcile_sha: null
    main_sha: null
  - working_sha: a401e917c2e6b86f1872e85d181abc03fb01f365
    reconcile_sha: null
    main_sha: null
  version: 0.2.316
  story_points: 8
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


## The shipped default is off

`delegation.json` ships with the feature **disabled**, and that is a property of
this ticket rather than of whoever deploys it. Two reasons, and the second is
the urgent one:

- **Nothing may be enabled before there is a baseline.** The saving this exists
  to produce is unobservable until REQ-292 and REQ-293 are reconciled and a
  period of records exists to compare against.
- **A worker's context window is smaller than the caller's.** `claude-haiku-4-5`
  carries 200k against `claude-opus-5`'s 1M, and the measured Lagrange Foundry
  build already reached roughly 300k tokens resident. **REQ-296** declares
  `contextWindow` per backend entry and adds the host-side guard that ends a
  turn before the provider errors. Until that lands, a worker opened on the
  smaller window is a session with nothing between it and an overflow.

So this ticket may be **built and merged** in full ahead of REQ-296 — the switch
is what makes that safe. What it may not do is ship enabled, and a deployment
that turns it on before REQ-296 is a deployment that has skipped the guard.

## One file this shares with REQ-296

Both tickets edit `backends.json`: this one adds the worker's entry naming
`claude-haiku-4-5`, REQ-296 adds a `contextWindow` key to every entry. They do
not conflict in substance, but whichever lands second is responsible for the
worker entry carrying **both** — a worker backend without a declared window is
exactly the case REQ-296's guard cannot protect, and it would read as
configured rather than as missed.


## What it turned out to take

The shape above held. Four things it implies were not named in it, and each is
load-bearing enough that a reader of this ticket should not have to find it in
the diff.

### The worker's rates, not just its model

"A second entry in `backends.json`" implies a second entry in `prices.json`,
because condition 7 ends in **REQ-293's split by model** and a split by model is
priced by the name that actually ran. `prices.json` is keyed provider-then-model
and a lookup that fell back to the `claude` family would price a worker's Haiku
tokens at Opus rates — a confidently wrong figure, which is the one thing that
file exists to avoid. So `claude_builder` is keyed there as itself.

### `l1SurfaceSet`, extracted rather than reused

The ticket expected "an argument change rather than a refactor", on the grounds
that `createL1Toolbox` already takes `role` and `config`. That is true of the
inputs and wrong about the output: the delegation surface builds each worker's
Toolbox **itself** — which is exactly what makes "the worker's authority is its
role's grant" a framework floor rather than this host's discipline — so what the
host must supply is a list of surfaces and a grant, not a finished Toolbox.

`createL1Toolbox`'s body is therefore split in two: `l1SurfaceSet` does the
assembly and `createL1Toolbox` becomes the one-line Toolbox construction on top
of it. Every existing caller is unchanged. Writing a second assembly for the
worker was the alternative, and it is how the travelling-grant merge, the
appended manual and the narrowing-to-what-was-composed would have come to
disagree — with a worker holding authority nobody granted it as the symptom.

Each role gets its **own** call: a Toolbox binds each surface to the grant it
was constructed with, so handing the consultant's L1 instance to a worker would
re-bind it to the worker's narrower grant and quietly take capabilities off the
consultant.

### Two start-up checks, not one

Condition 9 asks for a worker bound to an undeclared backend to fail at
start-up. The same argument applies to a worker role bound to a role **this host
cannot build** — it would otherwise surface as a runtime `unknown_role` refusal
at the first delegation, which is the same configuration mistake discovered in
the same customer's conversation. Both are checked, both name the offending key,
and both are checked **even with the switch off**, so that flipping it is a
decision rather than an experiment.

### Attribution is read off the junction, and the audit sink is set past the API

Condition 7's "on every exit path" is satisfiable only from the junction. The
manager takes a turn's attributions, clears them, and writes them onto the
`turn_end` record it appends from its own `finally` — durable for the worker
that failed, the worker that was stopped, and the turn the client walked away
from. They are **not** on the terminal event, which carries the turn's own
spend. So the caller reads the last `turn_end`, and only where the delegation
surface was composed at all. Both sources are named in that order, so the day
upstream puts `attributed` on the terminal event this needs no change.

Condition 8 costs one line that reaches past the framework's API: the worker's
Toolbox is constructed by the delegation surface, and `Toolbox` takes its audit
sink at construction, which the surface does not pass on. The attribution itself
is already correct — the surface builds the worker's Toolbox with its own
session id and role — so the host supplies the sink and nothing else. The
upstream fix is one option on `WorkerConfig`; until it exists this is the honest
shape, and it is one line so it is cheap to delete.

### One property worth naming: the worker's prefix is cacheable

Every worker this deployment opens sends an **identical** stable prefix — the
builder's prose plus its own projected manual. Which site it is on and what is
currently on that site are volatile and ride the reminder tier. A worker lives
one turn, so nothing is lost by delivering them there, and putting them in the
prefix would give every delegation a prefix of its own — which on a lever whose
whole purpose is cost would be the saving spent on itself.

## Evidence

Two suites, 23 cases, named for the conditions above.

- `tests/test_UAT_FC_REQ-295_delegation_config.test.ts` (16) — the switch as a
  document: it ships off, a worker bound to an undeclared backend or an
  unbuildable role is refused by name, a malformed one is refused at the key
  that is wrong; the worker's model, ceiling and rates; the builder grant being
  the construction half and taking nothing from the consultant; the builder role
  loading with its own prose and providers and reusing none of the other roles'
  entries; the method entry rendering nothing with the switch off and the
  shipped words with it on.
- `tests/test_UAT_FC_REQ-295_delegation.workers.test.ts` (7) — the wire, through
  the real `/api/ai/prompt` endpoint with the provider scripted at the boundary:
  conditions 1 and 2 on the tools actually offered; 3, 5 and 6 on the worker's
  first request — the configured model and ceiling, the builder's prose, a grant
  that is a subset of the caller's plus `report` and no `delegate`; 4 on what
  comes back; 7 twice, once for a worker that reported and once for a worker
  that never did; 8 on the audited session id.

Three existing cases moved, none weakened. `REQ-174` and `REQ-239` each asserted
`Object.keys(L1_INSTANCES)` **equals** `[consultant]` — incidental to both
claims, which are that the renamed key is present and the old one absent
(REQ-174) and that the settings role is *not* there (REQ-239); both now assert
that directly. `REQ-182`'s corpus-free order now names `delegation.method`
alongside `site.manual`; its claim is that every name the order declares is one
`registerSiteProviders` binds, and the new one is bound unconditionally — which
is what lets the switch decide what it *renders* rather than whether the role
loads at all.

## Verification

Typecheck clean. Full suite in the branch worktree: 19 failures, against a
**22-failure baseline on clean `xgd-working`** — the branch's failing set is a
subset of the baseline's, plus `BUG-134_copy_two_ends`, which fails identically
at the pre-change commit in the same worktree (it shells out to
`bin/copy-to-cloud` and is a worktree-location artifact). No regression is
attributable to this change.

Two of the baseline failures are worth naming because they sit in this ticket's
own area and are **upstream drift, not this work**: `BUG-67` now sees
`backendSettings('claude')` carry a framework-defaulted `contextWindow` and sees
`configureBackends` accept an undeclared provider name. Both fail the same way
on clean `xgd-working`.

## On the file shared with REQ-296

This lands **first**: no entry in `backends.json` declares `contextWindow`, and
the value `BUG-67` observes is the framework's own default rather than this
repository's. So REQ-296 is the one landing second, and the responsibility that
ticket carries is to give **both** entries a declared window — the worker's
included, since a worker backend without one is exactly the case its guard
cannot protect.

The switch ships **off**, so nothing here is enabled ahead of REQ-296 or ahead
of a REQ-292/REQ-293 baseline.