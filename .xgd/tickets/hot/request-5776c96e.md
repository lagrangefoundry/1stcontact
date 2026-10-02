---
uid: request-5776c96e
id: REQ-364
type: request
title: 'Builder: a plan panel above the chat, where the consultant''s questions wait
  for the client'
created_by: EPIC-19
created_at: '2026-10-02T21:02:05.849959+00:00'
updated_at: '2026-10-02T23:31:01.525044+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  epic_parent: epic-95bc3b15
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f15171fb
  commits:
  - working_sha: 9af40dc0389d418c309dc0f8f01f3a7d60b8d3cb
    reconcile_sha: null
    main_sha: null
  - working_sha: b830e3e80efc5cd6653827232544953d4321b283
    reconcile_sha: null
    main_sha: null
  - working_sha: 34a0525318e81e30c42487fa660507ac29f05140
    reconcile_sha: null
    main_sha: null
  version: 0.2.441
---

## What changes

The builder's chat half gains a **plan panel** above the conversation. In v1 it puts **the consultant's questions for the client** ("asks") in front of the client, where they can be answered at any time without interrupting the design conversation. Later versions add status: what the consultant is doing, and where we are in the process. Those are out of scope here.

Design: [[DOC-65]] (§4 the panel renders the plan ticket, §5 what belongs on it, §6 asks, §7 chat behaviour). Builds on [[REQ-356]] (the plan ticket). Context: EPIC-19, CHAT-58, the Charlie's Plumbing session of 2026-10-02.

### The experiment this serves
The next test runs **with the coordinator off**: the group-chat switch on the Debug tab is off, so the client talks to the consultant on today's one-to-one path. **The coordinator must stay available.** Switching the group chat back on must give a working room with both agents, and the panel must work identically on both paths. The panel reads and writes the plan ticket, not any particular agent. (Turning the room back on for a site whose room was retired by REQ-358's migration depends on [[BUG-176]].)

### 1. Asks in the plan ticket
A new `asks` list in the plan's frontmatter (an extension to REQ-356's schema), as in DOC-65 §6:
- `id`, `prompt` (short), `why` (one line, shown to the client)
- `input`: `text | number | currency | phone | email | url | date | single_choice | multi_choice | upload`, with `options` for the choice types, and `accepts_upload` (an ask may take a document instead of a typed answer)
- `needed_by`: `first_pass | revision | prelaunch` (orders the list, never hides an ask), and `blocking`
- `status`: `open | answered | skipped | withdrawn`
- `answer`, `answer_material` (the material ticket uid of an uploaded file), `answered_by` (`client` or the agent that filled it), `answered_at`, and `withdrawn_reason`

Three ways an ask stops being open, each owned by a different party:
- **The client answers it.**
- **The client skips it:** "I don't know" or "doesn't apply".
- **The consultant withdraws it** when it is no longer needed. For example, Charlie says he doesn't want an email address on his site, so the email ask is withdrawn and he is never chased for it again. A withdrawn ask leaves the panel but stays in the plan with its reason, so a later turn does not ask again.

**Who owns what.** The consultant owns an ask's wording, input type and reason. The client owns the answer. An agent edit never overwrites an answer the client gave. When an uploaded document answers asks, the consultant fills in the related asks from it (`answered_by` = the agent, citing the material), so the client sees those questions disappear. The client can still change those answers.

The plan validator (`plan-core.ts`) enforces the schema.

### 2. The agents write asks
The plan surface gains operations to **add or edit an ask**, **withdraw an ask** (with a reason), and **fill in an ask from client material**. They are granted wherever the plan surface is granted today: the consultant, and the coordinator when the room is on. Operation text names roles, never the code names.

### 3. The client answers in the panel
A builder route lets the client **answer**, **skip**, **change an answer**, and **upload a document against an ask**. The upload goes through the existing material path (it becomes a Library item and a material ticket). The route:
- saves as the client goes, with no submit step for the panel as a whole;
- writes the plan ticket by compare-and-set, so it never loses a concurrent agent write;
- is scoped to the business and site;
- **never starts a turn.**

### 4. The panel
- **Placement.** It sits above the chat in the chat half of the screen, separated by **the same draggable divider used elsewhere in the builder**: drag either way, or collapse the panel completely. Its size and collapsed state are remembered the same way as the builder's other dividers.
- **What it shows.**
  - **A one-line phase** at the top, in plain words ("Rough first version", "Refining", "Getting ready to publish"). It is read-only and taken from the plan's existing `phase`. This is in v1 because it is cheap, and framing progress by phase fixes the "nearly done" impression (DOC-65 §5).
  - **"Needs your answer":** every open ask, with its prompt, its one-line reason, and an input matching its type, ordered by `needed_by`. There is no cap.
  - **What you've told us:** answered and skipped asks, compact, which the client can reopen to change.
  - Withdrawn asks are not shown.
