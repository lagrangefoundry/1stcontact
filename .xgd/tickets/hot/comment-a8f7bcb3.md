---
uid: comment-a8f7bcb3
id: COMMENT-4488
type: comment
title: Comment on epic EPIC-22
created_by: xgd
created_at: '2026-09-29T22:27:11.672057+00:00'
updated_at: '2026-10-02T00:37:19.069922+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-82afdac9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "68c9c1c2-42fc-4ec0-b707-f3bb6832c652",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fe88be8d-0bb2-46aa-97bb-c802a1c1bd1e-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T22:26:28.159661+00:00" -->
#### You
Hi, I need you to create a debug tab - for now this can be globally visible but eventually we will want to hide it for normal users.

The tab will have three things:
1) Configuration parameters for the network. Today this is:
 - switch on/off delegate tool calls (see EPIC-20)
 - switch on/off group chat (see EPIC 19)

2) If group chat is on the debug tab should show chat windows for Alice and Bob (their individual windows - not the group window)

Please take a look at the references these are big feature switches, once you have context we should discuss.

Note the Group chat is still very much in-flight so it cannot be switched on today but the frame and the delegate switch can be built as a v1

<!-- xgd-turn id="fe88be8d-0bb2-46aa-97bb-c802a1c1bd1e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T22:33:07.312142+00:00" -->
#### Claude
I'll get context on this ticket and the two referenced epics.

I've read EPIC-20 (delegation, §"Delegation: verified in place" and the 2026-09-29 live session) and EPIC-19 Finding 14 in full (§14.1–14.19, including the DOC-61/DOC-62 filing and the REQ-344 abandonment), plus the actual code: `delegation.json`/`delegation.ts`, `builder/config.js`, `builder/console.js`, `builder/chat.js`, `ai.ts`, `wrangler.toml`.

Here's what I found and the five things I think we need to settle before I write the epic body.

## 1. There is already an operator surface, and it is deliberately not a tab

`config.js` has `CONSOLE_ACTION_ID` — a full-surface view, header action, gated on `ownsPlatformBusiness`, with a stated argument for not being a tab: the strip is **uniformly business-scoped** (REQ-179), so anything about the platform-as-a-whole would put the business switcher above a surface it silently doesn't apply to — *"a control that is present and ignored reads as a bug."*

Your item (1) — deployment-wide network switches — falls exactly on the Console's side of that line. And the Console is *already* gated the way you want "eventually hidden from normal users," so gating would be free rather than future work.

Your item (2) — Alice's and Bob's windows — falls on the *other* side: a conversation is about one site.

So the debug surface straddles the one distinction the tab strip is organised around. **Decision needed**: a real tab (accepting that it's the one non-business-scoped entry, documented as a deliberate exception because it's operator-only), or network switches as a Console section + agent windows in the site tab? I lean tab — the "reads as a bug" argument is about a customer-facing control, and this is explicitly not that — but the `config.js` comments will be read as law later, so the exception needs writing down, not just making.

## 2. "The delegate switch" is two switches, and the two-checkbox shape can express an impossible state

`delegation.json` ships `enabled: true` **and** `primary_writes: false` (REQ-343). Today the consultant holds **no L1 write groups at all** — every change is commissioned. So:

- `enabled` — are there workers?
- `primary_writes` — does Alice still have hands now that there are?

`delegation.ts` makes `enabled` dominate structurally (the narrowing is applied at the point the surface is composed), precisely so "no write groups and no worker to commission" is unreachable. Two checkboxes in a UI *can* express that state. I'd make it **one three-way control** over the reachable space:

- consultant writes, no workers *(`enabled:false`)*
- consultant writes, workers available *(`true`/`true`)*
- consultant commissions only *(`true`/`false` — shipped)*

That matches the config's own reachability guarantee instead of restating it in the client.

## 3. Making the switch runtime is a backend change, not a UI change

Today it's a bundled static JSON import, validated at start-up, deliberately with no filesystem in the graph, and both hosts (CLI + Worker) must agree. The seam exists and is unwired — `configureDelegation(doc)` is documented for exactly this ("a Worker reading the switch from KV"). What's actually needed:

- **A store.** There is no KV binding on this Worker; `DB` (D1) is it. That's a new migration (next is `0022`) — one deployment-wide row, not per-tenant, since `delegation.json` puts per-tenant control explicitly out of scope.
- **An install point** in `router.ts`/`ai.ts` before the host is built.
- **Cache invalidation, which is the sharp edge.** `delegation.ts` warns: managers are cached and a manager holds its backend for its whole life, so a change needs `resetAiHost()`. Calling that per request throws away every cached manager; never calling it means the flip doesn't land until the isolate recycles. So v1 semantics have to be stated honestly: **the flip applies to the next session, not to a turn in flight**, and the panel should say that rather than imply live effect.

## 4. Nothing exists behind a group-chat flag yet

Per §14.17, the room is **LF REQ-183**, gated on LF REQ-182 + REQ-283, design-note-first. REQ-344 is abandoned (§14.19). There is no Bob: no second role, no room, no cursor.

A disabled-but-present switch contradicts this repo's own doctrine in three places (`delegation.json`: *"off means never composed, not composed-and-refusing"*; `development.ts`: *no address, no surface*; the Console: unrendered when unentitled). So I'd read your "the frame and the delegate switch as a v1" as: **build the frame and one working switch, and add the group-chat entry when there is something behind it** — not ship a dead toggle. Confirm that's what you meant.

## 5. The real question about Alice's and Bob's windows

