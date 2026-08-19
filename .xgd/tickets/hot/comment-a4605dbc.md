---
uid: comment-a4605dbc
id: COMMENT-1142
type: comment
title: Comment on request REQ-148
created_by: xgd
created_at: '2026-08-18T01:34:21.630824+00:00'
updated_at: '2026-08-19T23:45:59.981024+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7ae3c2cc
  kind: chat_transcript
---

<!-- xgd-turn id="9bebfada-9944-4175-8a3d-809090ec4524-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T01:34:17.315772+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="9bebfada-9944-4175-8a3d-809090ec4524-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-18T01:37:07.734836+00:00" -->
#### Claude
I'll start by reading the ticket to see what's being asked.

Let me investigate the codebase to ground the questions.

I've read the ticket and surveyed the code. Before implementing I need one decision from you, plus three smaller confirmations.

## What I found

Section 2's **second** bullet is already done — REQ-145 moved `styles.ts` off `readFileSync` to the build-time `module-assets.ts`. What's actually left is only the component render.

And the two components are much less Astro-shaped than the ticket assumes. Neither `contact-form/index.astro` nor `carousel/index.astro` uses any Astro runtime feature: no islands, no hydration, no `Astro.request`/`Astro.url`, no layouts, no child slots. Each reads `Astro.props`, does plain TypeScript, calls `renderL1Fragment` (pure TS, already worker-safe), and emits HTML with a couple of `set:html` fragments and one conditional `<style>`. Their static `<style>` blocks are *already* extracted at build time.

## Q1 — the mechanism (the one that matters)

The ticket frames this as "precompile `.astro` at build time and bundle the compiled render function." There's a materially different option:

