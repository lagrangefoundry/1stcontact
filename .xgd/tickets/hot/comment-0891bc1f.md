---
uid: comment-0891bc1f
id: COMMENT-885
type: comment
title: Comment on request REQ-127
created_by: xgd
created_at: '2026-08-09T19:38:24.459438+00:00'
updated_at: '2026-08-09T22:23:10.493385+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-22a6521a
  kind: chat_transcript
---

<!-- xgd-turn id="c1a4f8a8-3f92-4d9d-9e79-cb41d3dea99f-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T19:38:19.952441+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="c1a4f8a8-3f92-4d9d-9e79-cb41d3dea99f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T19:41:10.121531+00:00" -->
#### Claude
I'll start by reading the ticket.

Let me investigate the current state.

Let me verify the delivered state is green before reporting.

I did the legwork before touching anything. Here's what I found.

## REQ-127's scope has already landed — under REQ-126

Commit `02a9af066` ("declare the L1 control surface as a Toolbox surface", owned by REQ-126, status `free_coded`) delivered essentially all of REQ-127's body:

| REQ-127 requirement | State |
|---|---|
| AI reaches the site through operations selected from the declared L1 API | ✅ `ai/l1-surface.json` — 16 ops, param types, 10 return shapes, 6 error codes, groups, sequences, absences |
| …under a declared policy | ✅ `ai/instances.json` — `caretaker` granted `ReadSite`, `WriteCopy`, `ManagePages`, `WriteConfig` |
| …bound to an in-process call type | ✅ `call_type: inproc`, `L1Toolbox` over `edit.ts` in-process |
| Config carries selection/policy/binding only, no prose | ✅ `instances.json` is 5 lines; every sentence projects from the declaration |
| `declare.ts` deleted | ✅ deleted — and so was `tools.ts` entirely |
| `tools.ts` reduced to declaration + config | ✅ superseded: `host.ts` builds tools from `box.schemas()`, no hand-written `Tool` bodies, no local manual renderer |
| Read/write split becomes **enforced** classification | ✅ `effect: read\|write` per op, gated by the Toolbox at projection and dispatch |
| **Site binding becomes a declared scope predicate** | ❌ **not done — deliberately** |

Nothing references `declare.ts`, `ERROR_MEANINGS`, `toolSpecs`, `renderManual`, `ToolDeclaration` or `builderTools` anywhere in the tree. Both AI suites are green (19 tests).

## The one open item is a decision, not a gap

REQ-126 kept the construction-time slug binding on purpose, and DOC-30 argues that's the *stronger* posture: no operation declares a `slug` parameter at all, so the model cannot address another site because there is no hole to fill. A scope predicate refuses a bad value; an absent parameter has no bad value to refuse. DOC-30's recommendation is **option 3** — extend the upstream Toolbox vocabulary with construction-scoped bindings so the existing guarantee becomes *declarable* — with option 2 (what shipped) as the interim, and it explicitly warns that option 1 "trades a real safety property for a declarative one and should not be adopted just to fit the current field set."

REQ-126's commit message records this was raised upstream.

## What I'd recommend

**Close REQ-127 as delivered by REQ-126**, and let the residual live upstream as the lagrange-framework finding it already is. Free-coding the scope predicate locally would mean adding a `slug` parameter the model must get right on every call — re-opening an error class REQ-122 removed for free, and contradicting our own design record.

I haven't changed the ticket or any code. Tell me which you want:

1. **Close it** — I'll update REQ-127's body to record that REQ-126 absorbed it, cite the commit, and note the scope-axis residual with its upstream pointer. No code, no commit.
2. **Build the scope axis anyway** — I'll do it, but I want the explicit call given the above.
3. **Something else you had in mind for this ticket** that isn't in the body yet — the body reads as pre-REQ-126 planning, so it's plausible your intent has moved on.

<!-- xgd-turn id="279b2250-2790-49ce-ba53-4bed8255ec03-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T20:06:51.946413+00:00" -->
#### You
There's something I don't understand here. It feels to me like the slug should be completely outside of the scope of what's going on here. Each site gets a chat window with its own session. The session is initialized to recognize that it is attached to that site. The chat window does not need to know anything about the sites. It's given a session and it's first contact job to trigger that session creation appropriately. No?

