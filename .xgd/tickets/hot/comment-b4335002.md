---
uid: comment-b4335002
id: COMMENT-3670
type: comment
title: Comment on request REQ-307
created_by: xgd
created_at: '2026-09-23T02:27:18.697107+00:00'
updated_at: '2026-09-23T18:17:42.017951+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ba1e2212
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6c4b044a-9b4b-4afe-b990-9ed81df2aad2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="810df578-4a10-4ea1-b86d-9fbe8c6ca139-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T02:26:11.175932+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="810df578-4a10-4ea1-b86d-9fbe8c6ca139-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T02:58:40.014910+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now the Worker-side adapter:

Now the router wiring and env binding:

Now the wrangler binding and migration:

Now the test harness binding and the UATs:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="07f96bc3-7ccd-4cec-85fc-a000f383793f-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T03:15:38.636492+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="07f96bc3-7ccd-4cec-85fc-a000f383793f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T03:46:22.971441+00:00" -->
#### Claude
I'll start by getting the current state of the ticket and the working tree.

A branch worktree from the prior session already exists. Let me read the full ticket body and check what work landed there.

The prior session left uncommitted work on the branch — no commits yet. Let me read the full ticket body and review the work in progress.

Ticket body is well-populated. Now let me review the work in progress on the branch.

The implementation looks complete. Let me check a claim in the wrangler comment ("A UAT pins the two sides together") and then run the tests.

Now let me run the test suite. First, checking the test commands available.

Let me run the REQ-307 workers suite in the foreground.

All 7 pass. Now let me check the wrangler parity test pattern (the wrangler comment claims a UAT pins both environments) and run the broader regression scope.

The wrangler comment claims a UAT pins both environments together, but none exists. Let me add it as a node test, following the REQ-162 pattern.

New UAT passes. Now the broader regression scope — the changes touch `ai.ts`, `router.ts`, `host-core.ts`, and the workers config, all widely used. Let me run the full suite and a typecheck.

18 failures. I need to separate pre-existing failures from regressions. Let me get the full failing list and establish a baseline on the base branch.

All failures are node-side. Several could plausibly relate to my `host-core.ts` changes, so let me baseline by stashing the changes and re-running just those files.

Baseline: 8 of 9 already fail without my changes. Only `req115-builder-shell.test.ts` passed in baseline. Let me restore and investigate that one specifically.

A genuine regression: `req115` times out with my changes. Let me investigate.

Let me measure the baseline for this file alone to see if it was already near the timeout.

Confirmed regression (baseline 6.6s, all pass). Let me bisect which file causes it.

Not `host-core.ts`. Let me try `router.ts`.

Not `router.ts`. Let me try `assets.ts` (it changes the generated AI worker bundle).

Not `assets.ts`. Let me test `ai.ts` and `worker.ts`.

Let me re-verify the baseline still passes, to rule out environmental state.

Baseline is reliable. Let me check whether req115 spins up wrangler/miniflare (which would read my new `wrangler.toml` blocks).

It uses `unstable_dev`, which reads `wrangler.toml`. Let me test that file specifically.

Confirmed — `wrangler.toml` is the cause. Let me check what `main` the Worker entry actually is.

Let me reproduce directly to see wrangler's actual complaint.

Config is valid for deploy. The issue is specific to `unstable_dev`. Let me see how the test invokes it.

Found the cause. Let me confirm by looking at `worker.ts` vs `index.ts` as entry points.

The req115 test mounts `index.ts` directly while using the same `wrangler.toml` — so the DO class can't resolve. The real entry (`main`) is `worker.ts`. Let me point the test at it.

Fixed. Let me check whether other tests mount `index.ts` via `unstable_dev` with the same config — they'd hit the same issue.

Same issue in `reconciliation-builder-workspace-origin.test.ts` (two call sites). Let me apply the same fix.

Identical in baseline — pre-existing. Now let me re-run the full suite to confirm we're back to the pre-existing failure set.

Back to exactly the baseline failure set (8 files, 15 tests) — `req115` now passes and no regressions remain. Let me update the ticket body to motivate the new UATs.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9b6655e3-8f46-44db-bbb7-de02b404bedb-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:06:09.463853+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="9b6655e3-8f46-44db-bbb7-de02b404bedb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:17:39.981137+00:00" -->
#### Claude
I'll pick up where the prior session left off — check the branch state and what's still outstanding.

