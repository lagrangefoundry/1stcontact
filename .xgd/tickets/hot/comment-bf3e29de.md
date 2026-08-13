---
uid: comment-bf3e29de
id: COMMENT-1003
type: comment
title: Comment on request REQ-134
created_by: xgd
created_at: '2026-08-13T16:27:24.568794+00:00'
updated_at: '2026-08-13T16:29:03.487534+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ba3e3fba
  kind: chat_transcript
---

<!-- xgd-turn id="e385198e-6710-4a58-96ed-09494511cf66-user" -->

<!-- xgd-chat role="user" ts="2026-08-13T16:27:20.770057+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="e385198e-6710-4a58-96ed-09494511cf66-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-13T16:29:03.335131+00:00" -->
#### Claude
I'll do the legwork first, then come back with only the questions I genuinely can't answer myself.

Investigated before asking. Here's what I found and what I still need from you.

## What I confirmed myself

- **`ai` component shape** — `js/src/backend.js` is exactly as the ticket describes: factory registry, `CAPABILITIES` map answerable without construction, `NO_CAPABILITIES` default, keep-existing-descriptor-on-reregister. It's a clean template to mirror.
- **`chatgpt.js` supports client injection** (`client` bypasses the key check), so AC 7/8/9/10 are all testable offline with fake clients — **no live API keys needed**. I'll do the same.
- **Single-language components are well-precedented**: `knowledge` and `ai_knowledge` are py-only; all of `webui/*` and `ticketing` are js-only. So JS-only doesn't break a house rule.
- **1stcontact reaches the store through `sharedModuleUrl(name)`** (`tools/generate/src/cli/webui.ts:138`), which resolves *any* package in the shared store, not just webui ones — so a new peer component is reachable from here with zero plumbing.
- **lagrange-framework is its own XGD project** with its own ticket store (`.xgd/tickets/{hot,cold,search}`).

## Blocking questions

**1. Repo — and therefore which ticket store this work commits against.**
The ticket recommends lagrange-framework, and I agree: it's domain-agnostic, `sharedModuleUrl` already reaches it, and js-only peers are precedented there.

But it collides with this session's scoping: free-coding requires the commits to land against a ticket in the *same* store, and REQ-134 lives here. So I need you to pick:

- **(a)** Build in `lagrange-framework/components/imagegen`. I create a REQ in *that* store, follow free-coding there, and REQ-134 here becomes the design record pointing at it. Architecturally right; means this session commits outside its scoped ticket, which the protocol calls "unusual" — I want your explicit go-ahead.
- **(b)** Build in 1stcontact (e.g. `packages/imagegen`) against REQ-134 as-is. Protocol-clean, moves fast, but puts a domain-agnostic component in its only-consumer-today repo and means a later migration.

I'd take **(a)** unless you want to avoid the cross-store move.

**2. Dependencies — needs your explicit sign-off either way.**
Neither provider SDK exists in 1stcontact, and lagrange-framework's CLAUDE.md forbids me installing without it.

My recommendation: **`fetch` only, zero new dependencies.** Both providers' image endpoints are plain REST; the vendor SDKs buy little here (no streaming, no tool loop) and cost workerd reachability, which DOC-12 §7 phase 2 actually needs. The `ai` component takes SDKs because it needs streaming and tool-calling — that reasoning doesn't transfer.

Confirm zero-dep `fetch`, or tell me to take `openai` + `@google/genai`.

## Decisions I'll take unless you say otherwise

I don't need answers on these — flagging so you can veto:

- **JS-only v1**, conformance corpus kept language-neutral so a py peer stays cheap.
- **Bytes across the port**, never URLs — each adapter fetches and normalises, killing the expiry footgun.
- **Tier vocabulary `draft` | `final`.** A provider with no tiers maps both to its single tier and *reports back the tier it actually used*, so cost records never claim a saving that didn't happen.
- **Model pins + a price table with an explicit `pricedAt` date**, as data. UATs assert the arithmetic, never the price — so a repricing is a one-line visible diff, not a test break. I won't web-search live pricing unless you want it; my figures would be stale by the time they're read either way, and the date stamp is the honest fix.
- **No host integration** — the component ends at bytes, per the ticket's out-of-scope list.

One smaller call for you if you pick (a): should REQ-134 here be **closed as moved**, or **kept open** as the 1stcontact-side design record and host-integration parent?

<!-- xgd-chat-end -->