---
uid: comment-a4e77428
id: COMMENT-1473
type: comment
title: Comment on bug BUG-37
created_by: xgd
created_at: '2026-08-24T21:09:26.563508+00:00'
updated_at: '2026-08-24T21:57:55.874085+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6612c4b7
  kind: chat_transcript
---

<!-- xgd-turn id="fbd51e19-aed0-4aef-8a9d-3b96dd6fe86e-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:09:21.293535+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="fbd51e19-aed0-4aef-8a9d-3b96dd6fe86e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T21:17:45.093252+00:00" -->
#### Claude
The ticket already carries a detailed hypothesis. Let me verify it against the actual code rather than taking it at face value.

The measurement contradicts the ticket's stated reason for Edit-vs-View. Let me widen.

Now let me try to actually reproduce inside real workerd, using the real xgd site definition.

Significant — the render is ~1ms; `loadDraft` is ~80ms and doesn't amortise. Let me break that down.

`assembleSite` (validation) is the whole cost. Let me check whether it scales linearly.

Investigation complete. Working tree is clean — no code changed. Here's what I found.

## Summary

The ticket's structural claim is correct: **the preview render cache really is dead in the Worker.** But its cost model is wrong, and the reason it gives for *Edit* failing while *View* doesn't is falsified by measurement. Fixing candidate (1) as written would recover about **2%** of a preview request.

## What I did

Imported the real `storage/sites/xgd` definition into a real D1 database inside **real workerd** (`vitest.workers.config.mts`, the same harness `test_UAT_FC_REQ-145_builder_in_workerd` uses) and drove the actual Worker `fetch`.

## Finding 1 — the dead cache is confirmed, and it barely matters

Five sequential `/preview/xgd/draft/` calls: `97ms, 79, 77, 76, 77`. No amortisation — every request re-renders, exactly as the ticket predicts.

But breaking one request down (real D1, real workerd):

| stage | cost |
|---|---|
| `version` + `readPages` + `assetNames` (D1) | **2–3 ms** |
| `assembleSite` — schema validation of the definition | **72–89 ms** |
| `renderSiteFiles` | **1–4 ms** |

The render — the only thing the `PREVIEWS` WeakMap protects — is ~2% of the request. Validation is ~95%.

## Finding 2 — the renderer cache structurally cannot avoid the expensive part

`PreviewRenderer.file()` calls `store.loadDraft(slug)` **unconditionally, before consulting its cache** (`preview.ts:108`), and that is deliberate — the stamp check has to be a store read. `assembleSite` runs inside `loadDraft` (`d1r2-store.ts:731-744`).

So even a perfectly re-keyed cache still pays ~75 ms per request. Candidate (1) is correct and worth doing (it closes the Node/Worker divergence at `builder.ts:103`), but it is not the fix.

## Finding 3 — Edit is the *cheaper* channel, so the stated Edit-vs-View reason is wrong

Measured on the real `xgd` definition:

| | files | total | per-page-load origin requests | render time |
|---|---|---|---|---|
| draft | 5 | 210.2 KB | 3 (html, theme.css, capabilities.js) | 1–5 ms |
| edit | 4 | **131.4 KB** | **2** (html, theme.css) | **1 ms** |

The edit channel emits **no client bundle at all** (`render.ts:280`, `clientJs = edit ? '' : getModuleClientJs()`), drops accent rules and reveal handles, and strips `href` targets. The edit page references exactly one URL — `./theme.css`. It is smaller, faster and makes fewer requests than View on every axis. "Edit is the larger render on the same dead cache" cannot explain the asymmetry.

## Finding 4 — the memory story doesn't survive the numbers

A whole `RenderedSite` is 131–210 KB of strings. Reaching the 128 MB isolate ceiling needs ~600 concurrent renders. A 12-request concurrent burst against `/preview/xgd/edit/` returned `200 ×12` in 890 ms. Validation scales **linearly** (~18 ms per page-copy at 2/4/8/16 pages) — no cliff.

