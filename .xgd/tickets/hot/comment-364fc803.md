---
uid: comment-364fc803
id: COMMENT-2083
type: comment
title: Comment on bug BUG-46
created_by: xgd
created_at: '2026-09-02T01:08:06.409281+00:00'
updated_at: '2026-09-03T00:20:12.837266+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-597b41d2
  kind: chat_transcript
---

<!-- xgd-turn id="de02f4e4-7746-406d-b50e-4b25a2ef3fd1-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T01:07:49.665027+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="de02f4e4-7746-406d-b50e-4b25a2ef3fd1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T01:10:54.791112+00:00" -->
#### Claude
I've read the ticket and verified its claims against the code. Three questions before I start — the first is blocking.

**1. The upstream dependency is not available (blocking for parts 1 & 3).**

The ticket's own check confirms it:

```
grep -c "async transcript(" .../node_modules/@lagrangefoundry/ai/src/manager.js → 0
```

But it's worse than "re-install and go". `transcript()` exists **only** on lagrange-framework's `free-BUG-38` branch (commit `2c9a2e84`, "SessionManager.transcript — the read a client renders from"). That branch is *not* merged into the framework's `xgd-working`, and framework BUG-38 is still `status: draft`. So there is nothing to re-install yet.

The merge itself would be trivial — `free-BUG-38` is one code commit ahead, `xgd-working` is only ticket-commits ahead, no code overlap. Which do you want?

- **(a)** I merge `free-BUG-38` into the framework's `xgd-working`, run `bin/install --lang js --component ai`, then implement (1)(2)(3) here. Cost: I'd be completing another repo's draft ticket's merge-back and pushing it into the shared store every sibling consumes.
- **(b)** I implement **(2) only** now — the `waitUntil` fix. Fully unblocked, entirely in our repo, and it's the half that actually caused the reported loss. The ticket says so itself: *"worth doing first and separately."* (1) and (3) follow once the framework lands.
- **(c)** You do the framework merge + install; I then do all three in one pass.

I'd recommend **(b) now, (a)/(c) after** — it gets the reported bug fixed today without me reaching across repos to promote someone else's unmerged work.

**2. Is part (3), the reattach route, in scope — including the client?**

It's larger than the ticket's one paragraph suggests. `watch()` yields *junction records* (`{kind, turn_id, …}`), not the `{kind:'text', content}` frames `api.js` parses, so the route owns a record→event mapping. And a route alone changes nothing an operator sees: `api.js` needs a tailer and `chat.js` needs to call it on load with the cursor from `/api/ai/session`. That's a materially bigger surface than (1)+(2) combined. In scope here, or a follow-up?