**Option A (ticket's framing):** compile the two `.astro` files in a build step, bundle the factories. This still requires Astro's *runtime* (`astro/runtime/server`, plus whatever executes a component factory) inside the Worker — which is exactly the surface REQ-145 found drags `markdown-remark`/Shiki/Prism and `virtual:` specifiers. Adds a build step and keeps two render paths in tension.

**Option B (my recommendation):** delete Astro from the module render path — rewrite the two components as plain TS functions `render(props): string`. Zero Astro in the Worker, no new build step, no precompiled artifact to go stale.

Option B *deletes* rather than adds: `createContainer`, `astroContainer()`, the `astro/container` type import, `AstroComponentFactory` in the behavior contract, and the `needsAstro` branch in `renderSiteFiles`. AC-1 becomes true by construction (one code path, nothing to diverge), AC-3 is free (both modules are just functions), AC-5 is untouched (the CSS extraction is unchanged). It reads as the "Simplicity Over Preservation / replace, don't extend" answer.

Cost of B: `BehaviorDefinition['Component']` changes type, and ~6 existing test files that render via `AstroContainer` must switch to calling the function.

**Do you want A or B?**

## Q2 — the conformance fixtures

There are 12 deliberately-broken `.astro` fixtures under `tests/fixtures/conformance/` (the DOC-20 negative-fixture discriminator set). Under option B they convert too — mechanical, they're tiny. Confirm that's in scope for this ticket rather than a follow-up? (I think it has to be, or AC-4 can't be demonstrated.)

## Q3 — what "byte-identical" means in AC-1

Under B, node and worker run the *same* function, so node↔worker parity is structural. But the emitted HTML will differ in **whitespace** from today's Astro output (no semantic change — whitespace-only text nodes aren't flex items, so the carousel track is unaffected). Confirm AC-1 means node-vs-worker parity, not parity with today's Astro bytes?

## Q4 — the `1c` bootstrap

`tools/generate/bin/1c.mjs` boots a Vite server via Astro's `getViteConfig` *solely* because the render path imports `.astro`. With no `.astro` left, that could become a plain Vite SSR server. My recommendation is to **leave it alone in this ticket** — it keeps working, and changing the CLI bootstrap is a separate risk surface. Agree, or do you want it collapsed here?

I'll hold off on the branch and any code until you answer. Once you do, I'll populate the ticket body with the settled design before writing anything.

<!-- xgd-turn id="a7fe343f-90be-4c10-b0f1-feb2673cf314-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T17:34:54.068658+00:00" -->
#### You
B sounds good - I don't fully understand, but if you can assure me that the final output (the site) looks the same, then I'm all for simplification

2. Confirm fix them
3. ok
4. Please create a ticket for this additional work

<!-- xgd-turn id="7e0d4f27-3155-4cd9-8a41-bebfb1c7a68c-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T17:41:47.162476+00:00" -->
#### You
1. B sounds good - I don't fully understand, but if you can assure me that the final output (the site) looks the same, then I'm all for simplification 
   2. Confirmed
   3. Confirmed
   4. Please create a ticket for this additional work

<!-- xgd-turn id="2d637c83-55e1-4bb4-8e47-5689bf04a0d1-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T19:53:36.938012+00:00" -->
#### You
1. B sounds good - I don't fully understand, but if you can assure me that the final output (the site) looks the same, then I'm all for simplification
2. Confirm fix them
3. ok
4. Please create a ticket for this additional work

<!-- xgd-turn id="2d637c83-55e1-4bb4-8e47-5689bf04a0d1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-18T20:21:59.162283+00:00" -->
#### Claude
Now I have the full picture. Let me update the ticket with the settled design and start.

Now the follow-up ticket for the `1c` bootstrap (Q4), then I'll cut the branch.

Now the shared HTML helper and the two components.

Now the two `styles.css` files, extracted verbatim from the `<style>` blocks:

Now the carousel component:

Now the build step reads `styles.css` instead of scanning Astro templates:

Now the render seam — delete the container, the injection, and `renderSiteFilesNode`:

Now export `getModule` from the worker entry:

Now regenerate the precompiled module assets and typecheck:

All clean. Now the conformance fixtures — 12 `.astro` files become plain TS:

Now update the test files that drive Astro's container:

Now the two tests that assert the lazy-Astro property, plus REQ-119/REQ-143/REQ-145:

Now the shared fixture and the two UAT files:

Now the workerd suite:

I'll wait for both suites to finish so I can compare failures against the clean-tree baseline. Meanwhile, here's where things stand.

**The site output is unchanged** — I verified this directly rather than assuming it. I rendered both real sites (`gigabytealchemy`, `xgd`, including the 4 live `contact-form` instances) on the clean tree and again on this branch, then compared:

| Artifact | Result |
|---|---|
| `home.html`, `whitepapers.html` (both sites) | **Identical** after normalising whitespace and Astro's inert `data-astro-cid-*` scope attribute |
| `theme.css` | Identical ignoring whitespace (module CSS is dedented now that it lives in a real `styles.css`) |
| `capabilities.js` | **Byte-identical** |

The only non-whitespace difference in the entire HTML is `action` → `action=""` on one form whose action is empty — the same thing in HTML.

**What changed:** the two behavior components are plain TypeScript functions instead of `.astro` files, which deleted the Astro container, the `createContainer`/`resolveModule` injection seams, `renderSiteFilesNode`, the `needsAstro` branch, the Astro template scanner, and both `*.astro` ambient declarations. The registry is now portable, so the Worker resolves and renders behavior modules through exactly the code Node runs. Module CSS moved verbatim into `styles.css` beside each component; `1c assets` still precompiles it.

I also filed **REQ-150** for the `1c` bootstrap (Q4) — collapsing Astro's `getViteConfig` to a plain Vite SSR server, kept out of this ticket deliberately.

One environment note: this sandbox blocks socket binding, so the workerd suite and every loopback/browser test (conformance, preview) cannot execute here — they fail with `listen EPERM` identically on the clean tree. I'll report exactly which tests I could and couldn't run rather than implying more coverage than I have.

<!-- xgd-turn id="ae6a4fa6-f92d-4874-8608-0fefb056fc0d-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T20:53:18.796871+00:00" -->
#### You
Please can you create a detailed bug (xgd report-bug) describing the sandbox constraints, the specific ask for this project

<!-- xgd-turn id="ae6a4fa6-f92d-4874-8608-0fefb056fc0d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-18T20:57:11.090270+00:00" -->
#### Claude
The bug is written but **`xgd report-bug` cannot run from this session** — which turned out to be the sharpest evidence for the report itself:

```
Error: ticket://lagrangefoundry/xgd/ refused: git hash-object -w /tmp/…yaml failed:
       error: unable to create temporary file: Operation not permitted
```

The sandbox's write allowlist covers 1stcontact and its worktrees but not the **xgd repo's own git object store**, so an assistant that hits a tooling defect can't file it from the session that hit it. I added that as a finding and saved the body for you to file:

```
xgd report-bug \
  --title "xgd claude sandbox blocks all socket binding: workerd suite unrunnable, 51 of 57 node test-file failures are environmental (1stcontact)" \
  --fields '{"severity":"high"}' \
  --body-file .xgd/tmp/REQ-148-sandbox-bug.md
```

The file is in both checkouts (`/Users/martin/lagrangefoundry/1stcontact/.xgd/tmp/` and the `free-REQ-148` worktree).

**What it says**, grounded in measurements from a clean `xgd-working` checkout:

- No sockets at all — loopback TCP, `0.0.0.0`, and UNIX domain sockets are all `EPERM`. Probes included.
- **51 of 57** failing node test files fail from this; 6 fail for genuine pre-existing reasons. The **workerd project is 0-of-3 runnable** — Miniflare's `listen()` throws an unhandled `'error'` and Node aborts, so those tests produce no result at all.
- It removes exactly the layer that proves this product works: conformance (DOC-20 serves a one-module page and drives a browser), the builder/request-time render, and every workerd claim REQ-141/143/145/148 exist to make.
- Blocked sockets don't fail fast — they burn the timeout. One file takes 1440s; a full run is 31 minutes, nearly all of it waiting.
- The worst cost is signal: with 51 doomed files, telling your own regression from the floor requires running the same suite on a clean checkout and diffing failure sets. I did that for REQ-148; it cost an hour to learn my only two regressions were ones I'd already fixed.
- Secondary frictions: unwritable `~/Library/Preferences/.wrangler/` (15 lines of EPERM noise before every test run), `diff <(a) <(b)` → `/dev/fd/11: Operation not permitted`, `ps` denied, `nice` warnings, `git push` failing so tickets stay local.
- **The ask**: permit loopback + UNIX sockets (this concedes nothing off-box — `allowedHosts: []` can stay), redirect or permit the wrangler log path, make `/dev/fd/*` readable, allow `ps`, and add the xgd store to the allowlist. If loopback can't be opened, XGD should announce it in a session banner and have `xgd quality run` classify socket-blocked failures as `environment` rather than `failure`.

Separately, the comparison run finished while I was writing this: **branch-only failures were exactly the two I'd already fixed** (AC-809/AC-810, a test helper that sliced module CSS at `\n\n/* ` — correct when the chrome was indented inside an `.astro` `<style>`, wrong now it's dedented). I've recorded all of that in REQ-148, including an explicit statement that the workerd UAT for AC-1 and the conformance dimensions **have never executed** and must run somewhere with sockets before the ticket is promoted.

