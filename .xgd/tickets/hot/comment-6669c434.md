---
uid: comment-6669c434
id: COMMENT-2312
type: comment
title: Comment on chat CHAT-43
created_by: xgd
created_at: '2026-09-08T00:06:33.335870+00:00'
updated_at: '2026-09-08T21:47:09.001318+00:00'
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

<!-- xgd-turn id="d84a7f71-2173-436a-b803-f12bde1bda78-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T03:13:06.786172+00:00" -->
#### Claude
Good question to ask before building on it. Let me find the actual rationale rather than infer it.

Found it — there's a whole section on exactly this. Let me read it.

That changes the picture — DOC-20 answers this directly, and my earlier framing was wrong.

DOC-20 answers this directly, and I got it wrong. Writing the discussion ticket.

Now correcting REQ-139's framing.

**lagrange-framework CHAT-30** (`chat-5ddeb33d`, open) — and the answer to "why did we say that" is: **we didn't.** My earlier framing was wrong, and it changes what REQ-139 should be.

## What that sentence actually was

Not a rule. It's the *consequence* of having one shipped call type, stated in the same paragraph:

> And with one shipped call type there is no dispatch registry, no client-handler port and no descriptor serialization format — **those would be machinery in advance of need**.

A YAGNI status note, which I read as architecture. That's exactly how the misreading happened, and it's one of the discussion points I put in the ticket — the line reads as a prohibition and isn't one.

## The real rule is narrower

**S1:** configuration *chooses among* call types and cannot *invent* one. Products can't define a mechanism for reaching an API; they can absolutely select and scope one. Extending the set is a reviewed framework change with a documented bar.

## And you already designed what I was proposing

DOC-20 works `http` through in full under *"The bar for adding a second"*, marked **"designed and deliberately not shipped, so the pattern is set"**: origin is configuration and never a parameter (SSRF dies structurally, not by validation); path slots percent-encoded *including* `/` (traversal dies by the encoding being total, not a blocklist); credentials at construction, redacted from audit; redirects can't change origin — *"a fixed origin is a lie after one uncontrolled hop"*; responses get a size cap, content-type check, and `untrusted` provenance by default.

The Deferred section: *"Coverage gaps in the call-type set… extensible by design; a missing member is a later vetted addition, **not a blocker**."*

## Why it was deferred — and why that's expired

DOC-20 states its test: *"Checked against every intended consumer — ticketing, knowledge, filesystem, 1stcontact L1 — each holds its API in-process. Nothing needs the Toolbox to spawn a process or open a socket."*

That was true then. It isn't now — and the describer already bypasses the Toolbox to call the SDK directly, which is precisely the failure the deferral was meant to prevent.

## What's left genuinely open

Only one of the three needs design:

| | Status |
|---|---|
| Product HTTP APIs | **No design work.** Ship `http` as specified. |
| Provider server tools | **The real question.** Fits neither `inproc` nor `http` — nothing on our side executes anything, no host API to construct against. S1's four questions map awkwardly onto a call we don't perform. And it falsifies DOC-20's *"Cloud backends have no tools of their own; the Toolbox **is** their entire capability surface"* — needs an amendment, not just an addition. |
| Vision describer | **Possibly needs nothing.** A describer toolbox constructed with a model client is already `inproc`. I over-scoped it. Open question is whether "describe an image" is generic enough for `ai`, or drags product prompt text in. |

**I've corrected REQ-139** — its rationale section now says it *ships* DOC-20's `http` design rather than carving an exception, and points the provider-tool premise question at CHAT-30.

Four things I've listed for discussion in CHAT-30: ship `http` now or wait for a second consumer; whether provider-executed calls need their own security section rather than fitting S1; whether the describer stays `inproc` and where its prompt lives; and whether that "no dispatch registry" line should be reworded so the next reader doesn't repeat my mistake.

<!-- xgd-turn id="fb21e4cc-2166-4e2e-81b7-d284888fc916-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T03:17:14.279424+00:00" -->
#### You
Can you also create a 1c ticket please?

<!-- xgd-turn id="fb21e4cc-2166-4e2e-81b7-d284888fc916-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T03:18:32.775654+00:00" -->
#### Claude
**1stcontact REQ-207** (`request-3731fe6b`, `draft`, medium, 3 points) — *The consultant can research: web search as a configured API, and the image describer leaves its second path to a model*.

## The scoping call I made

**Web search only. Web fetch deferred, on purpose** — because REQ-206 already gives you something better. Fetch doesn't render JavaScript, so a modern site comes back as a shell; `capture_site` drives a real browser. Shipping both would invite the assistant to reach for the worse one.

The two you *do* want compose: **search finds the address, capture looks at it properly.** A client saying "make it feel like the good photographers in Bristol" needs both halves — neither is useful alone. Fetch isn't refused on principle, just deferred until capture has landed and you can see what it leaves uncovered; by then it's a config entry, not code.

## The describer

REQ-207 is written as the deletion `describe.ts` already promised — it names its own consolidation point and commits to being deleted when one arrives. `anthropicImageDescriber` and `VISION_MODEL` go.

