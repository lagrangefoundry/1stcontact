---
uid: comment-d8169cbf
id: COMMENT-3136
type: comment
title: Comment on epic EPIC-19
created_by: xgd
created_at: '2026-09-18T19:05:45.594764+00:00'
updated_at: '2026-09-19T18:45:24.674068+00:00'
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

<!-- xgd-turn id="9dd68164-7981-4255-899f-cd9daf8cdebd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T20:57:51.286482+00:00" -->
#### Claude
Data repair, not a code change — so no branch and no UATs needed for the local part. I can do it now. BUG-116 stays for the prod survey and the make-it-legible work, which *are* code.

Let me check a few things first so I don't corrupt anything.

Everything checks out. Backing up first, then the repair.

Done — no ticket needed for this part. It's data, not code, so the free-coding protocol doesn't apply; BUG-116 keeps the code-side work.

**Your Lagrange Foundry conversation is back.** 28 turns, 26,875 bytes of transcript, 224,813 bytes of tool record, plus the summary and the proper title — all now on `chat-50932534`, the ticket at the site's current opaque-key address.

| site | survivor | transcript | tools | summary |
|---|---|---|---|---|
| Lagrange Foundry | `chat-50932534` | 26,875 | 224,813 | 3,404 |
| 1st Contact | `chat-15df6ccb` | **106,147** (113 turns) | 589,882 | 3,666 |

I moved the comments by re-pointing `subject_uid` and copied the title and summary body across, so nothing was dropped in the move. Deleted: `chat-d73a11e1`, `chat-b98f4eec`, `chat-5c9fd79b`, `chat-bff48a7f`, plus the empty orphans for Gigabyte Alchemy and Felix Test, and their leftover comments and `ticket_changes` rows.

One thing I did beyond the literal instruction: **cleared `backend_ref`** in both headers. It named a backend segment that no longer exists, and a stale one doesn't fail on read — it fails on the session's *next turn*, which would have looked like the restore itself hadn't worked.

Verified after writing: both session files still parse, each header's `id`/`chat_ticket_uid` agree with its ticket's `session_id`/uid, both transcripts end cleanly on `xgd-chat-end`, exactly one `chat_transcript` comment per chat ticket, and no comment points at a deleted subject.

**I left XGD alone**, and I'd want your call before touching it. It's the case where both sides have real content: `chat-9d2dcca0` is live at the correct address (22,635 / 323,855) *and* `chat-d53aa031` is a genuine earlier conversation orphaned at `site-xgd` (10,041 / 153,901). Applying the same rule there would overwrite live history with older history. Options are to leave it, or to append the older transcript ahead of the newer one — but that's a merge, and merges of a session file want more care than a repair script.

Backup is at `.xgd/tmp/d1-backup-before-chat-repair.sqlite` if anything looks wrong. **Restart the builder** to pick it up — the archive caches session-uid lookups in memory.

Still open on BUG-116: the production survey and repair, the key-model assertions, and making an orphan discoverable instead of silent. Those are code and go through the normal branch-and-UAT route.

<!-- xgd-turn id="f73bc645-e225-4581-8748-1bf699d77c55-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:02:15.765573+00:00" -->
#### You
Sure leave xgd.

Thank you I see my conversation again

<!-- xgd-turn id="f73bc645-e225-4581-8748-1bf699d77c55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:02:42.564962+00:00" -->
#### Claude
Good to hear. Let me record the XGD decision so it doesn't sit as an open question.

Recorded — XGD is now a decision on BUG-116, not an open item. The earlier conversation stays intact in the store, just unreachable from the builder, and I noted that the production survey must report that case separately rather than folding it into the repairable set.

Where EPIC-19 stands:

- **Finding 1** — model routing. Opus 5 confirmed on the conversation; Haiku delegation available in the framework but not adopted here, parked with your reasoning captured.
- **Finding 2** — the orphaning. Diagnosed, local data repaired, BUG-116 filed for the rest.
- **BUG-116 open work**, all code and all through the normal branch-and-UAT route: the production survey and repair, assertions pinning the opaque-key model so a name-keyed path can't land unnoticed, and making an orphaned conversation discoverable instead of silent.

Worth a flag while it's fresh: your **production** store likely has the same shape, and the sites there have had real client conversations. Nothing is at risk — the transcripts survive, they're just invisible — but the longer it runs the more sessions accumulate at stale addresses. Whenever you want, the survey half of BUG-116 is small and read-only, so we can find out what's actually there before deciding on a repair.

Otherwise — carry on building with the consultant. That's what this epic is for, and the friction you hit is what I want to see.

<!-- xgd-turn id="958a9e9d-5836-4bce-9492-562b83efe221-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:03:34.248473+00:00" -->
#### You
Can you delete the orphaned xgd chats please and the back up

<!-- xgd-turn id="958a9e9d-5836-4bce-9492-562b83efe221-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:04:27.877734+00:00" -->
#### Claude
One check before I do this, because the two together can't be undone.

`chat-0e3f7263` (`site-unnamed`, 253 bytes, empty) — no issue, that's junk.

`chat-d53aa031` is the one I want you to confirm. It's a real conversation, not a stub:

- **"XGD (GenDev Labs) — marketing site for a governor for AI-generated software"**
- 10,041 bytes of transcript, 153,901 bytes of tool record, 933-byte summary
- 2026-09-10, superseded by the current `chat-9d2dcca0` (22,635 / 323,855)

Deleting the backup at the same time removes the only recovery path for it, so once both are gone that conversation is gone permanently.

Three ways to go — say which and I'll do it straight away:

1. **Delete everything** as asked — both XGD orphans and the backup.
2. **Delete both orphans and the backup, but export `chat-d53aa031` first** to a ~164KB markdown file somewhere you choose. Gets rid of the 2.8MB database backup and the clutter in the store, keeps the conversation readable if you ever want it.
3. **Delete the empty one and the backup, keep `chat-d53aa031`** where it is.

My inclination is 2 — it costs one small file and removes every other thing you asked to remove. But it's your data and your call.

<!-- xgd-turn id="b3b268ac-2bc9-4376-92d7-bb6515200ab7-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:05:03.047263+00:00" -->
#### You
ok do 2

<!-- xgd-turn id="b3b268ac-2bc9-4376-92d7-bb6515200ab7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:06:26.193135+00:00" -->
#### Claude
Done.

**Exported** → `storage/chat-archive/xgd-site-xgd-2026-09-10.md` (166,368 bytes): the summary, the verbatim session file with its header so it could be restored, and the full 153,901-byte tool record.

**Deleted** → `chat-d53aa031` and the empty `chat-0e3f7263`, their comments and `ticket_changes` rows, and the 2.8MB backup at `.xgd/tmp/d1-backup-before-chat-repair.sqlite`.

The store is now clean — every chat ticket sits at an opaque-key address:

| tenant | session | transcript |
|---|---|---|
| 1st Contact | `site-site_62d3d00…` | 106,147 |
| Lagrange Foundry | `site-site_936dd7c…` | 26,875 |
| XGD | `site-site_bca807f…` | 22,635 |
| Gigabyte Alchemy | `site-site_d669b15…` | 313 (new) |

No dangling comments, and each business conversation is keyed on its `biz_` id. XGD's live conversation was not touched.

Two things worth knowing: the archive file is **untracked** in git (`storage/` is only partly tracked), so it'll show in `git status` — commit it or move it wherever you'd rather it lived. And it's now the only copy of that conversation, since the backup is gone.

BUG-116 records it, and I've noted that export-then-delete is a third outcome the production survey has to be able to produce — alongside re-home and retire — because what to do with a superseded conversation is a judgement about its worth, not something a rule can decide.

<!-- xgd-turn id="4c2e8df4-5f92-4fe4-a090-5a5f0c60b7a5-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:08:45.700455+00:00" -->
#### You
ok so I have been playing with the reproduction console and every run generates a bunch of bugs - ai think we are up to 9 now some of these will be L1 bugs, can you review all these and see if there are patterns - is there anything we can do to get ahead of fixing bug by bug?

<!-- xgd-turn id="4c2e8df4-5f92-4fe4-a090-5a5f0c60b7a5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:12:19.687068+00:00" -->
#### Claude
I read all of them — it's 10 tickets carrying **22 distinct defects** (REQ-265/269/270/271, BUG-106–111, plus evidence appended to BUG-100 and BUG-24). Three logged rounds cost **$22.28 over 246 turns** on `claude-opus-5[1m]`.

## The headline

**Only 2 of the 22 are L1 capability gaps.** Eleven are defects in the instrument that measures fidelity.

| where it sits | n |
|---|---|
| instrument reports pass/clean when it measured nothing or wrong | 5 |
| the two sides measured by different procedures | 4 |
| capture loses information the page had | 5 |
| comparator has no axis for it | 2 |
| fold is wrong | 2 |
| **L1 genuinely cannot express it** | **2** |
| process/harness | 2 |

