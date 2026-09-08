---
uid: comment-6669c434
id: COMMENT-2312
type: comment
title: Comment on chat CHAT-43
created_by: xgd
created_at: '2026-09-08T00:06:33.335870+00:00'
updated_at: '2026-09-08T01:18:05.498483+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-80217782
  kind: chat_transcript
---

<!-- xgd-turn id="621cc88e-6f3b-4163-ae04-219882eae253-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T00:06:09.517645+00:00" -->
#### You
We created tools, I believe, for:
Website screenshoting
Website capture (download)

<!-- xgd-turn id="621cc88e-6f3b-4163-ae04-219882eae253-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T00:07:54.137379+00:00" -->
#### Claude
Yes — both exist, at three levels each (CLI, assistant tool, and Worker).

## Screenshotting

**CLI:** `1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop]` or `1c shot --url <url>`
- `tools/generate/src/cli/shot.ts` — the Node shell (render → serve on loopback → screenshot the *served* page, so `/assets/` resolve)
- `tools/generate/src/cli/capture/screenshot.ts` — the runtime-agnostic core (REQ-154), so a Worker can reach it

**Assistant tool:** `screenshot` on the `fidelity` surface (`ai/fidelity-surface.json`), plus `compare` (perceptual diff of two pictures) and `check_fidelity` (structural + value + pixel gates, reporting *disagreement*). A "picture" is a tagged union: `reference | draft | edit | revision | url`.

**Worker:** `apps/control-app/src/shot.ts` — the composition root for Cloudflare Browser Rendering; the only file naming `@cloudflare/puppeteer`. Note its header says *no route answers it yet*, deliberately — exposing a metered browser over HTTP was left to REQ-157.

## Capture

**CLI:** `1c capture page <url>` → `tools/generate/src/cli/capture/` (18 modules)

Writes a self-contained bundle: `capture.json`, per-viewport screenshots, raw + rendered HTML, mirrored assets, `multistate.json` (the multi-viewport ladder / acceptance oracle), `l1.json` (the ladder folded to one L1 doc), `forms.json`, `hints.json`.

**Worth flagging against your word "download":** it's *rendered-only* capture, not a site download. It records computed values and mirrors referenced assets (images, `.woff2`) — it does not reproduce a source tree. Assets a CDN intercept missed come back as `files: []`.

**Assistant tool:** `capture_site` on the same surface, with `list_references` / `describe_reference` alongside. Capturing also auto-writes a prose description so references are findable by what they *are*.

**Two things guarding it:**
- `capture/egress-guard.ts` (REQ-157) — `capture_site` is the first operation taking a URL *from the model*, so it's an SSRF surface. The guard sits at the driver's per-request seam, not on the typed URL, because a pre-flight check can't see a redirect to `169.254.169.254`. It's honest that it can't defeat DNS rebinding.
- The surface overview tells the model that captured text is a third party's writing — material to report on, never an instruction.

**Two driver backends** behind one `BrowserDriver` seam: `playwright-driver.ts` (laptop) and `cf-driver.ts` (Browser Rendering, with `withBrowserSession` leasing *one* browser per run because sessions are metered and rate-limited).

Downstream of a capture bundle sits the whole reproduction pipeline — `1c repro`, `refold`, `l1-gate`, `gate`, `values-diff`, `diff`, `aligned-crops`, `responsive-diff`, `adopt-gaps`.

<!-- xgd-turn id="936cdacc-2e99-49fe-b644-4d4368ca1182-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T00:08:35.582710+00:00" -->
#### You
So why is the AI telling me that it doesn't have them?

<!-- xgd-turn id="936cdacc-2e99-49fe-b644-4d4368ca1182-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T00:10:31.067602+00:00" -->
#### Claude
Good question — let me trace how surfaces actually get mounted for a running assistant.

Because it's telling you the truth. The tools exist, and the consultant is granted them — but the **deployed Worker never mounts the surface**, so the model is never told they exist.

## The chain

1. `ai/instances.json` grants `consultant` → `fidelity: ["SeeSite"]`, which is all six ops (`capture_site`, `list_references`, `describe_reference`, `screenshot`, `compare`, `check_fidelity`). ✅
2. `ai/host-core.ts:597` mounts it **conditionally**:
   ```ts
   ...(deps.fidelity ? [{ surface: await fidelitySurfaceFor(lib, deps.fidelity(slug)) }] : []),
   ```
3. `HostDeps.fidelity` is declared nullable — "or null where this deployment cannot take it" (`host-core.ts:275`).
4. **CLI** wires it: `ai/host.ts:193` → `fidelity: opts.origin ? (slug) => nodeFidelityDeps(...) : null`.
5. **Worker does not.** `workerHost()` in `apps/control-app/src/ai.ts:273–332` builds its `HostDeps` with `store`, `archive`, `junctions`, `audit`, `apiKey`, `extraSurfaces`, `ledger`, `priming`, `delta` — and **no `fidelity` key at all**.
6. `fidelityDeps()` is defined and exported at `apps/control-app/src/shot.ts:150` and is called from **nowhere in the repo**. Same for `r2ReferenceStore` — never constructed in the Worker.

