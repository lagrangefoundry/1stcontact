---
uid: comment-d8169cbf
id: COMMENT-3136
type: comment
title: Comment on epic EPIC-19
created_by: xgd
created_at: '2026-09-18T19:05:45.594764+00:00'
updated_at: '2026-09-18T19:36:46.647975+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-95bc3b15
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "57e726cb-3511-4e23-9e9e-57ef54355255",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a683a3e0-74ba-4ea6-8f3a-5fcadde7f87b-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T19:05:35.216039+00:00" -->
#### You
This is a ticket to focus on the UX and AX (AI experience) of the web builder. I am going to start by working on my sites with the AI then, when that is working well, we will build some example sites going through the assist customer playbook.

You are and EPIC ticket session EPIC-19. You are going to help me by fixing bugs and tweaking the experience as we go.

Please familiarize yourself with the 1st Contact product aspirations, the web builder, the AI chat and particularly its priming and tools - you are my expert in all those details.

One thing I would like you to confirm: This produce is build on ../lagrange-framework components. I recently added a feature for this product that allowed the interacting AI to run an advanced model for the hard thinking and spawn Haiku agents for the L1 development. Can you validate for me that that model is in place and that the UX interaction is with Opus 5 and the development is with Haiku?

<!-- xgd-turn id="a683a3e0-74ba-4ea6-8f3a-5fcadde7f87b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T19:10:32.442966+00:00" -->
#### Claude
I've read myself in — priming, corpus, tool grants, the two hosts, the backend config — and written the epic body with the scope plus this audit. Here's the answer to your question.

## Opus 5 on the conversation — confirmed, in place

`tools/generate/src/cli/ai/backends.json`:

```json
"claude": { "model": "claude-opus-5", "max_tokens": 64000 }
```

`backends.ts:configureProjectBackends(lib)` installs that document, and it's called **before** `registerBackend` at both host build sites — `host-core.ts:888` (the site consultant) and `host-core.ts:1166` (the settings assistant). The backends read settings at construction, not per request, so the ordering matters and it's right.

One subtlety worth knowing: 1c registers backends under per-site names (`siteBackendName(slug)`, `businessBackendName(businessId)`), but constructs `new lib.ClaudeAPIBackend({...})` **without** a `name` option. The adapter defaults `name = 'claude'` and reads `backendSettings('claude')` (`claude_api.js:158`) — so the registry name doesn't affect the model. Every conversation in this product is Opus 5 at a 64k ceiling. On Opus 5 that ceiling is a *shared* thinking+text budget, which is why `backends.json`'s note argues for it being roomy.

## Haiku workers for L1 — not in place in this repo

The framework half exists and is installed. lagrange-framework REQ-148 shipped the `delegation` surface on 2026-09-11 (`27c999cf9`, corpus pinned by `b8c13848f`), and the shared store at `../node_modules/@lagrangefoundry/ai` carries it: `delegation_toolbox.js` exporting `DelegationToolbox`, `DelegationRuntime`, `WorkerConfig`, `delegationInstanceConfig`, re-exported from `core.js:320-344`. `backend_config.js` accepts any backend name, so `claude_worker` is configurable in data.

1stcontact consumes none of it:

1. **`backends.json`** declares one backend. No `claude_worker`.
2. **`instances.json`** grants the consultant `l1` (8 groups) + `fidelity` (`SeeSite`). No `delegation` — so the `Delegate` tool is never projected into the tool list the model sees.
3. **`createL1Toolbox`** (`toolbox-core.ts:905`) composes `L1Toolbox` + `extraSurfaces` + `ManualToolbox`. Nothing anywhere constructs a `DelegationToolbox` or a `DelegationRuntime`.
4. **`roles.ts`** declares two roles — consultant and settings (REQ-239) — plus the two describer roles in `apps/control-app/src/ai.ts`. There's no delegable worker role with its own narrower grant, and a role that exists for sessions isn't automatically one workers may run as.

Zero references to `Delegate`/`delegation`/`claude_worker` in 1c source. The `DELEGATION_*` symbols you'd find in `.wrangler/tmp/*/worker.js` are just the bundled library's export list — the library ships them whether or not we wire them.