The loop is working exactly as designed. What it's telling you is that **the ruler isn't trustworthy yet** — so it keeps finding ruler bugs instead of L1 bugs. The ticket quality is genuinely high (dependency-ordered, every claim quoted from a file or a command the round actually ran). The problem isn't the console; it's what you've pointed it at.

## Four patterns

**1. A false pass is the norm.** REQ-269 opens *"a pass verdict at mean 0.31 hides five residuals"*. REQ-271: *"a pass at mean 0.31 with 14 deltas."* BUG-106 reports `0 deltas, 0 unmatched` having measured nothing. BUG-107's missing comparison made 11 lost headings read as zero deltas. BUG-110's verdict ladder ignores the value gate's severity entirely. BUG-111's unpaired section is *"reported nowhere the gate reads"*. One design choice generates all six: **when the instrument can't see something, it answers pass rather than unknown.**

**2. The two sides are read by different code.** REQ-270 #3 says it outright — *"the two sides are read by two different procedures"*. Different populations (#4), band paint read from the fill box on one side only (#2), bands on one side and none on the other (REQ-269 #5). None of these is authorable if one extractor runs over both sides against one schema.

**3. The capture is a lossy bottleneck.** Padding, the line-height fraction, `href`, alpha, transparent-vs-white — one defect shape: the extractor stores a rounded or defaulted value instead of the true one. No fold fix or L1 axis recovers what capture discarded.

**4. A frozen bundle makes landed fixes invisible.** REQ-271 confirms the score is *"again 1051.13, region for region"*, and 13 of its 14 deltas are REQ-269's already-ticketed residuals. Round 3 spent $4.91 and 56 turns largely re-confirming frozen items.

## How to get ahead of it

