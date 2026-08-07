---
uid: comment-b335cb8a
id: COMMENT-712
type: comment
title: Comment on request REQ-119
created_by: xgd
created_at: '2026-08-06T19:37:27.321745+00:00'
updated_at: '2026-08-07T22:57:46.236303+00:00'
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

<!-- xgd-chat-end -->