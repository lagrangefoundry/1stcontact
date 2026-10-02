---
uid: request-ace901e5
id: REQ-357
type: request
title: 'Builder chat: group chat — a room with the consultant and the assistant, behind
  a per-business switch'
created_by: EPIC-19
created_at: '2026-10-01T21:04:15.900939+00:00'
updated_at: '2026-10-02T00:26:16.347209+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 14
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-68d3ad6f
  commits:
  - working_sha: 6401f8f1fa3f72e1c5547697e4a3e48a31e7dc83
    reconcile_sha: null
    main_sha: null
  - working_sha: 9c5b6555bda313e6d0b4963944eb5084d522d567
    reconcile_sha: null
    main_sha: null
  - working_sha: c56e8cbef8837b806986142b31c878090b1100a7
    reconcile_sha: null
    main_sha: null
  version: 0.2.431
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

## What landed (implementation record)

### Behaviour as built
- **Switch.** `business_network_settings.group_chat` (migration `0023`, NULL and 0 both off), read per request through `deps.groupChat`; `GET/POST /api/network/group-chat` (boolean only, 400 otherwise). The Debug tab draws it beside delegation, only from its own read. With it on, the tab shows each agent's private session (read-only, via `POST /api/ai/private {site}`; 404 when the business has no group chat). Flipping it reopens the builder conversation at once.
- **Opening.** With the switch on, `/api/ai/session {site}` answers the room: `sessionId: room-<site>`, the room's contributions as turns each carrying `speaker` (display name) and `role` (client = `user`, members and room notes = `assistant`), `group.names`, `live: false`. With it off the same call answers `site-<site>`, the consultant's conversation, unchanged.
- **The room.** Created on first open of a site's builder conversation while the switch is on: `createGroup` homed on its own chat ticket (session `room-<site>`), roster = the consultant's chat ticket (the session `site-<site>`, the existing conversation) and the assistant's chat ticket (session `assistant-<site>`). Reopened with `openGroup` afterwards. Created with `endRoundOnPost: false` (LF REQ-197 out of scope) and the budgets in `group-chat.json` (`max_auto_turns` 6, `max_contributions` 2).
- **The assistant.** Role `assistant`, backend `claude_assistant` in `backends.json` (claude-haiku-4-5, 16000), priming `assistant_priming` / `assistant_reminders` in `priming.json`, L1 grant `instances.json` → `assistant: ReadSite, MeasureDrawings`. Its own surfaces: L1 reads, the corpus and the ticket reader (`deps.assistantSurfaces`), the Library's read group only, and `GroupToolbox`. No write group, no `Delegate`, no image surface or generator, no camera. It reads the consultant's recorded decisions through the product tier's ledger seed (same manager), the site's plan (REQ-356, landed while this was open) through the same per-turn `site.plan` reminder the consultant gets, and anything in the ticket store through the ticket reader, including the consultant's transcript (no access controls, per the operator decision).
- **Room tools.** Both members carry `GroupToolbox` with `groupInstanceConfig()`; each member's `GroupRuntime.speaker` is set to its own chat ticket when the room opens. The consultant's existing tools are untouched; it also gets a `group-room` priming entry (the framework's group-member framing + one product paragraph) that renders nothing with the switch off.
- **An exchange.** `/api/ai/prompt` with `room-<site>` (16,000-char limit unchanged): `contributeAsOperator`, then one `Orchestrator.run()` inside the request. The orchestrator's prompt function is `siteTurn` — the body of the consultant's turn path, lifted out of `streamPrompt` — so every member round gets pending-turn, spend (role `consultant`/`assistant`), turn clock, `site_changed`, context guard and exhaustion narration. Member events are forwarded tagged `meta.member`; a member's own `done` becomes `member_done`; each post the room records is a `room_post` event (`meta` = speaker, role, ts, turn_id, passed). One final `done` (`complete` / `aborted` / `error`, plus the orchestrator's stop and reason).
- **Cold isolate.** Before running, the host prepares the room's and both members' junctions from their Durable Objects and attaches both member sessions, so neither is skipped for want of a loaded junction.
- **One at a time.** Guard = `exchange` field on the room's chat ticket (JSON `{at, calling, stop}`), claimed by compare-and-set on `expected_version`, heartbeat each round, cleared at the end; a guard older than one turn clock + 60 s is treated as dead. A second run while live gets `EXCHANGE_BUSY` and `done{status: refused}`, with no model call.
- **Stop.** `POST /api/ai/stop {sessionId}` sets `stop: true` on the guard (compare-and-set) and answers `{stopping}`. The running isolate checks it before each round and polls it every 2 s during a round; when set, it ends the in-flight round with the framework's control-record stop (`manager.requestStop` on that member's session) and ends the exchange `aborted`.
- **UI (decision: extend our chat panel, not vendor `webui-room`).** `webui-chat` already draws attributed turns in follow mode, so in room mode the existing panel mounts with `onSubmit` (echo-free: the client's message comes back as the room's first post), `follow()` over the exchange's events mapped to frames, `onStop` → `/api/ai/stop`, and an attribution hook (client on the right; a tone per member; room-recorded declines/skips marked as notes). A member's own deliberation is not drawn in the room; it is on the Debug tab. A submit while an exchange runs is put back in the composer with a note.
- **Names.** `tools/generate/src/cli/ai/group-chat.json` is the one place display names live (`consultant`, `assistant`, `client`, `room`). They are the room's `names` map and what the panel shows.

### Design decisions made during implementation
- **Durable stop.** Ticket item 5 asks for the "existing control-record stop". On its own, a control record cannot cross isolates in this host: the producer reads its in-memory mirror of the Durable Object junction and only re-reads at entry points. So the cross-isolate half is a write on the room ticket's guard field, and the running isolate turns it into the framework's control-record stop locally.
- **One manager per site, rebuilt when the switch moves**, rather than a second cached manager. The backend registry is global and keyed by name, and a resumed session reaches its backend by the name its `session_start` recorded, so two managers for one site would hand each other their tools.
- **A client that walks away does not end an exchange.** It runs to completion under `waitUntil`; Stop is how to end one.
- **Reload mid-exchange** draws the room as recorded so far (`live: false`, no reattach). Live drawing is through the prompt stream.
- **REQ-353 supersession.** REQ-353's Debug-tab claim 9 ("no group-chat switch") no longer holds: the switch now exists beside delegation, drawn only from its own read. That UAT's comment was updated; its single-row assertion still holds because that mount serves no group-chat read. REQ-182's corpus-free provider list gained `group.room`.

### Test plan (as built)
- `tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts` (workers; real route, D1, ticket store, junction DO; Anthropic client is the only double, room-aware): switch off unchanged; switch on creates a room with both members and keeps the consultant conversation (and off returns to it); the assistant's tool list has every L1 read and the room tools, and no L1 write, Delegate, image or camera tool; a client message runs one exchange with both members called on a cold isolate; a second run is refused and a stop ends the exchange (guard on the room ticket); a writing round raises `site_changed` and both members' spend is recorded; the transcript replays identically with speakers.
- `tests/test_UAT_FC_REQ-357_group_chat_panel.test.ts` (jsdom): the room is drawn with speakers; the composer posts to the room and the exchange streams in without the member's private text; Stop reaches `/api/ai/stop`; the Debug switch sits beside delegation, and turning it on saves, reopens the conversation and shows each agent's session.
- `tests/test_UAT_FC_REQ-357_names_are_configuration.test.ts`: no display name from `group-chat.json` appears in the AI host's source or JSON (`platform-fonts.json` excluded: font catalogue) or in the builder's chat panes.