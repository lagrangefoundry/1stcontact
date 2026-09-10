---
uid: comment-19db7f70
id: COMMENT-2573
type: comment
title: Comment on bug BUG-71
created_by: xgd
created_at: '2026-09-10T17:54:51.607573+00:00'
updated_at: '2026-09-10T18:15:18.587602+00:00'
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

<!-- xgd-chat-end -->