<!-- xgd-turn id="279b2250-2790-49ce-ba53-4bed8255ec03-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T20:07:13.703226+00:00" -->
#### Claude
Let me look at the actual wiring between the panel and the host before I answer.

<!-- xgd-turn id="012fc657-ed40-41d8-b934-fd9b01fc0900-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T20:08:08.172366+00:00" -->
#### You
There's something I don't understand here. It feels to me like the slug should be completely outside of the scope of what's going on here. Each site gets a chat window with its own session. The session is initialized to recognize that it is attached to that site. The chat window does not need to know anything about the sites. It's given a session and it's first contact job to trigger that session creation appropriately. No?

Let me put another way I'm not expecting the framework to supply a chat window that supports N sessions selected with a slug. I am expecting 1c to switch in the correct session.

<!-- xgd-turn id="012fc657-ed40-41d8-b934-fd9b01fc0900-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T20:21:55.670040+00:00" -->
#### Claude
Let me check what the framework's chat component and session API actually offer before I answer.

You're right, and the framework already agrees with you — the leak is entirely ours.

I checked both seams:

- **`mountChat(container, opts)`** takes an opaque `id` (storage key) and `sendPrompt(text)`. It has no site *or* session concept. It is exactly the single-session window you describe.
- **`@lagrangefoundry/ai`'s `SessionManager`** is already session-id-oriented: `createSession(role, backend, {sessionId})`, `resume(sessionId)`, `promptStream(sessionId, text)`. Also no site concept.

Neither side asked for a slug. Our three files inserted one, and `host.ts` records the decision that did it:

> *"Takes the SLUG, not a session id. The id is derivable, so asking the client to carry one would only introduce a value it could send stale."*

That inverted the layering. To avoid a stale id it handed the **browser a site identity** — so now every turn re-asserts which site it's for, and `chat.js` carries a `generation` token whose entire job is to stop a late answer landing in the window that has since switched sites. That machinery exists because the panel is site-aware; in your model it has nothing to guard.

What it looks like your way:

| | today | your model |
|---|---|---|
| panel | `setSite(slug)`, holds `site`, derives `builder-chat:${slug}` | handed a session; knows neither |
| wire | `POST /api/ai/prompt {slug, text}` | `{sessionId, text}` |
| site→session map | recomputed on every call, in three layers | one place: the host |
| switching | panel re-opens by slug, guards with a token | 1c swaps the session in |

And it dissolves the REQ-127 residual rather than building it. There's no scope predicate to declare, because outside the host *nothing names a site* — the binding lives in the session, established once at creation. That's a cleaner answer than DOC-30's option 1 and it needs nothing from upstream.

One thing I'll hold to while implementing: the host should resolve a session id against sessions **it** minted, not `resume` any string the client sends. Today the client supplies the slug, so this is neutral either way — but a session id is the kind of value that invites being treated as a free-form key, and it shouldn't be.

Let me read the rest of the wiring, then scope the ticket.

I have the full picture now. Here's the shape, then I'll scope the ticket.

**Where the slug actually leaks** — four layers, all ours:

| file | today |
|---|---|
| `chat.js` | `setSite(slug)`, holds `site`, `builder-chat:${slug}`, generation token |
| `api.js` | `streamChatPrompt(slug, text)` → `POST {slug, text}` |
| `builder.ts:295` | `/api/ai/prompt` takes `{slug, text}` |
| `host.ts` | `streamPrompt(slug, …)` re-derives `sessionIdFor(slug)` per turn |

`builder.ts:270` carries the same rationale as `host.ts`, so the decision is written down in two places and implemented in four.

**The change**: `/api/ai/session {slug}` stays — that *is* 1c triggering session creation, and `app.js` legitimately knows the slug because the toolbar owns the site selector. Everything downstream of it carries a session:

- `createChatPanel` gets `setSession({sessionId, turns, ready, error})`. No `site`, no slug, no `openSession` call — and no generation token, because it's handed an already-opened session synchronously rather than doing the async open itself.
- `app.js` opens the session on site change and swaps it in. The async guard moves here, where the async now is.
- `/api/ai/prompt` takes `{sessionId, text}`, resolved against sessions the host minted.

