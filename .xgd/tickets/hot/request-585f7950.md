---
uid: request-585f7950
id: REQ-353
type: request
title: A Debug tab, and a per-business switch for delegation
created_by: EPIC-22
created_at: '2026-09-30T00:06:06.120891+00:00'
updated_at: '2026-09-30T01:05:35.276259+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  epic_parent: epic-82afdac9
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-52d87346
---

## What this is

The first child of [[EPIC-22]]: a **Debug tab** in the builder, and on it one
working control — **whether this business's consultant delegates construction to a
cheaper worker**. The tab is the frame the rest of the epic hangs off; the switch is
the thing that makes it more than chrome.

The epic carries the reasoning. This ticket is the behaviour.

## The tab

A fifth tab in the builder's strip, labelled **Debug**, declared in
`builder/config.js` beside the four that are there and added to `TABS`.

- **It is business-scoped like the other four**, which is what lets it be a tab at
  all ([[REQ-179]]): everything on it is about whichever business the switcher above
  has open, so the strip stays uniformly business-scoped and needs no exception.
- **It is rightmost.** `SETTINGS_TAB`'s own comment claims that position and gives a
  reason — *"the three tabs before it are the work; this is the record of who the
  work is for"*. That claim is amended rather than contradicted: Debug goes after
  Settings because it is not part of the product at all, and is the one tab expected
  to be taken away from most people. The comment is updated to say so, so the next
  reader does not find two tabs each documented as last.
- **It is visible to everybody in this version**, deliberately and temporarily. No
  entitlement check, no `ownsPlatformBusiness` gate. The epic records what that
  leaves open and why it is acceptable for now.
- **It renders a "Network configuration" section** holding the one control below.
  The section is the shape a second switch is added to, and it holds exactly one
  entry today because there is exactly one thing to switch — group chat has nothing
  behind it yet and is not rendered.

## The switch

One control: **delegate tool calls, on or off, for the business in scope.**

- **It shows what is actually in force** for that business when the tab opens — the
  business's own stored value where it has one, and otherwise the value this
  deployment's `delegation.json` carries. It is never a control rendered from a
  default it did not read.
- **A business that has never been touched behaves exactly as it does today.** No
  stored value means the deployment's document, so shipping this changes no
  business's behaviour until somebody moves a switch.
- **Off means the delegation surface is never composed for that business** — not
  composed-and-refusing. No worker role registered, no second backend built,
  `delegate` absent from the consultant's manual, the method prose rendering nothing,
  and the consultant holding its L1 write groups again. That is the existing
  structural absence ([[REQ-295]]), reached per business instead of per deployment.
- **On means what this deployment means by on.** Today that is [[REQ-343]]'s shipped
  arrangement — `primary_writes: false`, so construction is commissioned and the
  consultant writes nothing itself. This switch does not expose `primary_writes` and
  does not let a business set it; `enabled` continues to dominate it, structurally,
  at the point the surface is composed.
- **It takes effect on that business's next session, not on a turn in flight**, and
  the surface says so in words rather than leaving the operator to infer it. A
  manager holds its backend for its whole life, so a turn already running keeps the
  arrangement it was composed with.
- **Two businesses served by one isolate never see each other's value.** The
  resolved setting reaches the host as a parameter on `deps`, assembled per request
  once the scope is known — the arrangement `fidelity`, `images`, `pictures` and
  `assetUrl` already have. It is **not** installed through `configureDelegation`,
  which writes a module-level global and would feed a manager cache keyed per
  store-and-site from a value that changed under it.
- **A stored value is validated the way the bundled document is.** It becomes a
  delegation document and goes through the existing `delegationFromMapping` /
  `delegationFor`, so a malformed or unresolvable value is refused by name at the
  point the host is built rather than at the first delegation in a customer's
  conversation.
- **A host with no resolver reads the bundled document.** The `1c` CLI passes none
  and keeps behaving exactly as it does today. That is this repository's ordinary
  shape for a capability a host has not got, not a divergence between two hosts about
  one value.

## Where the value lives

Per business, in D1, in a new table of its own with a new migration.

- **Per column, not one blob**, so the next switch is a column rather than a parse,
  and so a business can hold an opinion about delegation while inheriting everything
  else.
- **NULL means inherit**, which is what makes the untouched business above
  indistinguishable from today.
- **It survives a redeploy and an isolate recycle**, which is the whole reason it is
  not a variable.
- One row per business, written by the switch, read when the host is built.

## What this deliberately does not do

- **No group-chat switch.** The room is framework REQ-183, gated, design-note-first
  ([[EPIC-19]] §14.17), so there is nothing behind the flag. A rendered switch that
  cannot be moved is present-and-refusing, which `delegation.json`,
  `development.ts` and the operator console each reject in their own words. The
  section takes a second entry when the room exists.
- **No agent windows.** Alice's and Bob's individual sessions are the epic's second
  item and need the room.
- **No entitlement gate**, per the epic.
- **No change to `primary_writes`, to `backends.json`, or to what a worker may do.**
- **No per-business `workers` map.** A business chooses whether it delegates, not
  which model it delegates to; the worker's backend stays a deployment fact.

## Observably true when this is done

1. The builder shows five tabs, and the fifth is Debug.
2. Opening Debug on a business shows a network configuration section with a
   delegation control reflecting that business's effective setting.
3. With no stored value, the control reflects `delegation.json` and the host composes
   exactly what it composes today.
4. Turning it off and opening a new session for that business yields a consultant
   with no `delegate` operation, no worker backend, and its write groups restored.
5. Turning it on again restores the deployment's arrangement.
6. A second business, untouched, is unaffected by either flip.
7. A malformed stored value is refused by name when the host is built, naming the
   business and the offending key.
8. The `1c` CLI's behaviour is unchanged by anything in this ticket.