1. **Unfreeze the loop** (REQ-270 #1) — a bundle that records which extractor took it, and a re-capture when the extractor moves. This is the rate limiter, and it isn't a fidelity defect at all.
2. **Make `unmeasured` a verdict, not a pass** — one change converts six of the 22 from silent to loud and prevents the next six.
3. **Symmetry by construction** — one extractor over both sides. Retires pattern 2 as a *category* rather than as four tickets.
4. **Audit capture completeness once** — mechanically diff the CSS properties a reference page uses against what `capture.json` records. Two or three references turns five rounds of discovery into one list.
5. **Split the queues** — only the two class-2 items raise the product's ceiling, and they shouldn't sit behind ruler repair.

One metric warning: **stop reading delta count as progress.** Landing BUG-107 took deltas from 1 to 14 — that's the instrument sharpening, not the reproduction degrading. The number that means something is the unmeasured set shrinking.

All of this is Finding 3 in EPIC-19. If you want, I can file a single ticket for the "ruler-first" program — items 1–3 as one coherent piece of work, since they share a root — rather than letting them stay scattered across four REQs. That would also let you pause the console for a round or two, which given $7/round of partly-rediscovery would pay for itself.

<!-- xgd-turn id="4843e28c-a0ac-4b9d-9b31-09062b747fbf-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T21:42:54.281217+00:00" -->
#### You
I have pasted this response into EPIC-12 transcript because that is a more relevant location for that discussion.

I want your help with feedback I got from the tool:

**1. No — I cannot create tickets of any kind, XGD bugs included.** My ticket access is read-only: I can look tickets up, query them, read comments, backlinks and history. There is no create, no update, no comment-add. I confirmed this by pulling the full entries for every ticket tool I have. So when I hit a bug in this session, I have no way to file it — I can only tell you in conversation, which is exactly what's about to happen.

**2. Two real bugs found this session, one of them live right now.**

**Bug A — the knowledge corpus is down.** I just tried to search your project knowledge for the XGD positioning and got back: `corpus_unreadable — an index or a store is missing or damaged. This is a deployment fault, not something to retry differently.` That is the tool telling me it's a deployment fault. It was working earlier in the session — I read the Lagrange Foundry brand document through it — so it has broken *during* the session.

**Bug B — the two-store problem, which cost us real time.** This is the more interesting one for your design. Pictures live in two separate places: the **site's** files, and the **client Library**. Earlier I told you flatly that I couldn't see the image I'd generated. That was wrong — it was in the Library the whole time, and `screenshot` reads Library names directly. I'd checked the site's files, found nothing, and concluded I was blind.

Two attempts at the recursive image, both failed the same way: the picture generated fine but couldn't be stored — `store_unavailable`, reported as a deployment fault. That's a third bug for your list, and a nastier one than the billing error: **it burns the generation cost and hands back nothing.** Two identical failures is enough; I've stopped rather than spending more of your money into a void. Worth checking whether the generated bytes are recoverable somewhere, because they were made.

So 4 issues - can you review recent REQs I thought we created a tool for the production AI to file bugs in this project - I definitely started the conversation. And then three bugs - can you investigate and create tickets for these please

<!-- xgd-turn id="4843e28c-a0ac-4b9d-9b31-09062b747fbf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T21:47:41.251774+00:00" -->
#### Claude
Four things to run down. Let me start with the ticketing surface, since that determines whether the AI could have filed the other three itself.

Investigation done. Filing four tickets.

Four tickets filed, all linked from EPIC-19.

## 1. The filing tool — you didn't build it here, but it exists upstream → **REQ-273**

No REQ in this project covers it. But the capability is already shipped in `@lagrangefoundry/ai-ticketing`, which carries **two** declarations, and we adopted only one:

- `tickets` → `ReadTickets` / `WriteTickets`
- **`development` → `FileDevelopmentTickets`: `report_bug`, `request_capability`, `add_ticket_detail`**

Same shape as the delegation finding: built upstream, never consumed here. `ai.ts:311` even predicts this — *"`ReadTickets` AND NOT `WriteTickets`, which is a separate decision nobody has made."*

Importantly, `WriteTickets` would have been the **wrong** fix — it writes into the *client's* tenant. The `development` surface answers that in its own overview: *"What you file here goes to the people who build this product… nothing filed here reaches them."* It also pre-empts the noise problem: *"Filing is not something to do on your own initiative. Someone asks for a ticket; your part is writing the good version of it."* Empty `scope_axes`, so there's no axis to get right. The real work is giving a Worker a handle to our own project store, not the grant.

## 2. `corpus_unreadable` → **BUG-117**

The defect stands regardless of what actually broke: it's a **catch-all**. `toolbox.js:600` turns *every* unrecognised failure — a Workers AI 429, an R2 timeout — into the same error as a genuinely missing index, and the declared message then says *"not something to retry differently."* Your assistant did the right thing with the information it had: it stopped. `host_detail: false`, so the real cause never reached it.

Two root-cause candidates consistent with "worked, then broke mid-session": the embedder (Workers AI is the one dependency here with a rate limit and an expiring token) or a read crossing a partially-written index, since the project KB re-indexes near-live off your own transcript growth.

## 3. The two-store problem → **BUG-118**

Not a missing grant — the Library surface is composed and granted. And the trap is *already documented*, almost word for word: *"Do not think of these as two stores… `screenshot` takes the name this catalogue gives you, unchanged."*

The problem is **that text is in the surface overview, which isn't in the default projection.** The assistant sees one line per tool. And the priming's rule for fetching the full entry only fires when you're unsure *what a tool takes or returns* — this assistant wasn't unsure, it was confident and wrong about where its own output had gone.

The sharpest fix is the cheapest: **`create_image` returns `ticket`, `attachment`, `filename`, `size`, `tier`… and nothing that says "this is in the client's Library" or "that filename is what `screenshot` accepts."** The one moment the assistant is guaranteed to be paying attention is the moment the system says nothing.

## 4. `store_unavailable` → **BUG-119**

You were right that this is the nasty one. `_store` creates the ticket, *then* attaches the bytes, and the bytes exist only in memory — **no write-ahead**. If `create` fails, they're discarded on unwind. Both failure modes raise the same code with `host_detail: false`, so a second attempt is indistinguishable from the first, which is exactly what you saw.

On recovery: **almost certainly not for these two.** It'd need an orphan blob, only possible if `attach` was reached, and there's no operation here that reads one. I've put a look in R2 in the ticket, but the honest expectation is the money's gone.

One thing worth acting on before anything else: **BUG-117 and BUG-119 both reported store-level deployment faults in the same session.** Two surfaces failing that way within one session is more likely one cause than two — I've flagged that in both tickets.

<!-- xgd-turn id="9f5b6c9b-3fcb-414b-815a-88cb5efb2aee-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:29:37.803036+00:00" -->
#### You
Can we actually have a generated picture appear in the chat flow?

<!-- xgd-turn id="9f5b6c9b-3fcb-414b-815a-88cb5efb2aee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T22:30:13.178179+00:00" -->
#### Claude
Let me check — there are traces in the code suggesting some of this already exists.

<!-- xgd-turn id="aac1083f-868c-4e17-b4d4-1dbd96cfe350-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:30:47.813198+00:00" -->
#### You
This might be an option for the AI, but I think it is usually the right thing - right now I have to switch to the library to see the image we just created.

<!-- xgd-turn id="aac1083f-868c-4e17-b4d4-1dbd96cfe350-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T22:36:45.128812+00:00" -->
#### Claude
This one's mostly built already. Let me file it with what I found.

REQ-217 already exists for this — I filed a duplicate. Let me read it and correct.

I got that wrong — the handle *is* wired. Let me establish the real state before correcting the ticket.

I need to correct that — my append contained a false claim. The feature is fully built.

Good — the append never actually landed, so nothing false was written. Let me see what REQ-217 already records.

Found it — REQ-217's body is frozen by design past `ready_to_reconcile`. My log filter hid the error. Using a comment instead.

Yes — and it's **already built**. I went down a wrong path first, so let me give you the corrected picture.

## This shipped on 2026-09-11

**REQ-217 — "Chat: an image a turn produced appears in the conversation"** — free-coded as `215187d64c` at version 0.2.169, status `ready_to_reconcile`, with two UAT files including a workerd one that fetches the bytes back through the Worker's own route table.

All of it is wired:

- `imagegen.ts:391` passes `display: generatedDisplay(opts.materialUrl)` into the plugin
- `router.ts:667` supplies the URL factory — the only place holding both the route and the resolved business
- The sentence the model actually receives is explicit: *"Show this picture to the person you are talking to by including this line in your reply, exactly as written: `![name](url)`"*
- `displayLine` is the single composer for both `write_image` and `create_image`, so the chat pane can read the material back off the `<img src>` — that's the REQ-220 contract
- Clicking it opens the same modal the Library does

So the question isn't "can we", it's **why isn't it happening for you**. Three candidates:

1. **The model isn't pasting the line.** REQ-217 explicitly accepted this failure mode — *"for a failure that costs a client one click"*. That's the trade you're now overruling.
2. **Your running build predates the commit.** `1c builder` never rebuilds the browser bundle; a `src/builder/*.js` change needs `./bin/1c assets`. **Check this first — one command, costs nothing.**
3. The call took a path with no `materialUrl`, where absence is designed to be silent.

## Your decision is recorded

> *"This might be an option for the AI, but I think it is usually the right thing."*

That overrules REQ-217's accepted failure mode: showing is the norm, the assistant needs a reason to *withhold*. It doesn't revive the host-injected trailer that ticket rejected — instead, make the expectation standing in `priming.json` (it composes with the existing `act-rather-than-narrate` reminder), then measure; if the picture is still omitted, the guarantee becomes structural with evidence behind it.

That's on REQ-217 as **COMMENT-3142**, because its body is frozen at `ready_to_reconcile`. Any priming change needs a new ticket.

## Two corrections on my own work

I filed **REQ-279** as a duplicate before finding REQ-217 — archived it.

And more usefully: my `update` and `append` calls to REQ-217 both *looked* like they succeeded and wrote nothing. The refusal — *"ticket is in the reconcile pipeline; body/title are frozen"* — was a log line my own output filter was cutting off. I've saved that to memory so I check writes properly rather than tailing filtered output.

<!-- xgd-turn id="83f1f645-9348-490b-b5f9-7757285b8673-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:58:56.302667+00:00" -->
#### You
I just (accidentally) navigated away from the Lagrange Foundry business - when I returned I found I had lost my latest turn exchange which was in-progress with the AI - is it gone for good?

Lets talk about this experience - I think the user will expect an open turn to run to completion even if the page is refreshed or navigated away from even if the browser is closed.

<!-- xgd-turn id="83f1f645-9348-490b-b5f9-7757285b8673-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:01:27.877192+00:00" -->
#### Claude
Let me check your actual data first, then the machinery.

**Gone for good, yes.** I checked your transcript directly: `chat-50932534` now holds 36 turns, 57,348 bytes, ending on a *complete* user/assistant pair. There's no orphaned user turn and no partial reply. The in-flight turn left no trace at all — including your own message.

## The codebase already agrees with you, and says exactly where it stopped

**BUG-46 solved half of this.** `router.ts:5326` is worth reading in full because it's the precise answer:

> A reload aborts the SSE, the next `controller.enqueue` throws on the cancelled stream, that runs the generator's `finally` — where the library appends `turn_end` and awaits `sync()` […] Registering the stream's completion means the drain and this audit flush both outlive the client that walked away, which is what makes a **COMPLETED** turn durable under a reload race.

And then it names the rest:

> It does not make an in-flight turn durable — that is the junction's business, and in this Worker the junction is RAM (`ai.ts`), so an isolate evicted mid-turn still loses it. Rendering from the junction is what narrows the window; **only a Durable Object would close it.**

Confirmed: `ai.ts:202` and `:598` pass `memoryJunctions()`, and `wrangler.toml` declares no durable objects and no workflows. The turn is driven by the fetch request; the live record lives in the isolate. Both die when you leave.

So the honest framing: **the turn is terminated, not completed.** That's precisely the gap between the system and your expectation.

## Why I think your expectation is right — and the lost text is the least of it

1. **Turns have side effects.** A consultant turn writes pages, palettes, pictures. One killed after three of seven edits leaves the site half-changed — and the change signal still fires, so the pane re-renders and the client *watches their site move* with no reply explaining why. Nothing records that the turn was interrupted.
2. **Turns cost money.** Same family as BUG-119: spend already made, artifact nobody receives.
3. **Turns are long.** A tool loop against a browser and a store, not a two-second reply. The window where leaving hurts is most of the turn.

## What closing it takes

The good news: **the reattach half is already built.** `tailSession` is a cursor-based subscriber over the junction, explicitly *"safe to do on any page load"* and *"never a second producer"*. It was written for this. What's missing is underneath it:

- **A driver that outlives the request** — a Durable Object per session is the natural shape. A session already has one identity, turns must be serialised per session anyway (the transcript's compare-and-set proves it), and the junction wants to live beside its driver. `ctx.waitUntil` won't do; BUG-46 already spent it on the drain.
- **A durable junction**, so another isolate can read the live turn.
- **A resume contract on load** — `tailSession` answers it once there's a durable producer.

## One cheap thing worth doing regardless

**Fold the user's message before the turn starts.** Right now an interrupted turn costs you your own words *and* the reply. Persist the user turn up front and a lost turn costs only the answer — your question survives, shows on reload, and re-sends with one click. Small, independent of the DO work, and it removes the most irritating half of what just happened to you.

Related: **say that a turn was interrupted.** A turn ending without `turn_end` is knowable, and the transcript should show it rather than leaving a gap the client reads as the assistant ignoring them.

All of this is Finding 4 in EPIC-19. Want me to file it — and if so, as one ticket for the durable turn, or split the cheap intermediate out so it can land this week?

<!-- xgd-turn id="ec3a8ec4-0208-4a49-bd34-b76b1c272267-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:08:59.706057+00:00" -->
#### You
So the honest framing: **the turn is terminated, not completed. <-- terminated would be one thing, my prompt and the partial response I saw were lost too - much more serious. **

<!-- xgd-turn id="9111ac2a-c5ac-4dce-8e87-c9b9eb4d1b41-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:09:24.704639+00:00" -->
#### You
So the honest framing: **the turn is terminated, not completed. <-- terminated would be one thing, my prompt and the partial response I saw were lost too - much more serious. **

<!-- xgd-turn id="9111ac2a-c5ac-4dce-8e87-c9b9eb4d1b41-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:12:19.112159+00:00" -->
#### Claude
You're right, and that's a sharper and more serious claim than the one I made. Let me check it properly — because BUG-46's whole point was that the record survives the client walking away.

You're right, and the evidence is worse than either of us said. I have the timeline.

You're right. I understated it, and the store shows exactly how much.

## The timeline

| | |
|---|---|
| last message in the chat transcript | **22:18:34** |
| last tool record | **22:24:12** |
| both artifacts written | **22:24:46** |

Nearly **six minutes** of turn ran in that gap. At 22:24:46 the `tool_transcript` grew to 350,925 bytes. The `chat_transcript` went from **version 20 to 21 and gained nothing** — no user turn, no partial reply.

And the work wasn't trivial. The tail of the tool transcript is a `record_decision` against your engagement ledger, carrying a real decision about the site's recursion diagram, returning `{"entries": 6, "title": "Lagrange Foundry — initial website build"}`.

**So your ledger now records a decision the transcript has no memory of anyone making.**

## Why the halves behave differently

They're written by two mechanisms with two durability properties, and nothing makes them agree:

- **Tool records are append-only and land as they happen.** `_applyTools` says so: *"`append_body` rather than a read-modify-write: the artifact is append-only… there is no version to lose a race on."*
- **The prose transcript is a read-modify-write folded from the junction**, and the junction is RAM. BUG-46's `ctx.waitUntil` drain *did* run — `ctx` is correctly supplied at the one call site — but it folded against a junction that no longer held the records. Version bump, no content. That's the signature.

BUG-46 anticipated the hole. What it didn't anticipate is that losing the junction **doesn't lose the turn — it loses the half without consequences.**

## Why this is the more serious claim

Stopping work when the client leaves is a policy you can argue about. Committing the work and discarding the conversation isn't a policy, it's divergence:

- **The assistant's memory is now wrong.** Next turn it loads the transcript and can't see the decision it recorded. It'll re-ask or contradict itself, in front of the client.
- **You have no account of a change you can see.** The counter moved, the pane re-rendered, the transcript explains nothing.
- **You lost your own words**, not just the reply.
- **It's silent** — no error, no gap marker.

Filed as **BUG-121**, with items ordered so the integrity fix doesn't wait on the big one:

1. The prose record must be at least as durable as the tool record — both append-as-it-happens, or neither.
2. Fold the user's message before calling the model.
3. An interrupted turn must say it was interrupted.
4. *Then* the policy question — running to completion — which needs the Durable Object and durable junction, with `tailSession` already built for the reattach.

**1–3 should land before the DO work**, because the integrity defect doesn't go away once turns run to completion: a turn can still fail, and its two halves must still agree. EPIC-19's Finding 4 is corrected to match.

<!-- xgd-turn id="c357bba7-a478-497e-885e-dc64a063d6b0-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:23:25.250855+00:00" -->
#### You
ok so the consultant (we should use that word instead of assistant) and I are lacking a common frame of reference for assets. I am thinking that if we just expose the ticket ID (human readable) on the library item list that would do it - I assume the AI has access to that?

<!-- xgd-turn id="c357bba7-a478-497e-885e-dc64a063d6b0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:25:06.866583+00:00" -->
#### Claude
Noted — consultant from here on.

**No — and that's the crux of it.** Neither of you can see it today.

## What each of you actually sees

**The consultant's handle is the uid.** `storedImageOf` (`material.ts:1396`) sets `name: row.uid`, so `list_library` returns `item: "material-bd70d8d9"`. The `catalogue_item` shape carries `item`, `title`, `filename`, `kind`, `role`, `rights`, `placed_on`… and no human id.

**You never see the uid.** `library.js:527` renders `row.title || row.filename`, and the search filter is `${row.title} ${row.filename}`. The uid is used internally and never displayed.

So the only thing you currently share is *title and filename* — which is precisely the ambiguous thing.

## Your own Library proves the point

```
material-3328dff9 | MATERIAL-3 | A crucible of molten metal leaning forward to …
material-de9ac4ed | MATERIAL-4 | A crucible of molten metal leaning forward to …
material-bd70d8d9 | MATERIAL-5 | A crucible of molten metal leaning forward to …
```

Three generated variants with **identical titles**. You see three rows that read the same; the consultant sees three opaque uids. Neither of you can say "that one".

## So the list alone won't do it

It needs to land in three places to become a shared frame:

1. **The catalogue item** — project `human_id` into `catalogueItem`/`itemView`, so the consultant reads it.
2. **The Library row** — show it beside the title, so you read it.
3. **As an input** — so you can type "MATERIAL-5" and the consultant resolves it. This is the cheap one: `StoredImage.aliases` already exists and `haystack` already searches `name`, `title`, `filename` and `aliases`, so adding the human id to aliases makes the consultant's own filter match it with almost no new code.

(3) is what makes it a *common* frame rather than two parallel labels — the reference has to work in both directions.

**One caution:** don't swap the uid out. `library.ts:55` is explicit that `name` is the single projection shared with `screenshot` and `edit_image` — *"Writing `name: row.uid` here instead would be the drift in miniature."* Changing the handle would mean migrating stored edit recipes and any persisted reference. Add a display id; keep the uid as the machine handle.

## One decision I need from you

Your priming tells the consultant: *"If you ever find yourself naming a framework concept in a message to your client, you have already lost them."* Is `MATERIAL-5` operator scaffolding, or may the consultant say it to a real client?

I'd lean **client-facing** — a catalogue number is how a gallery or a print shop talks, and "the crucible, MATERIAL-5" is clearer than three identical titles. But it's a genuine call, and it decides whether this is a debug affordance or part of how consultations run.

Tell me which and I'll file it — it's a small, well-bounded REQ.

<!-- xgd-turn id="136f3b90-7863-4bc0-ab7d-8add96b2252b-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:41:13.111498+00:00" -->
#### You
Yeah I agree MATERIAL is a bit vague is that really what we called the tickets? I mean I would like to say IMAGE-5, DOC-7 but yes this is not too technical

<!-- xgd-turn id="136f3b90-7863-4bc0-ab7d-8add96b2252b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:42:47.303368+00:00" -->
#### Claude
**Yes, that's really the ticket type** — but it's the *type*, not the kind. There's one ticket type `material` covering everything the client gives you, and `kind` (`image` / `font` / `document` / `capture`) is a field on it. `human_id` is minted per ticket type, so you get MATERIAL-n.

And `material` is the right type name — it genuinely is "what the client gave us", whether that's a photograph or a brand book. It's just the wrong thing to put in front of a person.

## So: keep the number, change the prefix

Derive the label from `kind`, over the number the ticket already has:

| kind | label |
|---|---|
| `image` | `IMAGE-12` |
| `document` | `DOC-7` |
| `font` | `FONT-3` |
| `capture` | `CAPTURE-2` |

Your Library is currently 13 images and 9 documents, so those two are what you'd actually see.

**Why reuse the existing number rather than mint a per-kind sequence:** no second counter, no migration; the number stays globally unique across kinds, so `IMAGE-12` and `DOC-12` can never both exist; `MATERIAL-12` stays recoverable for debugging because it's the same number; and reclassifying an item relabels it without renumbering.

**The cost, so you're choosing it rather than discovering it:** per-kind numbering won't be dense. You'll see `IMAGE-3`, `IMAGE-6`, `IMAGE-13` — not 1, 2, 3. Catalogue and invoice numbers behave that way and it reads as normal, but if you want dense per-kind numbering that's a second counter and a migration, and better decided now.

Filed as **REQ-280**, with three things it has to do or it isn't shared:

1. the catalogue item the consultant reads
2. the Library row you read — and matchable by the row filter
3. **as an input the consultant accepts**, so you can say "use IMAGE-5" and it resolves without translation

(3) is the one that's easy to drop and is the whole point. It's also nearly free: `aliases` already exists and `haystack` already searches it.

The uid stays as the machine handle — `library.ts:55` warns that changing it is "the drift in miniature", and it's persisted in stored edit recipes.

One thing I wrote down explicitly: your "not too technical" ruling makes this a **carve-out from the priming's no-framework-vocabulary rule**, so the consultant may say `IMAGE-5` to a client. Recorded as a deliberate exception, so a later pass over the priming doesn't read it as a violation to clean up.

<!-- xgd-turn id="429c199c-2ec8-4b3e-a520-c8124c668b26-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:57:35.975843+00:00" -->
#### You
That's better than Material - would be nicer if we had IMAGE-1, IMAGE-2 but its probably ok.

Are these numbers global or per tenant?

<!-- xgd-turn id="429c199c-2ec8-4b3e-a520-c8124c668b26-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:58:50.025412+00:00" -->
#### Claude
**Per tenant.** Confirmed both ways:

```sql
CREATE TABLE counters (
  tenant_id TEXT NOT NULL,
  type      TEXT NOT NULL,
  value     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, type)
);
```

and three different businesses each have their own `MATERIAL-1`:

```
biz_51a674… | MATERIAL-1 | material-e478df0e
biz_5b1017… | MATERIAL-1 | material-20fa5f92   ← Lagrange Foundry
biz_96fc32… | MATERIAL-1 | material-0c513381
```

That's the right property for a client-facing label — every client's catalogue starts at 1, and the number never hints at how many other clients exist. It's an information-barrier property too, not just cosmetics: a global sequence would leak volume across tenants.

Let me check one thing, because it decides whether you can have the dense numbering you'd prefer.

`kind` is set once at ingest (`kind: classification.kind`, from classifying the uploaded bytes) and nothing mutates it afterwards. That changes my recommendation — **you can have IMAGE-1, IMAGE-2.**

**Per tenant**, and you can have the dense numbering after all.

## The tenancy answer

`counters` is `PRIMARY KEY (tenant_id, type)`, and three businesses in your local store each hold their own `MATERIAL-1`. Every client's catalogue starts at 1.

That's load-bearing rather than cosmetic: a globally sequenced label would tell one client how much material every *other* client has uploaded — an information leak across the tenant barrier, in a string the consultant is now cleared to say out loud.

## IMAGE-1, IMAGE-2 — both objections fail

I'd hedged toward sparse numbering. Checking properly, neither reason survives:

- **No schema change needed.** Since `counters` already keys on `(tenant_id, type)`, a per-kind counter is just another key in the same table (`material:image`). Same mechanism, and it inherits the per-tenant scoping for free.
- **Reclassification can't break a reference.** `kind` is assigned once at ingest from classifying the uploaded bytes (`material.ts:660`), and nothing mutates it afterwards. That was the objection that would have forced sparse numbering — a client says "IMAGE-3" and the thing gets renumbered under them. It can't happen.

**The cost you're accepting:** the client-facing number no longer matches the ticket's own `human_id` — `IMAGE-3` might be `MATERIAL-9`. That's a debugging inconvenience only; the catalogue item carries both and the uid is still the machine handle. Anyone in D1 can join them.

I've recorded the fallback too — labelling with the kind over `human_id`'s existing number, sparse but exactly recoverable — so if the divergence ever proves more annoying than the density is worth, the alternative is written down rather than rediscovered.

REQ-280 updated. One caution noted in it for whoever implements: the per-kind counter must stay keyed on `(tenant_id, …)`. A counter keyed on kind alone would silently break the per-tenant property, and that's the kind of thing that looks fine in dev where you're the only tenant.

<!-- xgd-turn id="f5c7104a-9ab5-410b-8116-6711b731b463-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:56:40.394672+00:00" -->
#### You
Can you create a delete CTA on the asset/material detail pages.

Also I see the big red error messages "Not on the site" with a warning triangle - that is nonsense a Site asset has to be a POTENTIAL asset - its not an error if I choose not to use all the photos. Perhaps assets that are used the Site asset pill is Colored with the theme accent and otherwise is gray?

Can you give me two REQs please?

<!-- xgd-turn id="f5c7104a-9ab5-410b-8116-6711b731b463-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:58:57.009583+00:00" -->
#### Claude
Both investigated. Filing them now.

Two REQs filed. The second one turned out to be more than a styling fix.

## REQ-281 — Delete a Library item from its detail pane

`archive` is already the declared erasure path — `tickets.ts:928`: *"archive is the erasure path (DOC-37)… a lock that reached it would be a retention policy nobody asked for."* So it's `archive({uid})`, not a new mechanism. There's no route for it yet; `/api/material` has no DELETE and the pane has no affordance.

The fact that makes it safe, and which the wording must get right: **placement copies the bytes.** `place_on_site` reports *"how many bytes were copied"*, and `promoteToSiteAsset` writes `placed_on` *"after the copy it records"*. So **deleting a placed item does not take it off the site** — the page keeps its own asset. That's the opposite of the natural assumption, which is why the confirmation has to say it plainly.

## REQ-282 — "Not on the site" is firing on a failure that can't happen

You're right, and the cause is sharper than styling:

```js
function unplaced(row) {
  return row.role === 'site' && placedList(row).length === 0
}
```

REQ-181 added that on the reasoning that *"an empty `placed_on` on a site-role row is a failure rather than a category"* — and that was true when upload attempted placement. **It hasn't been true since BUG-47**, which states in the ingest path:

> **NO PLACEMENT HERE (BUG-47).** … `promoteToSiteAsset` writes `placed_on`, after the copy it records.

Nothing is attempted at upload. So `role === 'site' && placed_on === []` isn't a failed placement — it's **the ordinary initial state of every site-role upload**, from the moment it lands until someone chooses to use it. The badge then tells the client *"You asked for this to go on your site and it did not get there… try adding it again"*, which is false on all three counts.

REQ-181's predicate lost its meaning when BUG-47 removed the placement it was detecting.

Your proposal adopted: accent pill when placed, grey when not, no glyph, no hint. I kept two things from REQ-181 that survive the predicate being wrong — **colour must never be the only carrier** (its own note: *"a screen reader and a monochrome display each get the whole fact"*), so the pill still says its meaning in words; and `role` is the client's own statement of intent and is worth showing.

And flagged explicitly: **don't treat this as cosmetic.** Recolouring while leaving the predicate meaning "failure" leaves a false claim in the code and the hint text for the next reader.

<!-- xgd-turn id="6da2d957-c6af-4d53-b556-b81538191ee5-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:04:25.393079+00:00" -->
#### You
Actually there is more to 282 - when I open the asset selector from the editor mode on the site tab, I am given a selection of images that selector ONLY shows me images that are shown in the Library as being "On the site" or rather they do not have the error pill. This is wrong in two ways:
1. The images without the error include images that are not on the site
2. The selector needs to show all images - I am far more likely to want to select an image that is not yet used than one that is - there are usecases for both of course.

<!-- xgd-turn id="6da2d957-c6af-4d53-b556-b81538191ee5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:06:28.949098+00:00" -->
#### Claude
Found it — and the picker isn't reading the pill at all, which makes your point sharper.

Added to REQ-282 as Part 2 — and the investigation sharpens your first point rather than confirming it as stated.

## The picker isn't reading the pill at all

`edit.ts:803` builds the field's enum from:

```ts
async function imageHandles(slug, opts) {
  return (await listSiteAssets(slug, opts)).filter(a => a.kind === 'image').map(a => a.src)
}
```

So it offers **the site's own assets** — bytes already copied under the draft's `assets/`. The Library is a different list, and the picker has never read it.

Which means the no-pill set and the picker set were never computed from each other. They agree *by accident*, for `site`-role items — which is most of what a client uploads, and exactly why they read as one thing. A `reference`-role image carries no pill and isn't in the picker either, which is the case where the illusion breaks.

So the pill has two faults, not one: it's mis-worded (Part 1), **and** it's being taken as a prediction of what the editor will offer, which it isn't.

## The capability already exists — it's just in the wrong place

`promoteToSiteAsset` is what the Library's own **Use on site** button calls. Your workflow today is: leave the editor → find the item → place it → come back to the picker. Part 2 collapses that into the pick.

Four things I flagged for whoever implements it:

1. **Place on Save, not on pick.** The modal is *"staged, never committed"* — copying bytes at pick time would leave an asset behind when you cancel. The pick stages an intent; Save performs the placement.
2. **The value stays a site handle.** `/assets/<name>` is what L1 `src` must be; a Library uid isn't one. Only the *list* widens — nothing the write side validates changes.
3. **Rights refusals must be visible, not silent.** `promoteToSiteAsset` refuses anything not `republishable`. Those should appear as unpickable *with the reason* rather than filtered out — a client who can't find their own photograph has been told nothing, which is Part 1's mistake in the other direction.
4. **Mark what's already placed** using Part 1's accent/grey vocabulary.

That last one is why I kept it as one ticket rather than filing a third: both parts are the same confusion between *what the client has* and *what the site is using*, and fixing either alone leaves the other still teaching it.

I did note a scope caveat — Part 2 touches the write path and is bigger than Part 1. If it won't sit on one branch, split it, but keep the vocabulary decision in whichever lands first so the two surfaces never disagree mid-flight.

<!-- xgd-turn id="67dfe3fe-9be9-4d8f-8c6d-fb5ae40f74ae-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:09:48.121720+00:00" -->
#### You
Ok the picker needs to offer me what is in the library that is the primary purpose of the library

<!-- xgd-turn id="67dfe3fe-9be9-4d8f-8c6d-fb5ae40f74ae-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:10:30.007902+00:00" -->
#### Claude
That's a stronger statement than I wrote it as, and the codebase already agrees with you — for the consultant, just not for you.

Recorded as the governing principle for Part 2, not as a feature request — and there's a good piece of evidence behind it.

**`library-surface.json` already says exactly what you just said**, in the consultant's own manual:

> **Being on the site is a field on a catalogue item, not a different place to look.** An item that is on the site says so, in `placed_on`. An item that is not is still theirs, still described, still here — it simply has not been placed yet. **Do not think of these as two stores; think of one catalogue with a mark on some of its entries.**

So the consultant is taught *one catalogue with a mark*. The builder shows you *two stores* and lets you pick from the smaller one. The same sentence that's priming for the AI is the specification for this UI — and only one of the two surfaces implements it.

That reframes Part 2 usefully:

- **The picker's list is the Library's image set, full stop.** Not the site's assets, not the Library filtered by something the client didn't ask for. The site's asset copy is bookkeeping — it shouldn't be a list anybody picks from.
- **Everything else in that section is about *how a pick becomes a valid `src`***, not about which items appear. Place-on-Save, the `/assets/<name>` handle, the rights refusals — all mechanics downstream of a list that's already decided.
- **"On the site" becomes a mark on an entry, not a membership test** — which is Part 1's accent/grey pill finally doing the job it should have had: telling you which of your pictures are in use, on the one list where all of them are.

One consequence worth being explicit about: this makes Part 1 and Part 2 genuinely inseparable. If the picker shows everything, the mark is the *only* thing distinguishing used from unused — so getting the pill's semantics right stops being cosmetic and becomes load-bearing.

<!-- xgd-turn id="c0c39d30-d066-4fbd-be8d-8419d822b56e-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:13:03.983853+00:00" -->
#### You
That's fine but it should not be an error mark - just showing the assets as unused - can you update 282 please

<!-- xgd-turn id="c0c39d30-d066-4fbd-be8d-8419d822b56e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:13:42.624515+00:00" -->
#### Claude
Updated. Three changes:

**The vocabulary follows your word.** You said "unused", and that's better than what I had — so the pill now reads **In use** / **Unused** rather than "On the site" / "Not on the site". The old phrasing names an *absence* and reads as a deficiency: *not* on the site, where it was supposed to go. "Unused" names an ordinary condition of a catalogue. Most of a client's Library will be unused most of the time, and that's the healthy state of having given us plenty to work with.

**Never an error mark, in any register.** Spelled out so it can't be re-introduced in a softer form: no warning glyph, no red or amber or any colour the builder uses for something wrong, no hint text telling the client to try again or fix anything, and no badge shape that differs from the in-use one. The two states differ in colour and in word and in nothing else — **an unused item must not be more visually prominent than a used one, because it is not more important.**

**And I've walked back my "load-bearing" phrasing**, because it could be read as arguing for emphasis. What Part 2 actually raises is the bar on the mark being *correct and present* — not on it being *loud*. That's now written into the ticket explicitly, so an implementer doesn't read the two parts together and conclude the pill should shout.

<!-- xgd-turn id="712e1acf-f940-46e3-ba15-e9e550179e3b-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:20:08.949826+00:00" -->
#### You
**The vocabulary follows your word.** You said "unused", and that's better than what I had — so the pill now reads **In use** / **Unused** rather than "On the site" / "Not on the site". The old phrasing names an *absence* and reads as a deficiency: *not* on the site, where it was supposed to go. "Unused" names an ordinary condition of a catalogue. Most of a client's Library will be unused most of the time, and that's the healthy state of having given us plenty to work with. <-- can we go with my original US suggestion - TBH this is NOT a very valuable thing for the user to know I do not want to use a lot of realestate on it.

Here is what I would like - there is one pill is says (Site Asset) I would like to change the color of the outline and the word depending on the state: used - color it using the theme's accent color, unused - color it gray. Please.

<!-- xgd-turn id="712e1acf-f940-46e3-ba15-e9e550179e3b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:21:05.759856+00:00" -->
#### Claude
Understood — your design, one pill, colour only. Let me correct it.

Done — your design, as you specified it:

- **One pill reading "Site Asset"** in both states. The label never changes.
- **Used** — outline and word in the theme's accent colour.
- **Unused** — outline and word in grey.
- No second badge, no extra row, no more space than the pill already takes.

I dropped my In use / Unused invention and quoted your reasoning in the ticket, because it's the constraint an implementer needs: *"this is NOT a very valuable thing for the user to know. I do not want to use a lot of real estate on it."* That settles what weight it gets — minor ambient information gets a colour and nothing else.

Also noted: `UNPLACED_LABEL` and `UNPLACED_HINT` (`library.js:170-172`) both go. One label, two colours, no second string to maintain.

**One free addition, flagged as recommended rather than required.** REQ-181's accessibility argument was sound — colour alone reaches neither a screen reader nor a monochrome display. Your judgement that this is minor information does mean it can be ambient, so it doesn't overturn your design. But an `aria-label` or `title` on the pill ("Site Asset — in use" / "Site Asset — not yet used") costs **zero pixels and no layout**, and stops it being colour-only for anyone who can't use colour. The ticket says to drop it if it complicates the pill — but knowingly, rather than by omission.

<!-- xgd-turn id="044def1a-d44f-43cf-b5d6-b2bcdb51d5ba-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:24:06.872280+00:00" -->
#### You
NO - please use bold face for in use as well as color

<!-- xgd-turn id="044def1a-d44f-43cf-b5d6-b2bcdb51d5ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:24:58.344238+00:00" -->
#### Claude
Updated:

- **Site Asset** in both states — label unchanged.
- **Used** — outline and word in the theme's accent colour, **word in bold**.
- **Unused** — outline and word in grey, normal weight.

Your bold does the job my extra word was trying to do, and better: weight is a second channel, so the state survives a monochrome display or a colour-blind reader without costing any space. That's REQ-181's "colour must not be the only carrier" satisfied on the display side — and I removed my earlier line saying the two states shouldn't differ in weight, which your instruction contradicts.

I also called out which way the emphasis runs, because it's the correction in miniature: **used is the emphasised state, unused is the quiet one.** Today it's exactly backwards — the unplaced item is the one that shouts.

The only residue is the screen reader: bold isn't announced, so it'd hear "Site Asset" in both states. An `aria-label` closes that for zero pixels. Still marked recommended-not-required, and explicitly *not* a second visible word.

<!-- xgd-turn id="bae4b372-0cea-472c-b75c-b298b15123c0-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T17:24:28.830316+00:00" -->
#### You
Ok so two problems that are occurring in the production Agent:

1) context is getting full of images - even with our new and improved context management images are large and apparently do not move - lets talk this one through, I'm not sure that I understand it - I thought we resupplied the context on every turn are we really resupplying the images? Related to this problem, when a turn is truncated and then resumed, our prompts drive the AI to "look at the site again" which rapidly fills an over full context, often unnecessarily

2) There's a couple of issues relating to images that need to be resolved. Because of the bug (now fixed) that left the AI confused about where an image had landed we got two images built with the prompt starting: 

