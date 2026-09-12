---
uid: bug-e771acac
id: BUG-89
type: bug
title: 'Contacts pane: the detail keeps the previous business''s contact across a
  business switch'
created_by: martin-github@westhead.me
created_at: '2026-09-12T21:53:21.763183+00:00'
updated_at: '2026-09-12T22:24:04.468227+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0663dda5
  severity: high
  commits:
  - working_sha: 376f0063e9888524547a95460e0f232a4db72272
    reconcile_sha: null
    main_sha: null
  version: 0.2.180
  story_points: 2
---

## Symptom

Open a contact in the Contacts pane with 1st Contact's business selected. Switch
the business to xgd. Open the Contacts tab. The list is empty — correct, xgd has
no contacts — and **the detail pane is still painting the 1st Contact contact**,
with their name, address, axes, businesses and history, under a switcher naming
another business.

The Library tab has the identical defect for material, by the same mechanism.

## Root cause

`createPeoplePanel`'s `clear()` (`apps/control-app/src/builder/people.js`) drops
the rows, the flags, the bounce set and the tick-set on a business switch, and
then calls `listDetail.setItems([])`. `createLibraryPanel`'s `clear()` does the
same through `apply()`.

`mountListDetail` in `no-tab` mode holds the open detail as a record keyed by the
item's key, in a `Map` that is **independent of the item list**: `setItems([])`
re-renders the list pane and never touches `bodyEl`. So the rows go and the
rendered detail subtree stays exactly as it was — the previous business's
contact, still on screen.

Both `clear()` functions carry comments promising precisely what they do not
deliver: *"leaving the previous business's material on screen under a header
naming this one is the one outcome a failure here may not produce"*. That
promise was kept for the list and never extended to the detail.

## This is not a server leak, and it is still a tenant violation

`/api/people/detail` scopes by tenant **and** id (`personDetail`, `people.ts`),
and `/api/material` reads through a scope-bound store handle. Nothing crossed
the boundary on the wire: the data on screen was fetched legitimately under the
previous business and then **outlived the scope it was read in**.

That is still a tenant violation as a display fact, and it is the reason this is
severity high rather than cosmetic: the pane asserts a contact belongs to the
business currently named, an operator cannot tell this apart from a real leak,
and the one thing the two-level model rests on ([[DOC-40]] §2.1, [[DOC-42]]) is
that what is on screen belongs to the business that is open.

## Fix

- **The detail goes with the list.** Clearing a list-detail host closes the open
  detail, which in `no-tab` mode destroys the record and restores `emptyDetail`,
  and drops the selection key — a selection is a pointer into a list that no
  longer exists.
- **One shared helper, not two copies.** The rule is single-sourced in a small
  module both panels import, because it was violated twice in the same shape and
  the next panel that mounts a list-detail needs it too.
- **Through the component's existing public surface** (`getActiveTab()` /
  `closeTab()` / `select()`) — no change to the out-of-repo `webui-list-detail`
  primitive, which already returns the empty pane when the active detail closes.
- **Both panels**, in one change. The Library's `clear()` has the same defect via
  the same primitive and the same host contract; fixing only the reported one
  would leave another business's material on screen under the same switcher.

## Test plan

`tests/test_UAT_FC_BUG-89_detail_goes_with_the_business.test.ts` — jsdom, mounted
against the real installed `webui` components (the pattern REQ-199 / REQ-201 /
REQ-233 established; a mocked component would assert the mock rather than that
the pane emptied):

- Contacts: open a contact, assert the detail names them; `clear()`; assert the
  detail no longer names them anywhere and the empty pane is back.
- Contacts: the switch as the host actually performs it — `clear()` then
  `refresh()` into the next business's transport — leaves no trace of the first
  business's contact in the pane.
- Contacts: the selection key is dropped, so nothing reports a row that is not
  in the list.
- Library: the same claims for material.

-