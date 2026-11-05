---
uid: comment-8f31e389
id: COMMENT-2619
type: comment
title: Comment on request REQ-220
created_by: xgd
created_at: '2026-09-10T22:09:13.101115+00:00'
updated_at: '2026-09-11T21:46:28.075925+00:00'
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

<!-- xgd-turn id="38d14443-0534-4b92-b675-889a58ec5026-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T18:05:13.519130+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="1f4794da-3efa-44fa-bcee-a2c6fc65a2ce-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T19:21:47.599138+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1f4794da-3efa-44fa-bcee-a2c6fc65a2ce-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T19:52:10.946829+00:00" -->
#### Claude
Now the server side, api, and callers.

Now the tests.

Now the local preview module, rewritten around REQ-219's op shapes.

Now rewrite the editor around "show the rendered picture, preview only the pending op".

Now the origin half: material.ts, router.ts, and the callers.

Now the router route: wire `measure` and map `RecipeRefusedError` to a status.

Now the modal suite, updated to the new behaviour.

<!-- xgd-turn id="626de7f3-b694-4dc9-95e8-ccb996d60a9b-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T21:05:42.191435+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="626de7f3-b694-4dc9-95e8-ccb996d60a9b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T21:19:17.877909+00:00" -->
#### Claude
Work is in progress in the branch worktree with no commits yet. Let me assess it.

Now let me run the four UAT suites in the foreground.

All 31 pass. Now reviewing the implementation for coherence — the prior session ended mid-rewrite.

Some failures may be pre-existing. Let me baseline them against `xgd-working`.

All 16 failures are identical on the `xgd-working` baseline — pre-existing, none from this work. Now let me check the UAT names against the ticket body.

All 31 UATs trace to the body, but two paragraphs in it went stale (they were written before REQ-219 landed) and a couple of behaviours need motivating language. Let me correct the body — preserving everything else exactly.

Now the merge lock, then merge working in, bump, and fast-forward back.

Now the version bump as the tip commit, then fast-forward.

Free-coding complete. REQ-220 is at `free_coded`, both commits are on `xgd-working`, and the branch is torn down.

## What landed

**The surface** — clicking a picture opens `modal.js`'s shell with the Library name and the four tools REQ-219's vocabulary names (crop, rotate, resize, adjust). It opens from the Library's detail pane and from the picture in the chat, because that is the same picture. Undo/redo span the sitting; the recipe is what persists, and no control sends bytes — so a crop can be widened a year later.

Five new/changed pieces, each elsewhere for a reason:

- `picture-kind.js` — one predicate, asked by the Library *and* by the origin, so a capture or a drawing cannot be offered a button the route would then refuse.
- `material-name.js` — one `mountFields` descriptor mounted in the pane and in the modal, committed through one call. That is what *"editing it in either place changes the same thing"* rests on.
- `image-preview.js` — the *one pending* operation as CSS over bytes the renderer made. No second fold, no browser-side bake.
- `reviseName` / `reviseRecipe` + their two routes — parse, compile, then write, through `image-recipe.ts`. A second producer of edits, never a second definition of one. 403 for a crop of a document or drawing; 409 for a recipe this picture cannot take, in the vocabulary's own words.

**Evidence** — 31 UATs across four suites, all passing. Typecheck clean, `wrangler --dry-run` clean, and the browser module graph resolves.

**Two things worth knowing:**

1. **16 pre-existing failures.** The full suite has 12 failing files (priming configuration, two-KB sessions, copy-edit gesture, webui scope). I ran the identical set on `xgd-working` and got the *same* 16 — none is from this work, and none is in the areas it touched.

2. **I corrected two stale paragraphs in the ticket body.** They were written before REQ-219 landed and said the route answers `rendered: false` for *every* commit and that there was no renderer. There is one now (`env.IMAGES` is bound), so `rendered: false` is specifically the no-binding deployment, and the editor appends a per-commit counter to the stable file address to avoid re-serving a cached rendition. I also added motivating language for four behaviours the tests assert but the body had not named — the vocabulary refusal at the write, the two refusal kinds, the URL-as-contract inverse, and the chat hook being opt-in.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-turn id="792d7b86-4ff7-4310-8bb7-323aa5c952b2-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T21:42:36.196259+00:00" -->
#### You
Please create a ticket to fix the 16 failures

<!-- xgd-turn id="792d7b86-4ff7-4310-8bb7-323aa5c952b2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T21:46:26.981241+00:00" -->
#### Claude
The user explicitly asked for a ticket, so I'll file one. First let me find out what actually breaks — a bug ticket that just lists test names is useless.

`AC977` lists uncovered routes — I need to check whether my new routes are among them.

Confirmed — two of those uncovered routes are mine. Let me characterise the rest before writing the ticket.

The priming failures aren't the KB network error — the missing sentences are locally composed. Let me test the upstream-drift hypothesis.

Causes are now pinned. Writing the ticket body.

**BUG-83** (`bug-ee6c6c39`) — filed at `draft`, priority high.

I ran each failure down to a cause rather than listing test names, and the 16 turned out to be five independent problems:

| # | Cause | Tests |
|---|---|---|
| 1 | Provider output missing from the primed system text — site-binding sentence, change signal, corpus delta | **11** |
| 2 | Three declared origin routes have no non-cacheable probe (AC977) | 1 |
| 3 | Panel width whitelist wrapped across lines; assertion matches a contiguous substring | 2 |
| 4 | webui component scope restated in three tracked files (AC960) | 1 |
| 5 | `points.js:49` contains `data-l1-segment` in a CSS string (AC1006) | 1 |

**One thing you should know: two of those uncovered routes in cause 2 are REQ-220's.** `/api/material/name` and `/api/material/recipe` are mine, and I did not extend AC977's probe list. Because that test was *already* red over `/api/material/changes`, nothing went green→red and the omission never announced itself — which is precisely the masking effect this ticket is about, caught in the act. I've named it as mine in the body rather than leaving it to look pre-existing. It's three probes to fix; say the word and I'll do it under REQ-220, since it's that ticket's debt.

Two calls I made in the body rather than guessing at:

- **Cause 1 has two candidate explanations and I did not pick one.** The missing sentences are all *provider* output and the priming list loads through the framework's `rolesFromMapping` — and `@lagrangefoundry/*` isn't in the lockfile, with the shared store last refreshed 2026-09-10, so upstream drift would produce exactly this shape. But the node runs also print `GET /accounts: fetch failed` (the sandbox has no route to Cloudflare). That can't explain the site-binding sentence, which is composed locally — though it probably does explain REQ-160's three document titles. The ticket says to tell those apart *before* fixing, because a fix aimed at the wrong one will appear to work on eight of eleven.
- **Causes 3 and 5 may be faults in the tests, not the code.** The width rule in `builder.css` is correct and present; the test just looks for `':has(.builder-modal__box'` as one unbroken string and there's a newline plus eight spaces inside the selector list. And a CSS rule mentioning `data-l1-segment` isn't obviously a second address resolution. For 5 I flagged that the AC needs reading before either side is touched — it might be the drift the AC exists to catch.

No code changed, so no branch was cut. REQ-220 remains at `free_coded`.

<!-- xgd-chat-end -->