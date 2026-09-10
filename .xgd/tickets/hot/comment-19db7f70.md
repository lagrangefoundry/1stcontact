---
uid: comment-19db7f70
id: COMMENT-2573
type: comment
title: Comment on bug BUG-71
created_by: xgd
created_at: '2026-09-10T17:54:51.607573+00:00'
updated_at: '2026-09-10T18:16:00.462392+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ee954e95
  kind: chat_transcript
---

<!-- xgd-turn id="2928fb35-cc69-4c60-8cc1-8b1d37f41b74-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:54:33.179531+00:00" -->
#### You
# The builder did not start.

**What failed:** could not load http://127.0.0.1:8788/builder/main.js

**GET /api/sites:** 200 [{"slug":"1stcontact","latest":null},{"slug":"gigabytealchemy","latest":null},{"slug":"xgd","latest":null}]

An asset the builder imports is missing. Run `1c assets`, then restart the builder — the assets manifest is read at startup.

The document loaded; its client did not. Full detail is in the browser console.

<!-- xgd-turn id="2928fb35-cc69-4c60-8cc1-8b1d37f41b74-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:57:13.298274+00:00" -->
#### Claude
Diagnosed. Here's what happened and what I think the fix is.

**The symptom is real and the boot guard did its job.** `apps/control-app/dist-assets/` was absent, so `/builder/main.js` 404'd, the module graph never loaded, and the guard rendered exactly the right hint. `/api/sites` returning 200 confirms the Worker and store were fine — it was only the client bundle.

**Root cause: `1c builder` never builds assets.** `case 'builder'` in `tools/generate/src/cli/index.ts:816` composes the env-file layering and spawns `wrangler dev` — nothing more. `dist-assets/` is gitignored (`.gitignore:191`), so it does not exist in a fresh checkout, a new worktree, or after a clean. The same gap makes a *stale* build invisible: edit `src/builder/main.js`, restart the builder, and you are still served the old copy, because the assets are a build artifact copied by `1c assets`, not read live.

I ran `./bin/1c assets` — it succeeded, `dist-assets/builder/main.js` now exists, and the whole build takes **1.3s**.

**Proposed fix:** `case 'builder'` calls `cmdAssets()` (already exported, `assets.ts:837`) before spawning wrangler. 1.3s at startup removes both the missing-assets and stale-assets failure classes permanently, and a failed build raises before wrangler starts rather than after — which is right, since a builder that can't serve its client shouldn't bind a port. No flag, no freshness heuristic: one command, always coherent.

**One consequence worth naming now:** `tests/test_UAT_FC_BUG-50_builder_env_files.test.ts` calls `run(['builder'])` ten times with `spawn` stubbed. Unstubbed, that's ~13s of real asset rebuilds against the live repo tree per suite run. I'd stub the assets build in that test at the same boundary spawn already is, and add a BUG-71 UAT asserting the build happens *before* the spawn.

Two things I'd like you to confirm before I cut the branch:

1. Is that the fix you want, or would you rather `1c builder` only *check* for `dist-assets` and refuse with a hint (leaving the stale-assets case unsolved)?
2. Same treatment for `1c serve`/anything else that fronts the assets, or just `builder`?

I've held off writing the ticket body until you've settled 1 — say go and I'll populate BUG-71 with the above, title it `1c builder: starts wrangler dev without building assets`, and implement.

<!-- xgd-turn id="4c3026de-03d2-4ae7-92be-9228f79c37f3-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T18:15:18.457887+00:00" -->
#### You
I believe 1c serve is deprecated - is that correct? We shoudl just delete it so it is not confusing.

I don't understand your explanation so I can't say if the fix is right.

Why is this happening?

<!-- xgd-turn id="4c3026de-03d2-4ae7-92be-9228f79c37f3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:16:00.305759+00:00" -->
#### Claude
Two answers.

## `1c serve` — already deleted; the file must stay

You're right that it's deprecated, and it's further gone than you think: there is **no `case 'serve'`** in the CLI. REQ-177 removed the command, and `tests/req177-discontinue-raw-server.test.ts` exists specifically to keep it removed.

What's left is `tools/generate/src/cli/serve.ts`, and that is not the deprecated thing. It's a library function, `startServe`, that binds a throwaway loopback port so a headless browser has somewhere to point. Live callers: `1c shot`, `1c aligned-crops`, and the module conformance harness (`tools/generate/src/conformance/harness.ts:196`), plus four test files. Deleting the file breaks screenshots and crops.

There is one genuinely confusing leftover, and it's a doc bug: the CLI's own usage text still lists `serve` as a command (`index.ts:508`, in the "offline commands are never gated" sentence). That's one stale word advertising a command that doesn't exist. Worth deleting; it's a text edit, not a code change.

## Why the builder didn't start

The builder's browser code is written in one place and served from another.

- **You edit** `apps/control-app/src/builder/` — 27 files, `main.js` among them.
- **The Worker serves** `apps/control-app/dist-assets/builder/` — `wrangler.toml:56` points the assets binding there.

`1c assets` is what copies one into the other. Nothing else does. And `dist-assets/` is gitignored (`.gitignore:191`), because it's a build output — so it does not exist in a fresh checkout, a fresh worktree, or after a clean.

That's the whole failure. `1c builder` starts `wrangler dev` and nothing more. The server came up correctly, served the HTML correctly, answered `/api/sites` correctly with your three sites — and then the page asked for `/builder/main.js`, and there was no `dist-assets/` for it to come from. 404. The page had no client, so it sat there blank until the boot guard wrote the message you pasted.

I ran `./bin/1c assets`; it took **1.3 seconds** and the directory is there now. So your builder will start.

**Why it will happen again.** Two ways, and the second is the nastier one:

1. The directory is absent — any fresh checkout or worktree. Blank page, as you just saw.
2. The directory is present but **stale**. You edit `src/builder/main.js`, restart the builder, and you are still served the old copy — because the restart doesn't copy anything. No error, no blank page, just your change apparently not working.

So the fix I proposed is: have `1c builder` run that 1.3-second copy itself, before it starts the server. Then the served copy is never missing and never behind the source, and neither failure can happen. That's the whole change — it's not clever, it just stops making the operator remember a step the machine can do.

Does that make sense now? If so I'll write BUG-71 up and implement it.

<!-- xgd-chat-end -->