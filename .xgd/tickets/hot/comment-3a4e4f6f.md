---
uid: comment-3a4e4f6f
id: COMMENT-830
type: comment
title: Comment on request REQ-122
created_by: xgd
created_at: '2026-08-07T23:31:42.328406+00:00'
updated_at: '2026-08-07T23:50:13.743753+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-58b6a329
  kind: chat_transcript
---

<!-- xgd-turn id="338840d4-908e-409d-80ee-b9c62393e51e-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T23:31:38.423873+00:00" -->
#### You
Are you ready to add a chat panel (see existing components and showcase demos) to the builder? We should discuss the system prompt it gets but basically at this point it just needs to be aware of the site being edited and the tools that will allow it to make changes. Lets wire it up properly with session management and the knowledge bases (see examples) but I will create a separate ticket for created a system KB to populate it with.

<!-- xgd-turn id="338840d4-908e-409d-80ee-b9c62393e51e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T23:35:43.414701+00:00" -->
#### Claude
Yes — ready. I've read the builder, the installed components and the AI/KM stack. Here's what's in place, the one real surprise, and the decisions I need from you.

## What's already there

- **`app.js:104`** has the placeholder: `builder-chat-placeholder`, already sitting in the `mountSplit` secondary with rail-collapse wired. Replacing it with `mountChat(...).element` is a few lines.
- **`@lagrangefoundry/webui-chat`** is installed in the shared store (with `webui-markdown`, its only peer). Adding both to `WEBUI_PACKAGES` in `tools/generate/src/cli/webui.ts:41` puts them in the import map automatically.
- **`@lagrangefoundry/ai` (JS)** is installed — `SessionManager`, `Role`/`StaticDocs`, `FileStore`, the `Tool`/`FilesystemTools` seam, `runToolLoop`, streaming.
- **A structured edit surface already exists** as plain functions in `tools/generate/src/cli/edit.ts` — the same ones `1c copy set` and the click-to-edit modal dispatch to. Those *are* the tools; they need wrapping, not writing.
- `showcase/src/doc-chat-demo.js` is the exact composition (document | chat in a split), and `components/ai/py/showcase/ai_host.py` is the reference host contract (`/ai/roles`, `/ai/session`, `/ai/prompt` SSE).

## Where it runs

**The builder origin (Node), not the Worker.** `@lagrangefoundry/ai`'s full entry point is Node-only, and the store, the render and `publish` already live there. `control-app` keeps proxying verbatim. Same reasoning REQ-119 used for the render — this doesn't move until DOC-12 §7 phase 2.

## Decision 1 — backend: `claude_api`, not `claude_code`

I'd use the API backend with **in-process tools**. `claude_code` is a filesystem agent — that is precisely the raw-code escape hatch DOC-2 and DOC-8 §5.2 close ("the forbidden list is enforced by absence"). With `claude_api` the registered tool list *is* the authority boundary, and every write goes through the same validator the modal does.

## Decision 2 — the tool gap (the one that matters)

Today's structured write paths are: copy/image at an L1 address, page add/update/rm, site config, assets, publish. **There is no structural L1 write tool** — nothing that sets an axis, adds a node, or moves anything.

So a chat shipped against today's surface can do *"fix that typo", "swap this photo", "add a Contact page", "publish"* — and cannot do *"make the hero darker"* or *"move that up"*. Which is awkward, because DOC-28 §3 says the sophisticated stuff is exactly what the AI is for.

My recommendation: **ship the panel, session, transport and today's tools under this ticket; file the L1 write tool separately.** Its design (addressing granularity, partial-axis writes, validation envelope, undo) is a real piece of work and would swamp this one. Your call — say the word and I'll fold it in instead.

## Decision 3 — knowledge bases (a real finding)

**KM is Python-only.** `lagrangefoundry.knowledge` and `lagrangefoundry.ai_knowledge` have no JS peer — the installed store has `ai`, `ai-ticketing`, `ticketing` and the `webui-*` set, nothing else. KM also indexes a *ticket* corpus through the ticket API, which this repo doesn't have.

Three ways forward:

| | what | cost |
|---|---|---|
| **a** | Role `documents:` via `StaticDocs` — the JS `ContextSource` seam | free; no search |
| **b** | Python KM as a sidecar the Node host calls over HTTP | real search; a Python runtime in the builder |
| **c** | Write a JS peer of KM | large |

I'd take **(a)** now. `roles.js` says it outright: *"search-backed / KM sources slot in later behind the same interface."* Your system-KB ticket populates the doc list; swapping in a search-backed source later changes one class and nothing above it.