A Renaissance notebook study in graphite and red chalk on aged parchment

Both have the filename: a-renaissance-notebook-study-in-graphite-and-red.png

I just refreshed and I have identities now - these are IMAGE-9 and IMAGE-10

I have been trying for many turns to get the AI to use IMAGE-9 and it consistently re-adds IMAGE-10. Now that I have references I will tell it IMAGE-9 and see what happens...

<!-- xgd-turn id="6473be19-4572-4fe8-bae0-51534e1cd531-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T17:25:03.667436+00:00" -->
#### You
Ok so two problems that are occurring in the production Agent:

1. context is getting full of images - even with our new and improved context management images are large and apparently do not move - lets talk this one through, I'm not sure that I understand it - I thought we resupplied the context on every turn are we really resupplying the images? Related to this problem, when a turn is truncated and then resumed, our prompts drive the AI to "look at the site again" which rapidly fills an over full context, often unnecessarily - please read the last turn for more details and the AI's recommendations 
2. There's a couple of issues relating to images that need to be resolved. Because of the bug (now fixed) that left the AI confused about where an image had landed we got two images built with the prompt starting:

A Renaissance notebook study in graphite and red chalk on aged parchment

Both have the filename: a-renaissance-notebook-study-in-graphite-and-red.png

I just refreshed and I have identities now - these are IMAGE-9 and IMAGE-10

