---
uid: comment-6669c434
id: COMMENT-2312
type: comment
title: Comment on chat CHAT-43
created_by: xgd
created_at: '2026-09-08T00:06:33.335870+00:00'
updated_at: '2026-09-08T22:27:51.331624+00:00'
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

<!-- xgd-turn id="ab2bd0d1-b059-4ce3-bfe8-1c58e9d2d7be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T21:48:34.544302+00:00" -->
#### Claude
Good question — let me put actual numbers on it rather than hand-wave.

Here's the tension in concrete terms.

## What a separate package actually costs

From the REQ-141 diff, standing up `ai_vision` as its own component took **9 new files plus 4 shared-file edits**:

```
components/ai_vision/js/{package.json, PUBLIC-API.md, vitest.config.js}
                    src/{index.js, plugin.js, toolbox.js, vision_surface.json}
                    tests/{fixtures/describer.js, test_UAT_...js}
+ vitest.alias.mjs, vitest.config.mts, REQ-56 install roster, pnpm-lock.yaml
```

For a **data-only** plugin, `toolbox.js` disappears — `HttpSurface` is the executor, and it already lives in `components/ai`. So the actual content is two things: a `surface.json` declaration, and a ~30-line object carrying `{name, formatVersion, version, declaration, requires, http:{origin, auth}}`. Everything else on that list is packaging around two files with no logic in them.

Then each consumer pays again. In 1c, a new component needs its own shim function in `assets.ts` alongside `writeAiWorkersShim` — the four that exist today (ai, ticketing, passwordless, knowledge) are each hand-written, because the Worker can't follow a bare specifier into the out-of-repo shared store.

## What it costs inside `components/ai`

`assets.ts:198` is the decisive detail. The AI shim is a **named export list**, not a wildcard — deliberately, so an upstream rename fails typecheck here rather than as `undefined is not a function` mid-turn. Which means a plugin re-exported from `ai`'s `/workers` rung costs 1c exactly **one line**:

```ts
const AI_WORKER_EXPORTS = [ ..., 'webSearchPlugin', ... ]
```

Framework-side it's `src/plugins/websearch/{surface.json, index.js}` plus one line in the `exports` map. It inherits `ai`'s existing vitest project, alias, install roster and PUBLIC-API. Call it two new files and two edited lines, across both repos.

## The argument against, and why I think it's narrower than it looks

`toolbox/index.js:5` states the design claim: the Toolbox "knows about tools in general and nothing about any tool in particular." A search declaration inside `components/ai` reads like it breaks that.

Two reasons I don't think it does:

**The claim is scoped to `src/toolbox/`, not to the package.** `FilesystemToolbox` already ships in `@lagrangefoundry/ai` — it sits at `src/filesystem_toolbox.js`, *outside* `src/toolbox/`, with its rationale stated in its own header ("for a cloud backend the Toolbox is the entire capability surface, so file access has to come from somewhere"). A `src/plugins/` folder beside it doesn't touch the machinery's invariant. The precedent is already set, and it's set at exactly the right boundary.

**Explicit discovery survives intact.** REQ-139's real invariant is that plugins are imported by the host and passed in — no scanning, no ambient registration. That's unchanged either way: the host still writes `resolvePlugins([webSearchPlugin], ...)` and its startup code still names every capability the assistant has.

## The dependency argument, which is the one that actually decides it

`ai_imagegen` depends on `@lagrangefoundry/imagegen` and `@lagrangefoundry/ticketing`; `ai_vision` on `@lagrangefoundry/ticketing`. If those lived inside `ai`, then `ai` would depend on ticketing and imagegen, and every adopter of `ai` would drag both in. That's a dependency inversion and it's fatal — **REQ-141 got this right, and nothing I'm suggesting changes it.**

But a data-only plugin has **zero dependencies by construction**. Its executor is `HttpSurface`, which is already inside `components/ai`. That's the entire distinction, and it makes the rule almost write itself:

- **Component-bridged (supplies `create`) → its own package.** It has real dependencies and real logic.
- **Data-only (declaration + http block) → inside `components/ai`.** Zero dependencies by construction, so the packaging buys nothing and costs a shim per consumer forever.

## The honest counter

**Release coupling.** A data-only declaration tracks a third party's API. Inside `ai`, you can't take a corrected Brave declaration without taking a new `ai`. The plugin's own `version` field stays independent — that external-reference property survives — but the *install* is coupled.

I still land on "inside," because the cadences are lopsided: a search declaration changes rarely, and when it does it's because the vendor moved, which is when you'd want a coordinated look anyway. Whereas the shim cost is paid once per plugin per consumer and never goes away. But that's a judgement, not a fact, and it's the argument I'd expect to lose on if you disagree.