`chat.js` shows one conversation and knows nothing about sites — it's already shaped to mount twice. But today there's one session per site (the consultant's), so "Alice's window" in a debug tab would be a *second pane on the same conversation the Site tab shows* — two drafts, one transcript, no new information.

The debug value only appears if the window shows something the Site tab can't. And per §14.15/DOC-62 §4, topology 3's whole point is that **each member's view is a projection** — Alice gets the client verbatim plus plan state as compact fact, not Bob's transcript. So:

> **Is the debug window the *conversation*, or the *agent's context*?**

The first is two `mountChat`s and is nearly free. The second is a new read surface over what each session actually sent — and it's the thing you genuinely need when debugging a two-agent network where the two agents see different rooms. I think the second is the reason this tab is worth building, and it's a different piece of work.

---

Nothing written to the ticket yet, and no code. Once you call (1) tab vs Console, (2) three-way vs two switches, (4) dead toggle or not, and (5) conversation vs context, I'll write the epic body and file the children — I'd expect roughly: the tab frame + gate, the D1-backed runtime switch (store + install + invalidation semantics), the delegation control, and the agent-window surface as its own child blocked on the room.

<!-- xgd-turn id="069fabe2-ac5d-4acc-b524-e4c58a8cbeb7-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T22:47:19.195550+00:00" -->
#### You
Your item (1) — deployment-wide network switches — falls exactly on the Console's side of that line. And the Console is *already* gated the way you want "eventually hidden from normal users," so gating would be free rather than future work. <-- I deliberately asked for this to be a business level tab because I want these controls at the business level. I appreciate that configuration may not exist today but that is what we need to build.

"The delegate switch" is two switches <-- no it's 1 either the delegate feature is on or the feature is off I don't think there is any value in having the delegate feature half on. What is the state that you think I want to express?

3. Making the switch runtime is a backend change, not a UI change <-- yes, that's a good point. Perhaps these should be deployed time switches not runtime switches. I imagine making them run time switches would be quite complicated and have a lot of potential bugs associated with it and it is not a product feature that I desire. Do you agree with this or would the runtime change be easy?

`chat.js` shows one conversation and knows nothing about sites — it's already shaped to mount twice. But today there's one session per site (the consultant's), so "Alice's window" in a debug tab would be a *second pane on the same conversation the Site tab shows* — two drafts, one transcript, no new information. <-- to get a better sense of this look at epic two in Lagrange framework and the showcase tab that we have built with it. It shows the group chat and the individual chats for each of the two participants. This remains a UI feature even if the such as become developed time changes. This is also a per business feature so it is appropriate to have it as a tab

<!-- xgd-turn id="069fabe2-ac5d-4acc-b524-e4c58a8cbeb7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T22:49:49.032383+00:00" -->
#### Claude
Let me look at framework EPIC-2 and the showcase tab, and at the actual composition point that decides how hard a runtime switch is.

Read the Flock demo (`showcase/src/flock-demo.js`) and EPIC-2. That answers my objection — taking your points in order.

## 1. Business-level tab — accepted, and it removes the exception rather than creating one

You're right, and it's the better answer. If the switches are business-scoped then the tab strip stays **uniformly business-scoped** and the debug tab needs no exception to REQ-179 at all — my Console argument only applied to a deployment-wide control. A per-business debug tab is ordinary.

What it does change is the config: `delegation.json` says *"DEPLOYMENT-WIDE, READ AT START-UP. Per-tenant control is deliberately out of scope"* — but the same paragraph anticipates this, which is why `workers` is a map: *"so that adding a scope later is an extension of this document rather than a rewrite of it."* So this epic supersedes that one sentence, and the file already expects it to.

## 2. One switch — I was wrong

The state I was reaching for was `enabled: true, primary_writes: true` (workers available *and* the consultant keeps its hands). That isn't a product state, it's the rollback lever for REQ-343, and it already has a home as a deploy-time key. And `enabled` already dominates `primary_writes` **structurally** — the narrowing is applied at the point the delegation surface is composed — so one switch is not just simpler, it's safe by construction:

- **off** → no workers, consultant writes (byte-for-byte the pre-delegation prompt)
- **on** → the deployment's document decides what "on" means (today: commission-only)

One switch. `primary_writes` stays in `delegation.json`.

## 3. Runtime: easy *if* we pick the right seam, and a bug factory if we pick the wrong one

Your instinct is right about the risk but I don't think deploy-time is actually cheaper here, and the reason is item 1. Once the switch is per-business, a deploy-time switch means adding a business dimension to `delegation.json` and flipping it by editing JSON and redeploying — so the tab's "switches" become read-only text. You'd pay the config work and not get the control.

The runtime cost is small **because you've already established the pattern five times over**. `build(slug, opts, deps)` in `host-core.ts:1220` already composes per-site, and `fidelity`, `images`, `pictures` and `assetUrl` are each documented as *"A PARAMETER, ASSEMBLED BY `router.ts`"* — resolved per request, after the scope is known. Delegation becomes the sixth. Then:

- **Validation is free.** The D1 value feeds a document through the existing `delegationFromMapping`/`delegationFor`, so the same named start-up refusals still apply. The seam was designed for exactly this — the file says *"a Worker reading the switch from KV, or a test standing the feature up, installs its own document"*.
- **The one real hazard is staleness**, and it's bounded: managers are cached on `storeId + site`, so a flip needs that key evicted, or the stated rule "takes effect on your next turn". Small, and testable.

**The trap is `configureDelegation`.** It's a module-level global. Using it for per-business resolution means mutating a global per request while feeding a cache keyed per site — that is precisely the class of bug you're worried about, and it would be a genuine mess. Going through `deps` instead makes the per-business value a parameter that can't bleed.

So: **runtime, via `deps`, D1-backed** (no KV binding on this Worker; `DB` + migration `0022`). Roughly a day, in the idiom the file already uses. I'd only go deploy-time if you want the tab to be a display rather than a control.

## 4. The Flock tab — my "no new information" objection was wrong

I was reasoning from 1stcontact's one-session-per-site world. The Flock demo makes the distinction the whole point: *"A member deliberates in its OWN session. Its chat panel here shows that session and not the room's history; the room shows what it decided to say and not what it said to itself deciding"* — EPIC-2 §1 observable 5. So the individual windows show private deliberation, which is structurally different from the room. That's the feature, and it's a UI feature regardless of how the switches are stored. Agreed.

Three things worth carrying from that tab into our frame now:

- **`webui-room` is a shipped upstream package** with a `PUBLIC-API.md`, and it is **not** vendored here (we have chat, fields, list-detail, markdown, scroll, shell, split). Adoption is the goal-map pattern: vendor + host adapter. That makes this the sixth instance of EPIC-19's standing "built upstream, unadopted here" pattern — worth recording on the epic.
- **The room cannot tell you who is composing.** The demo polls `GET /ai/activity`, a third observer over the member's own junction, because *"a tab that read the room to decide would always read idle."*
- **xgd's BUG-1402**: the component ships an activity strip, the host fed it nothing, the operator read a working room as inert and retyped — which truncated the in-flight turn. The strip is a safety control, not decoration.

---

One thing left to settle before I write the body: **does the group-chat switch get rendered in v1?** You said it can't be switched on today. This repo argues hard against present-and-refusing (*"off means never composed, not composed-and-refusing"*, and the Console isn't rendered when unentitled), so my lean is that v1 renders the tab, the delegate switch, and a config section shaped to take a second entry — and the group-chat switch lands with the room behind it. If you'd rather see it disabled with a reason on it so the tab reads complete, say so and I'll build it that way.

Say the word and I'll write the EPIC-22 body and cut the branch.

<!-- xgd-turn id="37a3973c-29c2-46bf-8004-a45d5b24b792-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T00:02:45.788511+00:00" -->
#### You
Yeah V1 is create the tab and the delegate switch with the necessary backend changes to support that - can you give me a ticket for that please?

<!-- xgd-turn id="37a3973c-29c2-46bf-8004-a45d5b24b792-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T00:07:34.218172+00:00" -->
#### Claude
Now I'll write the epic body and the v1 child ticket.

Filed. Two tickets written:

**EPIC-22** — *Debug tab: per-business network configuration, and a window on each agent*. Now has a body; it was `Untitled` / `(new ticket)` before. It records the four things we settled today, each with the argument rather than just the verdict:

- why it's a business-scoped **tab** and not the console (REQ-179's rule doesn't bite once the controls are per-business), and that this supersedes `delegation.json`'s *"per-tenant control is deliberately out of scope"* — which that same paragraph anticipated
- why the delegate control is **one switch**, and that `enabled` already dominates `primary_writes` structurally so one switch is safe rather than just simpler
- **runtime via `deps`, not deploy-time**, with `configureDelegation` named as the trap (module-level global feeding a per-site manager cache)
- **framework EPIC-2's Flock tab as the UI reference** for the agent windows, including the three findings worth stealing: `webui-room` is shipped upstream and unvendored here (sixth instance of EPIC-19's unadopted-upstream pattern), the room reads idle while a member composes, and xgd's BUG-1402 — the activity strip is a safety control, because an operator who reads a working room as inert retypes and truncates the turn

