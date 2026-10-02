---
uid: request-5776c96e
id: REQ-364
type: request
title: 'Builder: a plan panel above the chat, where the consultant''s questions wait
  for the client'
created_by: EPIC-19
created_at: '2026-10-02T21:02:05.849959+00:00'
updated_at: '2026-10-02T21:02:05.849959+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-95bc3b15
  story_points: 13
  auto_merge_back: true
  needs_review: false
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
