---
uid: comment-d8169cbf
id: COMMENT-3136
type: comment
title: Comment on epic EPIC-19
created_by: xgd
created_at: '2026-09-18T19:05:45.594764+00:00'
updated_at: '2026-09-18T20:54:35.177342+00:00'
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

<!-- xgd-turn id="9de78e62-f118-447f-b2d7-487adeadc417-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T19:37:44.709633+00:00" -->
#### Claude
Right — and the split is sharper than you'd expect. There are two channels, and only one comes from the parent.

**System channel — the host's, not the parent's.** `_openWorker` calls `manager.createSession(role, registryName, {sessionId})`, so the worker's system prompt is its *role's* priming, assembled by the normal path. The parent contributes nothing to it and has no parameter that could. That's what makes "the brief carries intent, the role carries authority" structural rather than a convention.

**User channel — the parent's, and it's exactly one turn.** `_runWorker` calls `manager.promptStream(workerSid, brief(goal, checks))`. `brief()` (delegation_toolbox.js:505) assembles:

```
<the parent's goal prose, verbatim>

Before you report, make each of these checks and report it as passed or
failed with a reason. Quote each one back exactly as written here:
- <check 1>
- <check 2>

When the work is done, report the result. What you report is the whole of
what the session that gave you this work receives; it does not see this
conversation.
```

That is the entire crossing. Not the parent's transcript, not the parent's priming, not the client's words.

**One turn, not a conversation.** The turn contains the worker's whole tool loop — many calls, many round-trips — but it never gets a second user message. The parent can't iterate with a worker; an underspecified brief comes back thin and the parent re-delegates. That's what bounds the cost of a single `Delegate` call.

## The part that matters for us

A worker knows only three things: what its role's priming teaches it, what its surfaces let it read, and what the parent wrote in the goal. It doesn't know what your client said, what you decided four turns ago, or why. Three consequences:

1. **Site binding is free.** `config.surfaces` are built by the host per delegation, so the L1 surface arrives already bound to the slug. The worker can read and write the right site without being told which one.

2. **Corpus access is a grant decision.** Without the knowledge surface, everything about the client's brand has to be in the goal prose. With it, a Haiku session is reading the client's knowledge base — and it's the cheap model making retrieval judgements.

3. **The consultant doesn't currently know how to brief a worker.** Nothing in `priming.json` teaches it what a good goal or a good `accept` check looks like, and the entire value of the split rests on exactly that skill. The surface's own overview is blunt about the failure mode: if the parent re-inspects everything the worker did, the tokens have been *moved to the more expensive side*, not saved. So adopting this means authoring new priming, not just wiring — and that authoring is the hard part, because you're teaching an Opus session to write prompts for a Haiku one at runtime.

Worth knowing on the accounting side: worker spend rolls into the caller's ledger, attributed to the delegation, on every exit path — including `failed` and `stopped`.

All of this is now in the epic body. It reinforces my earlier ordering: build with the consultant first, watch where it writes long mechanical sequences, and let those observations tell you what the worker's role and its brief-writing priming should say.

<!-- xgd-turn id="836f9cb2-07cd-4c5f-b2ae-8bf5af11545e-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T19:45:33.860036+00:00" -->
#### You
My feeling is the delegate does not need access to the broader kb. It needs information about the tools and very specific instructions from the parent and thats it. (May not be true for all delegates but in this context...) If brand context is needed it should be supplied by the parent.

Let park this for now, as you said I don't think we are ready for it. We will come back Please record our thinking in your ticket so we can recover it easily.

Now one quick question - I am looking at my Lagrange Foundry site - I built it with a chat session but I do not see that chat context in the window. Is that a bug? Is the chat session lost?

<!-- xgd-turn id="836f9cb2-07cd-4c5f-b2ae-8bf5af11545e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T19:48:06.946722+00:00" -->
#### Claude
Parked and recorded — including your call that the worker gets tools + the parent's instructions and nothing else, with the reasoning for why, so we can pick it up cold.

On the chat: **it's a bug, and no, the conversation is not lost.** It's intact — 26,815 bytes of transcript plus 224,813 bytes of tool record — sitting on a chat ticket the builder no longer looks for.

## What happened

`sessionIdFor(site)` is `site-${site}`, and `TicketSessionArchive` finds-or-creates a chat ticket by `fields.session_id`. So a conversation is keyed on the site's **address**. Change the address and the lookup misses — and because "no ticket with this session_id" is indistinguishable from "a brand new site", it silently creates a fresh empty session instead of erroring.

Lagrange Foundry's address has moved twice, so there are now three chat tickets in your tenant:

| chat ticket | session_id | transcript | when |
|---|---|---|---|
| `chat-d73a11e1` | `site-unnamed` | **26,815 bytes** | 2026-09-11 |
| `chat-b98f4eec` | `site-lagrangefoundry` | 269 B — header only | 2026-09-13 |
| `chat-50932534` | `site-site_936dd7c92e…` | 313 B — header only | 2026-09-14 |

The first is your real build conversation — it opens *"Please review the background document that I uploaded. I want to build an initial site for this company."* You started it while the site was still `unnamed`; naming it moved the address, and the later migration of site addressing from name-slugs to opaque `site_<hash>` ids moved it again.

It isn't just this site. `1stcontact` (`chat-5c9fd79b`, 3,666 B) and `xgd` are orphaned the same way, and `gigabytealchemy` lost one too.