I have been trying for many turns to get the AI to use IMAGE-9 and it consistently re-adds IMAGE-10. Now that I have references I will tell it IMAGE-9 and see what happens...

<!-- xgd-turn id="6473be19-4572-4fe8-bae0-51534e1cd531-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T17:28:36.272602+00:00" -->
#### Claude
Let me read the consultant's own analysis from the transcript first, then check the mechanisms.

That's a strong self-diagnosis. Let me verify each claim against the code rather than take it at face value.

Two things confirmed already. Let me check what the AI is actually choosing between.

The repo has moved under me — both the `IMAGE-n` labels and a `placed_as` mapping have landed since I last read this. So:

- **IMAGE-9** = `material-90ee7e31` → placed as **`plate-i-loop.png`**
- **IMAGE-10** = `material-365f481c` → placed as **`plate-i-hands.png`**

Let me check whether saying "IMAGE-9" will actually resolve, since that's what you're about to try.

**The page already references `plate-i-loop.png` — that's IMAGE-9.** It's correct as of now. Let me verify the context mechanism, which is the part you want to understand.

Verified. Here's the mechanism — and it explains the doom loop structurally, not just as a bad prompt.

## 1. Yes — we really are resupplying the images

The Messages API is stateless. There's no server-side conversation, so **every request carries the whole `messages` array**. `claude_api.js:313` appends with `state.messages.push(...)`, and `toAnthropicContent` renders an image block as a real Anthropic image block. No cap, no slice, no pruning anywhere in that file. Every screenshot goes over the wire again on every later turn of the session.