<!-- xgd-turn id="39812f7e-09ea-4953-9483-d374e20f4871-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T21:26:27.660904+00:00" -->
#### You
ok I create the ticket manually, but I think I see the config fix for the ticket permissions - can you try creating a test ticket now please?

<!-- xgd-turn id="39812f7e-09ea-4953-9483-d374e20f4871-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-18T21:27:52.889638+00:00" -->
#### Claude
Tried it — **still blocked**, and I've pinned the exact cause.

```
$ xgd report-bug --title "TEST TICKET — sandbox write-permission probe (delete me)" ...
Error: ticket://lagrangefoundry/xgd/ refused: git hash-object -w /tmp/…yaml failed:
       error: unable to create temporary file: Operation not permitted
```

**The gap:** the xgd ticket store's root is `/Users/martin/lagrangefoundry/xgd` (per `~/.xgd/projects.yaml` line 26–29), and that path is absent from the sandbox write allowlist. Direct probes:

| Path | Writable |
|---|---|
| `/Users/martin/lagrangefoundry/xgd` | **BLOCKED** |
| `/Users/martin/lagrangefoundry/xgd/.git` | **BLOCKED** |
| `/Users/martin/lagrangefoundry/xgd/.git/objects` | **BLOCKED** |
| `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_xgd.git` | writable |