**REQ-353** — *A Debug tab, and a per-business switch for delegation*, filed as the epic's first child (both `epic_parent` and `epic_children` are set; `xgd ticket children` still reports none, which is the index lag we saw earlier, not a broken link).

It's the v1 you asked for: the tab frame plus the one working switch and the backend under it. Behaviour is written as eight observables so the UATs have language to trace to, and it's explicit about the parts that are absences rather than omissions — no group-chat switch (nothing behind it; a switch that can't be moved is present-and-refusing, which this repo rejects in three separate files), no agent windows, no gate, no per-business `workers` map.

Two things in there you should look at, because they're my calls and not yours:

- **The Debug tab goes rightmost**, which contradicts `SETTINGS_TAB`'s comment claiming that position with a reason. The ticket amends that comment rather than leaving two tabs each documented as last — worth a glance in case you'd rather Debug sat elsewhere.
- **The exposure while it's ungated** is recorded plainly: anyone reaching the builder for a business can turn that business's delegation off, and EPIC-20 measured that at $0.54 against $0.046 per element write. I've written it as acceptable-for-v1 because the builder is behind Access and you're its only user — but it's stated, not buried, so gating it stays a decision.

Haven't cut a branch or written code yet. Say go and I'll branch `REQ-353` and build it.

<!-- xgd-turn id="ccb38fde-4693-457f-a8b9-34bf364e3c52-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T00:20:29.720647+00:00" -->
#### You
353 has been implemented but I see no debug tab?

<!-- xgd-turn id="ccb38fde-4693-457f-a8b9-34bf364e3c52-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:27:20.697051+00:00" -->
#### Claude
Source has the Debug tab on xgd-working; checking whether the built assets / deployment actually carry it.

The code is fine. What you're looking at is a stale build of it.

REQ-353's code (`683d066a5d`) is on xgd-working, and `builder/config.js` there has `DEBUG_TAB` in `TABS`, mounted in `app.js`. But the browser doesn't load `src/builder/`. It loads `apps/control-app/dist-assets/`, which only `./bin/1c assets` writes, and `1c builder` never runs that. The copy being served was built on Sep 28, the day before REQ-353 landed: there was no `debug.js` and its `config.js` had no `DEBUG_TAB`. The Worker `.ts` changes load straight away, so the backend half was running while the browser still had the old client.

**Local:** I've re-run `./bin/1c assets`. `dist-assets/builder/debug.js` now exists and `config.js` has the Debug tab. Reload the builder and it should be there; no server restart needed. There's one more thing to do locally. Migration `0022` (REQ-353's table) is applied, but `0023_group_chat_switch.sql` from REQ-357 isn't. REQ-357 has since wired into the Debug panel, so apply it before trusting what the panel shows:

```
cd apps/control-app && npx wrangler d1 migrations apply DB --local
```

**Production:** the last code deploy was 2026-09-27, so neither REQ-353 nor REQ-357 is live there. Deploying means applying 0022 and 0023 to the remote database and then running the deploy. I haven't done either, because they change production:

```
cd apps/control-app
npx wrangler d1 migrations apply DB --remote --env production
./bin/1c assets   # from repo root, if not already fresh
npx wrangler deploy --env production
```

Nothing changed on EPIC-22 or REQ-353, since no code was wrong. REQ-353 is already at `ready_to_reconcile`.

<!-- xgd-turn id="30923d91-ad9a-4b69-a7fa-cb14f9d6ff27-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T00:31:47.837284+00:00" -->
#### You
I'm looking at dev - I brought the servers down, ran bin/dev and brought them back up - should that not be enough?

<!-- xgd-turn id="30923d91-ad9a-4b69-a7fa-cb14f9d6ff27-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:32:48.917288+00:00" -->
#### Claude
No, restarting isn't enough, and my last answer was wrong for your setup. Re-running `1c assets` changed nothing you'd see.

Since REQ-318, the dev environment doesn't serve your source files at all. `bin/dev up` runs wrangler against a frozen bundle in `apps/control-app/.dev-snapshot/`, and the only thing that rebuilds that bundle is `bin/deploy --env dev`. Taking the servers down and bringing them back up just serves the same bundle again.

Your dev log says so in its first lines:

```
worker: 1stcontact-control-app-dev --env dev (deployed 2026-09-26T20:57:38Z, 9a2aeb7b45)
FROZEN: editing a source file changes nothing here until `bin/deploy --env dev`
```

That bundle is from Sep 26, and REQ-353 landed on Sep 29, so dev is serving a build without the Debug tab. That also means anything else merged since Sep 26 is missing from dev, including REQ-357's group chat.

To fix it:

```
bin/deploy --env dev
bin/dev restart dev
```

The deploy also runs the migrate hook against your local database. That applies `0023_group_chat_switch.sql`, which is the one migration still pending locally (REQ-357's).

I haven't run the deploy myself, since it changes your dev environment and data; say if you'd like me to. I've also corrected my saved memory note, which still described the older setup where re-running `1c assets` was enough.

<!-- xgd-turn id="1b2f711b-c591-4bbd-b616-39e811b630a2-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T00:36:33.690075+00:00" -->
#### You
Sorry I said bin/dev - I meant bin/build that runs 1c asset, right

<!-- xgd-turn id="1b2f711b-c591-4bbd-b616-39e811b630a2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:37:17.545860+00:00" -->
#### Claude
Yes, `bin/build` runs `1c assets`, but dev doesn't serve what it builds.

`bin/build` writes the builder client into `apps/control-app/dist-assets/` and a test bundle into `apps/<app>/dist/`. Dev on :8789 serves neither. It serves `apps/control-app/.dev-snapshot/`, which only `bin/deploy --env dev` writes. So build plus restart rebuilt the files and then served the same old bundle again.

Your dev log shows it. Even after your rebuild and restart, it names a bundle from before REQ-353 landed on Sep 29:

```
deployed 2026-09-26T20:57:38Z, 9a2aeb7b45
FROZEN: editing a source file changes nothing here until `bin/deploy --env dev`
```

To get the Debug tab in dev:

```
bin/deploy --env dev
bin/dev restart dev
```

The deploy also applies the pending local migration `0023_group_chat_switch.sql`.

<!-- xgd-chat-end -->