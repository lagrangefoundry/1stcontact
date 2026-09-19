---
uid: request-3c6bad4e
id: REQ-281
type: request
title: Delete a Library item from its detail pane
created_by: EPIC-19
created_at: '2026-09-19T00:58:10.541560+00:00'
updated_at: '2026-09-19T15:00:36.596702+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d7a7e8f3
  story_points: 5
  commits:
  - working_sha: 0c06d07b91a7ea3b2cfca35ed7062dc0f8c27797
    reconcile_sha: null
    main_sha: null
  - working_sha: 5ff0717cd3c4f8e5b25ceac05887d131e5686bbb
    reconcile_sha: null
    main_sha: null
  version: 0.2.281
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


---

## Implementation (Claude, 2026-09-18)

### The shape

`archive({uid})` on the material ticket, reached from a new erasure route, with
the component's own trash semantics doing the work: it **cascades to the
attachment records and moves their bytes**, so the old blob position 404s and an
outstanding URL finds out at the moment of deletion. Deletion that still serves
is not deletion, and nothing here re-implements that — it is inherited.

### Why the row leaves every list for free

The component's read slice scans live records only (`archived: false`), and its
change classifier states that *"an archived ticket is never in a set … which is
what gives `archive` an `exit` and `unarchive` an `enter` for nothing"*. So one
`archive` call removes the item from `listMaterial` (the Library tab's list and
the assistant's `list_library`, which are the same read), from
`materialImageLibrary` (so `screenshot` and `edit_image` stop naming it), and
from the KB corpus predicate — and raises the `exit` the Library tab already
knows how to apply.

### Retrieval has to forget it too

The catalogue is not the only thing that answers about a file: the material's
description and extracted text are embedded in the project knowledge base, and
the chunk index drops every parent no longer in the corpus on its next refresh.
Left to the next upload, a deleted brand document would keep answering searches
until something unrelated happened to write. So the erasure runs the same index
seam the description correction runs, and a failure there is logged and never
allowed to undo the deletion — the material is gone whatever the index does.

### The consultant is told it was deleted, not that it never existed

`itemNamed` resolves over the live catalogue; on a miss it now re-resolves over
the deleted one and refuses with a distinct, declared `DELETED` code. A session
holding `IMAGE-5` from earlier in the conversation is told the client deleted it,
which is actionable, rather than being handed the *"there is no catalogue item
called IMAGE-5, the ones there are: …"* refusal, which invites it to argue with
the client about a name they both saw. This costs one extra read, on the miss
path only. The host supplies the deleted catalogue through the same projection
(`storedImageOf`) the live one uses, so a deleted item answers to exactly the
spellings it answered to while it was there.

The surface declaration gains the `DELETED` error, names it on the two
operations that resolve a name, and its `surface_version` moves. The *"Removing
anything"* absence stays — deleting is still not something the assistant may do —
and now says who can.

### The control, and what it says

At the **foot of the detail pane**, below the description: reachable, and as far
from the name field and the picture as the pane allows. Not on the row.

Confirming opens the builder's ordinary modal shell with Cancel focused (a return
press aimed at something else must not delete a client's file), and the copy says
what is actually lost — the file, what the describer wrote about it, the edit
recipe, and any reference to it by number — and, **for a placed item, that it
stays on the site**: the page holds the site's own copy, so this does not take
the picture down, and taking it down is an edit to the page. A placed item is
deletable, per the ticket's recommendation.

On success the row goes and the pane clears. A delete performed elsewhere
arrives as the change feed's `exit`, which already dropped the row and now also
closes the detail when it is that item's — a pane left open over a deleted file
is the same stale assertion the business-switch case already rules out.

### Surfaces touched

- `apps/control-app/src/material.ts` — `archiveMaterial`, `listDeletedMaterial`.
- `apps/control-app/src/tickets.ts` — the accessor's archived listing, named in
  the type rather than reached for with a cast.
- `apps/control-app/src/router.ts` — `DELETE /api/material?uid=`.
- `apps/control-app/src/library.ts` — the `deleted` port.
- `tools/generate/src/cli/ai/library-core.ts`, `library-surface.json`.
- `apps/control-app/src/builder/{api,library}.js`, `builder.css`.

### Not done

Un-deleting, and taking the site's copy off the page — both out of scope above.


### As landed — deviations and additions

- **The route is `DELETE /api/material?uid=`**, on the list's own path rather
  than a `POST …/delete`: the three POST routes beside it are each a narrow
  write of one named field, and this is the removal of the resource the list
  route lists. `/api/domain` already spells its own erasure this way.
- **The envelope carries `forgotten`** — whether the search index was refreshed.
  The erasure stands either way, and a caller is entitled to know which; the
  upload route's own `indexed` sets the precedent.
- **`forgetFromIndex` is a sibling of `indexAfterWrite`, not the same function.**
  The two report opposite facts and their warnings are read by somebody trying
  to understand a system: one says *stored but not indexed*, this one says
  *deleted but possibly still findable*. One function answering both would carry
  a sentence that was wrong half the time.
- **The confirm button carries a declared class.** [[BUG-53]]'s static sweep
  requires every class literal handed to `modalButton` to have a rule, so
  `.builder-library__confirm-delete` is declared — as the danger repaint of the
  `--primary` affirmative, which is the one place in this feature a filled
  warning colour is right.
- **The delete control is a text button in the danger colour, not a danger
  button.** On a filing screen a filled red box reads as the primary thing to do
  there, which is the opposite of true.

### Evidence

- `tests/test_UAT_FC_REQ-281_deleting_a_library_item.workers.test.ts` — the
  erasure over real D1 and R2: the record archived and out of every list, the
  bytes no longer served, the index seam run, the non-material uid refused, and
  **the site's own copy of a placed picture surviving**.
- `tests/test_UAT_FC_REQ-281_the_library_offers_deletion.test.ts` — the pane:
  where the control is, what the dialog says for a placed and an unplaced item,
  cancel, refusal, and the row and pane both going (by the button and by the
  change feed's `exit`).
- `tests/test_UAT_FC_REQ-281_the_deleted_name_is_declared.test.ts` — the
  surface: DELETED over NOT_FOUND, the trash never listed and never read on the
  path that works, and the declaration validating with its travelling grant.

Full `workers` project green (134 files / 1209 tests). The `node` project's
remaining failures are pre-existing or worktree artifacts (browser-gated
suites, webui serving, the system-KB suite), confirmed against the main
checkout.