## Why the model doesn't even hedge

This is REQ-126 working exactly as designed, and it's why the answer is a flat "I don't have that" rather than "I might". From `roles.ts`:

> the tool manual — PROJECTED from the surface declaration and this session's grant … **a session is never told about a capability it was not granted**
>
> a hand-written inventory of tools is precisely the text that is still describing last month's surface six weeks later, and it is worse than no inventory because the model believes it.

The role text deliberately enumerates nothing. So an unmounted surface isn't a tool the model has but can't find — it's a tool the model has never heard of.

## Was this on purpose?

It *was*. `apps/control-app/src/shot.ts`'s own header:

> **NO ROUTE ANSWERS THIS YET, on purpose.** A browser session is metered and the account has a concurrency cap, so exposing one over HTTP is a decision about rate limiting and authorisation rather than a wiring step, and it belongs to the ticket that gives the assistant the surface ([[REQ-157]]). What lands here is the capability and its proof.

But REQ-157 is the ticket that then wrote `fidelity-core.ts`, `fidelity-surface.json`, the egress guard, and the CLI wiring — it did the Node half and appears to have left the Worker half undone. That comment now reads as stale rather than as a live decision. (I couldn't confirm from REQ-157's body — it's not in the hot ticket set.)

## What's already in place

Almost everything:

- `[browser] binding = "BROWSER"` in `wrangler.toml`, for **both** dev (:287) and `env.production` (:370)
- `previewRenderer(store)` per-store in `router.ts:244`
- `egress-guard.ts`, `leasedDriverFactory`, `adoptCapture` — all built
- `r2ReferenceStore` exists in `tools/generate/src/store/`

The gap is roughly two call sites: construct the R2 reference store, and pass `fidelity: (slug) => fidelityDeps(env, previewRenderer(store), references, origin, slug, {}, adoptCapture)` into `workerHost`. The unresolved part is the one the comment flagged — rate limiting and authorisation on a metered browser.

Want me to scope that under CHAT-43 and wire it?

<!-- xgd-turn id="d550636a-f100-4b45-a4bf-4cc1d264c0d2-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:15:42.311752+00:00" -->
#### You
Can you create and REQ to mount the surface?

<!-- xgd-turn id="d550636a-f100-4b45-a4bf-4cc1d264c0d2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T01:18:05.068362+00:00" -->
#### Claude
Facts confirmed. Writing the ticket.

**REQ-206** — *The assistant's eyes in the builder: mount the fidelity surface on the Worker* (`request-0d4b67bf`, status `draft`, priority high, 3 points).

## What it asks for

The six `SeeSite` operations reaching a real consultant session in the builder, plus the two things that make them useful rather than nominal: captures landing in the client's own private per-business store, and each capture adopted as findable material (otherwise `capture_site` reports the bundle wasn't written up — half a feature).

## The decision it makes

`shot.ts` deferred this on "rate limiting and authorisation." The ticket splits those and answers both:

- **Authorisation — no new surface.** The original concern was exposing a browser *over HTTP*. This adds no route. The browser is reachable only inside a turn that's already admitted (session cookie or Access, per REQ-202) and already business-scoped, and `capture_site`'s egress guard already covers the model-chosen-URL problem at the per-request seam.
- **Rate limiting — the real exposure, and it's spend, not safety.** A responsive ladder is eight navigations. So: a per-session budget on live-page fetches; exhaustion is a *readable refusal of that one operation* with every other tool still working; counting follows the `SIGNIN_RATE_LIMIT` precedent. This makes the surface overview's existing "looking is not free and it is not instant" true rather than advisory.

I also wrote the technical consequences into the body explicitly — per-request reference store, builder origin from the request, the two-driver split (guarded factory gets **no** origin resolver, so a captured page naming our host can't be answered from our own store), and absent-browser staying absent-and-fine. That's so reconciliation doesn't discover them as undeclared drift.

## Two notes

**The `git push` failed** — sandbox proxy authentication, not a ticket problem. The ticket is committed locally and will need a push from outside the sandbox.

**I set `chat_comment` wrong and cleared it.** I passed the chat uid; the field takes a `comment-*` uid. Worth re-pointing at this conversation's comment if you want the trace.

I've left it at `draft` and haven't cut a branch or written code — say the word and I'll take it to `ready_to_implement` and free-code it. The one thing I'd want your call on first is the budget number, since it's the only genuinely arbitrary quantity in the ticket.

<!-- xgd-chat-end -->