The allowlist has all seven `~/.xgd/worktrees/git_github.com_lagrangefoundry_*.git` roots plus the current project's primary checkout (`/Users/martin/lagrangefoundry/1stcontact`) — but not the *other* projects' primary checkouts. The temp file `xgd` writes is fine; it's `git hash-object -w` failing to create its scratch file inside `.git/objects/`.

**No workaround via the worktree.** I tested that too: `…/worktrees/…xgd.git/main` is writable, but its `.git` is a pointer (`gitdir: /Users/martin/lagrangefoundry/xgd/.git/worktrees/main`) and objects still land in the primary store — `git hash-object -w` from there fails identically.

**The fix:** add `/Users/martin/lagrangefoundry/xgd` to the sandbox write allowlist. I can't apply it myself — the settings files that would carry it (`~/.claude-2/settings.json`, `1stcontact/.claude/settings.json`, `settings.local.json`) are all in the sandbox's `denyWithinAllow` list, and none of them currently contains the filesystem allowlist anyway (it looks derived from working dirs + `projects.yaml` worktree roots rather than written literally).

The bug body is still at `.xgd/tmp/REQ-148-sandbox-bug.md` in both checkouts if you want to file it manually once the path opens up.

<!-- xgd-turn id="c3288158-da6b-4e91-802f-8d7a9b11730b-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T22:23:53.283348+00:00" -->
#### You
Do you have permissions now?

<!-- xgd-turn id="a156b4b1-21c5-4530-a112-14c4b46cb030-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T22:25:41.607920+00:00" -->
#### You
Do you have permissions now?

<!-- xgd-turn id="a156b4b1-21c5-4530-a112-14c4b46cb030-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-19T22:29:05.841187+00:00" -->
#### Claude
Yes — both blockers are gone. Let me confirm with the tests that couldn't run before.

Workerd suite is fully green. Now the node suite — previously 51 of 57 files failed environmentally.

Yes — permissions are open now, and it changed the picture materially.

**What works:**

| Previously blocked | Now |
|---|---|
| TCP loopback binding | **Works** — this was the core blocker |
| `xgd report-bug` into the xgd store | **Works** — created BUG-1217 as a probe |
| **workerd test project** | **Runs — 4 files, 40 tests, all green** |

Still blocked: writes to `/Users/martin/lagrangefoundry/xgd/.git/objects` directly, and `…/xgd/.xgd/_locks/` — so `xgd ticket update` against the xgd store fails even though `report-bug` (create) succeeds. Minor, and not on the path of this ticket. The probe ticket **BUG-1217** in the xgd store needs deleting by hand; I couldn't close it.

**The substantive result:** the REQ-148 evidence I told you had never executed has now executed.

The workerd suite ran green apart from one failure, and the failure was the *expected* one: `test_UAT_FC_REQ-145_a_page_mounting_a_behavior_names_the_ticket_that_renders_it`. That test was REQ-145 pinning the gap — it asserted that a page mounting `contact-form` fails with a 500 naming REQ-148. It now returns 200, because REQ-148 closed the gap. I deleted that superseded case; REQ-148's own three UATs (`…behavior_in_workerd.workers.test.ts`) already prove the positive — the draft channel renders, the served bytes are the component's own output, the edit channel switches behaviour off. Re-run: **40/40 pass.**

So AC-1 is now backed by executed evidence rather than a promise.

The node suite (previously 51 of 57 files failing environmentally) is running in the background now; I'll report the comparison against the clean-tree baseline when it lands. The conformance dimensions ride in that project, so this is also the first chance they've had to execute.

<!-- xgd-turn id="408ce32e-fdde-4b70-9ca8-9bbdca37324e-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T22:30:40.196129+00:00" -->
#### You
Background tests die in this environment, please run all tests in the foreground

<!-- xgd-turn id="408ce32e-fdde-4b70-9ca8-9bbdca37324e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-19T23:00:48.095908+00:00" -->
#### Claude
The detached run died — confirms your point. Two things in that output worth flagging before I re-run:

12 orphaned vitest forks from the **free-REQ-146** worktree are still running — a dead session's leftovers, not mine. They'll contend for CPU during the run. Want me to kill those too?

