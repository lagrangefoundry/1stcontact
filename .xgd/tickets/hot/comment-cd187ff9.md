---
uid: comment-cd187ff9
id: COMMENT-6244
type: comment
title: Comment on request REQ-629
created_by: xgd
created_at: '2026-11-01T22:39:12.379711+00:00'
updated_at: '2026-11-01T23:05:15.804266+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f52d99b8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "aaa33e1c-c5fa-4840-8ba1-540376035147",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d8f3b3be-2dfb-4b73-8afd-1d5e6837460a-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T22:37:15.355925+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d8f3b3be-2dfb-4b73-8afd-1d5e6837460a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T22:48:07.980068+00:00" -->
#### Claude
Reading the ticket: it asks for an inventory and a proposed list of cuts, reviewed with you before any text changes. I'm finding the budget UAT so I can measure.

I'm writing a temporary probe test (not to be committed) that captures the consultant's real first request, so the inventory uses measured sizes per section and per tool.

Tool schemas are built from our `*-surface.json` declarations by the framework, so I'll keep the cuts inside our own JSON. I'm totalling the cost per surface, overview text plus its tools.

I have the inventory data. Before drafting the proposal I'm checking DOC-70, the prompt audit, for its list of stale and contradictory text.

I haven't changed any prompt text yet. The ticket says the inventory and proposed cuts go to you first, so they're on REQ-629 for you to review. It stays at `draft` until you agree a set of cuts.

**Where it stands:** I measured the consultant's prompt on clean `xgd-working` by replaying the REQ-466 test's request and capturing what the model was sent. It is **219,329** characters (about 80k of system text and 139k of tool definitions) against the 205,000 target. Reaching ~190k means cutting about 29k.

**What I found:**
- **Host-enforced rules save less than the ticket expected, about 4.9k.** BUG-323 (menu button) and REQ-622 (layout checks) have no text in the consultant's prompt at all; theirs is in the builder's priming. Most of the BUG-322 text is in `set_stage`'s description (2.4k) and two paragraphs of the plan manual.
- **Repeated text is the bigger saving.** For example, the rules for `after` (driving a page before taking its picture) are written five times. The schema for naming a picture is written out three times, at 4.6k each: twice in `compare`, once in `screenshot`.
- **Most of DOC-70's findings no longer apply.** It predates REQ-473's new priming. Still live: the duplicated `compare` schema, the `capture_site` private-address paragraph, `record_check_answer` still calling the consultant "alice", and builder-only manual text being sent to the consultant.

**Proposed cuts:**

| | What | Saves |
|---|---|---|
| P1 | Host-enforced rules down to one line each | ~4.9k |
| P2 | Say each thing once, in the place it's used | ~8.3k |
| P3 | Shorten the shared picture schema (also shrinks the builder) | ~6.5k |
| P4 | Stale text | ~1.5k |
| P5 | Rarely needed reference (drawing craft, layout catalogue, capture detail) moved to the system knowledge base | ~4.5k |
| | **P1–P5 together** | **~25.7k, to about 193.6k** |

So P1–P5 alone land just short of 190k.

**Questions before I start:**
1. **Do you agree P1–P5 as written on the ticket?** Drop any item you don't want.
2. **P6, a grant change: do you want it?** It means taking `compare`, `AgentContext`, `AgentPriming`, `AgentReminder`, `TicketComments`, `TicketBacklinks` and `TicketHistory` away from the consultant and the talker; the builder keeps `compare`. DOC-70 recorded one `compare` call ever and none for the others. It saves about 15k (to ~178k), but it removes tools rather than trimming text, and two tests (REQ-283 AC3, REQ-228) would need revising. Without it, I'd look for about 4k more in the second-wave items.
3. **New target:** OK to set it to the measured size plus about 2,000?
4. **Framework text:** about 3–5k more needs lagrange-framework changes. That is the delegation manual (3.2k, which repeats "Commissioning construction") and builder-only manual text the consultant is sent. Should I file a ticket in that repo? I won't change code there.

<!-- xgd-turn id="a786235c-d149-4584-b7b2-030b728628d4-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T23:05:13.706136+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-chat-end -->