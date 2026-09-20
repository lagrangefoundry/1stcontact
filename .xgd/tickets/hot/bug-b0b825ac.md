---
uid: bug-b0b825ac
id: BUG-126
type: bug
title: 'edit_image has never worked: the store handed to the image plugin has two
  methods and the edit path needs five'
created_by: EPIC-19
created_at: '2026-09-20T19:24:34.816301+00:00'
updated_at: '2026-09-20T19:24:34.816301+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What the consultant reported, verbatim

> **`EditImage` cannot reach Library images at all** — `this.store.get is not a function`. Six attempts, by ticket id and by filename. Blocks the common request *"make my photo match the site's style."*
>
> **Related:** `list_image_edits` refuses site files, because only Library items carry an edit recipe. Coherent by design, but it means a picture already placed on a page cannot be adjusted — you must go back to the Library copy. People will hit this constantly.

Five attempts across the session, by document id, by the correct Library id, and by filename. Identical crash every time. The consultant correctly concluded it was a genuine fault rather than a bad reference, and stopped — after spending five attempts to establish it.

## Root cause — the handle we give the plugin has two methods and its edit path needs five

`generatedMaterialStore` (`apps/control-app/src/imagegen.ts:227`) returns, by its own explicit type annotation:

```ts
): Pick<TicketStore, 'create' | 'attach'> {
```

Two methods. That narrowing is deliberate and well argued in the surrounding comment — it is what makes *"the only record this plugin can cause is one holding a picture it was allowed to make"* a property of the handle rather than of the plugin's good behaviour.

Upstream's edit path needs three more. `ai-imagegen/src/toolbox.js` `_source()` calls:

- `this.store.get({ uid })` (line 457) — **the crash**
- `this.store.attachments({ uid })` (line 463)
- `this.store.read_attachment({ uid })` (line 491)

None exist on the handle. So `edit_image` has **never worked in this deployment** and cannot have. Generation works because the create path touches only `create` (line 524) and `attach` (line 532) — exactly the two we supply.

## Why nothing caught it

The handle crosses into the plugin through `lib.resolvePlugins(..., { options: { create_image: { store } } })` (`imagegen.ts:457`), and `imagegenLib` is imported as `Untyped`. So the one place where a two-method object meets a five-method expectation is the one place TypeScript is switched off. The narrowing is correct, the boundary is correct, and the gap between them is invisible.

The grant makes it worse rather than better: `images.instanceConfig()` is *derived from the surface's own declaration*, which is the right design and is defended at length in `imagegen.ts:472-486`. But it means the edit operation is granted automatically because the surface declares it — the grant cannot know the store behind it cannot serve it. A capability we can never fulfil is offered on every turn.

## The second half — an adjustment has nowhere to land

`list_image_edits` (the separate `image` surface, [[REQ-219]]) refuses site files because only Library items carry an edit recipe. That is coherent, and the consultant said so. But placing COPIES the bytes, so once a picture is on a page the only adjustable copy is the Library original — and the client is looking at the page, not the Library. *"Make this one a bit warmer"* about the thing on screen has no path at all.

Both halves are the same request from the client's side: **change a picture that already exists.** One crashes, the other declines. Fixing the crash alone leaves the second wall standing.

## Fix

1. **Widen the handle to what the surface it backs actually needs** — `get`, `attachments`, `read_attachment` alongside `create` and `attach` — keeping every existing refusal: the type gate on `create`, and `attach` only against tickets this handle itself made. Reads need their own scope rule, which is *this business's material and nothing else*; the store is already tenant-bound, so that is a type check rather than a new barrier.
2. **Make the gap impossible to reopen.** The `Untyped` boundary is why a five-method expectation met a two-method object in silence. Either type the handle against what the plugin declares it calls, or assert the method set at composition time so an upstream rung that grows a sixth call fails where it is wired rather than on a client's turn.
3. **Do not grant what cannot be served.** If the store behind a surface cannot serve an operation, narrow the derived grant rather than offering it — the same shape `createL1Toolbox` already uses to drop a surface that was not composed. An offered-and-always-crashing operation is worse than an absent one, which is the principle this repo already applies to a missing image key.
4. **Give an adjustment somewhere to land** — either an edit recipe on the placed copy, or a stated path back to the Library original that the consultant can follow on the client's behalf without the client learning what a Library is.

## Test plan

- The handle exposes exactly the method set the image surface calls, asserted directly, so a new upstream call fails at composition rather than at runtime.
- `edit_image` against a Library picture by its picture id returns an edited image; against its ticket id it resolves through the attachment; against an unknown id it refuses with `unknown_image` rather than crashing.
- A read through the handle cannot reach another business's material.
- `create` still refuses a type other than the configured one, and `attach` still refuses a ticket the handle did not create.
- An operation the store cannot serve is not in the granted set.