**The attractive-nuisance risk** is real and worth guarding mechanically: someone adds a slightly-logic-y plugin to `src/plugins/`, then a dependency, and the graph inverts quietly. The guard is cheap and it's just the data-only definition made executable — *nothing in `src/plugins/` may supply `create`, and nothing may import beyond its own declaration JSON.* One UAT over the folder.

## One thing not to conflate

DOC-25's ownership rule — the framework may ship a plugin only when it wraps a **public third-party contract** — is a different axis. That decides *whether the framework ships it at all*. This question is *where inside the framework it goes*. A Brave search plugin passes the first test either way; the second test is only about packaging overhead.

**My recommendation:** add the split rule to DOC-25 (component-bridged → package, data-only → `components/ai/src/plugins/`, with the no-`create`-no-imports guard), and let the search plugin be the first thing built under it. If you'd rather keep every plugin uniformly packaged for release independence, say so — that's the version where the search ticket carries a full component and a 1c shim, and it's maybe two extra points.

<!-- xgd-turn id="dc049017-2fba-4ad2-9b27-3e712ac50ea2-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:05:30.086203+00:00" -->
#### You
Honestly I don't understand what you're trying to say. Let me take a step back and express the intent here. What I want to do with Lagrange Framework is really two things (1) Allow me to build reusable AI application components once so that future applications can be built faster (2) enforce true API separation so Claude can't cheat when its wiring things together.

This kind of modularity only makes sense when the seams I defined in the right places, if we get them wrong it creates more work and potentially inferior products. 

I think my feeling on this one as we have done some work perhaps it is of value, at this point let's keep it simple

<!-- xgd-turn id="dc049017-2fba-4ad2-9b27-3e712ac50ea2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:05:54.549375+00:00" -->
#### Claude
You're right, and my question was the wrong question.

I was optimizing for file count. You're optimizing for seam enforcement — and on that measure a separate package **beats** a folder inside `components/ai`, because a package boundary with a declared `dependencies` list is a wall an agent can't quietly reach through. A folder inside `ai` is a soft seam that stays honest only as long as everyone remembers the rule. That directly undercuts your goal (2), which is the one you care about more.

The 1c shim cost I was complaining about is the same property, not a tax: `AI_WORKER_EXPORTS` is a named list precisely so an upstream rename fails at typecheck instead of as `undefined is not a function` mid-turn.

So: **one convention. A plugin is a component.** REQ-141 already set it with `ai_imagegen` and `ai_vision`; the search plugin follows it. Nothing new to decide, nothing to add to DOC-25.

That leaves what's actually in front of us from the review:

- **REQ-206** — ship unchanged, not blocked by any of this.
- **REQ-207** — split. The describer half is a ~30-line `sessionImageDescriber` in 1c with no framework dependency (`imageBlock` is already in the installed `ai`). The search half is a new framework component.
- **Search provider** — still the one open call, and it's the only thing blocking that ticket.

Want me to write those up?

<!-- xgd-turn id="c7bbfd32-34e4-4f1a-b60e-9b8af2d444f9-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:13:32.761079+00:00" -->
#### You
Can you update 207 please?

<!-- xgd-turn id="c7bbfd32-34e4-4f1a-b60e-9b8af2d444f9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:15:39.884178+00:00" -->
#### Claude
Updated. Here's what changed and why.

**Two corrections, both recorded in the ticket rather than quietly absorbed:**

1. **The search mechanism.** The ticket assumed the model's own vendor would run the search. REQ-139 rules that out — `web_search` exists on `claude_api` and not on `chatgpt`, so a granted role would silently hold different tools depending on which backend opened the session. Search is now a third-party API over the `http` call type.

2. **The threat model, which that change breaks.** The original said *"No SSRF surface — the provider executes the search on its own infrastructure, so there is no request leaving our network."* That is now false: a request does leave. I withdrew the sentence explicitly and replaced it with what's actually true — the destination is fixed at construction, path slots are percent-encoded, query fields are serialized, so there's no hole for a model-supplied URL. `egress-guard.ts` still has nothing to hold, but because this operation never takes a URL from the model, not because no request is made.

**The describer half turned out to be unblocked.** It needs no plugin layer, no new component, no reinstall — `imageBlock` is already in the installed `@lagrangefoundry/ai`. It's `sessionTextDescriber`'s peer, sending an image block beside the instruction. The `DescribeImage` seam keeps its shape, so the existing UATs keep working.

I also wrote down why the framework's own `describe_image` plugin **isn't** what this adopts, since that's the obvious question anyone will ask next: it describes when the model asks, and this product describes at ingest — DOC-38 §6 needs every material to carry a description, so a lazy one leaves un-asked-about uploads unfindable. Two lesser reasons beside it (body shape, and it covers one of four branches).

