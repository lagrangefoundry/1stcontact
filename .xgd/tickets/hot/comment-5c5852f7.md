---
uid: comment-5c5852f7
id: COMMENT-2280
type: comment
title: Comment on request REQ-188
created_by: xgd
created_at: '2026-09-05T20:20:02.227587+00:00'
updated_at: '2026-09-05T20:30:46.538070+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b0abafbf
  kind: chat_transcript
---

<!-- xgd-turn id="e2a22217-b53e-4175-acf7-f62cbb4f5982-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T20:19:15.692496+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e2a22217-b53e-4175-acf7-f62cbb4f5982-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T20:30:45.493492+00:00" -->
#### Claude
Now update the panel to use it.

Now the origin-side design record in `people.ts`.

Now update the REQ-186 UI assertion that pinned the old label, and write the REQ-188 UATs.

Now the regression scope around identity/people/terms.

Implemented and landed. REQ-188 is at `free_coded`, commit `59b983957f` merged into `xgd-working`.

**What changed**

- **New `apps/control-app/src/builder/people-state.js`** — the single definition of the three states (`Contact` / `Invited` / `Member`), derived from `invitedAt` and `termsAcceptedAt`. Its own dependency-free module so the same function is reachable from the browser panel *and* from a workers test running against real rows; `builder/people.js` re-exports it rather than keeping a copy. `termsAcceptedAt` is tested first, so someone who signed up without ever having been invited by this business still reads as a member.
- **The tab** — rows carry one of three labels; the facet is built from `PERSON_STATES` so a state a row can display can never be one the filter cannot select.
- **The invite dialog** — reports *"… is invited"* / *"… was already known here, and is now invited"*, and the hint now says they become a member when they sign in and accept the terms. Leaving that sentence saying "member" would have kept the old model alive in the one place an operator reads.
- **Design record rewritten** in `people.ts` and `builder/people.js`; **DOC-42 §4, §4.1 and §9 amended** (three states in the relations table, the two markers and the two parties that write them, the `tos_accepted_at`-not-`first_seen_at` reasoning, and a strengthened §9 falsifier).
- **Two REQ-186 UATs adjusted** where they pinned the old label — one asserted `['Member','Member']` after an invite and now asserts `['Invited','Invited']`; two names that said "as a member" no longer do.

**Evidence** — 10 new UATs. The workers suite drives *both* transitions through real routes inside workerd against real D1: `POST /api/people/invite` with an owner's Access token, and `POST /api/terms/accept` with the person's own; nothing stamps `tos_accepted_at` by hand on the path under test. It also pins why the marker is that column and not `first_seen_at`, by driving a request the terms gate refuses and observing `first_seen_at` set, acceptance null, state still `Invited`. The jsdom suite mounts the real webui components and proves the labels, the facet, the invite ceiling and the no-operator-action transition.

Two pre-existing failures on `xgd-working`, unrelated to this diff and left alone: `bug32-webui-scope-rebrand` (two files restating the scope) and a `tsc` error in `session-knowledge.ts` re-exporting `SHIPPED_SOURCE`. Both reproduce identically without my changes.

One judgement call worth flagging: an invited-but-unentitled person still cannot reach `/api/terms/accept` at all, so at level 2 nobody can currently cross Invited → Member. That is DOC-42 §10.1's admitted-but-unentitled gap, which your ticket explicitly scoped out — the tests work around it by giving the accepting person an entitlement.

<!-- xgd-chat-end -->