One consequence worth stating: the panel's draft-persistence key goes `builder-chat:alpha` → `builder-chat:site-alpha`, so an unsent draft typed before the upgrade won't be found after it. That's a half-written message, not history — transcripts are server-side and unaffected.

Ticket scoped. Now the code — starting with the host, which owns the mapping.

Found something. That key contains **NUL bytes**, not spaces:

Not corruption — it's a deliberate idiom, in four independent places:

| file:line | key |
|---|---|
| `ai/host.ts:145` | `${ctx.cwd}\0${ctx.root}\0${slug}` |
| `builder.ts:495` | `${ctx.cwd}\0${ctx.root}` |
| `fidelity.ts:539` | `${d.text}\0${d.property}` |
| `preview.ts:170` | `${slug}\0${channel}` |

NUL as a composite-map-key separator, so a slug containing the separator can't forge another key. Sound. But written as a **literal NUL byte**, which makes all four files `data` to `file(1)` — plain `grep` silently prints nothing without `-a`, which is what sent me looking for the route table in the wrong places earlier. `\0` in a template literal is the same runtime string and keeps the source greppable. I'll use the escape in new code and leave the existing four alone — three of them are nowhere near this ticket.

Now `openSession` mints and `streamPrompt` resolves:

Now the browser transport:

Now the panel — this is where the site concept disappears entirely:

Now `app.js` — where the site→session switch now lives:

`chatTransport` is a test seam — the open call now happens in `app.js`, so the seam has to follow it:

Now let me check what else references the old shape, then update the tests.

Now the host test — let me see how it drives turns:

Now the origin-probe test:

Now the REQ-127 UATs — the origin half first:

Pre-existing — 8/8 fail identically at `HEAD` without my changes. Upstream renamed something:

The drift is precise: upstream replaced the session **store** with a transcript **archive** (`FileStore`→`FileArchive`, `manager.store`→`manager.archive`, and `load`/`list` became async). That's three call sites in `host.ts`. Let me finish the browser half first, since it doesn't depend on the AI library.

Browser half is green — 10/10. Here's where things stand.

## Delivered and verified

**REQ-127's layering is implemented across all four files.** The slug now stops at `app.js`:

- `chat.js` — `setSite(slug)` → `setSession(session)`. No `site`, no slug, no `openSession` call, and the `generation` token is **gone** from the pane.
- `app.js` — owns the site→session translation; the generation guard moved here, where the async now is.
- `api.js` / `builder.ts` — `/api/ai/prompt` carries `{sessionId, text}`.
- `host.ts` — `streamPrompt(sessionId, …)` resolves against a registry of ids it minted; `UnknownSessionError` → 404.

Ten browser UATs pass, including the two that pin the ticket's claims: `the_pane_exposes_no_way_to_name_a_site` (asserts `setSite`/`getSite` are `undefined`) and `a_slow_open_for_an_abandoned_site_does_not_land` (the race the deleted token guarded, now asserted where the guard lives).

Of the 7 origin UATs, **4 pass** — every refusal path: slug-instead-of-session → 400, unissued id → 404, invented id starts no conversation, and the 404 is JSON rather than a fabricated apology streamed into the transcript.

## Blocked: the AI library moved under us

The 3 origin UATs that need a live turn fail, and so do **all 8 REQ-122 host UATs — identically, at `HEAD`, with my changes stashed.** I verified that before writing a line. `@lagrangefoundry/ai` replaced the session store with a transcript archive:

| `host.ts` | was | now |
|---|---|---|
| line ~210 | `new lib.FileStore(dir)` | `new lib.FileArchive(dir)` |
| `storedTurns` | `manager.store.load(id).turns` | `await manager.archive.load(id)` — **async** |
| `attach` | `manager.store.list()` | `await manager.archive.list()` — **async** |

Three call sites; both callers (`openSession`, `streamPrompt`) are already async, so it's mechanical. `Session.turns` is unchanged, so nothing downstream moves.

## The call I need from you

This is a dependency migration, not REQ-127. Folding it into REQ-127's commit would bury a real upstream break inside a layering ticket — precisely what `[FREE-CODED]` attribution exists to prevent. But without it REQ-127's origin half can't be demonstrated, and unverified code gets eliminated as drift on the next `test_fix`.

I'd **file it as its own bug ticket and fix it first**, then land REQ-127 on a green suite — two commits, each doing one thing. I haven't created a ticket because this session is scoped to REQ-127 and you haven't asked for another.