**Added a sequencing section.** The describer ships on its own; the search plugin doesn't exist yet in the framework; installing it here needs the post-REQ-139 `ai` in the shared store plus an `assets.ts` shim.

Two things I left alone and want your call on:

- **Story points are still 3.** The in-repo scope got clearer rather than bigger, but it now carries install + shim + config work it didn't before. Worth 5?
- **Splitting.** I kept both halves in one ticket since you asked me to update rather than split, and they are one intent. But the describer is ready now and the search half is blocked on a framework component nobody has built — so as it stands the ready half waits. Say the word if you want them separated.

The one open decision still blocking the search half is which search API — it fixes the declaration, the credential name and the result shape.

<!-- xgd-turn id="1ea65d0a-4064-4242-bf02-f1d28a42f9c0-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:25:23.637634+00:00" -->
#### You
So, lets discuss - if we are using a model API with its own tools built in - wouldn't it make sense to be able to use them?

<!-- xgd-turn id="1ea65d0a-4064-4242-bf02-f1d28a42f9c0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:27:49.974733+00:00" -->
#### Claude
Good challenge — let me check one thing before answering, because it changes the answer.

Let me check the actual server-tool contract rather than assert it from memory.Yes — and having checked both codebases, the objection that kept them out is weaker than it reads.

## Three reasons

**1. The negotiation machinery REQ-139 says is missing already exists.** The ticket says provider tools need "capability negotiation of the kind the `vision` flag already performs." That's `capabilities()` in `backend.js` — a declared flag per adapter, read via `backendCapabilities(name).vision`, with `ai_vision` refusing at construction when it's false. It isn't missing. It has no `webSearch` member yet, which is a much smaller thing.

**2. The framework already has a path for backend-native tools.** `filesystem_toolbox.js` documents it as "two enforcement paths, one declaration" — in-process policy for API backends, CLI flags for the agentic backend, and *"nothing detects a mode — the backend determines which exists."* Provider-executed tools are that same category, not a new one. REQ-139 even says the agentic-backend path is untouched by it.

**3. 1c is single-backend.** Only `ClaudeAPIBackend` is ever registered — `host-core.ts:613` and `ai.ts:154`. Nothing here runs chatgpt. The backend-conditional argument that killed provider tools doesn't bite for us at all.

## What comes free

I checked the current server-tool contract rather than working from memory. On `claude-opus-5` it's `web_search_20260209`:

| REQ-207 asks for | Native |
|---|---|
| per-session budget | `max_uses` |
| scope | `allowed_domains` / `blocked_domains` |
| attribution | results carry their source |

Three of the five properties the ticket asks for, with no key, no HTTP surface, no new component, no `assets.ts` shim, no install. **Using the provider's tool is less work than the Brave plugin I put in the ticket, not more.**

One correction to the ticket's fetch reasoning while I'm here: `web_fetch` only fetches URLs *already present in the conversation* — it can't wander. The "search finds it, capture reads it properly" conclusion still holds on rendering grounds, but not on the grounds the ticket gives.

## What's genuinely lost

- **Provenance wrapping.** Toolbox results get wrapped in `UNTRUSTED_OPEN`/`UNTRUSTED_CLOSE`. A `web_search_tool_result` arrives inside the assistant turn and we never touch it, so "material, never instruction" drops from structural to advisory for that one tool. Bounded — these are short search snippets, not whole attacker-controlled pages — but it's a real step down, and `capture_site` doesn't have it.
- **The audit record.** It won't appear in the Toolbox's journal. The blocks are still in the transcript, so the operator can see them; they just aren't in the trail everything else is in.

## The shape that keeps goal (2)

The cheap version — pass `web_search` straight into the backend's tool list — bypasses the grant and the manual entirely. That's exactly the wiring-around-the-seam failure you care about, so I'd not do it.

The clean version is a third call type, and `host-core.ts:617` shows why it fits: the backend's tool list is built *entirely* from `box.schemas()`. So a `provider` operation would be declared like any other — capability group, grant, manual prose, `max_uses` — and emitted into that list as a passthrough descriptor instead of a JSON-schema tool. It never reaches `box.run`, because the vendor executes it. Declaration and manual stay in one place; only the enforcement path differs, which is the pattern the filesystem surface already set.

Framework scope is roughly: a `provider` call type in the declaration, a capability flag so an incapable backend makes the surface absent (reusing REQ-139's absence machinery unchanged), and the passthrough in the tool-list projection.

**My recommendation:** drop the Brave plugin from REQ-207 and go this way. It's less work, it keeps the grant and the manual honest, and it means `web_fetch` and `code_execution` arrive later as configuration rather than as three more components.

One thing to check before setting a budget default: per-search pricing isn't in the cached reference I have, so that number needs looking up rather than guessing.

Want me to rewrite REQ-207's search half around this, and note the framework ticket it needs?

<!-- xgd-chat-end -->