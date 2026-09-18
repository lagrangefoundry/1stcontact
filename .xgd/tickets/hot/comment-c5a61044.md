---
uid: comment-c5a61044
id: COMMENT-3143
type: comment
title: Comment on bug BUG-119
created_by: xgd
created_at: '2026-09-18T22:37:39.935421+00:00'
updated_at: '2026-09-18T23:02:40.446033+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fecb3bda
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "97d0739e-9815-4322-b6d7-2a895356eea6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="95d17995-3e27-40ed-8277-127fa9d5f506-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:37:05.026738+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="95d17995-3e27-40ed-8277-127fa9d5f506-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:02:39.797500+00:00" -->
#### Claude
Now router.ts — remove the duplicate log and its call sites.

Now the imagegen store handle — the site of the reported fault.

Now the UAT file.

Now the regression scope — the suites that touch this seam.

Now version bump and commit.

Done. BUG-119 is at `free_coded`, four commits, version 0.2.269.

## The answer to the ticket's own question first: the money was not burned

Both pictures were stored perfectly and are still here — `MATERIAL-13` / `MATERIAL-14`, with attachments `attachment-69eac3a7` / `attachment-0ccfebf1` and ~3.4 MB of PNG each in R2. One has since been placed on a site. The ticket's "almost certainly not recoverable" prediction was wrong; nothing needed recovering.

## What actually threw

`generatedMaterialStore.attach` in `imagegen.ts` is the handle the plugin gets as `options.store`, and it does three things — the store's `attach`, the `filename`/`content_type` write-back, and **a knowledge index refresh**. The first two succeeded. The third threw, over the embedder that was broken all session (the same REST detached-fetch fault BUG-117 is fixing). The plugin can only read a throw out of a store handle as one thing, so it reported `store_unavailable` — "deployment fault, no ticket to hand on" — and discarded the uid of a picture that was sitting in the Library.

The ticket's instinct was right: one cause, two surfaces.

## What I changed

One rule, stated once in `indexAfterWrite` (`material.ts`): **the index seam is a refresh, not a write, and a refresh failure must never fail the write it follows.** The indexer is a change-feed consumer keyed on `updated_at`, so a failed pass is retried for free by the next write; the record and bytes it follows are not like that. Applied at all three places the seam is awaited — the image plugin's store handle, `ingest`, and `reviseDescription`.

Never silently: absence and failure are two loud sentences naming the uid, and the failure one carries the cause. `ingest`'s `indexed` flag becomes the honest "is this in the index". The loud log moved from `router.ts` (three call sites) to `material.ts`, beside the seam that knows which sentence applies. The `filename`/`content_type` write-back stays fatal, and a genuine store failure still raises `store_unavailable`.

Items 1–4 remain upstream in `@lagrangefoundry/ai-imagegen` — nothing here makes `_store` correct; it just stops this deployment manufacturing that failure out of a successful operation.

## Evidence

`tests/test_UAT_FC_BUG-119_a_failed_index_must_not_lose_the_picture.workers.test.ts` — four claims through `route()` over real D1/R2 with the real store, type pack, plugin and tool loop. Verified RED first: the unfixed code reproduces the exact quoted sentence and 500s the upload. Full workers project green (1169 tests), `tsc --noEmit` clean. Three node-project failures (`bug32-webui-scope-rebrand`, `BUG-112_on_sample_layout_gate`, `BUG-67_backend_settings`) are pre-existing — they fail identically with my changes reverted.

One thing worth your attention: the KB index for this tenant hasn't been written since 2026-09-11. Every material since then is stored but unsearchable. Once BUG-117's embedder fix lands, the next write should sweep them all up — but it's worth confirming rather than assuming.

<!-- xgd-chat-end -->