- **No state of its own.** It renders the plan ticket. It re-reads and redraws when the plan changes during a consultant turn (the same moments the site pane learns of site changes), when a turn ends, and when the client opens the builder. There is no page reload, and no chat message is generated.
- When there are no asks, it shows the phase line alone.

### 5. The consultant hears the answers
The per-turn change notice ([[REQ-160]], `session-delta.ts`) reports plan answers: **which asks the client answered, skipped or changed, and the values**. It does not just say that the plan ticket changed, and it leaves out changes the agent made itself. It stays within a stated budget: values are truncated rather than dropped, and the count of changed asks is always given. Nothing wakes the consultant. Answers accumulate and are reported on its next turn, and mid-turn arrivals are picked up the way mid-turn uploads already are. In the room, the same notice reaches whichever member reads the plan.

### 6. The agents are taught the rules
This ships with the panel; without it the test measures the old behaviour.
- **[[DOC-64]]** (the system document both agents read) gains DOC-65 §6–§7. That covers asks, the panel/chat rule (only enduring facts the client can answer unaided go on the panel; judgement and variant choice stay in the chat), withdrawing asks, asking for documents rather than data entry, one topic and at most one question per post, the client's topic taking priority, meeting the client where they are, announcing the stage before going away to work, and milestone reviews. DOC-65 overrides DOC-64 where they conflict. The system landscape is regenerated (REQ-358's guard).
- **The consultant's priming** carries the core of it in a few lines: put enduring questions on the panel the moment you think of them; ask in the chat only when you are blocked; withdraw an ask when it no longer applies; one topic and at most one question per post; announce the stage before going away to work.

## Out of scope
- the panel's status sections (decided/open decisions, "the consultant is working on…")
- speaker styling in the chat (only relevant with two agents in the room)
- a room containing only the consultant (a later optimisation to trim self-talk, if the experience works)
- a recorded client position on the technical/marketing axes
- grouping or organising asks
- the final details pass ([[TODO-9]]), sensitive uploads ([[TODO-10]]) and cost ([[TODO-11]])

## Why free-coded
One coherent change: the schema, the operations, the route, the panel, the notice and the priming are each useless alone, and they land together on one branch.

## Test plan
`test_UAT_FC_<this>_*`:
- (plan) The validator accepts each input type and status and rejects a malformed ask. An agent edit to an ask's wording keeps the client's answer. A withdrawn ask keeps its reason.
- (workers; real route, D1, ticket store) The client answers, skips, changes and uploads against an ask, and each lands in the plan by compare-and-set without losing a concurrent agent write. No turn starts.
- (workers) After the client answers an ask, the consultant's next turn's change notice names the ask and the value, and an agent's own ask writes are not reported back to it. This holds with the group-chat switch off and on.
- (panel) The panel renders the phase line and the open asks with the right input per type, hides withdrawn asks, shows answered and skipped asks as changeable, re-reads when a turn's plan write arrives, and keeps its divider position and collapsed state across a reload.
- (priming) The consultant's assembled priming carries the panel rules, and the plan surface's tool manual lists the add/edit, withdraw and fill-from-material operations.

## Implementation decisions (made while building)