Say the word and I'll do that. If you'd rather keep it to one ticket, I'll fold the three call sites into REQ-127 and note the migration explicitly in the commit body.

<!-- xgd-turn id="91e6d3eb-9197-4591-819c-600e3d4c3e9e-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T20:55:18.903921+00:00" -->
#### You
Its fine, keep it in this ticket but can you explain where we are oncve you have finished up

<!-- xgd-turn id="91e6d3eb-9197-4591-819c-600e3d4c3e9e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T21:10:07.886690+00:00" -->
#### Claude
Understood — folding it in. Let me fix the three call sites.

Both `resume` and `createSession` became async too:

`getSession` resumes only when the session isn't already live — re-resuming a live session re-folds its junction, which is the fold error:

The junction defaults to `~/.xgd/sessions/live` — machine-global — while the archive is per-workspace. That splits one session across two places and leaks conversations between checkouts, which is the exact hazard `sessionsDir` was written to prevent:

All 7 origin UATs pass. Now the REQ-122 host suite:

From 8 failures to 3. The remaining three are stale REQ-122 assertions that REQ-126 deliberately invalidated — let me look:

All 44 pass across six suites. Now the full suite and quality gate:

Three failures, all in the edit-modal/browser area — none touch AI. Let me check whether they're pre-existing:

Identical — 6 failed, 16 passed, same tests. Zero regressions from my change. Now lint and typecheck:

Build and typecheck clean. Let me check the two files I didn't author before committing:

Both unrelated — site-content drift and an XGD tooling artifact. Leaving them out. Let me record the folded-in migration on the ticket:

Done. REQ-127 is `free_coded` at `7347d224e`, 44/44 green across the six AI suites.

## Where we are

**Your instinct was right, and the framework already agreed with you.** `mountChat` takes an opaque `id` and `sendPrompt(text)`; `SessionManager` takes a `sessionId`. Neither has a site concept. This project inserted a slug into four layers on a rationale it wrote down twice — that a session id would be "a value the client could send stale." Avoiding that gave the *browser* a site identity instead, which cost more: every turn re-asserted its site, and the pane carried a `generation` token whose only job was to stop a late answer landing in a window that had switched away.

Now a site becomes a session in exactly one place — `POST /api/ai/session` — and nothing above the host names a site. `app.js` does the switching, because it owns the site selector. The pane holds a conversation and can't be told about sites at all: `setSite` and `getSite` no longer exist, which is asserted directly as a UAT. The generation token moved to `app.js` with the async that needed it.

**On the original ticket clause** — the scope predicate is withdrawn, not deferred. It would have handed the model a `slug` parameter to get wrong on every call. The binding didn't need declaring; it needed locating. That also means nothing is now waiting on the upstream Toolbox finding REQ-126 raised.

## Two things you should know about

**The upstream migration you told me to fold in was bigger than the three call sites I quoted.** Beyond `FileStore`→`FileArchive`, two more surfaced only under test:

- `attach` had to move from `resume` to `getSession`. `resume` now reconciles the junction and is no longer idempotent — re-resuming a live session re-folds an already-folded record stream.
- **`logDir` was defaulting to `~/.xgd/sessions/live`.** A session now has two tiers, and only the archive was being pointed at the workspace. One conversation was living half in `storage/chat` and half in your home directory, and two checkouts of different projects would have shared a junction keyed only by slug — the exact hazard `sessionsDir`'s own comment says must not happen. Both tiers now sit under the workspace.

**Three REQ-122 assertions were stale against REQ-126** and I updated them to what REQ-126 intended. One is worth your attention: the refusal a model sees no longer contains the offending path — the Toolbox renders the declared error-class meaning instead, so `set_copy` on a bad address returns "what you addressed does not exist. Re-read the listing" without saying *which* address. REQ-126 flagged that upstream. The test now asserts correctability rather than the specific path, but the model is getting less to work with than it used to.

## Not mine, still there

