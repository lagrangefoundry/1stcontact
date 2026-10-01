---
uid: request-ace901e5
id: REQ-357
type: request
title: 'Builder chat: group chat — a room with the consultant and the assistant, behind
  a per-business switch'
created_by: EPIC-19
created_at: '2026-10-01T21:04:15.900939+00:00'
updated_at: '2026-10-01T21:04:15.900939+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 14
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes

A business can switch its builder conversation into a **group chat**: one room in which the client, the **consultant** and the **assistant** all post. The room is the record the client sees and the place both agents post. This adopts the lagrange-framework room as it stands (REQ-153/154/196: `createGroup`, `openGroup`, `Orchestrator`, `GroupToolbox`/`GroupRuntime`). No turn-taking or attribution logic is reimplemented here. Design context: EPIC-19 Findings 14–16, DOC-62.

"Alice" and "Bob" are working code names only. The roles are `consultant` and `assistant`.

### 1. A per-business switch (Debug tab)
- A group-chat switch sits on the Debug tab beside the delegation switch, resolved per business the same way delegation is (REQ-353). It is off by default, and with it off the builder behaves exactly as today.
- With it on, the Debug tab also shows each agent's own private session (EPIC-22 §2).

### 2. The room
- On first enable, a room is created per site with `createGroup` and homed on its own chat ticket. Its members are the consultant's chat ticket and the assistant's chat ticket.
- The site's existing conversation becomes the consultant's private session, **unchanged**. The room starts empty, and switching group chat off returns the builder to that conversation.

### 3. The assistant role
- A new role, `assistant`, on Haiku with its own backend entry in `backends.json` (not `claude_builder`), its own priming entries, and its own chat ticket and session.
- **Read access to everything the consultant can see:** the knowledge base, the site (L1 read operations), the Library catalogue, the decisions ledger, the client's tickets (read-only), and the room.
- **No write access to the site, no delegation, no image generation, no screenshots.**
- **Deliberately no access controls between the agents.** The assistant can read anything in the ticket store the consultant can, including the consultant's private transcript. Its working place is the room, but nothing is built to stop it reading elsewhere. Operator decision (2026-10-01): there is no motivation for such controls.

### 4. Room tools on both members
- Both members carry `GroupToolbox` (the room's read and post tools, granted with `groupInstanceConfig()`), with the member's own chat ticket as the speaker.
- The consultant's existing tools are unchanged.

### 5. Running an exchange
- In group mode the client's message is posted into the room as the operator's contribution (`contributeAsOperator`), and one exchange is run with `Orchestrator.run()` **inside the prompt request**, streamed like a consultant turn today. The 16,000-character submission limit (REQ-309) applies unchanged.
- **Survives isolate eviction.** Nothing the run depends on is held only in isolate memory. Before running, the host reopens the room (`revive`) and prepares and attaches **both** member sessions, so neither member is recorded as skipped merely because its junction is not in this isolate.
- **One exchange at a time per room.** The "already running" guard is a field on the room ticket, written with compare-and-set (the `pending_turn` pattern), not an in-memory flag. A second run while one is live is refused.
- **Stop is durable.** Stopping an exchange uses the existing control-record stop, so a stop request reaches the run whichever isolate it lands in.
- **Each member round is a full builder turn.** The orchestrator's prompt function is the host's own consultant turn path, not bare `manager.prompt`. Every member round therefore gets:
  - the pending-turn record (BUG-121)
  - spend and turn-clock accounting
  - SITE_CHANGED after tool activity, so the site pane re-renders as members edit
  - the context guard and the budget-exhaustion narration

  Each member's events are forwarded to the client stream.

### 6. The builder UI in group mode
- The chat panel shows the room's transcript with **who said each contribution** (client, consultant, assistant), live while an exchange runs and identically on reload.
- The composer posts to the room, and a stop control ends the exchange.
- Whether to vendor upstream `webui/room` or extend our chat panel is the implementer's call. Record it here when made.

### 7. Names are configuration
- Role keys are `consultant` and `assistant`. The display names (currently "Alice" and "Bob") come from one config entry and are what the room shows (the room's `names` map).
- Priming and surface text refer to roles ("the consultant", "your assistant") or a template slot, never to the code names.

## Out of scope
- **The dramaturgy:** the document that shapes the conversation, the plan, and how the assistant administers it. That is a separate thread.
- **Getting the client's words into a round already in flight:** LF EPIC-7.
- **LF REQ-197:** ending a member's round as soon as its post lands.

## Test plan
UATs named `test_UAT_FC_<ticket>_*`, in the workers suite where the real grant and Durable Object exist:
- Switch off: the builder conversation is unchanged.
- Switch on: a room is created with both members, and the consultant's existing conversation is intact.
- The assistant's tool manual contains the read operations and the room tools, and none of the site-write, delegation, image or screenshot operations.
- A client message posts to the room and one exchange runs. Both members are called, not skipped, including on a cold isolate where neither junction is loaded.
- A second run against a live room is refused. A stop ends the exchange.
- A member round that writes L1 raises the site-changed signal, and its spend is recorded.
- The room transcript replays with speaker attribution.
- No "Alice" or "Bob" literal appears in source, priming or surface JSON.