## Finding 5 — the "~51KB" from the earlier probe is probably not an artifact

The ticket dismisses the earlier probe because `/edit/...` matches no route and falls through to `env.ASSETS`. But `dist-assets/` contains no `edit/` path (only `framework/edit-client.js`, `builder/editor.js`) and there's no `not_found_handling`, so ASSETS would 404, not return 200 with 51 KB. Meanwhile the measured edit `index.html` is **49.9 KB**. That's close enough that the earlier probe may genuinely have hit the edit render and got a clean 200 — i.e. the edit route works in isolation, and the kill needs the full browser context.

## Where this leaves the diagnosis

The recorded victim's **94 ms CPU / zero subrequests** now matches a single preview request almost exactly (binding calls don't count as subrequests in the analytics dimension, so a preview request *is* a zero-subrequest request). That's the one thing that got *stronger*.

94 ms is far under a paid-plan 30 s CPU limit and far over the free-plan 10 ms one. `wrangler.toml` declares no `[limits]` block, so **which Workers plan this account is on is now the most decision-relevant unknown** — and it's a question I can't answer from the repo.

Nothing at the origin distinguishes Edit from View in a way that makes Edit fail and View pass. Two candidates remain, and neither is resolvable by reading source:

- The asymmetry is a **browser-cache artifact** — preview responses carry no `Cache-Control`, so View's already-loaded URL gets heuristic caching while Edit is a fresh URL. Both would be equally broken at the origin.
- The killed request **isn't the preview request at all**.

So the ticket's own prerequisite — add `[observability]` (top level *and* under `[env.production]`), redeploy, reproduce once — is still right, and is now the *only* open path.

## What I'd propose changing about the candidate fixes

- **(1) re-key the cache** — do it, but as correctness/divergence cleanup, not as the fix. Recovers 1–4 ms of a 78 ms request.
- **New candidate: cache the *validated* definition**, keyed `(tenant, slug, version)`. `version` is already the stamp, so `siteRow` (~1 ms) still proves currency while the ~75 ms `assembleSite` is skipped. That turns a 78 ms request into ~5 ms and subsumes (1) entirely, since the render cache stops mattering.
- **(2) bound what a render holds / (3) stream the edit render** — look unnecessary on these numbers.

Two things I'd want before committing to a fix: the plan/CPU-limit answer, and the observability data. Shall I add the `[observability]` block (config-only, no ticket needed) so the next reproduction is actually readable?

<!-- xgd-turn id="39fb6724-8afe-4724-93d6-8ec03320c46c-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:21:06.858297+00:00" -->
#### You
I don't know if I am paying for this plan - can you check with the wrangler access you have

<!-- xgd-turn id="39fb6724-8afe-4724-93d6-8ec03320c46c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T21:23:21.012166+00:00" -->
#### Claude
Not authenticated (expired token, non-interactive, and this sandbox has no network access). Let me mine the local wrangler logs instead — 1727 runs are recorded there.

Wrangler can't answer it — but the ticket's own telemetry can. Let me verify one consequence first.

## Can't check it directly

`wrangler whoami` fails: the OAuth token in `~/Library/Preferences/.wrangler/config/default.toml` has expired and can't refresh in a non-interactive session, there's no `CLOUDFLARE_API_TOKEN` set, and this sandbox has no network access anyway (`allowedHosts: []`). So no API call is possible from here — that needs `wrangler login` in an interactive terminal, or a token in the env.

I mined the 1,725 local wrangler logs instead. No plan or usage-model field is ever recorded. The only deploy metric present is `Total Upload: 1621.41 KiB / gzip: 321.17 KiB`, which is under both plans' script-size caps and so doesn't discriminate.

## But you don't need the API — the ticket already answers it

The recorded victim **burned 94 ms of CPU**. A request cannot accumulate 94 ms of CPU under a ceiling lower than that; it gets killed at the ceiling. So this account's per-invocation CPU limit is **> 94 ms**, which rules out the Workers Free plan (10 ms). You're on a paid plan, and `wrangler.toml` declares no `[limits]` block, so the default applies — 30 s.

