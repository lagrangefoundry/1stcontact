---
uid: epic-82afdac9
id: EPIC-22
type: epic
title: 'Debug tab: per-business network configuration, and a window on each agent'
created_by: martin-github@westhead.me
created_at: '2026-09-29T22:18:44.250735+00:00'
updated_at: '2026-09-30T00:06:22.474864+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: medium
  chat_comment: comment-a8f7bcb3
  epic_children:
  - request-585f7950
---

## What this epic is for

A place in the builder where the **network** — the set of AI participants working a
business's site, and the rules they work under — can be configured and watched.

Two things belong on it:

1. **The network's configuration parameters, per business.** Today that is two
   switches: whether the consultant delegates construction to a cheaper worker
   ([[EPIC-20]]), and whether the engagement runs as a group chat with a second
   agent in the room ([[EPIC-19]] Finding 14).

2. **A window on each agent's own session.** With group chat on, the tab shows
   Alice's and Bob's *individual* chats — not the room. The room is the product
   surface; these are the two private sessions behind it.

It is a debug surface, not a product one. V1 is visible to everybody and the gate
comes later — named below so it is a deferred decision rather than an oversight.

## Why it is a tab, and a business-scoped one

Asked and settled (2026-09-29). The alternative considered was the operator console
([[REQ-297]] / [[REQ-298]]), which is already a full-surface view gated on
`ownsPlatformBusiness`, and which `builder/config.js` argues at length must not be a
tab: the strip is uniformly business-scoped ([[REQ-179]]), so a platform-wide surface
in it would sit under a business switcher that silently does not apply, and *"a
control that is present and ignored reads as a bug"*.

**That argument does not apply here, because these controls are business-scoped by
decision.** The operator's position: the network is configured per business, and a
per-business surface in a per-business strip needs no exception to REQ-179 and makes
none. The console stays what it is; this is a fifth tab beside the other four.

The consequence for [[EPIC-20]] is a real one and is this epic's to carry:
`delegation.json` states *"DEPLOYMENT-WIDE, READ AT START-UP. Per-tenant control is
deliberately out of scope"*. That sentence is superseded. The same paragraph
anticipated it — *"`workers` is a MAP rather than a pair of scalars so that adding a
scope later is an extension of this document rather than a rewrite of it"* — so the
document expected this and the deployment-wide value becomes the default a business
inherits rather than the only value there is.

## The delegate switch is one switch, and the code already makes that safe

Settled 2026-09-29, against an earlier proposal on this epic for a three-state
control. `delegation.json` carries two keys — `enabled` (are there workers) and
`primary_writes` ([[REQ-343]]: does the consultant still write now that there are) —
and the shipped values are `true` / `false`, i.e. construction is commissioned and
the consultant holds no L1 write groups at all.

There is **no product value in half-on**:

- **off** — no worker role registered, no second backend built, `delegate` absent
  from the manual, the method prose renders nothing, and the consultant holds its
  write groups again. The prompt is byte-for-byte what it was before delegation
  existed, which is what makes the switch a rollback rather than a new state to
  debug.
- **on** — the deployment's own document decides what "on" means. Today:
  commission-only.

`enabled: true, primary_writes: true` — workers available *and* the consultant keeps
its hands — is the rollback lever for [[REQ-343]], not a state anyone configures per
business. It stays a deploy-time key in `delegation.json`.

And one switch is safe rather than merely simpler: `enabled` dominates
`primary_writes` **structurally**, because the narrowing is applied at exactly the
point the delegation surface is composed. So "the consultant has lost its write
groups and has no worker to commission" stays unreachable without this epic having to
check for it.

## Runtime, not deploy-time — and the seam matters more than the decision

Asked and settled 2026-09-29. Deploy-time was considered and is not cheaper once the
switch is per-business: `delegation.json` has no business dimension, so a deploy-time
per-business switch means adding one to the document and flipping it by editing JSON
and redeploying — paying the configuration work and getting a tab of read-only text
instead of a control.