**The design did assume a bound — and it was removed elsewhere.** `content.js:232` says:

> an image is visible to the model for the remainder of the segment that sent it and not beyond it.

That was true when sessions recycled. REQ-126 deleted recycling (`session.js:13`: *"nothing recycles, and a session that never recycles has exactly one conversation"*). One conversation per session means "the remainder of the segment" is now **the rest of the session**. The comment describes a limit that no longer exists, and nothing replaced it.

**What *is* bounded, and why this is confusing.** The durable record is fine — `redactContent` writes `[image: image/png, 48231 bytes, fp:1a2b3c4d]`, so transcripts never carry base64. And `seedDialogue(state, window, …)` bounds what's carried when a conversation is *rebuilt*. But that applies at seed time and never again:

- **Long-lived isolate** → every image accumulates, resent every turn.
- **Evicted isolate** → rebuilt from the durable record, where images are already placeholders, so they all vanish at once.

Context cost depends on isolate lifetime, which nothing models or reports.

**This is why the recovery loop is structural, not just a bad prompt.** After truncation the conversation is rebuilt — so the images are genuinely gone and the model *cannot* see the site. Then `priming.json:80` tells it: *"Look at the site before you answer."* The redaction removes the evidence and the reminder mandates re-acquiring it. The consultant walked into that four or five times and correctly identified it as a doom loop.

One correction to its account: it said images "never leave". True in flight; on a rebuild they leave *all at once*. **That asymmetry is the defect**, not the accumulation alone.