Corroborating independently: I measured ~78 ms CPU per preview request. Under a 10 ms ceiling, View would 1102 as reliably as Edit. View works.

## This inverts my previous conclusion

I flagged the plan as "the most decision-relevant unknown" because a free-plan 10 ms ceiling would have explained everything. It's settled, and it settles the wrong way for that theory: **with a 30 s ceiling and a 94 ms victim, the kill was not CPU exhaustion.**

1102 with trivial CPU means **memory** — and the ticket's instinct there was right even though the mechanism it proposed isn't. Workers memory is per-*isolate* and shared across concurrent requests, and an OOM kills **whichever request happens to be running when the ceiling is breached, not the one that caused it.** That is exactly the shape of the two facts that fit nothing else: a 94 ms / zero-subrequest victim, and death ~7 s *after* a 12-request burst. The victim was a bystander.

Which means I was looking in the wrong place when I dismissed memory on render size. A `RenderedSite` is 131–210 KB and is collectable — it's not the problem. What is *not* collectable is module-global state that lives for the isolate's life:

- `CHAT` (`router.ts:96`) — one `WorkerHost` per isolate, deliberately never per-request. `resetChatHost()` exists for tests only; nothing in production drops it.
- `managers`, `roles`, `baselines` (`host-core.ts:211,222,236`) — module-global `Map`s, never evicted, each holding a `SessionManager` that accumulates conversation history for as long as the isolate lives.

And that gives a far better answer to "why Edit and not View" than anything about render size, because it isn't about the mode's cost at all: **it's about when in a session's life you reach it.** Edit is what you do after the chrome has booted, the chat pane has opened a session, and turns have accumulated. View is what's on screen from the first second.

## Two caveats, since this is now load-bearing

- I'm treating "94 ms CPU" as belonging to the *specific* killed request. If that figure was actually an aggregate across invocations, the inference weakens considerably. Worth confirming where it came from.
- The isolate-lifetime-state theory is a hypothesis, not a verified finding. I haven't measured retained heap.

The `[observability]` prerequisite still gates everything — but the question it needs to answer has changed. It's no longer "which URL died"; it's "what does this isolate retain across requests, and does the kill correlate with isolate age and chat activity rather than with the preview route."

Want me to add the `[observability]` block (config-only, both top level and `[env.production]`)? And separately — worth me digging into `SessionManager`'s retention to see whether it's genuinely unbounded per isolate, before you spend a deploy cycle?

<!-- xgd-turn id="a9273f11-18c5-4039-8d66-d0b00ddf059d-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:24:52.458204+00:00" -->
#### You
ok I just upgraded to a paid plan (there was a 10ms limit). Am I good?

<!-- xgd-turn id="50296815-5a12-4b76-95ca-d687823c55d5-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:25:10.754097+00:00" -->
#### You
ok I just upgraded to a paid plan (there was a 10ms limit). Am I good? It seems to work

<!-- xgd-turn id="50296815-5a12-4b76-95ca-d687823c55d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T21:25:59.526333+00:00" -->
#### Claude
Yes — that was it, and my 94 ms inference was wrong. The free plan's 10 ms ceiling is exactly the right size to explain this: I measured **~78 ms CPU per preview request**, which blows a 10 ms limit by ~8×, on every single request. That matches the "100% reproducible" report precisely. Whatever the 94 ms figure was, it wasn't the killed request's CPU.

The upgrade takes you from 10 ms to the paid default of 30 s — about 3,000× headroom on a request that needs 78 ms. So the outage is genuinely resolved, not papered over.

One thing worth knowing: on the free plan, *everything* was marginal, not just Edit. `/api/sites`, `/api/copy`, publish — all of them route through the same `loadDraft`, all of them were over 10 ms. So the upgrade likely fixed things you hadn't attributed to this yet. (It also means "View worked" was probably browser caching — preview responses carry no `Cache-Control`, so View's already-loaded document was being reused while Edit was a fresh URL. That was the one fact I could never reconcile, and it's moot now.)