One precision worth having: the **text** describer needs nothing, REQ-173 already routed it through the session factory. The image describer is the last outlier, and it survived only because it needed a content shape the surface couldn't express.

## The test I wrote in

The ticket states the acceptance condition for "configuration, not code" explicitly: a *second* API — maps, companies register, stock photos — must be a config entry and a grant with **no TypeScript written in this repo**. That's what stops REQ-139 landing as a mechanism that still needs product code per API.

Also captured: grant-not-merely-present (the REQ-126 projection rule, same failure REQ-206 documents), credentials referenced never written into config, and absent-and-fine when a deployment can't supply it.

## Where the three now sit

| Ticket | Repo | Status |
|---|---|---|
| REQ-206 | 1stcontact | Mount the fidelity surface |
| REQ-139 | lagrange-framework | Configured external APIs — ships DOC-20's `http`, plus a new provider call type |
| CHAT-30 | lagrange-framework | The open design question REQ-139 depends on |
| REQ-207 | 1stcontact | Consumes REQ-139; needs REQ-206 for search→capture |

REQ-207 is blocked on REQ-139, which is blocked on CHAT-30's provider-call-type question. All four are `draft`/`open` — nothing cut, no code written.

Note the earlier `git push` failures persist (sandbox proxy auth); all four tickets are committed locally and need a push from outside the sandbox.

<!-- xgd-turn id="25e80075-00c7-4047-91be-6e47788adbca-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T21:40:12.533466+00:00" -->
#### You
ok lets check in - REQ-139 and REQ-141 were built - can you review what's there - I took the framework part a bit further than we originally agreed. Lets discuss if it works for 1c and how best to adopt it?

<!-- xgd-turn id="25e80075-00c7-4047-91be-6e47788adbca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T21:45:18.014923+00:00" -->
#### Claude
I'll pull both tickets and look at what actually landed.

The scope moved — "the plugin layer", not just the http call type. Let me read both tickets and the diffs.

I've read both commits end to end, plus the two shipped plugins, and traced how 1c would actually mount them. Here's the review and the adoption call.

## What landed vs what we scoped

We agreed on "ship DOC-20's `http` design." What landed is that plus a whole plugin layer:

| | REQ-139 (13 pts, both languages) | REQ-141 (8 pts, JS only) |
|---|---|---|
| | `http` call type, plugin packaging + versioning, credential resolution, absence semantics, per-session use caps, conformance suite, `ToolboxSurface` extracted to break a load cycle | `ai_imagegen` (`create_image`), `ai_vision` (`describe_image`) |

REQ-139 is `ready_to_reconcile`, REQ-141 is `free_coded`, REQ-142 (Python peers of the two plugins) is `draft`.

## Review — what's right

The `http` type is a faithful build of the DOC-20 design, and the security properties are structural rather than validated, which is the part that matters: origin fixed at construction with no slot for a model to fill; path slots percent-encoded **including `/`** so traversal dies by the encoding being total; typed query/body field maps that are serialized, never concatenated; redirects off by default and same-origin when on; size cap and content-type check *before* parsing; `untrusted` as the default provenance for the call type.

Three things I'd single out as better than asked for:

- **`HTTP_CONSTRUCTION_ONLY`** — a declaration is refused *by name* if it carries an origin or a credential. A shipped plugin structurally cannot hardcode somebody's endpoint or key.
- **Absence is narrow and correct.** Missing credential → the plugin drops out of the surface, the manual, *and* its configuration entries, and the session opens without it. A configuration naming a surface nothing supplies → still a startup failure with the name attached. That distinction is the one people get wrong, and getting it wrong turns a typo into a silently smaller session.
- **The use cap is spent on the right edge** — after every gate (so a refused call never spends budget) and before invocation (so a host that throws still consumes one, because a remote call that errored was still made).

## Review — three things I'd question

**1. The `http` call type has no shipped consumer.** Both REQ-141 plugins are component-bridged — they supply `create` and run real logic. The data-only flavour, which is the genuinely new and genuinely risky path, is proved only by UATs and fixtures. That's the gap I'd close first, and 1c has the obvious candidate (below).

**2. A plugin = a package = a Worker shim.** In 1c, every framework component needs a hand-written re-export shim in `assets.ts` — there are four today (ai, ticketing, passwordless, knowledge) — plus a vitest alias, a `package.json` and an install-roster entry. For a component-bridged plugin that's proportionate. For a data-only plugin, which is a JSON declaration and ~30 lines of packaging, it's most of the cost of the thing. **Worth deciding now: should data-only plugins ship inside `components/ai` (a `plugins/` folder) rather than as separate packages?** Otherwise the shelf gets expensive to stock in exactly the case it was meant to make cheap.

**3. `Toolbox.fromPlugins` isn't 1c's path** — but that turns out to be fine, see below.

## Does it work for 1c? Three consumers, three different answers

### (a) REQ-206, the fidelity surface — unaffected, ship it as-is