**Side effect of the same default:** the document and image describers (`describerSession`, `ai.ts:185`) also construct `ClaudeAPIBackend` with no `name`, so the mechanical digest work is billed at Opus 5 with a 64k ceiling too. That's the clearest immediate cost win, and it's independent of the delegation work.

## What closing the gap looks like

A child ticket, not this one. Shape:

- register a second variant constructed with `name: 'claude_worker'` (that's the one thing that makes the config readable);
- add `"claude_worker": { "model": "claude-haiku-4-5-20251001", ... }` to `backends.json`;
- declare a worker role in `roles.ts` with its own priming and its own *narrower* L1 grant — the authority is the role's grant, and no brief can widen it;
- compose `DelegationToolbox` over a `DelegationRuntime({ manager, workers: { [workerRole]: { backend, build, surfaces } }, caller })`, merge `delegationInstanceConfig([workerRole])` into the consultant's grant, and give the worker `ReportDelegatedWork`.

Want me to file that as a child ticket now, or start with the cheaper describer fix and come back to delegation once you've been building for a while and can say which work actually wants handing off?

<!-- xgd-turn id="2faf49cb-49e2-4f42-8c94-77be0f8d6eaa-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T19:31:33.901547+00:00" -->
#### You
So the framework is in place, we just need to adopt it?

<!-- xgd-turn id="2faf49cb-49e2-4f42-8c94-77be0f8d6eaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T19:32:46.191916+00:00" -->
#### Claude
Yes — the framework half is done and installed. But adoption isn't a config flip; it's a small ticket's worth of real wiring plus two decisions.

**The cheap half.** A `claude_worker` entry in `backends.json` naming Haiku, and a `delegation` entry in `instances.json`.

**The half that's actually code.** `WorkerConfig` requires `{backend, build}` — `build` is a function the host supplies that constructs the adapter around the *worker's own* toolbox (`delegation_toolbox.js:126-133`). So it's a second `createL1Toolbox` call with a narrower grant and a second registered backend name, not a reuse of the consultant's. Then a `DelegationRuntime({manager, workers, caller})`, `DelegationToolbox` composed into the consultant's surface list, and `delegationInstanceConfig([workerRole])` merged into its grant.

The worker needs priming of its own too. `priming_without_corpus` is the nearest existing shape — role, product-system, `site.manual`, cache boundary. A worker needs the page vocabulary and its tool manual; it doesn't need the consultation method.

**Two consequences to settle before adopting, not after:**

1. **A session record per delegation.** The worker is a whole session, and this host's archive is `TicketSessionArchive` (REQ-160) — so every delegation creates a `chat` ticket in the tenant's store. `kb/knowledge_bases.json` filters the project corpus on `type: [chat, material, reference, brief]`, so worker transcripts would join the *client's* knowledge base, and their growth would ride the `corpus.delta` reminder back into the consultant's turn. The framework flags this in its own header as the host's configuration to change. Either the corpus filter excludes worker sessions, or the client's KB fills with machine chatter.

2. **The live re-render survives** — worth knowing because it's the thing that would most obviously break. `SITE_CHANGED` comes from `store.counter(slug)` polled after each `TOOL_ACTIVITY` event on the caller's stream (`host-core.ts:1605-1613`). A `Delegate` call *is* tool activity, so the worker's writes land in the counter jump and the pane re-renders with them. No extra wiring.

Both are now in the epic body under Finding 1.

My recommendation on ordering: don't adopt this first. Build with the consultant for a while — you'll find out which work is genuinely mechanical-and-bulky (my guess: whole-page L1 writes and image-heavy passes), and that shapes the worker's grant and its `accept` checks far better than deciding now. The describer fix is independent and cheap, if you want the cost win today.

Say the word and I'll file the child ticket.

<!-- xgd-turn id="9de78e62-f118-447f-b2d7-487adeadc417-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T19:36:46.359699+00:00" -->
#### You
Hmm...how is the delegate prompted - it has to get the prompt from the parent, right?

<!-- xgd-chat-end -->