## But BUG-37 isn't fixed — the ceiling moved, the waste didn't

Both defects I measured are still live:

- **~95% of every preview request is re-validating the site definition.** `assembleSite` costs 72–89 ms and runs on *every* request, and no cache in the current design can avoid it: `PreviewRenderer.file()` calls `store.loadDraft()` before consulting its cache, deliberately, so the stamp check stays a store read.
- **The `PREVIEWS` WeakMap render cache is dead in the Worker** — confirmed empirically, five consecutive requests at ~77 ms with no amortisation. The Node/Worker divergence flagged at `builder.ts:103` is real and currently one-sided.

Practical impact now that you won't 1102: it's a ~80 ms latency floor on every preview byte, paid twice per page load and again on every editor save round-trip. It scales linearly at ~18 ms per page, so a site 5× the size of `xgd` costs ~390 ms per request — still far under 30 s, so this won't recur as an outage, but the editor gets progressively less responsive as sites grow. Cost isn't a concern: the $5 plan's included 30M CPU-ms is ~385,000 preview requests.

The fix I'd recommend is unchanged from my earlier note, and it's the one that actually matters — cache the *validated* definition keyed `(tenant, slug, version)`. `version` is already the stamp, so `siteRow` (~1 ms) still proves currency while the ~75 ms validation is skipped. That turns a 78 ms request into ~5 ms and subsumes the WeakMap re-keying entirely.

## How do you want to play the ticket?

Two reasonable options, and it's your call:

1. **Close BUG-37 as resolved by the plan upgrade**, and open a separate performance ticket for the validation cost and the dead cache. Cleanest, since the reported symptom is gone and the remaining work is a different thing.
2. **Keep BUG-37 open, re-scoped** to the performance defect, with the plan upgrade recorded as the mitigation.

Either way I'd like to correct the ticket body — its leading hypothesis (dead render cache → memory exhaustion) is falsified, and the measurements should be on record so the next person doesn't re-derive them. Say the word and I'll update it, preserving the existing content.

Separately, still worth doing regardless: adding `[observability]` (config-only, top level *and* `[env.production]`). You got lucky that this one was diagnosable from source and a plan page. The next one may not be.

<!-- xgd-turn id="2cb21d71-e731-4c17-910a-5d7df60dd738-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:29:01.073076+00:00" -->
#### You
If you have an easy way to fix the performance. go ahead

<!-- xgd-turn id="2cb21d71-e731-4c17-910a-5d7df60dd738-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T21:43:24.827622+00:00" -->
#### Claude
Let me follow the free-coding protocol properly. First, the process doc and a correctness check on the invalidation key.

Process understood. Let me check the version-bump gate and current version before starting.

Now Step 1 — update the ticket body to reflect the confirmed root cause and this fix's scope.

Now the implementation.

Typecheck is clean for my change (the two errors are pre-existing generated-file artifacts absent in a fresh worktree). Now the UATs.

Now the UAT suite.

Test fixture bug — `siteJson.name` isn't a schema field, so the validator strips it and nothing actually changes. Let me mutate real content instead.

Let me verify these UATs actually fail without the fix.

Now let me measure the actual improvement through the Worker, and run the full suite for regressions.

Before: every request ~77 ms. After: ~2–5 ms warm, and the 12-request concurrent burst went **890 ms → 18 ms**. Now the full suite.

33 node failures — I need to know whether they're mine. Let me get the failing file list, then compare against the same worktree with my change stashed.

Baseline without my change fails **6** files; with it, **5** — a strict subset. All pre-existing (worktree artifacts); no new failures. Now the quality gate and version bump.

Quality gate: **SUCCESS** (0 errors, 0 warnings). Now the version bump and commit.

Done and landed on `xgd-working`.

## What the fix does

