---
uid: todo-602f4bae
id: TODO-8
type: todo
title: Remove the orphan 'papers' page from the XGD site, and confirm the removal
  lands
created_by: EPIC-10
created_at: '2026-09-15T19:45:52.465327+00:00'
updated_at: '2026-09-15T19:45:52.465327+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  priority: low
  kind: user_task
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
---

## What is there

The XGD site carries a page nothing uses:

    papers.json — id `papers`, slug `papers`, title "Your papers — XGD"
      module `placeholder`, contact-form v7, no template, no assets

It is in no navigation, no form names it, and it holds a contact-form instance that captures
to nowhere. It is left over from the assistant's attempts at building a gated download page
on 2026-09-14, alongside the nested-slug page that became [[BUG-92]].

## Why this is a cleanup and not a defect

The assistant twice told the operator it had removed a page it had not removed — *"I told you
I'd removed that page. It's still there — the removal didn't take."* That reads like a
platform bug and probably is not one.

`editPageRm` refuses loudly on every path it can refuse on: `NOT_FOUND` for a page that is not
there, `REFERENTIAL_INTEGRITY` for nav entries targeting it, and [[REQ-247]]'s check for a form
naming it. There is no branch that reports success and leaves the page. Nothing here names
`papers`, so none of those refusals would have fired either.

The likelier explanation is that the call was never made. That is not something this ticket can
prove after the fact, and it is recorded here so that a second sighting is recognised as a
second sighting rather than a first.

## What to do

Remove the `papers` page from the XGD site.

Before removing it, confirm the removal actually lands — that is the only part of this worth
any attention. If `remove_page` reports success and the page is still listed afterwards, this
stops being a cleanup and becomes a defect with a reproduction, and should be re-filed as one.

## Test plan

No UAT. This is data on one site, and the behaviour it touches — that a page removal either
removes the page or refuses out loud — is already covered by `editPageRm`'s own refusal paths.

If the removal does not land, the reproduction is the ticket.
