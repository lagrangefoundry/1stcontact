---
uid: comment-a8f7bcb3
id: COMMENT-4488
type: comment
title: Comment on epic EPIC-22
created_by: xgd
created_at: '2026-09-29T22:27:11.672057+00:00'
updated_at: '2026-09-29T22:33:08.063876+00:00'
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

<!-- xgd-chat-end -->