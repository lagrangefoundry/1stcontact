---
uid: request-e89cbbff
id: REQ-239
type: request
title: The Settings tab, and the settings chat role
created_by: EPIC-4
created_at: '2026-09-13T21:18:15.497079+00:00'
updated_at: '2026-09-13T21:18:15.497079+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  depends_on:
  - REQ-237
  - REQ-238
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
---

## What this is

A fourth tab, two panes: the settings on the left, and on the right an assistant
with a role of its own that can reach the settings API.

## The tab

- **Rightmost in the strip**, after Site, Library and Contacts
  (`TABS`, `apps/control-app/src/builder/config.js:90`).
- **Business-scoped like every other tab**, which is why it is allowed to be a
  tab at all. [[REQ-179]] makes the strip uniformly business-scoped and keeps the
  Account surface out of it as a header modal, because the account is the one
  surface the shell's business switcher does not apply to, and *"a control that is
  present and ignored reads as a bug"*. Business name, hostname and site all
  belong to a business, so this satisfies that rule and needs no exception.
- **Blocked with the others when a grant lapses**, per `blockTabs`.
- **`fill: true`**, for the same reason the other three have it: it hosts a split,
  and a split resolves its height against the panel.
- **Its `id` is stable and its `label` is provisional**, declared in `config.js`
  and referenced from there, with a `STORAGE_KEYS` entry for the split position.
  A label string never appears as a literal anywhere else ([[REQ-115]]).

## The two panes

Left: the settings. Business name ([[REQ-237]]) and the `1stc.site` hostname
([[REQ-238]]) — what it is, and for a business that has not chosen one yet, that
it is needed before the site can go live.

Right: the assistant.

**The left pane edits the simple strings directly, and the assistant owns
anything with consequences.** [[EPIC-4]] argues Settings is *"a record-and-status
surface, not a workshop"* and that the conversational path is primary, and that
is right for the hostname — a final, public, first-come choice that deserves a
conversation. It is wrong for the business name: making somebody converse to fix
a typo in their own business name is the friction this product exists to remove.

**Both paths call the same API.** The form and the assistant's tool reach the
same operation, so the checks, the propagation and the effects report cannot
diverge between the two. A second write path with its own validation is how the
two halves of one surface end up disagreeing about what is allowed.

## The settings role

This is the project's **second role**. `roles.ts` today defines exactly one,
`CONSULTANT_ROLE`, and has always been shaped for a second — the header
anticipates *"the caretaker the ongoing tier will need"* and separates the
product-facts entry from the role text precisely so that standing one up does not
mean copying the facts and maintaining two divergent copies.

- **A new entry in `instances.json`** granting the settings surface and nothing
  else. A session is never told about a capability it was not granted, so the
  settings assistant's manual never mentions publishing a page or drawing an
  image, and it cannot propose, apologise for, or probe for one.
- **Priming carried as configuration, not code** — entries in `priming.json`, as
  [[REQ-182]] requires. The role text is what sets the register, and the register
  here is not the consultant's: a consultant forms a view and argues for it; this
  role is helping somebody through a small number of consequential, mostly
  one-time decisions, and its job is to make the consequences legible before they
  are committed to.
- **No site line.** `siteLine(slug)` is unconditional in the consultant's
  priming because a session acting on the wrong site is a failure with no signal
  to wait for. A settings session is about a business, so the framing it needs is
  which *business* it is in.

## The session is business-scoped, and that is the novel part

Everything in the host assumes a session is about a site. `sessionIdFor(slug)`
returns `` `site-${slug}` `` (`host-core.ts:427`), managers are held *"one
`SessionManager` per site"* (`host-core.ts:450`), and `registerSiteProviders`
binds a slug. A settings session is about a business — which, after [[REQ-236]],
is also the only scope under which the business name and the hostname mean
anything.

So the session id gains a business form alongside the site form, and the manager
map keys on whichever this session is. This is where the unknowns in this ticket
are; the browser work above is a few hours and this is not.

## What this ticket does not own

- **The settings operations themselves, and their prose.** [[REQ-237]] and
  [[REQ-238]] each declare their own operations, parameter descriptions and
  refusals in the surface, because the tool manual is *projected* from that
  declaration and a description that lives apart from its operation falls behind
  it. This ticket owns who is reading the manual — the role, the grant, the
  priming — and not what is in it.
- **DNS records, nameservers, registrar operations, and whether an address
  actually resolves.** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]]. Settings renders those
  verdicts; it does not compute them and does not embed a record editor.

## Falsifiers

- A settings write that reaches the store without passing through the same
  operation the assistant calls.
- A settings session that has to name a site.
- A tab label as a literal outside `config.js`.