But it depends what you mean by "system KB" — **an ordered document set, or a searchable corpus?** If the latter, this needs (b) or (c) and belongs in its own ticket.

## Decision 4 — the system prompt

Four layers, and I think the third is the interesting one:

**1. Role `system`** (static, in a `roles.json` next to the builder). Draft:

> You are the caretaker of a website your user owns. They are not technical: they know their business, not HTML, CSS or web frameworks.
>
> You change the site **only** through your tools. There is no other path — you cannot write HTML, CSS or JavaScript, and no tool will accept them. This is not a limitation to work around; it is what makes every change safe, reversible and reproducible. If something cannot be expressed through a tool, say so plainly and describe what you'd need — do not approximate it.
>
> A site is a tree of typed elements (text, images, boxes) plus a small set of vetted behavioural components (forms, carousels). Appearance lives in the tree; behaviour lives in the components. **Never expose that vocabulary to the user.** They asked for "a bigger heading", not an axis; say "I made the heading bigger."
>
> Read before you write. Make the smallest change that answers the request. After each change the page they are looking at re-renders — describe what you did in one or two sentences, in their language.

**2. Role `documents`** — the system KB. Your separate ticket. My guess at contents: DOC-24 (what the framework is for), DOC-23 (L1, written for the AI not for us), DOC-25 (behavior modules), and a tool cookbook of worked examples. Deliberately *not* the security policy — the boundary is enforced by tool absence, not by asking nicely.

**3. Site awareness — a tool, not a snapshot.** This is the bit I'd push back on slightly. Embedding the site definition at session create means it's stale after the AI's own first edit, and it's expensive. I'd prime it with *"call `describe_site` before your first change"* and give it `describe_site` / `list_pages` / `get_copy` as read tools. The draft mutates every turn; the priming shouldn't pretend otherwise.

**4. `reminder`** (re-applied every turn, never in the transcript) — the never-slip rules: which site slug is being edited, no raw markup, no framework vocabulary in chat, prefer a tool call over prose.

## Sessions

`SessionManager` + `FileStore`, one logical session per site slug, sessions dir under the store. Recycle-and-carry comes free. Persisted, so a browser reload resumes rather than restarting cold.

## Operational

The builder process will need `ANTHROPIC_API_KEY`. Nothing in this repo calls an LLM today, so that's a new environment requirement worth naming in the ticket.

---

Four things I need from you: **(1)** L1 write tool in or out of this ticket; **(2)** is the system KB a doc set or a searchable corpus; **(3)** does the `system` draft above read right; **(4)** happy with `describe_site`-as-tool over a priming snapshot?

Once those land I'll write the ticket body and start.

<!-- xgd-turn id="6b1b739e-dee3-43ea-8928-d0280ea6e77a-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T23:48:15.126898+00:00" -->
#### You
1. The backend can be Claude AI for now, in the finished product it will need to be Claude cloud (we will run in Cloudflare) so be sure to use the AI api. 
   2. Yes lets start basic and build out. What I think I want is to have a self-documenting tool framework that is part of the ai component but configured by this project - lets discuss
   3. That's fine we can build out a JS implementation (c) it won't take long - that is not your project - can we simulate with a python backend for now?
   4 agree - site awareness needs all the visibility tools we have created - I was just thinking we should have a session per site. If I select a different site we should change the session in the chat window. When we initialize the gigabytealchemy session we tell it that is the site it is associated with - here are you r tools to look at it.

<!-- xgd-turn id="6b1b739e-dee3-43ea-8928-d0280ea6e77a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T23:50:13.612757+00:00" -->
#### Claude
All four confirmed. Three quick things I verified, then the tool framework — that's the real discussion.

## Confirmations

**1. Claude API backend — and the Cloudflare path already works.** I checked the runtime deps: `claude_api.js` uses `@anthropic-ai/sdk` (fetch-based) plus `node:crypto`; the tool substrate uses `node:fs`/`os`/`path`. All of that is inside what `nodejs_compat` reaches, and the ai package's own README states `/core` is workerd-safe. So the Node builder host and the eventual Worker run the **same backend and the same tool loop** — no rewrite at the phase-2 boundary, just a different place to hold the store. Good call.

**3. Python KM sidecar as the simulation.** `ai_host.py` already exposes `/km/kbs`, `/km/awareness`, `/km/prime`, `/km/search`. The Node host gets a thin `KnowledgeClient` over those, surfacing two ways: an awareness map into priming through the `ContextSource` seam, and `knowledge_search` / `knowledge_get` as tools. When your JS KM lands, the transport swaps behind both seams and nothing above moves. What it needs from you: a corpus and a `knowledge_bases.yaml` — which is your system-KB ticket. Until then I'll stand it up against a stub KB so the seams are exercised end to end rather than mocked.