Meanwhile, running the node suite in the foreground, sharded to fit under the 10-minute command cap (233 files):

Shard 1/8 done: **5 files failed, 20 tests failed, 233 passed (253 total)**, 484s. The visible failures are in `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` — `box.run(...)` returning an array/object where the test expects a string (`expected [] to include 'SCHEMA_INVALID'`). That shape mismatch looks unrelated to REQ-148's Astro removal, but I need a baseline to be sure.

Capturing full output from here on so I can analyze without re-running.

Shard 2/8: **29 files, 207 passed, 3 skipped, 0 failures.**

`renderSiteFilesNode is not a function` — that one is very likely mine. Checking:

Confirmed — this is mine. Let me see what replaced it:

Signature is identical — the wrapper only supplied defaults that are now built in. Pure rename in the test:

REQ-143 green. Now the other two shard-3 failures — checking whether they touch anything REQ-148 changed:

Both look pre-existing, not REQ-148. Verifying:

Neither offender file — nor anything chat-related — is in my changed set. Both are pre-existing failures unrelated to REQ-148. Continuing:

One is mine — the conformance fixtures. Checking:

The 11 missing fixtures were written into the **main worktree** instead of the REQ-148 worktree. Confirming:

Both tracked changes are genuine REQ-148 work stranded in the main worktree. Migrating everything across:

The main-worktree `throws-on-render.ts` has a module-level `throw` that would crash at *import* time rather than render time — the REQ-148 worktree version is the correct one. Keeping that, copying the other 11:

Now the two tracked-file changes:

Now re-running the conformance test that was failing on the missing fixtures:

Green — but 2 files and 15 tests **skipped**. Checking why, since these are the conformance dimensions:

Chromium is installed, so `chromiumAvailable()` is failing for another reason. Testing it directly:

Conformance skips because of a Playwright browser-build mismatch: `tools/generate`'s Playwright wants chromium build **1228**, but only **1234** is installed. Trying the download:

Network egress is blocked (`allowedHosts: []`), so build 1228 can't be downloaded — the conformance browser dimensions stay skipped for an environmental reason, not a code one. Continuing the sweep:

Same two pre-existing families (tool-surface `answer` shape drift; `~/Library/Preferences/.wrangler` EPERM causing wrangler-registry timeouts). Continuing:

Shard 8 green. Re-running shard 1 (to capture its full failed-file list) and shards 3–4 (to confirm my two fixes landed):

<!-- xgd-turn id="7725880a-ed06-4efd-9403-c61989f4a544-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T23:17:11.890762+00:00" -->
#### You
Please continue

<!-- xgd-turn id="7725880a-ed06-4efd-9403-c61989f4a544-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-19T23:23:26.455602+00:00" -->
#### Claude
Shard 1 was SIGKILLed (exit 137 — memory pressure), no summary written. The orphan forks are now gone, so retrying with reduced concurrency:

All two known families again, none in my changed set. Confirming my two fixes in shards 3 and 4:

REQ-143 fixed (6 failures → 3, all remaining pre-existing). Now shard 4:

Conformance fixture fix confirmed too. Now verifying I didn't break anything with the migrated changes — typecheck plus the workerd project:

Typecheck clean. Updating the ticket per protocol:

Full sweep done, all in the foreground.

## workerd — green
**4 files / 40 tests, 0 failures.** REQ-148's own UATs pass: a behavior-module site renders its draft channel, the served bytes are the component's own output, the edit channel switches the behaviour off. AC-1 now rests on executed evidence rather than a promise.

## Three defects found and fixed

1. **Superseded REQ-145 boundary test** — asserted mounting `contact-form` fails with a 500 naming REQ-148. It returns 200 now because REQ-148 closed the gap. Deleted.
2. **`renderSiteFilesNode` left dangling** — removing the Astro container path deleted the wrapper but `test_UAT_FC_REQ-143_render_store_independence.test.ts` still imported it. Identical signature, so a rename to `renderSiteFiles`. Verified green.
3. **Work stranded in the wrong worktree** — the 11 converted `.ts` conformance fixtures, the `options.ts` import fix, and the `renderSiteFiles` async doc paragraph had been written into the main `1stcontact` checkout, not `free-REQ-148`. `req40-conformance-security.test.ts` was failing at import. All migrated; `tsc --noEmit` clean.

