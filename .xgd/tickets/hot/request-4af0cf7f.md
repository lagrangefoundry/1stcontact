---
uid: request-4af0cf7f
id: REQ-200
type: request
title: 'account-chrome: Sign In and the account portal as an L2 module on any site
  with accounts'
created_by: xgd
created_at: '2026-09-06T00:02:10.761978+00:00'
updated_at: '2026-09-06T00:02:10.761978+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-134]] (lagrange-framework) for sessions.

## Sign In is not platform chrome

The obvious way to build this is to have the apex Worker paint a Sign In link in
the corner of 1st Contact's own page. That would be [[DOC-40]] §2.1 rule 1's named
failure — a capability built for the platform that every customer needs too.

A customer's site may have accounts: people who sign in, hold a portal, and have a
relationship with that business. When it does, it needs exactly the same two
controls. So they are a **feature of any 1c site that has accounts**, and 1st
Contact's own site is simply the first one.

**Not of every site.** Plenty of sites have no accounts at all, and a login link on
a brochure site is a dead end that invites confusion. The capability is therefore
present or absent per site.

## An L2 behavior module, placed in an L1 slot

The mechanism already exists. [[REQ-93]] lets an L1 page bind a module instance to
a slot in its tree, and `packages/framework/src/l2/contact-form.ts` is the
precedent — a vetted behavior module with a slot preset registered by behavior id
in `l2/presets.ts`.

`account-chrome` becomes the second such module. That it is a module rather than
Worker-painted chrome is what buys what you asked for: **L1 decides where it goes
and what it looks like.** Placement is a slot; styling is the L1 tree in that slot;
and a site that wants the portal icon in the footer and the Sign In link in the
header can have that, because they are slots and not a fixed corner.

It ships a preset, so a site can instantiate it without authoring any L1.

## Two states, and what is in each

**Signed out** — a Sign In control. Activating it opens a modal asking for an email
address, which posts to the issue endpoint and then says *check your email for a
sign-in link*. That message is shown **whether or not the address was known**
([[REQ-134]]): the response must not reveal who is on the list. Today an unknown
address silently sends nothing; self-signup is a later decision.

**Signed in** — an account portal control, linking to that site's portal.

**And a link into the builder when, and only when, the signed-in person operates at
least one business.** This is the "My Businesses" control, and it is written as a
general rule rather than a platform special case on purpose: *operates a business*
is a fact about the person (`memberships`), not about the site they are looking at.
It happens to be true of one person today. An agency customer would see it too, and
would be right to.

**Falsifier:** a branch anywhere in this module on which site or which business it
is being rendered for.

## Enabled by declaration, never derived

Whether a site has accounts is a property the site declares. It must **not** be
derived from "does this business have any members yet", because the first member
signs up by using the Sign In control — derivation would hide it exactly when it is
needed and produce a site that can never acquire its first account.

## Sessions do not cross a cookie domain, and nothing may assume they do

[[REQ-134]] makes the session cookie's `Domain` host configuration, and that
constraint is load-bearing here rather than incidental.

`1stcontact.io` and `app.1stcontact.io` share a session because a cookie on
`.1stcontact.io` reaches both. A customer site on `alicesplumbing.com` **cannot
read that cookie and never will** — cross-site cookies are not available and should
not be wanted. So a site on its own domain has its own session, scoped to that
domain, and a person signed in to one is not thereby signed in to another.

This is correct rather than a limitation: two businesses' sites sharing a login
would be exactly the cross-tenant reach the tenancy model exists to prevent. What
matters is that nothing is built on the assumption of one global session.

**Falsifier:** any code that reads a session without reference to the domain it was
issued for.

## `public-site` becomes session-aware, and only that

`apps/public-site/src/index.ts` states *"There is no authentication, and published
sites are public by definition."* This amends that sentence, and the amendment is
deliberately narrow: the Worker reads a session cookie **to choose which of the two
states to render**, and for nothing else. Published content stays public and
unauthenticated; no page becomes gated, and no content varies by who is looking.

Caching follows from that: the module's rendered output depends on a cookie, so the
response carrying it cannot be served from the shared edge cache the way an
anonymous page is.

## The 1st Contact apex becomes a published site

`APEX_BODY = 'Hello from 1stcontact.io'` is replaced by a real published 1c site in
the `1stcontact` tenant, using this module — which is the dogfooding claim made
concrete: the platform's own front page is built the way a customer's is.

Its copy is deliberately minimal; the site is in stealth and has nothing to
announce. What it must have is the module, correctly placed.

## What this does not do

- no self-signup — an unknown address sends nothing
- no gated content, no per-viewer content
- no password, no OAuth, no second factor
- no portal itself; `/account` already exists
- no marketing copy beyond a placeholder

## Acceptance

- an `account-chrome` L2 behavior module exists alongside `contact-form`, is
  registered in `l2/presets.ts`, and ships a slot preset
- it can be bound to an L1 slot, and two sites can place it in different slots with
  different styling and both render correctly
- a site declares whether it has accounts; the module is absent when it does not
- the enabled state is declared and is not derived from whether any member exists
- signed out, it renders a Sign In control that opens an address modal and then
  reports *check your email*, identically for a known and an unknown address
- signed in, it renders an account portal control
- signed in, it renders a builder link when the person operates at least one
  business and does not when they operate none
- the module contains no branch on which site or business it renders for
- a session issued for one cookie domain does not authenticate a request on another
- `public-site` reads the session only to select the rendered state; no published
  content becomes gated
- a response whose content depends on a session is not served from the shared edge
  cache
- `1stcontact.io` serves a published site from the `1stcontact` tenant carrying this
  module, and `APEX_BODY` is gone
