---
uid: comment-2fa54c4e
id: COMMENT-6962
type: comment
title: Comment on bug BUG-330
created_by: xgd
created_at: '2026-11-03T00:50:47.370623+00:00'
updated_at: '2026-11-03T01:36:37.802185+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61224ab1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "df4c4542-8977-4055-89c8-65130550476d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9eba9c3f-dd51-477b-a7b5-f1442f36f620-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:49:14.617696+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="9eba9c3f-dd51-477b-a7b5-f1442f36f620-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T01:36:33.452894+00:00" -->
#### Claude
Reading the REQ-620 comparison-capture code (`comps.ts`, `capture-material.ts`) to plan the four fixes.

Studying how the existing durable jobs (shop import, consultant turn) build their host so a comparison capture can run as its own Workflows job.

Fix 3 is clear (make the video `poster` optional, drop empty/unsafe ones in the fold). Now locating where the capture pipeline loads the page, for the challenge-page wait.

Now checking the driver's `query` and the test fakes so the challenge-page wait can be tested end to end.

Plan is forming. Checking how comps are projected to the consultant (plan-core) and the capture-state constants.

Exploration done; I have a design for all four fixes and no blocking questions. Setting the ticket to `free_coding` and cutting the branch.

Worktree ready. Starting with fix 3 (the optional video poster) — schema, validator, renderer, fold.

Applying the poster edits.

Now the fold UAT — finding an existing REQ-461 video fold test to model.

Poster fix's non-browser UAT passes; the Chromium leg is skipped in the sandbox. Checking my note on running Chromium-gated suites here.

The worktree's linked `node_modules` resolves the `@1stcontact/*` workspace packages to the main checkout. Repointing those to the worktree.

Fix 3 verified in real Chromium. Now fix 1: challenge-page detection in the Browser Rendering driver.

Both drivers now wait out a bot-check page. Next: stop the pipeline retrying a blocked site.

Now the comps side: a `blocked` capture state, the job-side timeout, and running each capture as its own Workflows job.

Writing the comps.ts runner changes now.

Now the consultant side (plan-core): carry `blocked` and the reason on each comp.

Now the tile: a `blocked` card that says "This site blocks automated visits", with Remove and no Retry.

Now wiring the runner through `plan.ts`, `ai.ts`, the router, `worker.ts` and `wrangler.toml`.

Now the `CompCaptureJob` Workflows class in `worker.ts` and its bindings in `wrangler.toml`.

Typecheck is clean apart from two errors in files I haven't touched (`material-import.ts`, `zip-reader.ts`). Confirming those are the only ones.

Types clean. Now the remaining UATs — reading the REQ-620 workers test to model them.

Checking whether the workers test pool runs real Workflows bindings (miniflare), which would let the "not cut off" UAT use the real job.

Writing the BUG-330 workers UAT file (challenge page, stuck capture, durable job), and adding the real `COMP_CAPTURE` Workflows binding to the test pool.

Board comes back empty after an add. Checking whether the REQ-620 suite still passes, to see if that's my change or my test.

REQ-620 fails too. Baselining it on the unchanged main checkout before blaming my diff.

Pre-existing: REQ-620's suite is red on clean `xgd-working` as well. Diagnosing why, since my UATs share the harness.

Found it: REQ-621 hides the comp board until that "place" is introduced, which is why REQ-620's suite went red. Finding how other suites introduce it.

Seeded a settled story stage so the comp board is visible. Re-running both suites.

All 10 pass, including the durable case on the real Workflows engine. Now a UI UAT for the blocked tile — reading REQ-620's tile test.

UI UAT passes. Now the regression scope — tests touching the drivers, fold, schema, comps, plan surface and wrangler bindings.

Running the node regression scope in foreground batches of ~45 files.

12 failures in batch 1. Baselining those files on the unchanged main checkout.

Same set fails on base, except `builder-workspace-origin`, which fails a different subset each run (looks flaky). Rerunning it alone in the worktree.

Matches base when run alone. Batch 1 is clean relative to base. Running batches 2–3.

All pre-existing. Running the last three node batches.

One failure is mine: `REQ-461 envelope_security_a_missing_poster_is_rejected` pins the rule this ticket deliberately changes. Baselining the rest first.

Everything else is pre-existing. Only `REQ-461 …a_missing_poster_is_rejected` is new, and the ticket asks for that change. Reading that test.

Node scope is clean against base. Now the 59 workers-pool files in the scope.

Baselining these 13 workers failures on main.

