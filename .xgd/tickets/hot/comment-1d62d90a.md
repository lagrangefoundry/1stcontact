---
uid: comment-1d62d90a
id: COMMENT-2313
type: comment
title: Comment on request REQ-206
created_by: xgd
created_at: '2026-09-08T01:37:01.224445+00:00'
updated_at: '2026-09-08T02:15:51.546313+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0d4b67bf
  kind: chat_transcript
---

<!-- xgd-turn id="54817efc-f62e-4db5-9123-47a18f36ceee-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:36:31.177940+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="54817efc-f62e-4db5-9123-47a18f36ceee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T02:05:39.028711+00:00" -->
#### Claude
Now let me look at the router where `workerHost` is called, and how the request origin/tenant/store are resolved.

Now I have a clear picture. Let me start the free-coding process.

Now let me write the changes. Starting with `shot.ts`:

Now wire the budget into `fidelityDeps`:

Now `ai.ts` — `workerHost` accepts the fidelity factory:

Now the `chatHost` change:

Now the `RouterDeps.launch` seam and the three `chatHost` call sites:

The mount surfaced a real defect: the picture reaches the model as base64 *text*, not as an image. Let me look at what the surface intended:

Now the regression scope — the suites that touch what I changed:

Now re-verify against the merged tree before committing:

Done. REQ-206 is at `free_coded` with the commit landed on `xgd-working`.

## What I built

**The mount itself.** `router.ts` now assembles what the fidelity surface needs for the request's business and hands it to `workerHost`, which passes it through to `host-core.ts`'s existing conditional composition. Nothing about the surface, its declaration or its grant changed — it was always granted and never wired. A consultant session in the builder now has `capture_site`, `list_references`, `describe_reference`, `screenshot`, `compare` and `check_fidelity`, and the projected manual says so.

**No new HTTP route**, which is the answer REQ-154 deferred. What that deferral was actually about is spend, so browser acquisitions are budgeted per session — 40 live-page looks, counted at the lease, so reading something already captured or already rendered spends nothing without any verb knowing a budget exists. Exhausting it refuses that one operation, naming what ran out and what is still possible.

**One thing I found that I want to flag.** Mounting it revealed the picture was being *described, not shown*. The surface returns Anthropic content blocks, proved against a bare tool whose handler value passes through unmodified — but every tool a real host registers runs through the Toolbox, whose contract is that a result renders to text. So `screenshot` reached the model as a JSON document with base64 in it: the full cost of the image, none of the benefit, and the exact failure the surface was built to avoid. Blocks are now recovered at the edge that can carry them, with every call still going through the Toolbox for validation, gating, refusals and audit. The `1c` CLI gets the same fix. I judged this in scope because without it the ticket's headline claim isn't true; it's recorded in the ticket body.

Three smaller decisions, all in the body: the budget is a *burst* bound (per session manager, so an evicted isolate mints a fresh one) rather than a lifetime one; the shared surface declaration is deliberately untouched because the `1c` CLI's browser is neither metered nor capped; and captures are marked third-party, because nothing yet declares a business's own domain and guessing errs toward republishing a stranger's site.

**Evidence.** 7 new UATs, all through the Worker's own routes or the production assembly (`tests/test_UAT_FC_REQ-206_the_assistant_can_see.workers.test.ts`). Full workers project: 637 passed. Node project: 5 failures — 4 are pre-existing (I confirmed the identical set on the main checkout) and the 5th passes in isolation, a parallel-load flake. Workspace typecheck clean.

<!-- xgd-turn id="8fc40ab4-b067-40c6-a2cb-77e48df46bdb-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T02:13:07.052861+00:00" -->
#### You
What do I need to do for this to be available in the dev environments?

<!-- xgd-turn id="8fc40ab4-b067-40c6-a2cb-77e48df46bdb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T02:15:50.768328+00:00" -->
#### Claude
Short answer: **nothing in the repo.** No new binding, var, secret, migration, route, or asset rebuild. `[browser]`/`BROWSER` and the `BLOBS` bucket were already declared at the top level *and* under `[env.production]` (REQ-154/REQ-162 landed both), and the change is Worker/CLI TypeScript that wrangler bundles at deploy time — nothing in `src/builder/*` moved, so no `./bin/1c assets`.

**To get it on `app.1stcontact.io`**

```
bin/deploy --dry-run control-app   # rehearse
bin/deploy control-app
```

There's no `[env.staging]` block, so production is the only deployed environment.

Two things to be aware of on that deploy:

- **This is the first time Browser Rendering is actually exercised.** REQ-154 declared the binding and deliberately gave it no caller — "no route answers this yet" — so the binding has been declared and dark. Worth confirming the account genuinely has Browser Rendering available before assuming a failure is my wiring. If it isn't, the failure mode is benign: `BrowserNotConfiguredError` reaches the model as a tool error it can read, the session and every other tool keep working.
- **`pnpm install` is out of step in this checkout right now.** The dry-run aborted before doing anything, asking to purge `node_modules`. That'll need sorting before deploying from here; it's unrelated to this change.

**Local `pnpm dev:control` (`1c builder`)**

Already had the fidelity surface — the Node host has supplied `HostDeps.fidelity` since REQ-157, which is exactly why the Worker's absence was the whole ticket. So there's nothing to wire; it just needs Playwright's browser present locally (`npx playwright install chromium`) because `nodeFidelityDeps` drives `createPlaywrightDriver`. It does pick up this ticket's image-blocks fix, so screenshots there now arrive as pictures rather than base64 text. It has no ticket store, so captures store but aren't written up, and `capture_site` says so.

**Local `wrangler dev` of the Worker** — wrangler classes `browser` as local-and-remote, so it's either the local simulator or `remote = true` on the `[browser]` binding to proxy the real service. I haven't verified which of those actually works on this machine.

**One gap I noticed while answering, which I have not fixed.** The upload path logs loudly when material is stored but not indexed (`warnUnindexed`, because DOC-39 §4 makes an unindexed document *invisible* rather than merely stale). My adoption wiring doesn't do the same — so on a deployment without the `AI` binding, a capture is adopted into the corpus and silently isn't searchable. That matters for local `wrangler dev` in particular, since wrangler says the `ai` binding will never have a local simulator. It's a one-line log to match the existing precedent. Say the word and I'll open it as a follow-up rather than reopening REQ-206, which is already `free_coded`.

<!-- xgd-chat-end -->