Still hand-written, `inproc`, over 1c's own API. DOC-20's ownership rule says an application surface over the application's own API is the right answer and not second best. Nothing to adopt; REQ-206 is unblocked and independent.

### (b) The image describer — **the plugin does not discharge REQ-207's second half, and I got this wrong when I filed it**

`ai_vision` is much closer to 1c than I expected. It reads an attachment record, pulls bytes via `store.blobs.get(record.uid)`, describes on its own backend with tool use filtered and a fresh segment, and writes the result into the parent's body. That is 1c's model almost exactly — same store port, same one-blob-per-record shape.

But three divergences, and the first is fatal to the swap:

- **Trigger.** 1c describes at *ingest* — `material.ts` writes `body: description.body` at create, eagerly, for every upload, with no assistant in the room. `ai_vision` describes when the model *asks*. DOC-38 §6's whole simplification rests on every material carrying a description so the KB indexes bodies uniformly; a description that only exists once a model asked for it makes un-asked-about uploads unfindable. You can't move the trigger.
- **Body shape.** 1c: the body *is* the description, plus `description_status` / `description_model` and a `material_text` comment. `ai_vision`: splices an annotated block under a heading naming the attachment, because it assumes a parent may hold several images.
- **Coverage.** 1c has four branches (document / image / font / capture) with `DescriptionStatus` degradation. `ai_vision` covers images only.

**What actually removes 1c's second path to a model is smaller, and buildable today with no framework dependency at all.** The image branch should do what REQ-173 did for text: open a lightweight session on the AI host's own session factory and prompt it once with `lib.imageBlock`. That's a ~30-line `sessionImageDescriber` mirroring `sessionTextDescriber` at `ai.ts:141`, and it deletes `import Anthropic`, `anthropicImageDescriber` and `VISION_MODEL`.

I checked the shared store to be sure: the installed `@lagrangefoundry/ai` is **pre-REQ-139** (no `plugin.js`, `http.js` or `surface.js` under `toolbox/`) but it **does** export `imageBlock` — REQ-111 is in. So this fix needs no reinstall and no plugin.

`ai_vision` may still be worth mounting later as an assistant-facing *"look at that one again"* tool. That's an addition, not a consolidation.

### (c) Web search — re-scope, and the framework answer changed under it

REQ-139 explicitly excludes provider-executed tools, and the reason it gives is better than the one I gave you when I filed REQ-207: `web_search` exists on `claude_api` and not on `chatgpt`, so a role granted it would silently hold different tools depending on which backend opened the session — which breaks the manual's core property that the model is told exactly what it has. That needs capability negotiation of the kind the `vision` flag already does. So Anthropic's `web_search` is off the table for now, and rightly.

**But the `http` call type makes a third-party search API a data-only plugin — a declaration JSON plus an http block, and no TypeScript in either repo.** That is precisely the acceptance test I wrote into REQ-207 ("a second API must be a config entry and a grant with no TypeScript written in this repo"). DOC-25's ownership rule says the framework *may* ship a plugin when it wraps a public third-party contract, which a search API is. So it belongs in the framework, and it would be the layer's first data-only proof — closing question 1 above with the cheapest possible plugin.

## Adoption mechanics, concretely

1. **Reinstall `ai` first.** The store at `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/` is pre-REQ-139, so no plugin works until it's refreshed. `imagegen` is already there; `ai-imagegen` and `ai-vision` are not. I can't write that store from the sandbox — that one's yours.
2. **A shim per new component** in `assets.ts` for the Worker rung.
3. **Wiring is `resolvePlugins`, not `fromPlugins`.** 1c builds its own Toolbox at `toolbox-core.ts:624`; adoption is `resolvePlugins(plugins, {secrets, options})` and spreading `surfaces` into `extraSurfaces`. The config-dropping that `fromPlugins` does comes free — `createL1Toolbox` already narrows `granted` to composed surfaces (REQ-157, lines 618–622) for exactly the same reason. The two codebases independently arrived at the same rule, which is a good sign about the rule.
4. Grants go in `ai/instances.json` per role, unchanged.

## What I'd do

- **REQ-206**: ship unchanged. Not blocked by any of this.
- **REQ-207**: split it. The describer half becomes a session-factory change with no framework dependency — buildable now. The search half becomes "adopt an `ai_websearch` data-only plugin", blocked on the framework shipping one.
- **New framework REQ**: `ai_websearch` as the first data-only plugin, over Brave or Exa. Cheap, and it proves the `http` path with a real consumer.

Two calls I'd want from you before filing anything: **data-only plugins as separate packages or inside `components/ai`?** (question 2 — it changes what the search ticket looks like), and **which search provider**, since that fixes the declaration.

<!-- xgd-turn id="ab2bd0d1-b059-4ce3-bfe8-1c58e9d2d7be-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T21:47:08.329627+00:00" -->
#### You
Two calls I'd want from you before filing anything: **data-only plugins as separate packages or inside **`components/ai`**?**  <-- help me understand?

<!-- xgd-chat-end -->