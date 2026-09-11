---
uid: comment-8f31e389
id: COMMENT-2619
type: comment
title: Comment on request REQ-220
created_by: xgd
created_at: '2026-09-10T22:09:13.101115+00:00'
updated_at: '2026-09-11T02:41:28.081931+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b99bea26
  kind: chat_transcript
---

<!-- xgd-turn id="8e440398-a705-499e-b71f-a0106cd6ceae-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:08:48.214176+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="8e440398-a705-499e-b71f-a0106cd6ceae-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:14:07.361092+00:00" -->
#### Claude
I've read the ticket, the epic, all five siblings, and the code each of them names. No changes made. Here is what I found.

## Where this ticket actually sits

**It is entirely downstream, and the dependency is total.** REQ-219 is still `draft`, and I confirmed none of what it promises exists:

- No Images binding — `apps/control-app/wrangler.toml` declares `ASSETS`, `DB`, `SITES`, `BLOBS`, `BROWSER`, `AI` and nothing else.
- No recipe on the material record — `MaterialRow` (`material.ts:747`) has no operations field, and `rowOf` writes none.
- No `crop` anywhere in the builder. The only near-hits are `points.js:467` reading `objectPosition` off computed style and a comment in `page-style.js`.

So there is no useful code to write for REQ-220 until 219 lands. What *can* be settled now is the set of contracts 220 needs 219 (and 217, and 222) to honour — and several of them are not yet agreed.

## The furniture the ticket names is real and reusable

- `createModalShell` (`modal.js`) — backdrop, Escape, backdrop-click, `onClose`-before-detach, and the `mount()`-last ordering rule. Nothing in it knows what is being edited.
- `mountReader` (`reader.js`) — the exact pattern: a pane body plus a second body registered against one piece of state, opened into a shell.
- `getModalHost()` is already threaded `app.js:674` → `library.js:365` → `preview():738`.
- `mountFields` is already the Library's only editing vocabulary, in two blocks.

The new surface is genuinely three things: a click target on the image, a name-edit route, and the editor box itself.

## Findings worth deciding before any code

**1. `focalPoint` is dead, and the live focal point is a different thing.**
The ticket's premise — "`assetRefSchema` already carries `focalPoint`" — is true of the schema and false of the system. Grepping `packages/`, `apps/`, `tools/` for `focalPoint` returns three hits, all in `site-schema/src/schema.ts`: the declaration, and BUG-44's own note that it *"acquired no consumer at all"* when the site-level asset registry was deleted. Nothing reads it.

The axis that *is* live is `l1ImageAxesSchema.objectPosition` (REQ-136, `l1/schema.ts:1130`) — and it sits on the **L1 image node**, which is `.strict()` and carries no `focalPoint` at all. That makes focal point a property of *this picture in this band*, not of the material. The Library modal has no page or node in scope, so there is nowhere for it to write that anything reads. I'd either drop focal point from this ticket, or make it a material-level default and give the renderer a consumer for it — which is 219/222 work, not surface work.

**2. Publish does not read the material, so the ticket's strongest claim is currently false.**
`promoteToSiteAsset` (`material.ts:567`) **copies the bytes** into the site's `assets/` under a free name via `editAssetAdd`, and the L1 `image.src` points at that copy. Nothing re-syncs it. So for any picture already placed on the site, editing the recipe in the Library changes the Library's picture and not the site's — which contradicts *"what the client is looking at after a commit is what will be published."* Three ways out (defer promotion, re-render the site asset from the recipe at publish, or narrow the claim), and the decision belongs upstream of this ticket.

**3. The name is the ticket title, and the rights block is a deliberate whitelist.**
There is no title route — `/api/material/description` and `/api/material/role` exist, nothing else — so this needs `reviseTitle` plus a route. Two traps:
- `rowOf` does `filename = str(f.filename) ?? ticket.title` (`material.ts:788`). For a **capture** the field is absent, so renaming would silently rename its download filename too.
- REQ-213 made the rights block `editable: ['role']` explicitly *"so the block cannot acquire a second editable field by someone adding a descriptor."* Putting the name there breaks that rule on purpose; it wants its own block, like the description.

**4. The chat entry point needs a contract with REQ-217, not just for 217 to land.**
`mountChat` sets `record.el.innerHTML = renderSafe(...)` per message with no per-node hook, so the click has to be delegated off the panel host and must recover the material uid **from the `<img src>`**. That means the markdown line REQ-217's tool authors has to use a URL shape REQ-220 can parse. Worth writing down in both tickets now, or they will disagree.

**5. Clicking the picture is mouse-only.** An `<img>` isn't focusable. The reader deliberately puts its ⤢ in a bar for exactly this reason. The picture needs the same affordance, or a wrapping `<button>`.

**6. Two smaller ones.**
- `materialFileUrl(uid)` is a stable URL, so a committed edit will re-serve the cached rendition. REQ-220 should consume 219's content-addressed rendition address rather than this.
- `.builder-modal__panel` narrows to 520px unless the panel contains one of four whitelisted box classes (`builder.css:359`). An editor box needs to join that list.

**7. Two scope questions the shared code path forces.** `preview()` sends both `row.kind === 'image'` *and* `isCapture(row)` down the `<img>` branch, and `kindOf` files `image/svg+xml` as `image`. So as written, clicking a capture's screenshot and clicking an assistant-drawn SVG both open the editor. Both are probably wrong — a capture is a reference bundle, and cropping an SVG through an Images transform is not what anyone means.

**8. Session hygiene.** `openDetail`'s `reload()` already guards the description against being stomped by the subscribe feed (`host.querySelector('.fields-control-cell')`); the name field needs the same guard, and the editor modal needs to be torn down in `destroy()` the way the reader is, or a `list-detail` swap leaves it open over a different material.

## My read

This is the largest child of the epic by some way — a new modal surface, a drag-crop interaction, an operations toolbar, an undo/redo stack, plus a route and a domain function. It is not a 2-point free-code. I'd also flag that points 1 and 2 are not implementation details: they change what this ticket promises, and both are better resolved in REQ-219 before this one is written.

Want me to fold these into the ticket body — as an "Open questions before implementation" section, plus corrections to the focal-point paragraph — or discuss them first?

<!-- xgd-turn id="4e20f6a8-52a9-4990-a04b-3a1861e90566-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T02:11:24.690256+00:00" -->
#### You
Please reread the ticket your answers are there and proceed with the implementation

<!-- xgd-turn id="4e20f6a8-52a9-4990-a04b-3a1861e90566-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T02:41:26.829858+00:00" -->
#### Claude
Rereading — you're right, the ticket answers them: it is the *surface*, the recipe model and renderer are REQ-219's, focal point is stated as a thing the modal sets, and "interaction is local; truth is rendered" is the preview contract. Proceeding.

Ticket scoped. Now cutting the branch.

Now the implementation. Starting with the operation vocabulary — the one list.

Now the type pack fields and the routes.

Now wiring the two entry points together in `app.js`.

Now the UAT suites. Starting with the pure vocabulary/rendering contract.

<!-- xgd-chat-end -->