---
uid: comment-a4e77428
id: COMMENT-1473
type: comment
title: Comment on bug BUG-37
created_by: xgd
created_at: '2026-08-24T21:09:26.563508+00:00'
updated_at: '2026-08-24T21:24:52.552595+00:00'
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

<!-- xgd-chat-end -->