Work is in place but uncommitted. Let me review the diff and verify the state.

Good — on the branch worktree. Let me review the core implementation.

Implementation looks complete. Let me run the tests.

Both typecheck clean. Now the broader regression scope — full suite, as the prior session established a baseline.

Let me verify this failure set is pre-existing by baselining against the unmodified tree.

Identical — all 15 failures are pre-existing, unrelated to REQ-307. Restoring the work:

Now let me check every UAT is motivated by ticket body language.

All seven behaviour UATs map to existing body language. But four binding UATs and several touched files are technical consequences not yet written down. Let me read the exact body and extend it.

The body has a stray temp-path line from an earlier session. Let me extend it and clean that up.

Now bump the version and commit.

Now lock and merge back into `xgd-working`.

The operator has uncommitted changes in the `xgd-working` worktree that collide. Let me look before touching anything.

My changes append to different regions of that file; the operator's edits are a live production-config repair. I'll snapshot them, stash, merge, restore, and verify byte-identical.

Version conflict — `xgd-working` advanced to 0.2.339 while I was working. Let me redo the bump on the branch so the commit carries the correct final version.

Now restore the operator's uncommitted work and verify it came back intact.

Both present. Let me re-run the REQ-307 UATs against the merged tree.

All green post-merge. Now record the ticket as `free_coded`.

Another session published 0.2.340 while I worked. Let me check the current tip and re-bump.

The merge commit (not my work commit) introduced 0.2.340. Let me re-bump so a recorded SHA carries it.

Now record story points and clean up the branch.

REQ-307 is free-coded and landed on `xgd-working`.

## What shipped

A `SessionJunction` Durable Object (one per session, on `ctx.storage.sql`) implementing the same synchronous `JunctionStorage` port `memoryJunctions()` does — exactly the route `junction_memory.js`'s own header names, so no `lagrange-framework` change was needed.

Because the port is synchronous and a DO stub is not, the adapter is a **mirror plus write-behind**: reads answer off upstream's own `MemoryJunctionStorage` (composed, not reimplemented, so appends stay O(delta)), writes land in the mirror synchronously and queue in order to the object. Filling that mirror is the one asynchrony the port gains — an optional `prepare(sessionId)` the host awaits at its four session entry points. A store without the method is untouched, so the Node host and `1c` CLI are unaffected. No binding → `memoryJunctions()`, exactly today's behaviour.

## Verification

- **7 workers UATs** against a real miniflare Durable Object (not a stand-in — what's under test is that a turn survives the isolate that wrote it): survival across isolate replacement, durability-on-append, dangling turn closed `aborted` with the client told, conversation continuity, O(delta) appends, port round-trip, and no-binding fallback.
- **4 binding UATs** pinning the config: declared in both top-level *and* `[env.production]` (a named environment inherits nothing — getting this wrong fails silently in production only), `new_sqlite_classes` on both, and the class exported from the entry `main` names.
- Typecheck clean on both packages. Full suite: 15 failures, **byte-identical to the baseline** I measured by stashing the work — all pre-existing, none related.

## Two things worth flagging

**A latent test/deploy divergence, now closed.** Two suites mounted `index.ts` through this same `wrangler.toml` via `unstable_dev`. That only worked while the config needed no export `index.ts` lacks — a DO binding does. They now mount `worker.ts`, the real entry, so the shape wrangler deploys is the shape the ACs prove.

**Your uncommitted work.** `xgd-working` had your live EPIC-16 production-config repair (`PLATFORM_ADMINS`, `SERVICE_TOKEN_IDENTITIES`) uncommitted in `wrangler.toml`, which blocked the merge. I snapshotted it, stashed, merged, restored, and verified the restored diff is identical line-for-line — it's still sitting uncommitted exactly as you left it, now alongside the new binding blocks. Worth committing when you get a chance.

The version needed two bumps: `xgd-working` advanced under me mid-merge, and the merge-conflict resolution rather than my work commit ended up introducing 0.2.340 — so there's a small follow-up bump commit to 0.2.341. Both SHAs are on `fields.commits`. Ticket is parked at `free_coded`; promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->