- **6 pre-existing test failures** in `req115-builder-composition`, `req117-edit-loop-browser`, `reconciliation-copy-edit-gesture` — all edit-modal/browser. Byte-identical at `HEAD` with my work stashed; I verified before and after.
- **`storage/sites/gigabytealchemy/draft/pages/home.json`** — uncommitted, changes "Intentional Software" to "Un**intentional** Software". Looks like a stray edit rather than a deliberate one. Left it alone.
- **`.xgd/FAILED_update_comment-0a6ab5af`** — an XGD tooling artifact from a failed ticket-comment rename.

One aside: four source files (`ai/host.ts`, `builder.ts`, `fidelity.ts`, `preview.ts`) contain **literal NUL bytes** as map-key separators. The idiom is sound, but it makes those files `data` to `file(1)`, so plain `grep` prints nothing without `-a` — that cost me a detour hunting for the route table. `\0` in a template literal is the same runtime string and stays greppable; I used the escape in new code and left the existing four alone, since three are unrelated to this ticket.

<!-- xgd-turn id="82778d13-c981-4c25-b38e-8aee7c06a316-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T21:32:28.377120+00:00" -->
#### You
If I refresh the browser can I access the new features?

<!-- xgd-turn id="82778d13-c981-4c25-b38e-8aee7c06a316-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T21:33:34.229375+00:00" -->
#### Claude
Short answer: **no — refreshing alone will break the chat.** Let me confirm exactly how the builder serves each half.

**No — and a refresh on its own would actively break the chat.** Two reasons.

**First, there are no new features to see.** REQ-127 is a layering change. The operator experience is byte-for-byte what it was: pick a site, talk to the assistant, it edits that site. Everything that moved is internal.

**Second, only half your change is refreshable.** The builder serves the browser source straight off disk with `cache-control: no-store, must-revalidate`, so a refresh definitely picks up the new `chat.js`, `app.js` and `api.js`. But `host.ts` and `builder.ts` are TypeScript executed by the Node builder process — a refresh doesn't touch them. You'd get:

- new client posting `{sessionId, text}`
- old server demanding `{slug, text}` → **400 on every turn**

The panel would show the failure. Refresh-without-restart is strictly worse than not refreshing.

**As it happens there's nothing to restart** — I checked `ps`, no builder is running. So just start it:

```
bin/1c builder        # http://localhost:8790
```

That picks up both halves and you're on the new code.

## Your conversation history is fine

`storage/chat/site-gigabytealchemy.md` — your real conversation — is untouched. `FileArchive` was already pointed at the workspace, so the archive never moved. On first open, `resume` finds no junction, loads that archive, and re-seeds from it. The transcript replays as normal.

## One thing to clean up, and it's mine

The `logDir` bug I fixed left junctions in your home directory, and two of them are **from my test runs**:

```
~/.xgd/sessions/live/site-studio
~/.xgd/sessions/live/site-annex
```

`studio` and `annex` are the fixture slugs in the REQ-127 and REQ-122 host suites. They escaped there because until this commit the junction defaulted to the machine-global path — exactly the leak the fix closes. They're inert orphans now (nothing resolves those ids), but they're litter in your home directory and they shouldn't be there.

Want me to delete those two? I'd leave the UUID-named siblings alone — those belong to other tooling, not to this project.

<!-- xgd-turn id="a0c1efa5-3c5f-403a-bc1f-1e975400a4dd-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T22:22:36.250502+00:00" -->
#### You
yes

<!-- xgd-turn id="a0c1efa5-3c5f-403a-bc1f-1e975400a4dd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T22:23:10.293461+00:00" -->
#### Claude
Let me look at them before deleting.

Confirmed — the payloads contain my fixture literals (`A new headline.`, `Studio headline.`, `Remember this`) and `claude+site:studio` / `claude+site:annex`. Timestamps 20:56 UTC = 13:56 local, my pre-fix test run.

Deleted. The seven UUID-named siblings are other tooling's and were left alone.

Worth noting as evidence the fix holds: those two directories were last written at **13:57**, and I ran the full AI suites again at **14:09** — the second run didn't recreate or touch them. Post-fix, junctions land under each test's temp workspace and go away with it.

I also re-checked that your real conversation is untouched:

```
storage/chat/site-gigabytealchemy.md    # intact, in the workspace
```

So the state now: REQ-127 is `free_coded` at `7347d224e`, 44/44 green across the six AI suites, home directory clean. Start the builder with `bin/1c builder` when you want to drive it.

<!-- xgd-chat-end -->