**What I'd do first**, ahead of its four (which are all sound): **redact in flight the way the durable record already does.** Keep the last N images live, rewrite older ones to the same `[image: …, fp:…]` placeholder inside `state.messages`. It makes in-flight match the rebuild behaviour the design already chose, bounds cost independently of isolate lifetime, and the fingerprint lets the model know it already looked and at what — which is the thing that otherwise drives it to look again.

Its backpressure point is the other one I'd prioritise: *"I do not experience the cutoff… I am driving with no fuel gauge."*

## 2. IMAGE-9 is already on the page

Good news, and the repo moved under me while we were talking — both REQ-280's labels and a `placed_as` mapping have landed:

- **IMAGE-9** = `material-90ee7e31` → placed as **`plate-i-loop.png`**
- **IMAGE-10** = `material-365f481c` → placed as **`plate-i-hands.png`**

And the page currently references `/assets/plate-i-loop.png` — **IMAGE-9**. It's right.

Saying "IMAGE-9" will also work now: `storedImageOf` puts the label in `aliases`, and `resolveStoredImage` does exact-match-before-loose, so the label resolves everywhere the uid does — catalogue, `screenshot` and `edit_image` alike.

Why it kept picking wrong before: the only spellings were uid, title and filename, and those two share *both* title and filename. Any name-based reference was genuinely ambiguous, and the site-asset names (`plate-i-hands` / `plate-i-loop`) carry no trace of which Library item they came from — `placed_as` is what fixed that, and it wasn't there.

Want me to file Finding 5? I'd suggest two tickets — in-flight redaction plus backpressure as one (they're the same seam), and the `interrupted-turn` prompt rewrite as a separate small one, since that's a one-line change you could have today.

<!-- xgd-turn id="40d1a862-05e6-448e-8feb-44491c47b4a1-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T17:42:28.317679+00:00" -->
#### You
ok so I think the second problem is largely resolved now that the library has identifiers - when i asked for IMAGE-9, I got image -9

Lets focus on the context problem, it is existential. Can you remind me how we manage context with the chat framework components for a API model call like this?

<!-- xgd-turn id="40d1a862-05e6-448e-8feb-44491c47b4a1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T17:43:56.161247+00:00" -->
#### Claude
Here's the whole mechanism, end to end.

## What one API request carries

1. **`system`** — the assembled priming. Bounded by `maxPrimingChars` = 140,000, described as *"roughly 70% of a 200k window"*. You run Opus 5 at 1M, so priming is not where the pressure is.
2. **`messages`** — the conversation.
3. **`tools`** — the projected schemas.
4. **The reminder** — appended to the *last user message* by `turnTail` (REQ-144, so the cache prefix stays stable).

## How `messages` gets populated — two paths, one bounded

**Cold start** (no in-memory state for this backend ref):

```js
seedDialogue(state, window, BASE_MESSAGES)
```

The window is `DEFAULT_WINDOW_TURNS = 40` user/assistant **pairs**, each capped at `turnMaxBytes`, computed by `window()` in `transcript.js` from `session.turns` — that is, **from the durable record, where images are already `[image: …, fp:…]` placeholders**.

**Warm** (state exists for that ref):

```js
state.messages.push({ role: 'user', content: toAnthropicContent(checked) })
```

…and the whole array goes over the wire. No window. No cap. No compaction.

## And compaction doesn't exist on this path

The manager says *"the one mechanism left is compaction, and it is the backend's rather than ours: a backend that keeps its own conversation reports how full it is in tokens and can be asked to compact semantically."*

`compaction: true` is declared by exactly two backends — `claude_code.js` and `claude_code_interactive.js`. `ClaudeAPIBackend` declares `streaming, interrupt, vision, promptCache`, and contains **zero** occurrences of `compact` or `occupancy`.

So that sentence is true of the CLI adapters and **vacuous for the API one**. The API backend is the thing keeping the conversation, and it's the one with no mechanism for cutting it.

## The conclusion, which I think is the existential part

**"Context is constant, not grown-then-cut" (REQ-126) is a property of the *seed*, not of the live conversation.**

The window bounds what a conversation **starts with**. Nothing bounds what it **becomes**. On the API path a warm conversation is precisely grown-and-never-cut — and the only thing that ever trims it is an isolate eviction, which is invisible, unpredictable, and drops *everything* at once rather than the oldest things first.

That's also why this isn't really an images problem. Images are the heaviest thing flowing through an unbounded channel, but every tool result does the same — and the consultant's report mentioned reading whole page subtrees repeatedly, which is the same leak in cheaper units.

## The encouraging part

Both seams you need already exist and are in production use:

- **`window()`** bounds a turn list to N pairs with a per-turn byte cap.
- **`redactContent()`** replaces image bytes with a fingerprinted placeholder.

They're applied on the cold-start path. Applying them to `state.messages` in flight is **reuse of tested machinery, not new invention** — and it makes warm behaviour match the behaviour the design already chose for a rebuild, which removes the isolate-lifetime dependency entirely.

The fingerprint matters for the doom loop specifically: a model that sees `[image: image/png, 48231 bytes, fp:1a2b3c4d]` knows it already looked and at what. A model that sees nothing goes and looks again.

Recorded in EPIC-19 Finding 5. Shall I file it — one ticket for in-flight windowing and redaction, given they're the same change to the same array?

<!-- xgd-turn id="c0beadd2-6965-4d9c-9b43-17f8426998dc-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T18:06:51.263738+00:00" -->
#### You
So lets start at the top - the priming system that you are describing is our legacy "stuffing" methodology - I thought we had abandoned that. If not we need to put that on the list (though it will not solve our problem).

On context management this is a framework level problem and it applies directly to this type of call - this particular use-case is particularly.

I believe we did a lot of lf work on that too - can you take a look upstream at what lf provides already, I don't think you are using the latest

<!-- xgd-turn id="c0beadd2-6965-4d9c-9b43-17f8426998dc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T18:09:10.532004+00:00" -->
#### Claude
You're right to push me there — I've been reading the installed shared store, which my own notes say drifts. Let me compare.

The installed copy is byte-identical to the framework working tree. Let me check whether that tree is itself current.

I checked properly rather than assuming, and the answer is not what either of us expected.

## I *was* on the latest

Recursive hash comparison of `node_modules/@lagrangefoundry/ai/src` against `lagrange-framework/components/ai/js/src`: **zero files unique to either side, zero differing files.** Byte-identical. The framework tree is on `xgd-working`, 162 ahead of origin — the newest work that exists.

## And LF *did* do the context work — you're right about that

It's a coherent design, and all of it is installed:

| | |
|---|---|
| REQ-124 | session summary store — standing frame + append-only log |
| REQ-125 | transcript turn addressing, so a turn can be fetched by id |
| REQ-126 | turn-bounded history window; summary / pointer / window providers |
| REQ-128 | priming moves to the system channel |
| REQ-129 | compaction integration — observe `compact_boundary`, steer with `/compact` |
| REQ-143 | cache the message history; **make token spend observable** |
| REQ-144 | deliver per-turn tiers past the message history |

## The hole is precise, and it's upstream

REQ-126's window and REQ-129's compaction are the two mechanisms that bound a conversation. **Neither binds a warm API conversation:**

- The **window** is applied at *seed* only.
- **`compaction: true`** is declared by `claude_code.js` and `claude_code_interactive.js` — and by nothing else.

Compaction was designed for *"a backend that keeps its own conversation"*. `ClaudeAPIBackend` **does** keep its conversation, in `_state` — it just never got an implementation. So REQ-129 integrated compaction for the two backends that had it natively, and the API path, which is the one that actually needs the framework to do the cutting, got neither mechanism.

That's a **lagrange-framework ticket**, exactly as you said. Every adopter of the API backend has this, not just us.

## The fuel gauge already exists — we just don't show it

This is the cheerful part. REQ-143 landed per-request token accounting: `ClaudeAPIBackend.usage(ref)` returns one record per request, and `usage.js` exposes `usageRecord`, `turnUsage`, `turnSpend`, `sessionUsage`. **The host already knows what every turn cost in input tokens** — which *is* the context size.

So the consultant's *"I am driving with no fuel gauge"* is a **surfacing gap in this repo**, not missing framework capability. Much cheaper than it sounded.

## On "stuffing" — it hasn't been abandoned

DOC-22 *"Session Priming Configuration: three tiers, static text and providers"* is still current upstream, and nothing supersedes it. REQ-128 and REQ-144 *refine* it — system channel, tiers delivered past the message history for cache stability — they don't replace it. So `priming.json` isn't legacy; moving off it would be **new framework design**, not adoption.

And confirming your own instinct: it won't solve this. The priming is ~21KB of prose against a 140,000-char ceiling and a 1M-token model, it's stable, and the `cache_boundary` entry is last so the whole thing sits in the cached prefix. It's a fixed cached cost dwarfed by a single screenshot.

## So the split is

- **lagrange-framework**: bound a warm API conversation — apply `window()` in flight and `redactContent()` to ageing image blocks, or implement compaction for `ClaudeAPIBackend`. Both seams are written and tested; neither is wired to this path.
- **1stcontact**: surface the spend REQ-143 already reports, and rewrite the `interrupted-turn` reminder to name `list_changes` instead of "look at the site".

