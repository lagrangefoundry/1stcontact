---
uid: bug-b0b825ac
id: BUG-126
type: bug
title: 'edit_image has never worked: the store handed to the image plugin has two
  methods and the edit path needs five'
created_by: EPIC-19
created_at: '2026-09-20T19:24:34.816301+00:00'
updated_at: '2026-09-20T20:20:56.422436+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c918bdc5
  commits:
  - working_sha: 2773c602b9f0047df4c7ef6a6215d766ccf521f6
    reconcile_sha: null
    main_sha: null
  version: 0.2.294
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
---

## What was built

Numbered against the Fix above. Two decisions inside it were taken here rather than in the ticket, and both are recorded because a later reader will otherwise read them as drift.

**1 — the handle, widened.** `generatedMaterialStore` now returns `get`, `attachments` and `read_attachment` beside `create` and `attach`, each one resolving the name, checking the record, then asking the real store — so the scope is enforced in one place rather than three.

- *The read scope is the Library's own definition of material*, `MATERIAL_TYPES` — `material` **and** `reference` — rather than the single type `create` is narrowed to. `listMaterial` reads both, so narrowing to the create type would have refused a client's own uploaded photograph filed as a reference, which is the exact request that opened this ticket (*"make my photo match the site's style"*). An attachment is readable exactly when the record it hangs off is, checked through `fields.subject_uid`.
- *A picture answers to every name it answers to elsewhere.* The consultant spent five attempts — by document id, by the right Library id, and by filename — and a fix that took only the canonical uid would have left two of those three still failing. On a miss, the handle falls through to `resolveStoredImage`, which is [[REQ-218]]'s single rule for what a stored picture is called and already declares the catalogue label ([[REQ-280]]) and the filename as spellings of one. A second matcher here would be the drift REQ-218 exists to prevent.

**2 — the gap, closed by the type rather than by an assertion.** `generatedMaterialStore` declares `ImagePluginStore` as its return type, so a handle one method short of what the surface calls is a compile error. A runtime check at composition was written and then removed: it restates what the compiler already refuses, and the one case the compiler cannot see — upstream growing a sixth call — is equally invisible at composition. That case is covered instead by a UAT that reads the shipped executor's own source for `this.store.<name>` and holds the set against `IMAGE_STORE_METHODS`. Failure lands in CI, which is earlier than composition and earlier still than a client's turn.

**3 — the grant, derived from the handle as well as the declaration.** `imageGrantFor(store)` asks which capability groups the handle can actually serve and grants those. The group names are read from upstream's own `CREATE_GROUP` / `EDIT_GROUP` — added to the generated shim's export list — so no group name is spelled in this repository and a rename upstream stays a resolution error rather than a grant naming nothing. Editing subsumes generating, because an edit ends in one.

**4 — the second half: the stated path, not a recipe on the copy.** Two alternatives were rejected. Giving the placed copy its own recipe makes two editable versions of one picture that drift apart, with the next republish overwriting whichever one the client last worked on. Silently redirecting the edit onto the Library original changes a picture the caller did not name and reports about a different one, which is how an assistant comes to tell a client it did something it did not do. So `NOT_EDITABLE` now **names the Library item the bytes were placed from** — read back out of `placed_as` ([[REQ-282]]), which `promoteToSiteAsset` already writes for exactly this purpose — with its title, and says the change is published back over the file on the page. That last clause is true because `republishingRecipes` already carries a Library edit to every placement: the path the sentence describes is the path that already works. Where nothing records an origin, the refusal says so and says what to do instead.

### Files

- `apps/control-app/src/imagegen.ts` — `ImagePluginStore`, `IMAGE_STORE_METHODS`, `imageGrantFor`, the three read methods and their scope rule.
- `apps/control-app/src/tickets.ts` — `read_attachment` named on `TicketStore`. A call the type does not name is a call TypeScript cannot check, which was the bug's hiding place.
- `apps/control-app/src/material.ts` — `placedOriginOf`, `placed_as` read in the other direction.
- `tools/generate/src/cli/ai/image-core.ts` — the optional `originOf` dep and the refusal composed from it.
- `apps/control-app/src/router.ts` — `originOf` bound to this session's site.
- `tools/generate/src/cli/assets.ts` — the two group names added to the shim's export list.

## Test plan

Everything above, plus the original list:

- The handle exposes exactly the method set the image surface calls, asserted directly against the calls the **shipped executor's own source** makes — so a new upstream call fails in this repository's suite.
- `edit_image` against a Library picture by its picture id returns an edited image; against its ticket id it resolves through the attachment; **against its catalogue label or its filename it resolves through [[REQ-218]]'s one naming rule**; against an unknown id it refuses with `unknown_image` rather than crashing.
- A read through the handle cannot reach what is not this client's material — the record, the listing of its files, and the bytes of one of them, all three refused for a `brief`, all three answered for a Library picture.
- `create` still refuses a type other than the configured one, and `attach` still refuses a ticket the handle did not create.
- An operation the store cannot serve is not in the granted set: the whole handle grants both groups, the old two-method handle grants generation only, and a handle that serves nothing grants nothing.
- **A `list_image_edits` on a placed picture still refuses, and the refusal names the Library original, its title, and the fact that editing it republishes over the file on the page.**