On (3) I did **not** copy the main worktree's `throws-on-render.ts` — it has a module-level `throw` that crashes at import rather than at render. The worktree's version is the correct one.

## node — 233 files, 8 shards, ~1746 tests: 14 files / 60 tests failing

None are REQ-148's. I checked each failing file against the changed set; four pre-existing families:

| Family | Files | Signature |
|---|---|---|
| Tool-surface return shape | 5 | `answer.replace is not a function`, `.toMatch()` got object |
| Assistant conversation state | 5 | assistant turn never lands; unexpected `meta.ts` on messages |
| Wrangler registry EPERM | 3 | sandbox denies `~/Library/Preferences/.wrangler/` → 60s timeouts |
| BUG-32 scope literal | 1 | superseded scope restated in `kb.ts`, `fs-store.ts` |

The first two look like real product regressions from other work and want their own tickets — say the word and I'll file them.

## Still blocked
- **Conformance browser dimensions skip (15 tests).** `tools/generate`'s Playwright wants chromium build **1228**; only **1234** is installed, and network egress is blocked so it can't be downloaded. Not REQ-148's doing.
- `~/Library/Preferences/.wrangler/` writes denied.
- The sibling `xgd` repo: `report-bug` (create) works, but `.git/objects` and `.xgd/_locks` writes are denied, so `xgd ticket update` fails there.

Two things needing your call: the probe ticket **BUG-1217** in the xgd store needs deleting by hand (I can't close it), and the **main worktree still holds the now-duplicated stranded changes** — I left them rather than reverting someone else's checkout.

<!-- xgd-turn id="ceca655e-0f9e-435a-9f6c-2e08fe1387e1-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T23:43:47.795480+00:00" -->
#### You
please give me any install commands you need to run

<!-- xgd-turn id="ceca655e-0f9e-435a-9f6c-2e08fe1387e1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-19T23:44:38.186015+00:00" -->
#### Claude
Let me get the exact versions so the commands are precise.

One install command. The workspace pins Playwright **1.61.1**, and every browser you have is exactly one release too new:

| Engine | Needed (1.61.1) | Installed |
|---|---|---|
| chromium | 1228 | 1234 |
| chromium-headless-shell | 1228 | 1234 |
| firefox | 1532 | 1538 |
| webkit | 2311 | 2336 |

Run this outside the sandbox (needs network):

```bash
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-148/tools/generate
./node_modules/.bin/playwright install chromium firefox webkit
```

Using the local `./node_modules/.bin/playwright` matters — your ambient `npx playwright` is 1.62.0, which is what installed the 1234/1538/2336 set that 1.61.1 won't accept.

To verify it took:

```bash
ls ~/Library/Caches/ms-playwright/
# expect chromium-1228, chromium_headless_shell-1228, firefox-1532, webkit-2311
```

That unblocks 15 skipped conformance tests plus the browser-gated tests across ~20 more files (`req39`/`req41`/`req42`, `reconciliation-l1-substrate`, `req82`, `bug24`, `bug25`, and others). Chromium alone covers most of them; firefox and webkit are needed for the three cross-browser files (`req42-conformance-x-browser`, `reconciliation-l1-substrate`, `reconciliation-l1-language`).

Only run it in the main checkout too if you want the browser tests runnable there — the worktree has its own `node_modules`, but the browser cache is shared, so one install serves both.

The other two blockers aren't installs, they're sandbox permissions — add write access to `~/Library/Preferences/.wrangler/` (clears 3 files that currently hang to 60s timeouts) and to `/Users/martin/lagrangefoundry/xgd/.xgd/_locks/` (lets `xgd ticket update` work against the sibling repo, so I could close BUG-1217 myself).

<!-- xgd-turn id="455ed0c1-5a07-4939-9ff3-81cfeadd7ddc-user" -->

<!-- xgd-chat role="user" ts="2026-08-19T23:45:59.703635+00:00" -->
#### You
Shouuldn't I install it in working too? Feels weird to install it on a temporary branch

<!-- xgd-chat-end -->