The runtime cost is small because the pattern is already established five times over.
`build(slug, opts, deps)` in `host-core.ts` already composes per site, and `fidelity`,
`images`, `pictures` and `assetUrl` are each documented as *"A PARAMETER, ASSEMBLED
BY `router.ts`"* — resolved per request, after the scope is known. Delegation becomes
the sixth, and validation is free: a per-business value feeds a document through the
existing `delegationFromMapping` / `delegationFor`, so every named start-up refusal
still applies. `delegation.ts` designed this seam and said so — *"a Worker reading the
switch from KV, or a test standing the feature up, installs its own document"*.

**`configureDelegation` is the trap and must not be the mechanism.** It installs into
a module-level global. Using it for per-business resolution would mean mutating a
global per request while feeding a manager cache keyed per store-and-site — which is
how one business comes to be served another's setting. The resolved value travels on
`deps` instead, where it cannot bleed.

**Staleness is the one genuine hazard and it is bounded.** Managers are cached on
`storeId + site` and a manager holds its backend for its whole life, so a flip is
visible on the next session rather than to a turn in flight. That is the semantics,
and the surface says so rather than implying live effect.

**Absent resolver means the bundled document**, which is this repository's ordinary
shape for a capability a host has not got — `fidelity: null`, no image credential, no
ticket store. The `1c` CLI passes no resolver and keeps reading `delegation.json`, so
it is not a host that disagrees about a value; it is a host with no per-business
override to read.

## The Flock is the UI reference for the agent windows

lagrange-framework **[[EPIC-2]]** — *AI Flock: a group chat whose members are
sessions* — is `done`, and its showcase tab (`showcase/src/flock-demo.js`) is the
shape this epic's item 2 copies: two primed members, a room they are both in, and
**each member's own chat panel beside it**.

The distinction that makes the individual windows worth having is EPIC-2 §1
observable 5, in the demo's own words: *"A member deliberates in its OWN session. Its
chat panel here shows that session and not the room's history; the room shows what it
decided to say and not what it said to itself deciding."* So Alice's window is not a
second view of the room — it is the deliberation the room does not contain.

Three findings carried from that tab, each of which cost real time upstream:

- **`@lagrangefoundry/webui-room` is a shipped upstream package** with its own
  `PUBLIC-API.md` and no build step, and it is **not vendored here** — this
  repository has chat, fields, list-detail, markdown, scroll, shell and split.
  Adoption is the goal-map pattern: vendor the source, write a host adapter. This is
  the sixth instance of [[EPIC-19]]'s standing built-upstream-and-unadopted pattern,
  after delegation, the development surface, agent/summary, the product tier and the
  card channel.
- **The room cannot tell you who is composing.** The demo polls a separate activity
  projection over each member's own junction, because *"a tab that read the room to
  decide would always read idle."*
- **A member that is working must look like it is working.** xgd's BUG-1402 was
  exactly this: the component ships the state pill and the activity strip, the host
  fed neither, and the operator read a working room as inert and retyped — which
  truncated the in-flight member's turn. The strip is a safety control, not
  decoration.

## What v1 is, and what it defers

V1 is **the tab and the delegate switch, with the backend changes that make the
switch real** — filed as the first child. Group chat cannot be switched on today:
[[EPIC-19]] §14.17 leaves the room as framework REQ-183, gated on REQ-182 and
[[REQ-283]], design note first.

The group-chat switch is therefore **not rendered in v1**, on this repository's own
doctrine rather than for tidiness. `delegation.json`: *"off means never composed —
not composed-and-refusing"*; `development.ts`: a deployment with no address composes
no surface; the console: unrendered when unentitled. A switch with nothing behind it
is present-and-refusing, which is the shape all three of those reject. The
configuration section is built to take a second entry, and the entry lands with the
room.

Also deferred, and named so neither is discovered later:

- **The gate.** V1 is visible to everybody, at the operator's request. `ownsPlatformBusiness`
  already exists and is what the console is gated on, so the eventual narrowing is
  small. What it leaves open in the meantime is that anyone who reaches the builder
  for a business can turn that business's delegation off — and [[EPIC-20]] measured
  the difference at **$0.54 against $0.046 per element write**. The builder is behind
  Cloudflare Access today and the operator is its only user, which is what makes the
  exposure acceptable for v1 rather than absent.
- **The agent windows**, which need the room.

## Children

- [[REQ-353]] — a Debug tab, and a per-business switch for delegation (v1)
