---
uid: comment-cc05546b
id: COMMENT-5369
type: comment
title: Comment on request REQ-403
created_by: xgd
created_at: '2026-10-17T15:33:48.669011+00:00'
updated_at: '2026-10-17T15:56:34.967149+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d3825c8a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1d2493d3-5cb8-4574-9788-9e5862aca3d0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b9e1451f-3ef6-4805-a370-7b882c14f946-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:33:04.654824+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b9e1451f-3ef6-4805-a370-7b882c14f946-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T15:39:27.092484+00:00" -->
#### Claude
Reading the ticket and the existing REQ-399 §4 code it replaces; next I'll map the preview, plan-panel and chat code.

Still mapping: looking for how the upstream SessionManager records turns, so the stock opening can be written as a real assistant turn without a model call.

Confirmed `postTurn(..., {role:'assistant'})` folds as a genuine assistant turn. Now checking the Anthropic backend builds a valid message list when the history starts with an assistant turn.I've mapped all three panes. Most of this I can decide myself, but one requirement conflicts with how the panel works today, so I need your call on it before I start coding.

**Question: the "Sites we're comparing" board.** On a new plan, the comps board (REQ-378/401) is an open item, and it's drawn in the OPEN QUESTIONS section from the start. So even with zero questions, OPEN QUESTIONS has something in it, and its heading shows. The headings already hide when their section is empty, so this board is the only thing stopping "neither heading shows at the start". I see three options:

- **(a)** Hide the comps board until the plan has at least one ask, or the board has entries or has been settled. Then nothing shows at the start. This is my recommendation, because it matches what the ticket asks for.
- **(b)** Keep the board visible from the start, and accept that OPEN QUESTIONS shows with it in it.
- **(c)** Show the board from the start, but outside both sections, with no heading, until it has entries.

**Decisions I'll make unless you object:**

1. **The opening is recorded as two turns, not one.** The upstream library builds the model's history window from the first *user* turn (`recentTurnPairs` in lagrange-framework). A conversation that starts with an assistant turn would have that turn dropped, so the model would never see the opening.
   - So clicking the button records a hidden cue as a user turn, then the stock text as the assistant turn, using upstream's existing `postTurn`. There's no model call and no spend.
   - The client sees only the assistant turn; REQ-399's existing filter already hides the cue. The model always sees the pair.
   - This needs no change in lagrange-framework.
2. **A new `POST /api/ai/opening` route replaces the `opening: true` branch of `/api/ai/prompt`.** It returns the recorded turn as JSON, or 409 if the conversation has already started. The pane then types the text out itself and shows the composer when it finishes. REQ-399 §4's prompt-driven opening and its tests are replaced, not kept alongside.
3. **"Nothing built yet" means the site still holds only the untouched starter page.** I'll keep seeding the starter, because a site with zero pages risks breaking publish, render and the editor. The server reports that state; the preview shows the grey "Your site will appear here as it's created." panel, and publishing is refused while it holds. `STARTER_HEADING` also becomes "1st Contact" spelling wherever it can still surface.
4. **"All done…" is deleted everywhere.** With no open asks, the count line is simply hidden. The REQ-379 UAT that asserts "All done" at zero gets rewritten to match.

Once you've chosen a comps option, I'll write these decisions into REQ-403's body, set it to `free_coding`, cut the branch and build it.

<!-- xgd-turn id="2020a3c3-8aa5-4502-a0bb-a15231981e34-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:56:34.829802+00:00" -->
#### You
The comps board is an "OPEN QUESTION" it should be treated like all the others. It should not appear until triggered by the AI

<!-- xgd-chat-end -->