`assembleSite` — `validateSite` over the whole definition — was running once per preview *byte*, because `PreviewRenderer.file()` calls `loadDraft` before consulting its render cache (deliberately: the stamp check has to be a store read). That put ~75 ms of validation on a path no cache could reach.

The assembled value is now memoised per isolate in `d1r2-store.ts`, keyed `(tenantId, slug)`, holding `{ version, result }`. `siteRow` still runs on every `loadDraft` (~1 ms) and its `version` is compared before the entry is used — so currency is proven by a live D1 read, not assumed. Every draft mutation ends with `version = version + 1`, asset writes included, so nothing that changes the assembled value leaves the version still. Because the check is a D1 read rather than isolate state, a write from **another isolate or `bin/publish` from a laptop** invalidates it correctly too.

Two properties I was deliberate about:

- **It caches data, never a store handle.** That's what makes it safe where re-keying the router's `PREVIEWS` WeakMap would not be — a cached `PreviewRenderer` would read through a tenant check predating the request, which is exactly the staleness `storeFor` refuses. `forTenant` still runs per request, so a deactivated tenant is still turned away.
- **Keyed by site and replaced on version change**, not keyed by version and accumulated — so it holds at most one entry per site and can't grow with edit count. That distinction is the difference between a cache and a leak.

I left `PREVIEWS` dead on purpose. Re-keying it would trade the tenant-deactivation guarantee for the 1–4 ms the render now costs. That's recorded on the ticket.

## Measured, in workerd through the Worker's own `fetch`

| | before | after |
|---|---|---|
| warm preview request | ~77 ms | **2–5 ms** |
| 12-request concurrent burst | 890 ms | **18 ms** |

Cold first request still pays one assemble (~100 ms), as it must.

## Verification

- **6 UATs**, `test_UAT_FC_BUG-37_*`, in real workerd against real D1 — pass.
- **RED-checked**: with the memo disabled, `..._an_unchanged_draft_is_assembled_once` fails. The other five pass either way by design — they're the invalidation guards (write, cross-handle write, cross-tenant, forget/recreate, end-to-end save through `/preview/<slug>/edit/`), and they'd fail if the cache were *wrong* rather than merely absent. They assert object identity rather than timing, since a timing assertion for a perf fix is flaky by construction and identity is the deterministic form of the same claim.
- Full workers suite: **69/69**.
- Node suite: 5 failing files, against **6** on the same worktree with my change stashed — a strict subset, all pre-existing worktree artifacts.
- `xgd quality run`: SUCCESS, 0 errors, 0 warnings.

## Ticket

BUG-37 is at `free_coded`, commit `2058a16`, version bumped to 0.2.11, branch merged and cleaned. The body now records the confirmed root cause (free-plan 10 ms ceiling vs ~78 ms/request), the fix, and — kept explicitly — the falsified original hypothesis and my wrong "94 ms proves it isn't the free plan" inference, so nobody re-derives either.

Two things I did **not** do, both still open:

- **`[observability]` is still absent** from `wrangler.toml` (top level *and* `[env.production]`, which inherits nothing). Config-only, no ticket needed — say the word.
- **Promotion to `ready_to_reconcile` is yours.** I've left it at `free_coded` deliberately; setting it fires `xgd reconcile` within ~30 seconds.

One caveat worth stating plainly: this is verified in workerd via Miniflare, not against production. The measurements are real and the correctness UATs are real, but the deployed behaviour is unverified until it ships.

<!-- xgd-turn id="6db0f3f2-3ff6-48de-8bf5-1c20f8ff88b3-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T21:51:28.450678+00:00" -->
#### You
sure add observability?

do I need to rebuild and redeploy to apply your fix?

<!-- xgd-turn id="6db0f3f2-3ff6-48de-8bf5-1c20f8ff88b3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T21:57:55.851417+00:00" -->
#### Claude
Both — let me check what UATs pin `wrangler.toml` first, since several assert its shape.