Want me to file the framework one as a cross-repo ticket? Per my standing note that's a ticket in lagrange-framework and nothing else — no branch, no code there.

<!-- xgd-turn id="11ae560a-31dc-41ce-beb4-c68683876e1d-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T18:29:18.059363+00:00" -->
#### You
## On "stuffing" — it hasn't been abandoned

DOC-22 *"Session Priming Configuration: three tiers, static text and providers"* is still current upstream, and nothing supersedes it. REQ-128 and REQ-144 *refine* it — system channel, tiers delivered past the message history for cache stability — they don't replace it. So `priming.json` isn't legacy; moving off it would be **new framework design**, not adoption. <-- let's take a moment to get our vocabulary aligned and talk this through. I spent a lot of time working through this.

Stuffing is the term that I use for the old way of priming a session context. In XGD which is still using it it involves forcing multiple large documents into the context. Consuming hundreds thousands of characters of that context.

The alternative that we now have in place which uses around 4k characters is that we prime it with instructions to use the local knowledge base and an indication of what knowledge in the is irrelevant to the role. This gives the session the flexibility to read the documents that it needs when it needs them.

You said our context for this session consumed nearly 200,000 characters that sounds like the old mechanism to me.

We should have mechanisms for maintaining core decisions from a chat in the chat ticket body - but my focus was mainly on claude-code based chats which have auto-compacting. 

Note that this use-case is a particular problem - most xgd chats have a lifetime they exist to implement a feature or a set of features. This chat context lives for the lifetime of the website. The question that I want to ask you before I go back to LF - are we accumulating sufficient summary context that we can jump straight to truncation?

<!-- xgd-turn id="11ae560a-31dc-41ce-beb4-c68683876e1d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T18:31:12.827981+00:00" -->
#### Claude
Let me get you facts on both, starting with the correction I owe you.

## First, a correction I owe you

I quoted `maxPrimingChars = 140,000` as though it were consumption. **It's a ceiling.** Measured actuals:

| part | chars |
|---|---|
| static priming entries (role, product-system, purpose) | 5,870 |
| reminders | 293 |
| `km.landscape` source (`kb/system/awareness.md`) | 5,621 |
| projected tool manual — granted groups, one line per tool | ~18,900 |

≈31k characters, ≈8k tokens, fixed and fully cached.

**So we are not stuffing — you did move it, and 1c is on the new mechanism.** The priming says *"Your method is written down […] Read it before you start rather than improvise from these few lines"*, with `km.landscape` giving the map and `km.mechanism` the retrieval instructions. No design document is inlined. Your ~4k figure is about right for the instruction half; the rest is the landscape and the tool manual.

The one block worth your eye is the **tool manual at ~19k**. That isn't stuffed prose — it's the surface projection, already in its frugal form (one line per tool, full entries on demand). But it's the largest fixed item if the seed ever needs to shrink.

## Your actual question: no, and it's worse than "not enough"

**We accumulate no summary context at all.**

- **No `SummaryStore` is constructed anywhere in this repo.** `SessionManager` accepts `opts.summary`; nothing in `host-core.ts` or `ai.ts` passes one.
- **Zero `chat_summary` comments in the entire store.** Only `chat_transcript` (8), `material_text` (9), `tool_transcript` (4).
- The priming omits the summary tier deliberately, and says why: *"`session.summary` waits on lagrange-framework BUG-45."*

**And we don't have the other escape hatch either.** REQ-126's design says what falls outside the window is *"reachable two ways: the summary the session maintains, and the transcript it can address by turn id."* `priming.json` records that this host grants **no operation that reads a turn by id**.

So 1c has **neither** of the two recovery paths the window design assumes. The window isn't a window onto a larger recoverable context — **it's a cliff.** Truncating today would silently and permanently drop everything past it.

That's the thing to take to LF: the framework's window is sound *given* its two recovery paths, and this adopter has implemented neither.

**BUG-45 is the blocker and it's narrower than it sounds** — cache offsets are computed over the full assembly while the backend is handed only the stable priming, so a breakpoint lands mid-section once anything is volatile. It's `ready_to_reconcile`: fixed on working, not yet released.

## Where that leaves the ordering

Your instinct that this use case is special is the crux — an XGD chat dies with its feature, this one lives as long as the website. That argues for the **summary** rather than the transcript-pointer, because the pointer only helps a model that already knows which turn to ask for, and after a rebuild it doesn't.

So: unblock BUG-45 → wire the `SummaryStore` → *then* truncation becomes safe, and the in-flight window and image redaction become a tuning question rather than a data-loss one.

Worth asking LF while you're there: should `ClaudeAPIBackend` grow a compaction implementation, or is the summary-plus-window the intended answer for API backends? Right now `compaction: true` is CLI-only, and that asymmetry looks unintentional rather than designed.

<!-- xgd-turn id="d5a09835-17ea-4a7c-8898-57c1bc5a9518-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T18:39:41.499105+00:00" -->
#### You
Well, the idea was that rather than have a "stop the world" compacting moment, we would have (1) an ongoing summary generation consisting of two parts - a fixed length conversation summary - updated as appropriate and an unbounded log of conversation decisions. (2) give the session access to tools that allow it to read chunks of these and its old history on demand.

<!-- xgd-turn id="d5a09835-17ea-4a7c-8898-57c1bc5a9518-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T18:40:59.894840+00:00" -->
#### Claude
That maps onto REQ-124 almost exactly. Let me check which halves actually exist.

**Both halves are built.** Let me get the detail right.

Good news: **you built both halves, and they're sitting in the installed framework unused.**

## (1) The two-zone summary — `summary.js`, REQ-124

Almost your words back:

> **Two zones, because the polarity differs.**
> • **Standing frame** — a short paragraph, *rewritten* in place. What we are doing, what is settled, what is out of scope, and what was rejected and why. Bounded, always delivered in full.
> • **Log** — append-only. The running record; a seed delivers its tail plus a pointer to the rest.

`DEFAULT_FRAME_MAX_BYTES = 4000`. The frame is the comment's `framing` **field**, the log is its **body** — so a frame rewrite and a log append are structurally different writes that can't clobber each other. The frame's cap raises an **error, never a truncation**, because *"a frame silently losing its last sentence loses the rejections first, which are the whole reason the zone exists."*

And it knows what's at stake: *"if the summary is good the rest is plumbing, and if it is thin nothing downstream recovers."*

## (2) The on-demand tools — the `agent` surface

| group | operations |
|---|---|
| `InspectContext` | `priming`, `reminder`, `context`, `history`, `summary` |
| `OperateContext` | + `history_full`, `role_priming` |
| `MaintainSummary` | `summary_frame`, `summary_log` |

`history` reads turns *"by position or by turn id"*. `summary` reads frame and log. `summary_frame` replaces the frame, `summary_log` appends an entry — so **the session maintains its own summary**, which is the "updated as appropriate" part rather than a batch job.

## And 1stcontact composes none of it

`createL1Toolbox` pushes the L1 surface, the router's extras, and `ManualToolbox`. No `AgentToolbox`, no `agent` entry in `instances.json`, zero occurrences of `InspectContext` or `MaintainSummary` in the repo.

So my "moving off stuffing would be new framework design" was wrong in the direction that matters: **the design is finished, shipped, and the adopter never picked it up.**

That's now the third one — delegation (REQ-148), the development surface (REQ-147), and this. The pattern is worth naming in its own right: the framework is consistently ahead of this product, and the gap is *consumption*, not capability.

## What this changes about the plan

Before you go to LF — most of what I'd have asked them for, you already have:

- **Truncation becomes safe** once the summary is wired *and* `MaintainSummary` is granted. The cliff becomes a window with a recovery path.
- **No stop-the-world compaction needed**, which answers my earlier question about `ClaudeAPIBackend` growing a compaction implementation — it shouldn't. That was me reasoning from the CLI backends' shape instead of from your design.
- **What's genuinely left for LF** is narrower: BUG-45 (the cache-offset defect blocking a volatile summary tier in the priming), and the in-flight image/message growth on the API path — which is real but becomes a tuning problem rather than a data-loss one once the summary exists.

The 1c-side work is now the bigger half: wire the `SummaryStore`, compose the `agent` surface, grant `InspectContext` + `MaintainSummary`, and add the summary tier to the priming once BUG-45 clears. Want me to file that?

<!-- xgd-turn id="344ab627-5bc7-46ce-bfe1-ec63a661d861-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T18:44:35.899843+00:00" -->
#### You
BUG-45 in LF? that has landed?

Is the summary generation implemented?...but not wired in 1c?

<!-- xgd-turn id="a5bd9303-896e-4eab-b7f3-e35609b25c6e-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T18:45:24.525291+00:00" -->
#### You
BUG-45 in LF? that has landed?

Is the summary generation implemented?...but not wired in 1c? Are all the mechanisms available for searching and chunk-level access?

Does LF need to implement truncation?

<!-- xgd-chat-end -->