Only `BUG-322 next_stage_starts_when_one_ticks_done` differs. Rerunning it alone in the worktree.

Not obviously my code: it's about stage guides. Checking whether `xgd-working` moved on since my branch was cut, or the worktree lacks a generated artifact.

The worktree's generated `kb.js` is a 232-byte stub (main's is 1.9 MB), a worktree artifact. Copying it over and rerunning.

Passes. Regression scope is clean relative to base. Checking for lint and build scripts before committing.

Syntax-checking the in-page challenge probe script, as page scripts aren't type-checked.

Probe classifies correctly, including not flagging a normal page that carries Cloudflare's script. Now the version bump; checking my notes on this project's version gate.

Updating the ticket body now (keeping your Symptom section) so every UAT traces to its wording, then committing.

Committed. Now the merge-back sequence: lock, merge `xgd-working` into the branch, bump the version, fast-forward.

Merged cleanly. Re-typechecking and rerunning the BUG-330 and REQ-620 suites on the merged tree before bumping.

Two snags: `xgd-working` moved again, and `0.2.743` shows up in another ticket. Checking both.

Fast-forwarded. Running the ticket overlay check, then moving the ticket to `free_coded`.

`free_coded` is set, but it printed a version warning. Reading the full output, then setting story points and cleaning up the branch.

BUG-330 is implemented, merged into `xgd-working` and parked at `free_coded`. Commits are `7f1d6547…` (the fix) and `b28fdcfa…` (version 0.2.743), with story points set to 8.

**What changed**

1. **Bot-check pages.** After a page loads, both capture drivers check whether it's a holding page. They look for titles like "One moment, please" or "Just a moment", known Cloudflare / SiteGround / Sucuri / Wordfence challenge markup on a near-empty page, or a near-empty page that refreshes itself. If it's a holding page, they wait in the same page, re-checking every 2 s for up to 20 s; once it clears, the real page is captured. If it doesn't clear, the capture stops without saving anything and without retrying. The comp gets a new `blocked` state, and its tile says "This site blocks automated visits" with Remove only, since Retry would just hit the same check.
2. **Stuck at "loading".** When deployed, each comparison capture now runs as its own Cloudflare Workflows job (`CompCaptureJob`, binding `COMP_CAPTURE`, in all three wrangler environments), so it no longer depends on `ctx.waitUntil`'s ~30 s window. The job stops itself after 3 minutes and marks the comp failed with Retry. The board also still reads an old `loading` record as failed. I didn't run comp captures inside REQ-624's consultant job, because the client's own "add a site" also starts captures and that has no consultant job.
3. **Empty video poster.** The fold now drops an empty or unsafe `poster`, and the `video` node's `poster` is optional. An empty or unsafe URL is still rejected, so the security rule is unchanged.
4. **Telling the consultant.** `read_plan` now reports `blocked` / `failed` with the reason and a short note telling it not to describe how the site looks. A blocked capture never produces a description.

**Decision for you to check:** fix 3 contradicts an existing REQ-461 test, "a missing poster is rejected". I followed your ticket, which asks for a clip with no usable poster to fold without one. I renamed the test to `…_an_empty_or_unsafe_poster_is_rejected` and changed it to accept a missing poster, and recorded this on the ticket as an explicit supersession. If you'd rather keep REQ-461's rule, the alternative is to leave such clips out of the fold entirely; say if you want that instead.

**Tests:** all the new UATs pass:
- the challenge page (blocked, and one that clears)
- the stuck capture timing out
- a hung capture marked failed by the job itself
- the capture outliving `waitUntil`, run on the real Workflows engine in the test pool
- the blocked tile
- the empty poster, folded through real Chromium

I re-ran every test touching capture, the fold, comps, the plan, L1 validation and wrangler. Every failure left also fails on clean `xgd-working`.

**Also changed outside the ticket:**
- REQ-620's comps test suite was already failing on clean `xgd-working`: REQ-621 hides the comp board until the story stage is found. I fixed its test setup to mark the story stage done.
- I added `COMP_CAPTURE` to the workers test pool config so the durable test runs on the real engine.

**Still to do on your side:**
- **Deploy.** The new Workflows binding only works once deployed.
- **Live check.** The sandbox can't reach real websites, so the bot-check handling has only been tested against a simulated browser. Please re-add the three production comps (3dstudiosinc, jdscustomironworks, thecrucible) and confirm they come out right.

The ticket body is up to date (your Symptom section is kept). Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->