- **The coordinator gets the plan surface.** The ticket assumed it already had one; it did not (REQ-356 left the coordinator's plan grant out of scope, which is also why the coordinator made zero plan writes in the Charlie session). Its box now composes the plan surface with REQ-356's coordinator groups (`ReadPlan`, `KeepBrief`, `CoordinatePlan`) plus the new ask group, so switching the group chat back on gives a room in which both members can keep asks.
- **The ask operations are one new group, `KeepAsks`**, granted to both roles:
  - `set_ask` adds or edits the wording, reason, input type, options, `accepts_upload`, `needed_by` and `blocking`. It never touches an answer.
  - `withdraw_ask` takes a reason. It refuses an ask the client has answered (`ASK_ANSWERED`), because their answer stays theirs.
  - `fill_ask` fills an ask from client material and requires the material uid. It refuses an ask the client answered (`ASK_ANSWERED`), and may fill an open or skipped one.
  - The agent recorded in `answered_by` is the grant's role (`consultant` / `coordinator`), never a parameter.
  - Re-adding a withdrawn ask is refused (`ASK_WITHDRAWN`, naming the reason) unless the call passes `reopen`, so a later turn does not ask again by accident.
  - A multi-choice fill arrives as one `;`-separated string, because the declared parameter type is a string.
- **Each plan write answers the ask as it now stands** (REQ-361's "a write confirms what it wrote", merged in mid-build), not the whole plan.
- **The route is two endpoints.**
  - `GET /api/plan?site=` answers the panel's view: the phase, and the non-withdrawn asks in panel order (by `needed_by`, blocking first).
  - `POST /api/plan/ask` takes `{site, ask, action: answer | skip, answer?, answer_material?}`.
  - Both refuse a site this business doesn't hold (404). An `answer_material` must be a material in this business's store (400). An unknown ask is 404, a withdrawn one 409, and an answer the input can't take is 400.
  - An upload goes through the existing `POST /api/material` first (role `reference`), so it is a Library item and a material ticket, and its uid is then sent as `answer_material`.
  - The write goes through REQ-356's `sitePlan` port, so it is checked and compare-and-set. On `CONFLICT` the route re-reads and re-applies once before answering 409.
  - Changing an answer is answering again: the replaced value is kept as `previous_answer`.
- **The notice has its own cursor**, `plan_cursor`, on the reading session's `chat` ticket (beside REQ-160's `kb_cursor`).
  - It lists asks whose `answered_by` is `client` and whose `answered_at` is after the cursor, so an agent's own writes are never reported back to it. The cursor then advances to the newest answer reported.
  - A cold session is told every client answer once.
  - It is wired on every Worker turn, not only when a knowledge base is configured.
  - It is rendered by `plan.answers` in the consultant's reminders and `coordinator.plan_answers` in the coordinator's; the coordinator's member session has its own cursor.
  - The line reads "Your client updated N questions on the plan panel since your last turn: answered X: "v"; skipped Y; changed Z from "a" to "b"". It is bounded at 600 characters: values are cut first, the count is always given, and overflow is sent to `read_plan`.
- **The per-turn plan entry** (REQ-356's `planReminder`) also names the open asks (blocking marked), the answered values, and what was skipped.
- **The panel re-reads on a `plan_changed` stream event.**
  - The host counts completed plan writes per site at the plan port, for both members, and emits `plan_changed` after the tool call that wrote the plan, alongside `site_changed`.
  - The panel also re-reads when a turn (or a room exchange) ends and when the builder opens a site.
  - A redraw keeps an ask block whose content hasn't changed, and keeps the one the client is typing in.
- **Panel UI.**
  - Typed asks save when the field is left. Choices save when picked. A document saves once it has uploaded.
  - Every open ask has a Skip button ("I don't know, or it doesn't apply").
  - Answered and skipped asks show compactly, with a Change button that reopens the editor. A value an agent filled is marked "Taken from what you sent".
  - Phase labels: intake "Getting to know your business", first_pass "Rough first version", revision "Refining", prelaunch "Getting ready to publish", live "Live".
  - The divider is a second `webui-split` instance, vertical, collapsible on the panel's side, persisted under `site:plan-split`. Its initial split is 30%.
- **Consultant priming** gains a `plan-panel` entry, in both the with- and without-corpus orders.
- **DOC-64** gains §10, "The plan panel and the conversation", carrying DOC-65 §6–§7 and marked as overriding the earlier sections where they conflict. `asks` is added to §5's frontmatter list and to its who-writes-what table, and DOC-65 and REQ-364 are added to Related.
- **Supersession:** REQ-356's UAT `test_UAT_FC_REQ-356_the_brief_type_no_longer_exists` pinned the plan type's exact field list. It now includes `asks`, which is this ticket's deliberate extension of that schema.

## Test plan (as built)

- `tests/test_UAT_FC_REQ-364_asks_in_the_plan.test.ts` (node, Toolbox `box.run`). Covers:
  - every input type and status is accepted, and malformed asks and unfit answers are refused with the plan byte-identical;
  - an agent wording edit keeps the client's answer, and fill/withdraw refuse a client answer;
  - a document fill is recorded as the filling role, and the client can still change it;
  - a withdrawn ask keeps its reason, is off the panel, and is refused on re-add without `reopen`;
  - the notice names client answers, skips and changes but never agent writes, and stays within budget (cut values, exact count);
  - the plan entry names open and answered asks;
  - both roles hold the ask operations, and the summary manual lists them with no code names.
- `tests/test_UAT_FC_REQ-364_the_panel_answers.workers.test.ts` (workerd: real route, D1 and ticket store). Covers:
  - answer, change, multi-pick, skip and upload-then-answer all land, the upload is a material ticket, and the read draws them in order, with no model request made;
  - an answer racing an agent edit loses neither, and a foreign site, an unknown ask or a foreign document is refused;
  - group chat off: `set_ask` mid-turn raises `plan_changed`, the consultant's priming carries the panel rules, the next turn's notice names the client's answer and skip, and the agent's own fill is never reported;
  - group chat on: the coordinator holds the ask tools, both members' asks land, and each member's next round hears the client's answer.
- `tests/test_UAT_FC_REQ-364_the_plan_panel.test.ts` (jsdom, the real builder). Covers:
  - the phase line, the right control per input type, withdrawn asks hidden, and answered/skipped asks compact;
  - answers and skips reach the route as the client goes, and an answered ask reopens to change;
  - the panel re-reads mid-turn on `plan_changed` and at turn end;
  - the divider's position and collapsed state survive a remount on the same storage.