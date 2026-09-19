---
uid: request-3c6bad4e
id: REQ-281
type: request
title: Delete a Library item from its detail pane
created_by: EPIC-19
created_at: '2026-09-19T00:58:10.541560+00:00'
updated_at: '2026-09-19T00:58:10.541560+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d7a7e8f3
---

Parent: [[EPIC-19]]. Operator, 2026-09-18.

## The behaviour

A Library item's detail pane gets a **delete** action. A client who uploaded the
wrong file, or three near-identical generated variants they do not want, can get
rid of what they do not want to keep.

## What exists to build on

**`archive` is this system's erasure path, and it is already the declared verb.**
`tickets.ts:928` states it:

> archive is the erasure path ([[DOC-37]]): a lock that reached it would be a
> retention policy nobody asked for, and would collide head-on with deleting a
> business.

So this is `archive({uid})` on the material ticket, not a new deletion mechanism
and not a hard row delete. It is a column, not a status, so nothing in the
lifecycle has to learn a new state.

**There is no route for it yet.** `/api/material` has `GET`, `/item`, `/file`,
`/changes`, and `POST` for `description`, `name`, `recipe`, `role`, `fetch` and
upload. Nothing archives, and `builder/library.js` has no delete affordance.

## The fact that makes this safe

**Placement copies the bytes.** `place_on_site` returns `size` — *"how many bytes
were copied"* — and `promoteToSiteAsset` writes `placed_on` *"after the copy it
records"*. A picture that is on the site has its own asset under the site; the
Library row is the catalogue entry, not the site's copy.

**So deleting a placed item does not take it off the site.** That is the single
most important thing for this CTA to say correctly, because the opposite
assumption is the natural one and acting on it would be alarming. The wording
should tell the client what will and will not happen, in their terms: the picture
stays on the page it is on; it leaves the catalogue; putting it back means
uploading it again.

Whether a placed item should be deletable at all without a further confirmation is
a judgement for the implementation. The recommendation is yes, with the sentence
above — refusing it would strand every client who placed something once and now
wants their catalogue tidy.

## What it has to get right

1. **Say what is lost.** The bytes, the description the describer wrote, the edit
   recipe, and the item's place in any conversation that referred to it by name.
   A consultation that says *"use IMAGE-5"* ([[REQ-280]]) refers to something that
   will no longer resolve.
2. **The consultant's view must not go stale.** `list_library` reads the same
   catalogue; an archived row must leave it, and `itemNamed` must refuse a deleted
   name with a refusal that says it was deleted rather than that it never existed.
3. **Reachable, not prominent.** Deleting is rare and irreversible from the
   client's point of view. It belongs in the detail pane, not on the row, and not
   beside an action they use often.
4. **The row disappears from the list.** The pane already repaints rather than
   replaces (`library.js:72`), so the list has a path for this.

## Not in scope

**Un-deleting.** `unarchive` exists on the store and a recovery affordance is a
fair follow-up, but a client-facing trash that has to be browsed, sorted and
emptied is a second surface. Archive keeps the row, so nothing here forecloses it.

**Deleting the site's copy.** Taking a picture off a page is an editing operation
on the page, and it already has one.