---
uid: comment-b335cb8a
id: COMMENT-712
type: comment
title: Comment on request REQ-119
created_by: xgd
created_at: '2026-08-06T19:37:27.321745+00:00'
updated_at: '2026-08-07T23:13:58.425966+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-64864801
  kind: chat_transcript
---

<!-- xgd-turn id="46f75327-d84f-4384-813b-dac16b442301-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:37:23.574499+00:00" -->
#### You
I don't understand this ticket, can you explain to me why its needed?

<!-- xgd-turn id="46f75327-d84f-4384-813b-dac16b442301-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:38:48.137359+00:00" -->
#### Claude
Read the ticket, plus the code it's about (`tools/generate/src/cli/builder.ts`, `apps/control-app/`).

## What exists today, after T1–T4

`1c builder` is a **Node server on your laptop**. Two things about it matter:

- The preview iframe is served from `storage/dist/<slug>/draft|edit/` — bytes that `1c render` wrote to disk earlier (`builder.ts:227`, "a rendered channel, straight off disk").
- A copy edit writes the draft JSON, then calls `cmdRender(slug, {edit: true})` to **re-materialise the whole channel to disk**, then the iframe reloads (`builder.ts:218`).

Everything the builder needs beyond its own chrome is filesystem-bound: the dist tree, the `storage/sites/` listing behind the site selector, `publish`. `control-app` — the Worker that is supposed to be `app.1stcontact.io` — currently just fronts this Node origin. The header comment in `builder.ts:15-25` says so outright: *"this is precisely the 'T1 static serving' that T5 replaces… T5 deletes the proxy."*

## So what REQ-119 is for

**It is the ticket that makes the builder something other than a local dev tool.** A Cloudflare Worker has no filesystem. Until the draft and edit channels render at request time inside `control-app`, reading the draft from the store, the editor can only run on a machine that has the repo, the storage tree and Node. That's fine for you; it's not a product.

There's a second, quieter reason: rendering-by-writing-to-disk is the wrong shape as soon as there is more than one site or more than one editor. You rewrite an entire channel on every save, and two tabs on the same site race on the same files. Request-time render makes the render a pure function of the draft again, which is what DOC-12 §6 says it is.

## The actual engineering substance is AC3, not the deployment

"Where the render runs" is uninteresting. The risk is arriving at **two** renderers — the build-time one in `tools/generate` and a second one inside the Worker — which then drift. That's exactly the failure the server-side-only decision exists to prevent (DOC-7 §2.4). AC3 ("adding an L1 axis requires changing it in exactly one place") is the real work; AC2 (byte-identical output, verified by comparison) is the check on it.

And it's sequenced last for a good reason: it changes *where* the render happens, not *what* it produces. If you do it before T3/T4, a rendering bug and a runtime-move bug are tangled together.

## Whether you need it *now* — probably not

The ticket carries its own contingency, and I think it's the honest answer: **if v1 of the builder runs against the file-backed store on your machine, phase 1 is functionally complete at T4 and T5 is deferred, not dropped.** The trigger is the first time someone who isn't sitting at your laptop needs to open the builder. DOC-12 §7 splits the Cloudflare migration the same way — serving moves first, the store moves later, and moving the store while authoring is local is the genuinely throwaway work.

One thing worth fixing before this gets scheduled: the contingency says "presumes an answer to DOC-8 §13 Q3", but DOC-8's open questions are **§10**, and none of the seven is *"does v1 run against the file-backed store locally first?"*. So the decision this ticket is gated on isn't recorded anywhere. That question probably belongs in DOC-8 (or DOC-28) explicitly — say the word and I'll add it.

<!-- xgd-turn id="cc2cbf7c-e587-4d0f-905e-40176d33e303-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T22:57:45.956142+00:00" -->
#### You
ok please can you implement this?

<!-- xgd-turn id="cc2cbf7c-e587-4d0f-905e-40176d33e303-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T23:13:58.277792+00:00" -->
#### Claude
Now I'll implement. Starting with the render seam.

Now the preview route and the edit write path:

Now the `servePreview` helper and the renderer cache:

Now updating `control-app`'s doc comment to match reality:

Now the full suite again to confirm no other regressions:

Done. REQ-119 is at `free_coded`, commit `c1bc8d1`, version `0.1.26`.

## What landed

**One render, in memory.** `renderSiteFiles(loaded, opts)` in `tools/generate/src/render/render.ts` returns every text artifact of a channel keyed by relative path, touching no filesystem. `renderSite` is now a thin writer over it; the request-time path is a reader. A byte is decided in exactly one function, so adding an L1 axis moves both paths together — AC-3, and the thing the ticket called its actual substance.

**Request-time serving.** `tools/generate/src/cli/preview.ts` — `PreviewRenderer` resolves one preview URL to one artifact, rendering on demand behind a `DraftStore` seam (the shape `public-site/src/site-store.ts` already uses, and the one DOC-12 §7 names for D1). Renders are memoised per channel, invalidated by a stamp over the definition, so an out-of-band `1c copy set` shows on the next request. The two `cmdRender` calls in the save path are gone. `published` still comes off disk from the publish-time render.

Two side-effects worth naming: an invalid draft now surfaces as a 500 page naming the field, where before it left the last good render in place indefinitely with nothing signalling it; and `index.html` became a genuine alias of the home page's bytes rather than a second render of them.

## Where I did not do what the ticket asked

**AC-1 as written — "served by `control-app` at request time" — is unreachable while the non-goals hold, and I did not attempt it.** workerd has no filesystem and no Vite/Astro transform, and the render resolves `.astro` behavior modules through `bin/1c.mjs`'s Vite SSR server. Executing it inside the Worker needs the store reachable from workerd, which is DOC-12 §7 **phase 2** — and this ticket's non-goals say "no storage migration". So the ticket contains an internal tension; I built the reachable, load-bearing half and recorded the rest in `control-app/src/index.ts` and `wrangler.toml` so the proxy's remaining reason is accurate. What's left is a small change: a store binding plus mounting the same handler.

This also settles the contingency: **v1 runs file-backed locally.** The ticket said that question lives at DOC-8 §13 Q3 — DOC-8's open questions are §10 and none of them is this one, so the decision existed nowhere. It's now in the ticket body.

## Supersession — declared, not silent

REQ-119 contradicts **AC-992** and **AC-1026**, which pin "a successful save re-renders both channels *to disk* before reporting success." The claim survives (an edit changes the page, not one rendering of it); only the observable moves to the origin. I updated those two UATs in place and declared the supersession explicitly in the ticket body so reconciliation updates the entries rather than test_fix reverting the code.

## Tests

`tests/req119-request-time-render.test.ts` — 8 UATs over HTTP against `storage/sites/xgd` (two pages, L1, a `contact-form` module, real assets; the scaffold has neither a module nor an asset so it would exercise neither the Astro path nor asset serving). The load-bearing ones are equalities: the writer's disk output vs the render's memory output file-set-and-every-byte, and `1c render`'s artifacts vs what the origin serves, for both channels.

Full suite: **1240 passed, 6 failed** — all six pre-existing and unrelated (`reconciliation-copy-edit-gesture-modal` ×5, `req115-builder-composition` ×1), confirmed by running them against a stashed tree.

<!-- xgd-chat-end -->