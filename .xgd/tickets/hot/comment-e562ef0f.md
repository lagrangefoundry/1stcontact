---
uid: comment-e562ef0f
id: COMMENT-3741
type: comment
title: Comment on request REQ-315
created_by: xgd
created_at: '2026-09-24T01:45:48.619412+00:00'
updated_at: '2026-09-24T02:08:10.624559+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-68c8f289
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "90f4790c-ad60-4d68-b5c3-7df091af6f78",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c678a9dd-9aa1-40d1-a875-f12a494fe6ab-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T01:45:05.991333+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c678a9dd-9aa1-40d1-a875-f12a494fe6ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-24T02:08:08.315497+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me explore the relevant code.

I have enough to proceed. Let me record one design decision up front, then start.

**Decision I'm making (flagging, not blocking):** `bin/deploy --fonts` deploys the font mirror **and nothing else** — it does not also deploy the apps. The ticket says it "runs once per invocation, before or independently of the app deploys"; given a 1.35 GB target with a completely different cadence from a code deploy, "name what you want moved" is the honest reading, and `bin/deploy` (no flag) keeps meaning "the apps".

Now let me add the dependency and write the seed module.

Now the seed module:

Now add `LocalStore` / `stores` to the publish report:

Now the CLI command wrapper and report formatting:

Now wire it into the CLI dispatch and usage text:

Now the usage text (mirror's quality cliff + the new `seed` verb):

Now let me smoke-test the seed end to end against a small real fixture.

Now the UATs:

Two things surfaced that need deciding rather than dodging. First, `INTERNAL:` on an operator-facing refusal:

Now the REQ-312 UAT that my change makes false — amending it honestly rather than wording around it:

Now a real end-to-end smoke against the actual 829 MB mirror, seeding into a scratch store:

While that runs, let me record the implementation in the ticket body.

Meanwhile, let me bump the version.

Failures are all in unrelated areas — let me confirm they're pre-existing rather than mine.

Green and the version bump survived. Committing:

Now lock, merge back, and mark the ticket:

Done. REQ-315 is at `free_coded`, commit `0e8e48c276`, merged into `xgd-working`.

## What landed

**`1c fonts seed`** — publish's twin. Shares `platformObjects`, the `platform/fonts/` prefix, `platformFontKey`, the digest check, the `PublishReport` and its formatter; differs only in where the bytes go. It writes through **miniflare's own `R2Bucket` API** against the persist directory `wrangler dev` opens, so `r2PlatformFonts(env.SITES)` serves dev unchanged — the same implementation, not just the same interface. Not the on-disk format (an opaque DO-id-named SQLite store plus content-addressed blobs), and not `wrangler r2 object put` per object, for the reason `publish.ts` already records.

Measured on your real mirror: **5,498 objects / 855 MB in 29 s**, and a re-seed moving nothing in 20 s.

**Every app declaring the bucket is seeded**, discovered from `apps/*/wrangler.toml`, and the report names which stores answer. `--app` narrows it. `uploaded` scales with the stores; `bytes` is counted once.

**`1c fonts mirror` seeds at its tail**, beside the projection it already refreshes there — so the acceptance holds today, without §K.

**`bin/deploy --fonts`** deploys the mirror and nothing else: `--env production` publishes, `--env dev` seeds, a third environment is refused naming both, an app name narrows dev but is refused for the one cloud bucket. No capability section prints, because no hook ran.

## Two things I decided rather than dodged

- **`PublishError` is now a `CommandError`.** As a plain `Error` it printed `INTERNAL: There is no platform font mirror…`, which tells you the tool is broken when you simply haven't mirrored yet. This changes `1c fonts publish`'s exit code for those conditions from 1 to 3/6.
- **REQ-312's `..._not_wired_into_the_build_or_the_deploy` UAT is amended.** It asserted `bin/deploy` contains no fonts invocation at all, and this ticket makes that false by design. I could have worded my comments around the string match — that would have left the UAT passing while false. Instead it now pins the property it was protecting: `bin/build` reaches the mirror by no path, and every font delivery on `bin/deploy` is inside the `--fonts` target, reached from one guarded place that exits before any app deploys.

## Verification

13 new UATs, all observing the **served bytes** — each opens the seeded store with a fresh miniflare instance and reads back through `r2PlatformFonts`/`servePreviewPlatformFont`. `bin/deploy --fonts` is driven as you drive it: the real script, from a shell.

Full node suite: 4242 passed, 24 failed across 12 files. I stashed my changes and re-ran those files — **the failure set is byte-identical before and after**, all environmental to a fresh worktree (uninstalled webui components, filing service, account discovery).

One thing for you: your main checkout's local store is untouched — the smoke ran against a scratch store in the branch worktree, which I removed. Once the mirror finishes, `bin/deploy --fonts --env dev` will seed both apps for real.

<!-- xgd-chat-end -->