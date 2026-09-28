---
uid: comment-d0ca10c4
id: COMMENT-4189
type: comment
title: Comment on request REQ-342
created_by: xgd
created_at: '2026-09-28T16:55:51.496880+00:00'
updated_at: '2026-09-28T17:02:02.266862+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cbae2ec3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8a03c850-bb13-44c8-8a8a-de8920c19c7a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="895e2a1f-d697-4a95-bb8c-75e05deea3ab-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T16:54:47.057014+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="895e2a1f-d697-4a95-bb8c-75e05deea3ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T17:02:02.097720+00:00" -->
#### Claude
I've read REQ-342, DOC-60, the epic, and the code it touches (`priming.json` `templates/delegation-method`, `roles.ts` `delegationMethod`/`DELEGATION_METHOD_PROVIDER`, the consultant's `reminders` tier, and the REQ-339 suite as the style precedent). One blocking question, then some decisions I'm happy to take myself.

## The blocker is real, and it's two hops deep

REQ-342's own Dependency section says it's blocked on the diff provider. I checked:

- **REQ-340** (the diff provider, ours) — `draft`, no code.
- **BUG-71** (the upstream hook it hangs off, `lagrange-framework`) — `draft`, no code. The installed store's `delegation_surface.json` `shapes.result` carries `summary / changed / decisions / checks / accepted` and nothing host-derived; `delegation_toolbox.js` `_result()` has no account field to put a diff on.
- **`delegation.json` has `enabled: true`** — so this prose is live prose, not a dormant template.

So behaviours **2** ("the result carries a structural diff … the diff is not the worker's word") and **3** ("what the diff cannot settle") would, if written today, tell a live consultant to read a field that does not exist and to *stop re-inspecting the site on the strength of it*. That's worse than the current prose, not better.

Behaviours **1** (commissioning, not choosing), **4** (per-turn tail entry) and **5** (no model/backend/price) have no dependency on the diff at all — and 4 is the actual measured F4 defect: the method sits at priming entry [2] of 7 and none of the nine reminders mentions delegation.

## The question

Which do you want:

- **(A) Split — my recommendation.** Land 1, 4, 5 now; narrow this ticket's body to them and move the diff paragraphs (2, 3) onto REQ-340, which is where the diff's existence is established anyway. Gets the standing-behaviour fix — the one that makes the consultant actually delegate — out now instead of behind a cross-repo dependency, which is the same argument DOC-60 makes for shipping ticket 3 before ticket 2. Cost: whoever lands REQ-340 edits `delegation-method` a second time, which is a few paragraphs.
- **(B) Hold.** Do nothing until REQ-340 lands, ticket honoured exactly as written.
- **(C) Write it all now**, accepting that the consultant is told about a diff for however long REQ-340 takes. I'd advise against this while `enabled: true`.

## Decisions I'll take myself unless you object

- The tail entry gets its **own provider** (`delegation.reminder`), not a reuse of `delegation.method` — so it renders `null` with the switch off and the rollback stays byte-for-byte, exactly as `delegationMethod` already does. One short line in the tail, the full method stays in the cached prefix.
- Prose lives in `priming.json` `templates`; `roles.ts` contributes the accessor and the condition only — the split that file already keeps everywhere.
- UATs in the shape of `test_UAT_FC_REQ-339_a_worker_is_told_to_act.test.ts`: assert against text read back out of `priming.json`, never against a constant holding a copy.

Say A, B or C and I'll cut the branch and go.

<!-- xgd-chat-end -->