The parser ignores tables without a `binding` key, so `[observability]` is safe for the existing UATs. Since this file pins every inheritance trap with a test — and a dropped `[env.production]` repeat would silently lose production logs again, which is the whole bug — I'll add the UAT too. That makes it code, so: branch, per protocol.

Careful — that insertion point would swallow the `routes` key into the new table. Let me check.

Good catch — `routes` got swallowed into the new table. Fixing.

Structure is correct — `routes` stayed on `[env.production]`. Now the UAT.

My own comment text contains the literal `[env.production]`, so the slice started at the wrong place. Anchoring to line start.

All 66 pass. Now the deploy dry-run to prove wrangler itself accepts the config.

Dry-run passes (the `ACCESS_DEV_OPEN` warning is the intended, UAT-asserted security control). Committing.

Now updating the ticket body — the "Still outstanding" section is no longer accurate.

Both commits are ancestors and the code is on disk. Let me diagnose the version gate.

The gate expects the tip to be my own commit, but my ticket-body update landed after the merge. Its prescribed remedy is a fresh bump. Taking the session lock for a one-line change rather than cutting a branch.

Both changes are in and BUG-37 is back at `free_coded` with all three commits recorded.

## Yes — you need to redeploy

Nothing is live yet. Both changes require it, for different reasons:

- **The store fix is Worker source.** `wrangler deploy` rebuilds from source at deploy time and does *not* consume `dist/` — the repo's own `bin/build` says so explicitly. So the bundle I verified is evidence, not input.
- **The observability block is deploy-time config**, read from `wrangler.toml` when the Worker is uploaded.

```bash
bin/build            # preflight → 1c assets → typecheck → bundle
bin/deploy control-app
```

`bin/deploy` does **not** build — it runs its `deploy.d/` hooks (D1 migrations, secrets) and uploads. So run `bin/build` first; `apps/control-app/src/generated/` and `dist-assets/` are gitignored and the Worker imports two of them. `bin/deploy --dry-run` rehearses the same path if you want a look first.

One blocker: **your wrangler token is expired** — that's why I couldn't check the plan earlier. You'll need `wrangler login` in an interactive terminal before either command will work.

After deploying, the thing worth checking is that the 1102 diagnosis was complete: pull the invocation logs (now retained) and confirm preview requests land at single-digit milliseconds.

## Observability

Declared at the top level **and** under `[env.production]`, with `head_sampling_rate = 1`. `observability` is on wrangler's inheritable list, so the production repeat is redundant today — I wrote it anyway because this file's standing rule is that nothing depends on remembering which keys inherit, and losing that declaration fails silently: the deploy succeeds and the logs are just gone.

Worth flagging: **I made a real mistake here and the test caught it.** My first placement put `[env.production.observability]` before `routes`, which a TOML table header swallows — the file still parses, wrangler still deploys, and the production route silently stops being declared. I caught it on inspection, verified with `tomllib` that `routes` now sits on `[env.production]`, and wrote `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table` to reproduce it. RED-checked: reintroduce the bad ordering and that test fails.

4 UATs, all passing. The neighbouring `wrangler.toml` UATs (REQ-143/144/145/147, public-site, naming) still pass — 66 tests. `wrangler deploy --env production --dry-run` resolves with every binding present; the `ACCESS_DEV_OPEN` warning it prints is the intended, UAT-asserted security control.

## Ticket

`free_coded`, version 0.2.13, three commits: `2058a16` (store memo), `0fe586d` (observability), `999579b` (version bump). The body now covers the observability work and states plainly that neither change is live until redeploy.

The third commit needs explaining: the free-coded gate compares the version at the tip of `xgd-working` against the recorded SHAs, and my ticket-body update auto-committed *after* the merge — moving the tip to a commit carrying 0.2.12 without having introduced it. The gate's own remedy is a fresh bump, which is what that commit is. Worth knowing for future sessions: ticket writes after a merge but before `move-to-free-coded` will trip this every time.

Promotion to `ready_to_reconcile` is still yours — it fires `xgd reconcile` within ~30 seconds.

<!-- xgd-chat-end -->