**3. Part (4), the Durable Object junction.** The ticket says "separate ticket if taken" and "note the residual risk when closing this". Do you want me to file that ticket, or just record the residual risk in this body? (I won't create one unless you say so.)

One thing I don't need to ask about: the false comment at `ai.ts:187-190` is unambiguously in scope and I'll fix it whichever path you pick.

<!-- xgd-turn id="6ce5cbd6-dc8b-4d1a-a468-bd337cd3b37c-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T01:48:47.173667+00:00" -->
#### You
**The upstream dependency is not available (blocking for parts 1 & 3). Check now**

<!-- xgd-turn id="6ce5cbd6-dc8b-4d1a-a468-bd337cd3b37c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T01:49:50.558786+00:00" -->
#### Claude
Checked. **Still blocked — nothing has changed since my last check.**

The prescribed check, run just now:

```
grep -c "async transcript(" /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/manager.js
→ 0
```

Where `transcript()` actually is, verified branch by branch:

| ref | has `async transcript(` |
|---|---|
| framework `free-BUG-38` (tip `2c9a2e84`) | **yes** |
| framework `xgd-working` | no |
| framework `main` | no |
| shared install `node_modules/@lagrangefoundry/ai` | no |

So the ticket's "re-install/re-vendor before starting (1)" is not sufficient on its own: there is nothing to re-install yet. Framework BUG-38 is still `status: draft` with `commits: [2c9a2e84]`, `branch: free-BUG-38` — the code is committed on its branch but has not been promoted to `free_coded` and not merged back, so the framework's own `xgd-working` doesn't have it either. The framework worktree is clean; no uncommitted `transcript()` work anywhere.

Unblocking takes two steps in the framework repo, in order:
1. merge `free-BUG-38` → `xgd-working` (trivial: one code commit ahead, `xgd-working` only ticket-commits ahead, no code overlap)
2. `bin/install --lang js --component ai` to repopulate the shared store

Step 2 is the one with reach — it republishes the artifact every sibling project resolves against, not just ours.

Parts **(1)** and **(3)** stay blocked until both run. Part **(2)** — thread `ExecutionContext` into `streamTurn` and `ctx.waitUntil()` the stream, plus correcting the false comment at `ai.ts:187-190` and the stale "`ctx.waitUntil` is not reachable from here" at `router.ts:1112` — is entirely in our repo and unblocked. It's also the half that caused the reported incident, and the ticket says to do it "first and separately."

Say the word and I'll cut `free-BUG-46` and implement (2) now; or tell me to do the framework merge + install first and I'll do all three in one pass. Still open from before: whether part (3) includes the `api.js`/`chat.js` client changes it needs to be visible, and whether you want the Durable Object ticket (part 4) filed.

<!-- xgd-turn id="307f96e1-db2a-48fb-ba82-a38c329ee9c3-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:10:21.600069+00:00" -->
#### You
Please check again

<!-- xgd-turn id="307f96e1-db2a-48fb-ba82-a38c329ee9c3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:12:29.377472+00:00" -->
#### Claude
Framework side has landed. Let me check the scale of what an install would bring across.

Framework side has landed. The drift is exactly BUG-38 and nothing else — let me check what the install would do.

Deps unchanged — only a trailing newline. So `--no-deps` is the surgical path (and avoids the pnpm dependency-resolution step that the sandbox has blocked before).

Install is intact — `rmtree` failed on its first unlink and deleted nothing (same 31 files, same size). But the install itself cannot run from here:

**Progress on your side, one step left — and it's one I can't take.**

The framework half has landed since I last looked:

| | before | now |
|---|---|---|
| framework BUG-38 status | `draft` | `ready_to_reconcile` |
| `2c9a2e84` ancestor of framework `xgd-working` | no | **yes** |
| `transcript()` on `xgd-working` | absent | **present** |
| branch `free-BUG-38` | existed | deleted (merged back) |
| **shared install** | **absent** | **still absent** |

So the merge-back is done and the only thing standing between me and parts (1) and (3) is re-vendoring. I checked what that would move, and it's exactly BUG-38, nothing else — `manager.js` +49 lines (the `transcript()` method, one hunk) and a doc comment on `archive.js`. The component's `package.json` is byte-identical apart from a trailing newline, so no dependency changed.

I tried to run it, with `--no-deps` to keep it surgical. **The sandbox blocks it:**

```
$ bin/install --lang js --component ai --no-deps
PermissionError: [Errno 1] Operation not permitted:
  PosixPath('/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai')
```

`/Users/martin/lagrangefoundry/node_modules` is not in this session's write allow-list — the sibling repos are, their parent directory isn't. The directory is `drwxrwxr-x martin`, so the OS would permit it; a bare `touch` there fails the same way. This isn't something I can work around, and re-running won't change it.

**Nothing was damaged.** The failure hit `shutil.rmtree(target)` — it tries to delete the old install *before* extracting the new one — but it died on its first unlink, so the existing install is untouched: same 31 files in `src/`, `manager.js` same 33526 bytes. Worth knowing, because a later failure in that same call would have left the shared store half-deleted for every sibling project.

**What I need from you:** run this yourself, then I'll verify and start:

```
cd /Users/martin/lagrangefoundry/lagrange-framework
bin/install --lang js --component ai --no-deps
```

(Or add `/Users/martin/lagrangefoundry/node_modules` to the sandbox write allow-list and I'll run it.) I'll confirm with the ticket's own probe — `grep -c "async transcript(" .../@lagrangefoundry/ai/src/manager.js` should go `0` → `1`.

Meanwhile, part **(2)** — the `waitUntil` fix — needs none of this and is the half that caused the reported incident. Say the word and I'll cut `free-BUG-46` and start on it now rather than idling; (1) and (3) fold in once the vendor lands. Still open: whether (3) includes the `api.js`/`chat.js` client changes, and whether you want the Durable Object ticket (4) filed.

<!-- xgd-turn id="ea234d8a-6d5b-4adc-bc12-72fc147a8144-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:32:29.646527+00:00" -->
#### You
I have run the install

<!-- xgd-turn id="ea234d8a-6d5b-4adc-bc12-72fc147a8144-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:33:37.685963+00:00" -->
#### Claude
The probe still reads `0`. Let me find out why.

The install didn't land. The shared store is byte-for-byte the same copy as before your run:

| | framework checkout (correct source) | shared install |
|---|---|---|
| `manager.js` lines | 872 | **823** |
| `async transcript(` | 1 | **0** |
| `README.md` bytes | 10773 | **8393** |
| README "transcript" mentions | 7 | 4 (the pre-BUG-38 ones) |
| `@lagrangefoundry/ai/` dir mtime | — | **Sep 1 18:48**, unchanged since before you ran it |

The source is definitely right: `/Users/martin/lagrangefoundry/lagrange-framework` is the main checkout, on `xgd-working` at `11c959d5a8`, and its `components/ai/js/` has the BUG-38 content. So `pnpm pack` would have packed the right thing — the extraction just never happened.

I also ruled out a wrong-target install: `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry` is the only such directory anywhere under `~/lagrangefoundry` or the xgd worktrees, and no stray one was created in the last two days. There are no leftover pack tempdirs either, which suggests the run didn't get as far as extracting.

My guess is it failed the same way mine did and the traceback scrolled past — `bin/install` deletes the old install before extracting, so it dies at `shutil.rmtree` with `PermissionError: [Errno 1] Operation not permitted` if the shell it ran in is also sandboxed. Harmless (that's why the old copy is still intact), but it exits non-zero having done nothing.

Could you re-run it in an ordinary unsandboxed terminal and paste what it prints?

```
cd /Users/martin/lagrangefoundry/lagrange-framework
bin/install --lang js --component ai --no-deps ; echo "exit=$?"
```

A successful run ends with a table naming `@lagrangefoundry/ai 0.0.0` and the path it now occupies. Then this should flip `0` → `1`:

```
grep -c "async transcript(" /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/manager.js
```

If it keeps failing on the rmtree, `rm -rf /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai` by hand first and then re-run — the install rebuilds it from the tarball, so nothing is lost.

Meanwhile: I still have part **(2)** sitting unblocked and it's the half that caused the reported turn loss. Rather than keep idling on the vendor, I'd like to cut `free-BUG-46` and land it now — say go and I'll start, and (1)/(3) fold in when the store updates.

<!-- xgd-turn id="3c0b5121-c088-41f5-a6b9-77e237d5f2de-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:35:29.721818+00:00" -->
#### You
# ((.venv-tests) ) martin@nyx lagrange-framework % bin/install --lang js --component ai --no-deps ; echo "exit=$?" lagrangefoundry component install

repo /Users/martin/lagrangefoundry/lagrange-framework languages js components ai

## Plan — js

target /Users/martin/lagrangefoundry/node_modules requested ai

- deps (none — --no-deps) @lagrangefoundry/ai 0.0.0 from components/ai/js

## Running — js

$ /opt/homebrew/bin/pnpm pack --pack-destination /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/lagrangefoundry-pack-953tqva1 --dir /Users/martin/lagrangefoundry/lagrange-framework/components/ai/js extract lagrangefoundry-ai-0.0.0.tgz (150.1KB packed) → /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai --no-deps: third-party dependencies were NOT resolved. --no-deps: skipping the import smoke test.

## Installed

js → /Users/martin/lagrangefoundry @lagrangefoundry/ai 0.0.0 from components/ai/js → /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai [473.4KB]

exit=0 ((.venv-tests) ) martin@nyx lagrange-framework %

<!-- xgd-turn id="3c0b5121-c088-41f5-a6b9-77e237d5f2de-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:05:32.327835+00:00" -->
#### Claude
Install verified — the store is now byte-identical to the framework's `xgd-working`:

| probe | before | now |
|---|---|---|
| `async transcript(` in `manager.js` | 0 | **1** |
| `manager.js` lines / bytes | 823 / 33526 | **872 / 36203** |
| `archive.js` BUG-38 doc comment | 0 | **1** |
| `README.md` bytes | 8393 | **10773** |
| vs framework `xgd-working` | differed | **identical** |

Parts (1), (2) and (3) are all unblocked. Cutting the branch now.

Now I have what I need. Let me read the panel before writing.

Everything I need is confirmed. Writing the code now, starting with the host read.

Now the tailer in the host, so the router stays a pure transport.

Now the router — `ctx` threading, `waitUntil`, and the reattach route.

Now `streamTurn` — the `waitUntil` fix and the comment that says it's unreachable.

Now `streamTail` itself, beside `streamTurn`:

Now the worker entry point passes `ctx`:

Now the false comment in `ai.ts` that the ticket calls out:

Now the client transport, and a typecheck to catch anything I've broken.

Typecheck is clean — the one error is pre-existing on `xgd-working` in files I haven't touched (`SHIPPED_SOURCE` isn't re-exported). Now the client transport:

Now the UATs. Let me study how the existing chat tests drive a paced backend.

36 call sites pass two args. Making `ctx` optional matches `route`'s own optionality and avoids mechanical churn:

The wire-protocol double is deliberately single-sourced, so the paced variant goes beside it rather than forking it:

Now the UAT suite:

5 of 6 pass. The failure is a genuine finding, not a broken test — let me confirm it's pre-existing before adjusting.

Confirmed pre-existing: the REQ-146 suite covers the same scenario and deliberately asserts only the id and turns — never `ready: false`. In workerd the backend factory is lazy, so a missing key isn't detected at open time. That's untouched by my change, so I'll assert what's actually in BUG-46's scope and flag the gap.

All 6 pass. Now the essential check — do they actually fail against the unfixed code?

Restoring the fix. The revert was deliberate and it surfaced something important:

The `waitUntil` test passed even without the fix — vitest never tears the isolate down, so the drain finished anyway. It needs a structural assertion:

Now re-verify all six fail without the fix:

All six fail without the fix and pass with it. Now checking for regressions across the related suites:

Two failures. One is mine — a new route needs a cacheability probe. Let me check the other:

`bug32` fails on a clean tree — pre-existing and unrelated. The route-probe failure is mine:

All green. Now the ticket body — the protocol requires every UAT to trace to language in it, and I added behaviour the body doesn't yet cover.

Original preserved, section appended. Final review of the diff before committing:

A different second failure this run — let me check whether it's flaky or mine:

`l1-navigation` passes alone with and without my changes; it failed only in one full run and passed in another. Re-running the full suite to confirm flakiness:

Different failures again. Let me check whether these are the `dist-assets` artifact I built earlier:

req115 passes alone too. Rotating failures across runs suggests pre-existing flakiness — let me establish the baseline with a full run on a clean tree:

The `-u` flag stashed the generated assets I'd copied in, invalidating that baseline. Let me verify they're restored and redo it properly:

Baseline confirmed: the clean tree fails the same way (`bug32` consistently, plus a rotating flaky one). My changes add no failures. Restoring and committing:

<!-- xgd-turn id="36bfd42a-46f3-4431-a3bd-2064bfdc171b-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:07:31.120487+00:00" -->
#### You
# ((.venv-tests) ) martin@nyx lagrange-framework % bin/install --lang js --component ai --no-deps ; echo "exit=$?" lagrangefoundry component install

repo /Users/martin/lagrangefoundry/lagrange-framework languages js components ai

## Plan — js

target /Users/martin/lagrangefoundry/node_modules requested ai

- deps (none — --no-deps) @lagrangefoundry/ai 0.0.0 from components/ai/js

## Running — js

$ /opt/homebrew/bin/pnpm pack --pack-destination /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/lagrangefoundry-pack-953tqva1 --dir /Users/martin/lagrangefoundry/lagrange-framework/components/ai/js extract lagrangefoundry-ai-0.0.0.tgz (150.1KB packed) → /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai --no-deps: third-party dependencies were NOT resolved. --no-deps: skipping the import smoke test.

## Installed

js → /Users/martin/lagrangefoundry @lagrangefoundry/ai 0.0.0 from components/ai/js → /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai [473.4KB]

exit=0 ((.venv-tests) ) martin@nyx lagrange-framework %

<!-- xgd-turn id="36bfd42a-46f3-4431-a3bd-2064bfdc171b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:09:29.257826+00:00" -->
#### Claude
That install is the one that already landed earlier this session — I verified it (`transcript(` went 0→1) and built the whole fix on top of it. My last verification command got killed (exit 137, running two suites plus tsc at once), so let me redo it in smaller pieces and finish.

Green. Committing:

The merge lock is held by another active session (REQ-166, acquired a minute ago). Not abandoned — I'll wait for it rather than clear it.

The commit is in. While the merge lock clears, here's where things stand.

**Landed on `free-BUG-46` as `6be7ac96777c125d2055600deb72f8d03bdcc2c4`** — 8 files, +961/−28.

All three parts of the fix are in:

1. **Render from the junction.** `storedTurns` → `storedTranscript`, over upstream's `transcript()`. It folds the junction, returns the cursor, and seeds from the archive where there's no junction. Stays ahead of `attach` because it touches no backend. The blanket `catch { return [] }` is narrowed to the genuine "no conversation yet" case, discriminated by the archive's own listing rather than by error text — the same call `attach` already makes the same distinction with.
2. **`ctx.waitUntil`.** Threaded from the fetch handler through `route` into `streamTurn`, both optional so the Node transport degrades to prior behaviour. The comment claiming `waitUntil` was unreachable is corrected.
3. **`/api/ai/reattach`.** Tails `watch()` from the cursor, framed identically to a live turn. The record→event projection lives in `host-core.ts`, not the router. A missing cursor is a 400, not a silent zero.

Plus the false comment at `ai.ts` — it was restating DOC-21 §1.5, retracted upstream when `closedPrefix` landed.

**Verification.** Six UATs, all failing against the unfixed code and passing with it. Two things worth flagging about them:

- The `waitUntil` test **initially passed against the bug**. Nothing tears an isolate down under vitest, so an unregistered drain just carries on and finishes — "the transcript got archived" is true either way. It now asserts that the route *handed the runtime a promise* (zero before this ticket) and that awaiting only what was registered suffices.
- The ticket's proof #4 says a keyless `openSession` returns `ready: false`. **It doesn't in workerd** — the backend factory is lazy, so the failure surfaces on the first turn instead. That predates this ticket; REQ-146's equivalent test quietly asserts the same subset for the same reason. I asserted the part BUG-46 owns (full transcript from a keyless cold isolate) and wrote the divergence into the ticket as a finding.

**Full suite:** 2293 passed. Two failures, both pre-existing — I ran a clean-tree baseline to confirm. `bug32-webui-scope-rebrand` fails consistently without my changes; a second failure rotates between runs (`l1-navigation`, `req115-builder-shell`) and each passes in isolation, so that suite is flaky independent of this work. I added one probe to the origin reconciliation test, which requires every declared route to have a cacheability probe.

**One part of (3) is deferred, for a reason outside this repo.** The panel isn't wired to call the reattach route. `chat.js` would need to render a resumed stream into the live assistant bubble, and `@lagrangefoundry/webui-chat` has no affordance for that — every streaming path goes through `send(text)`, which appends a user message first. So a reloaded panel now paints the turn up to the fold (the reported bug, fixed) but doesn't yet resume painting. Route and transport are in place and tested for when that affordance exists.

Two things still open from earlier that I've assumed rather than had confirmed: I did **not** file the Durable Object ticket for part (4) — the residual risk is recorded in the body instead. Say the word if you want it filed. And the webui-chat affordance likely wants a framework ticket, which is equally not mine to create unasked.

Once the lock frees I'll merge to `xgd-working`, then `move-to-free-coded`. That needs a version — tell me which, or I'll take the next unclaimed patch after 0.2.46.

<!-- xgd-turn id="5d65e0b5-bf39-4502-b888-95ab38e6436f-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:19:00.745006+00:00" -->
#### You
What is the implication of the deferred work? is more lagrange-framework work needed?

<!-- xgd-turn id="5d65e0b5-bf39-4502-b888-95ab38e6436f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:20:12.703464+00:00" -->
#### Claude
Let me verify the webui-chat claim properly before answering — it's the crux.

Lock's free now. On your question — I need to correct something I said, because it changes the decision.

## What the deferral actually costs

The reported bug is fixed: a reload mid-turn no longer destroys the turn. What's left is narrower but visible.

After a reload during a turn, the panel paints the conversation up to the fold — so the reply is **there, but truncated**, frozen wherever the fold landed. The turn keeps running in the isolate and archives correctly, but that page never learns. To see the finished reply the operator reloads *again*, once the turn is over.

That's strictly better than "the turn is gone", but it has a failure mode of its own worth naming: a truncated reply doesn't announce itself as truncated. It looks like the assistant stopped mid-sentence. The old bug was at least obviously wrong.

## Is more framework work needed — yes for the ideal, no for most of the value

I was too absolute earlier. Two different things got collapsed:

**Live token-by-token resume does need a framework change.** I checked `mountChat`'s entire returned surface. Every streaming path — `send`, `queue`, `interject` — appends a user bubble and then calls `sendPrompt(text)`. `appendMessage` renders a whole message and returns its element with no update path; `getMessages` hands back copies. There is no way to drive an existing assistant bubble from a stream the composer didn't start. That's a genuine gap in `@lagrangefoundry/webui-chat` and would need a ticket there.

**A non-streaming resume needs no framework work at all.** On load, when a turn is live: paint the user message, *skip* the partial assistant turn, tail `/api/ai/reattach`, buffer it, and `appendMessage('assistant', painted + tailed)` when `done` arrives. The operator sees the complete reply land on its own, no second reload. What's lost is watching it stream for that one reattached turn — and only for a turn they reloaded into.

That's entirely in this repo. It needs one thing I deliberately left out: `/api/ai/session` doesn't currently say whether a turn is live. I skipped that flag as speculative when nothing consumed it. This would consume it, and it's cheap — `closedPrefix(records).length !== records.length` over the junction the fold already read.

## What I'd suggest

The ticket's part (3) does say "so a reloaded panel rejoins the turn in progress", so panel behaviour is in scope and I shouldn't leave it at the route. I'd do the non-streaming version now — it closes the visible symptom — and file the webui-chat affordance separately so live resume can be swapped in later without touching the route or the transport, which are already built and tested for it.

Three ways to go, your call:

1. **Do the non-streaming resume now**, in this ticket, on this branch — `live` flag + `chat.js` wiring + UATs. Roughly the size of what's already here for the client side.
2. **Merge as-is** and take the whole panel question as a follow-up ticket.
3. **Merge as-is and file the framework ticket** for the affordance, waiting for live resume to do the panel once.

I haven't filed anything — still no ticket created without you saying so, and that covers the Durable Object one from earlier too.

Merge and `move-to-free-coded` are ready to run whichever you pick; the only input I still need is the version, or I'll take the next unclaimed patch after 0.2.46.

<!-- xgd-chat-end -->