**4. Session per site.** `panel.on('site', cb)` already exists (`panel.js:113`), so the hook is free. One detail worth deciding: on switching back to a site, the *session* remembers the conversation but the chat panel doesn't. I'd rehydrate the panel from the session transcript (`parseTranscript` is in the protocol entry) — otherwise the AI answers with context the user can't see, which reads as spooky rather than clever.

---

## 2. The self-documenting tool framework

Today a tool is a 4-tuple: `new Tool(name, description, inputSchema, handler)`. The weakness is specific. DOC-8 §5.3 requires *"finite enums spelled literally in descriptions"* — so every enum gets written twice, once in `inputSchema` and once in the English prose. That second copy is where drift lives, and nothing detects it.

What I'd propose "self-documenting" should mean: **one declaration, four renderings, none of them hand-maintained.**

```js
declareTool({
  name: 'set_copy',
  summary: 'Change the words or image at one place on a page.',
  category: 'content',
  params: {
    slug:   { type: 'string', description: 'Which site.' },
    page:   { type: 'string', description: 'Page id — from list_pages.' },
    path:   { type: 'string', description: 'Address — from describe_page.' },
    values: { type: 'object', description: 'field → new value.' },
  },
  required: ['slug', 'page', 'path', 'values'],
  preconditions: ['describe_page'],          // → "call this first" in the manual
  errors: ['NOT_FOUND', 'SCHEMA_INVALID'],   // → the CommandError vocabulary, verbatim
  examples: [{ input: {...}, outcome: '...' }],
})
```

Renderings:

1. **The wire schema** the model receives — as now.
2. **The model-facing description, composed rather than authored.** `summary` + constraints rendered *from the schema* (enums, ranges, required combinations) + examples. The enum is written once, in the schema, so prose/schema drift becomes structurally impossible instead of merely discouraged.
3. **A tool manual**, generated and injected as a priming document through the `ContextSource` seam — the surface described *as a surface*: what's here, what sequences work, what the errors mean.
4. **A checked-in human reference** — the `PUBLIC-API.md` discipline the framework already uses for boundaries. A diff in it is a tool-surface change, reviewable as one.

Three properties I think are worth designing for explicitly:

**Declared absence.** DOC-8 §5.2 says the forbidden list is enforced by absence, and that's correct for *enforcement* — but absence teaches the model nothing. It burns turns proposing CSS and then apologising. A surface-level `absent:` list ("nothing here writes CSS or HTML; if you need that, say what you'd need and stop") converts the security property into usable guidance. It belongs beside the tools rather than in the role prompt, because it changes exactly when the surface changes — which is the part a hand-written system prompt always gets wrong six weeks later.

**Enums sourced from the validator, not restated.** The values the model must not hallucinate live in `packages/site-schema`. A declaration should *point at* them (`enumFrom: …`) rather than copy them. That's the difference between self-documenting and merely self-describing, and it's the piece that is genuinely 1stcontact's configuration rather than the framework's.

**Examples that can't lie.** If an example is structured data, the framework can execute it as a conformance fixture. Documentation that is verified by the test suite is the whole point — otherwise we've built a nicer place to write stale prose.

### The boundary problem

`components/ai/js` is lagrange-framework, and this repo's CLAUDE.md is explicit: no component source is copied here and nothing here patches or wraps a component — gaps close upstream. So renderers 2–4 are an **upstream ticket**, with a Python peer and conformance fixtures to match.

My recommendation: build the **declaration** here first, as data that compiles down to plain `Tool[]`. That's configuration, not a wrapper — it stays on the right side of the rule — and it means the shape gets designed against a real surface (the `edit.ts` functions, with their real `CommandError` codes) instead of in the abstract. Once it's earned, the declaration type and the renderers promote upstream and our declarations move over near-unchanged. Your framework repo, so your call — but designing the schema before we know what a real tool surface needs of it seems like the more expensive order.

---

## What I need to start

- **Sign-off on the declaration fields** above (particularly `absent` and `enumFrom` — those are the opinionated ones).
- **Declaration-here-first, or wait for upstream?**
- **`ANTHROPIC_API_KEY`** on the builder process — new environment requirement, I'll name it in the ticket.

Once you're happy with the tool shape I'll write the REQ-122 body and start on the transport + panel, which is the uncontroversial half.

<!-- xgd-chat-end -->