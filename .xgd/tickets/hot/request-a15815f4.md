---
uid: request-a15815f4
id: REQ-227
type: request
title: 'Picture stores: the AI cannot list the Library or move a picture onto the
  site'
created_by: BUG-80
created_at: '2026-09-11T21:55:52.134977+00:00'
updated_at: '2026-09-11T21:55:52.134977+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

## Symptom

The assistant cannot see what is in the Library, and cannot move anything out of
it onto the site. Both halves have now been observed twice, ten days apart.

**2026-09-01** (`comment-c9afb02b` on BUG-44): the client uploaded a gold "A"
logo. The assistant could not register it as a site asset and asked the operator
to drop the file in again.

**2026-09-11** (`chat-d73a11e1`, the same session as BUG-80): the assistant
generated three candidate illustrations, then spent **three rounds of
regeneration asking the client "how do the mold shapes look?" without ever
looking at them** — because `list_assets` showed nothing and it concluded the
generated pictures were unreachable. Mid-session, prompted by the client, it
discovered `screenshot` does take a Library handle. Its own words:

> "there are two separate picture stores, and I only checked one"

It then asked the operator to re-drop the file so it could be placed on the page,
exactly as on 2026-09-01.

## Why there are two stores, and what is actually wrong

The two stores are **correct and deliberate**, and are not the bug.
`image-library.ts` states it plainly: a **site asset** is bytes under a site's
`assets/`, serving the public internet; a **Library item** is a material ticket
holding what the client dropped on the conversation and what the generator made,
in a private bucket behind Access. "They live in different buckets on purpose …
so unifying the STORAGE was never on the table."

That module already unified the one thing that should be unified — the **name**.
`resolveStoredImage` answers for either namespace, which is why `screenshot` can
photograph a Library item at all.

So this is neither a storage problem nor, at bottom, a documentation problem. It
is **two missing operations**. The assistant has no verb for either of the two
things a person would obviously do with a picture store.

### Gap 1 — nothing enumerates the Library

`list_assets` lists site assets only. `ImageLibrary.list()` exists and returns
both halves, but is deliberately not exposed — the header records the reasoning:
"a picture's handle arrives in the result of whatever made it."

That assumption holds for one turn and fails across a session. A handle given
twenty turns ago is not reliably in the window; a picture the *client* uploaded
was never handed to the assistant at all; and a picture generated before a
compaction is simply gone. The refusal in `storedImage` is careful about this —
it tells the caller the Library exists and how a handle arrives — and the
2026-09-11 session still concluded the pictures were unreachable, which is the
evidence that a well-written refusal is not a substitute for a listing.

The cost is not a lost picture. It is that the assistant **asked the client to
judge its own work three times rather than looking at it**, which is precisely
the failure [[DOC-48]] §7 exists to prevent.

### Gap 2 — nothing promotes a picture onto the site

A Library picture cannot be placed on a page, because a page references
`/assets/…` and nothing copies bytes across. The assistant's only move is to ask
the operator to upload the same file a second time, through a different door.
This is what makes generated imagery close to useless today: it can be made, and
it cannot be used.

## What to build

1. **A listing that covers both namespaces.** Either extend `list_assets` to
   report Library items alongside site assets with their `where`, or add a peer
   operation. `ImageLibrary.list()` already returns exactly this, with canonical
   names and aliases — the data is there and nothing exposes it.

2. **A promotion verb.** "Put this Library picture on the site" — a copy from the
   private bucket into the site's `assets/`, returning the `/assets/…` handle a
   picture element takes. This is the `ManageAssets` / `add_asset` grant gap named
   on `comment-c9afb02b`.

Both are the assistant doing for itself what it currently asks the operator to do
by hand.

## Design notes

- **Promotion is a real trust boundary, not a copy.** The private bucket holds
  the client's confidential material; the site's `assets/` serves the public
  internet. Moving bytes across is a publication decision and should read as one
  — it is deliberate, it is auditable, and it is not something that should happen
  as a side effect of placing an image.
- **Listing the Library is not free.** It can hold every upload of an entire
  engagement, so a listing needs a bound and an order, the way `list_references`
  does. An unbounded listing is a different way of spending the tokens this saves.
- **Keep one vocabulary.** `resolveStoredImage` is already the single rule for
  what a name means. Neither operation should introduce a second way to name a
  picture.

## Not in scope

BUG-80 — the stored-picture render path — is a separate defect on the same
surface and is already fixed.