## Two defects, not one

1. **The migration miss** — when site addressing changed, the existing chat tickets weren't re-keyed. That's data repair: re-point `fields.session_id` on the surviving ticket, rewrite `id`/`backend` in its `xgd-session` header, and remove the empty ticket that would otherwise win the lookup.

2. **The design that made it silent** — keying a conversation on a *mutable* address means any future rename orphans it again, with no error and nothing in the UI. The durable identity is the site. Either derive the session id from something immutable, or have the site row carry its chat ticket uid — `TicketSessionArchive` already supports addressing a session by ticket, so that route is close to free.

Both are in the epic body.

Two things I'd want from you before touching anything: this is your **local dev D1** — I haven't looked at production, and I can't reach it from here, so it's worth checking whether the deployed sites have the same orphaning. And the repair is a write to your data, so say the word and I'll do Lagrange Foundry first, one site, so you can eyeball the result before I touch the other three.

<!-- xgd-turn id="092b5873-436c-4f07-a959-155a5e832f90-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T20:33:35.438202+00:00" -->
#### You
Keys should always be fixed independent and usually SHAs. Can you create a ticket to fix this please I think I need:
(1) ensure that the data model has an immutable (non-data) key for business and sites
(2) update the code to use that key rather than the site name
(3) fix the any prod data that would be confused by this

<!-- xgd-turn id="1bbcc938-b581-43f1-9399-7a4c7bfc4485-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T20:36:03.151617+00:00" -->
#### You
Keys should always be fixed independent and usually SHAs. Can you create a ticket to fix this please I think I need: (1) ensure that the data model has an immutable (non-data) key for business and sites (2) update the code to use that key rather than the site name (3) fix the any prod data that would be confused by this

Or am I misreading it looks like this was maybe fixed - your last chat sessiona appears to point to a proper key, yes? In which case I need the data fix `chat-d73a11e1`  transcript pointed at `chat-50932534`

This also needs fixing for any other sites in this state

<!-- xgd-turn id="1bbcc938-b581-43f1-9399-7a4c7bfc4485-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T20:38:39.503261+00:00" -->
#### Claude
You're reading it right — and the evidence is clear. Let me confirm the scope precisely before I write the ticket.

**BUG-116** — *Chat sessions orphaned by the site-address migration*, filed and linked from EPIC-19.

You're reading it right: **(1) and (2) are already done.** One refinement to your principle, though, because the codebase went further than it:

> 128 BITS FROM A CSPRNG, NOT A DIGEST. A hash *of the row's data* is data-as-key wearing a disguise: `sha256(email)` still changes when the address changes and still says two addresses are two people.

That's `tools/generate/src/store/ids.ts` (REQ-190). So not usually SHAs — a SHA *of the data* is still data-as-key. Every `sites.id` is `site_<32hex>`, every `tenants.id` is `biz_<32hex>` bar one legacy UAT fixture, and all four `sessionIdFor` call sites receive a site id. What you're seeing is pure residue: the migration re-addressed sites but didn't re-key the chat tickets left behind.

## The repair isn't uniform — three cases

**(a) Orphan has content, current is empty — mechanical.**

| site | keep | orphan address | retire |
|---|---|---|---|
| Lagrange Foundry | `chat-d73a11e1` — 26,815 / 224,813 / 3,404 | `site-unnamed` | `chat-50932534`, `chat-b98f4eec` |
| 1st Contact | `chat-5c9fd79b` — **106,129 / 589,882 / 3,666** | `site-1stcontact` | `chat-15df6ccb` |

I'd re-key the orphan rather than move its transcript onto `chat-50932534` as you suggested — the orphan ticket carries its title, the AI-maintained summary body, the tool transcript and its `created_at`, and moving only the transcript loses all of that. Same visible outcome, less thrown away.

**(b) Both have content — needs your decision.** XGD has a live session at the correct address (`chat-9d2dcca0`, 22,635 / 323,855) *and* an orphan at `site-xgd` (`chat-d53aa031`, 10,041 / 153,901). The orphan is earlier history, not a duplicate. No rule merges those; the ticket says leave it in place and make it reachable rather than silently re-key or delete.

**(c) Nothing to recover.** Gigabyte Alchemy's pair are both empty; Felix Test has only an empty `site-unnamed`. Retire and move on.

Two things worth knowing beyond the repair. `backend_ref` has to be **cleared** when re-homing — the header names a backend segment that no longer exists, and a stale one fails on the next turn rather than on first read, which would look like the restore didn't work. And the data shows the hazard you're guarding against: three tenants each hold a `site-unnamed` session, and `site-xgd` exists in *two* tenants — the real one plus an empty stray in the 1st Contact tenant. Tenant-scoping meant they never actually collided, but that's what a mutable human-meaningful key produces.

Everything above is your **local dev** store. Prod isn't surveyed — I can't reach it from here — so the ticket scopes the fix as a survey-then-apply the operator runs, dry-run by default.

Ready to cut the branch and start on it whenever you want. Given free-coding, I'd take (a) first: it's two sites, fully mechanical, and it gets your Lagrange Foundry conversation back in front of you.

<!-- xgd-turn id="9dd68164-7981-4255-899f-cd9daf8cdebd-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T20:54:35.124134+00:00" -->
#### You
Fine lets copy the transcripts and delete the old chats. Can you do this or is it worth a ticket

<!-- xgd-chat-end -->