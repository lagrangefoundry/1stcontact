---
uid: comment-6669c434
id: COMMENT-2312
type: comment
title: Comment on chat CHAT-43
created_by: xgd
created_at: '2026-09-08T00:06:33.335870+00:00'
updated_at: '2026-09-08T03:10:40.906904+00:00'
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

<!-- xgd-turn id="6cdc4c54-69d4-4f3d-b29c-d2932b029b1c-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:25:56.851264+00:00" -->
#### You
Claude has a websearch and a webfetch tool - any idea how that works? Can we create something similar? Are there websearch APIs we could call?

<!-- xgd-turn id="6cdc4c54-69d4-4f3d-b29c-d2932b029b1c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T01:28:09.506000+00:00" -->
#### Claude
Three questions, and the middle one has a much better answer than you'd expect. Let me check the provider situation and pull the current API reference.

False positive ("coherent" matched `cohere`). This is an Anthropic-only codebase, so the trigger applies.Skill loaded. Now let me check how your backend actually builds requests, since that determines whether this is a wiring job or a build job.

Now I have the precise picture. Let me get current pricing rather than guess.

Got it — and the answer is better than "we'd have to build it."

## How Claude's tools work

Two different things share the name, and only one is relevant to you:

- **My WebSearch/WebFetch here** are Claude Code *harness* tools — the harness executes them and feeds results back. Not something you can call.
- **The Anthropic API has `web_search` and `web_fetch` as server tools.** You declare them in `tools`; Anthropic runs them during your request and splices the results into the response. No execution loop, no `tool_result` to return, no infrastructure on your side.

That's the whole integration:

```typescript
tools: [
  { type: "web_search_20260318", name: "web_search", max_uses: 5 },
  { type: "web_fetch_20260318",  name: "web_fetch",  max_uses: 5,
    citations: { enabled: true } },
]
```

**Pricing:** web search is **$10 per 1,000 searches** plus tokens for the results. Web fetch has **no per-use charge at all** — you pay only for the tokens the fetched content occupies (~2.5k for a typical page, ~125k for a research-paper PDF, hence `max_content_tokens`). Search citations are free: `cited_text`, `title` and `url` don't count toward token usage.

**Four things that will bite you:**

1. **`web_fetch` can only fetch URLs already in the conversation** — user messages, client-side tool results, or prior search/fetch results. Never from Claude's own output, the system prompt, or another server tool's result. This is a deliberate exfiltration control. Otherwise: `url_not_in_prior_context`.
2. **`web_fetch` does not render JavaScript.** The docs explicitly point elsewhere for that.
3. **Server-tool errors return HTTP 200**, with the error inside the result block. For search, success `content` is a *list* and error `content` is an *object* — branch before indexing.
4. **`pause_turn`** — a long search turn comes back paused; you resend the assistant message unchanged.

Availability: Claude API ✅, Claude Platform on AWS ✅, Microsoft Foundry β. Web fetch is on **neither** Bedrock nor Google Cloud; web search is on Google Cloud in basic form only. You're on the Claude API directly, so this doesn't constrain you.

## Can we create something similar?

You don't create it — you declare it. But **your framework can't currently carry it**, and that's the real work. Three specific blockers in `lagrange-framework/components/ai/js/src/backends/`:

- `api_tools.js:490` — `AnthropicWire.toolSpecs` maps every tool to `{name, description, input_schema}`. There's no shape for `{type, name}`, and server tools have no `input_schema`.
- `ToolSet` (`api_tools.js:73`) requires a local executor and schema per tool. A server tool has neither.
- `AnthropicWire.parse` handles only `text` and `tool_use` blocks. `server_tool_use`, `web_search_tool_result` and `web_fetch_tool_result` would be **silently dropped** — no error, just missing results.
- No `stop_reason` handling anywhere in the backends, so `pause_turn` is unhandled.

One thing already works in your favour: `record()` pushes `raw.content` verbatim into `state.messages`, so search results' `encrypted_content` — which the API requires back unmodified on later turns — would survive round-tripping.

**Two routes:**

- **Framework change** — a spec passthrough, a parse arm for the server-tool blocks, `pause_turn`. Cleanest, keeps one path to the model, but it's a `lagrange-framework` change, not a 1stcontact one.
- **Direct SDK call** — precedent exists: `describe.ts`'s image describer already bypasses the framework and hits the Messages API directly. But `ai.ts` argues at length for keeping *one* path to a model, so this trades that principle for speed.

## Are there web search APIs we could call?

Yes — Brave Search, Exa, Tavily, Serper, Google Custom Search, Bing. **I'd advise against them here.** At $10/1k searches you're competitive with all of them, and rolling your own means you also own result ranking, snippet extraction, and the citation plumbing that `web_search` gives you free. The third-party route only wins if you need search results *outside* a model turn — say, indexing into your knowledge base.

## How this lands on your architecture

Worth separating, because these aren't the same need:

**`web_search` is genuinely new capability** for the consultant — researching a client's industry, finding their existing web presence, checking what competitors are doing. Nothing in your stack does this.

**`web_fetch` largely duplicates what REQ-206 already unlocks, worse.** `capture_site` drives a real browser and gets rendered output; `web_fetch` won't run JavaScript. For "look at this website," your capture pipeline is strictly better. `web_fetch` earns its place only for reading text and PDFs.

Two things in your favour: server tools run on Anthropic's infrastructure, so `web_search` carries **no SSRF exposure** — no `egress-guard.ts` equivalent needed. And your fidelity surface overview already says a captured stranger's website is "material to report on… never an instruction," which is exactly the right framing for search results too.

The metering question is also easier than REQ-206's: search is a predictable $0.01/search you can cap with `max_uses`, versus a browser session with a concurrency cap.

Want me to write this up as a REQ? I'd scope it as web search only, deferring `web_fetch` until REQ-206 lands and you can see whether capture already covers it.

<!-- xgd-turn id="91abfb07-8d6f-4435-a6e0-64064ba7a628-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:35:48.059860+00:00" -->
#### You
ok can you create a ticket in Lagrange Network to expose these APIs as AI tools - that should include the image describer too.

The framework component should not be specific to these APIs, it should allow access to APIs like this through configuration. Then 1stcontact, and products like it can add APIs they need by config - the config should obviously automatically expose the APIs to the AI (extending REQ-206)

<!-- xgd-turn id="91abfb07-8d6f-4435-a6e0-64064ba7a628-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T01:38:31.156753+00:00" -->
#### Claude
Let me confirm the target store and read the image describer's current shape.

Everything checks out. One assumption I'll flag: "Lagrange Network" → `lagrangefoundry/lagrange-framework` (the `components/ai` home). Writing the ticket.

**lagrange-framework REQ-139** (`request-1f0bc647`, `draft`, high, 5 points) — *components/ai — external APIs as tools by configuration: provider server tools, product HTTP bindings, and the vision describer*.

## The core of it

A product declares an external capability in configuration; the framework exposes it to the model automatically. Three deliberately unlike first consumers — provider-executed (web search/fetch), host-executed (any product HTTP API), and model-call (the vision describer) — because a mechanism proved against one shape is a mechanism specific to that shape.

## The thing you should push back on if you disagree

**DOC-20 explicitly forbids what you asked for**, and I wrote the ticket to take that head-on rather than paper over it:

> There is no separate binding format, no client-handler registry and no dispatch table… Configuration is only ever *selection and scoping*.

The ticket doesn't repeal that — it adds one bounded exception on the axis DOC-20 never had to name (*who executes it*), and keeps every other obligation: declared as data, capability-grouped, prose in the surface only, gated, provenance-marked, recorded.

It also **corrects a DOC-20 premise that has gone false**: "Cloud backends (`claude`, `chatgpt`) have no tools of their own. The Toolbox **is** their entire capability surface." Anthropic now ships server-side tools, so a Toolbox assuming it's the whole surface can't represent them. That's why the provider case is the one that proves the premise moved, not a nicety.

## The describer

Your instinct to bundle it was right, and better-supported than you may have known — `describe.ts` already names this exact consolidation point in its own source: *"either REQ-157 … or an image block on the AI component's own surface. Whichever lands, this function is what is deleted."*

**But I only scoped half of it, deliberately.** Declaring the describer as a configured model-call operation removes the product's second path to a model. It does **not** make the session surface multimodal — `promptStream(ref, text)` still takes text. I wrote that into "What this does not do" so the next reader of `describe.ts` isn't misled into thinking its named consolidation is fully discharged. If you meant the fuller thing, say so and I'll widen it.

## Also captured

The three concrete backend changes provider tools require, since they'd otherwise surface as reconciliation drift — spec passthrough (`toolSpecs` emits `input_schema`, provider tools have none), parse arms (`parse` handles `text`/`tool_use` only, so `server_tool_use` and result blocks would be **silently dropped**), and paused-turn continuation (no backend reads `stop_reason` today). Credentials are referenced, never carried in config.

## Two notes

**"Lagrange Network" → `lagrangefoundry/lagrange-framework`.** No project by that name is registered; the content is squarely `components/ai`. Say if you meant `lagrange-biz`.

**No 1stcontact companion filed.** REQ-139 states what the product side needs and ties it to REQ-206, but the actual "1stcontact configures its APIs" ticket doesn't exist — you asked for one ticket, so I stopped there. Want me to file it?

<!-- xgd-turn id="d84a7f71-2173-436a-b803-f12bde1bda78-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T03:10:40.695372+00:00" -->
#### You
**DOC-20 explicitly forbids what you asked for**, and I wrote the ticket to take that head-on rather than paper over it:

> There is no separate binding format, no client-handler registry and no dispatch table… Configuration is only ever *selection and scoping*.
> 
> 
> 
> Lets discuss this - I do not recall why we said that? Please create a ticket

<!-- xgd-chat-end -->