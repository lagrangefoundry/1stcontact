---
uid: request-a0910456
id: REQ-243
type: request
title: A capture form chooses the email it sends
created_by: EPIC-10
created_at: '2026-09-13T22:02:21.394972+00:00'
updated_at: '2026-09-13T22:03:19.908065+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  depends_on:
  - request-41a9dc90
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
---

# A capture form chooses the email it sends

A form says which message goes out when somebody submits it — a delivery, a welcome, or
nothing — instead of the one message the one hardcoded template happens to be.

## 1. What is true today

**One template, and it fires only on an asset.** `captureLead` renders `ASSET_TEMPLATE`
(`'asset'`) and does so only when the form declared both an asset key and an asset URL.
A form with no asset sends nothing at all — which is why the 1st Contact beta form, whose
whole deliverable is a place on a list, mails nobody.

**The key set is deliberately closed.** `TEMPLATE_KEYS = ['invite', 'signin', 'lapsed',
'asset']`, and `templates.ts` gives the reason: *"an open vocabulary would let a template
be authored under `sign-in` while the sender asks for `signin`, and the two would never
meet. The failure of a closed set is a refusal at authoring time; the failure of an open
one is a send that finds nothing at the moment somebody is waiting for mail."*

That reasoning is right and the constraint is wrong for this case: two forms on one site
plainly want different mail, and a closed set cannot express per-form copy.

## 2. The change: the set opens, and the check moves to publish

A form names the template it sends. The vocabulary stops being a fixed list and becomes
whatever templates the business has authored — and `templates.ts`'s failure mode is
answered by **validating at publish** that every template a form names exists in that
business's store.

That keeps the property the closed set was protecting. A typo is still a refusal at
authoring time rather than a send that finds nothing; what changes is that the refusal
comes from the store's actual contents instead of from a literal in the source. The system
keys keep their meaning — `invite` and `signin` remain what the identity flows send — and
are simply no longer the only ones.

**A form may also name no template**, which is capture with no mail, and is what a form
that only joins a mailing list should do.

## 3. Which tokens a capture template may use

`renderCopy` already refuses a template whose declared placeholders are not all satisfied,
and that refusal is the thing keeping a dead button out of a mail. A capture template's
tokens are the ones the capture path can supply: the gated page's link, and what the form
calls the artifacts it promised.

**`{{cta_url}}` for a capture form is the gated page** — the per-contact link from
[[REQ-244]] — and not an artifact URL. With a set of assets there is no single file to
link to, and the page is the thing that lists them.

## 4. What this does not touch

**Sign-up and sign-in keep their own templates and their own flows.** They are distinct
flows with distinct constraints, not configurations of a capture form; `invite` and
`signin` are already theirs. Nothing here gives a public capture form a way to send either.

## 5. Acceptance criteria

1. Two forms on one site, naming different templates, send different mail from the same
   submission path.
2. A form naming no template captures the contact, records its acceptances, and sends
   nothing.
3. A form with no assets can still send a welcome message — the case that mails nobody
   today.
4. Publishing a site whose form names a template that does not exist in that business's
   store is refused, and the refusal names the form and the missing key.
5. A template whose declared placeholders cannot be satisfied by the capture path is
   refused at render, as it is today.
6. A capture form cannot name a template in a way that sends a redeemable sign-up or
   sign-in link. Asserted by attempting it.
7. The business's own templates are read from its own store; two businesses may hold
   different copy under the same key with no platform-only branch.
