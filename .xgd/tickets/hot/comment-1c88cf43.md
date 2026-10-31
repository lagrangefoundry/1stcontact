---
uid: comment-1c88cf43
id: COMMENT-5768
type: comment
title: Comment on request REQ-472
created_by: xgd
created_at: '2026-10-27T15:35:38.576173+00:00'
updated_at: '2026-10-27T15:46:17.390462+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-742ca7af
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "290ec445-a4e6-4e64-99f8-ce7ebdb08549",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="45ca71e4-d8b7-4be0-8723-a0b86d64e1c8-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T15:33:24.453459+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="45ca71e4-d8b7-4be0-8723-a0b86d64e1c8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T15:46:13.552320+00:00" -->
#### Claude
Reading the KB build pipeline before scoping: the system KB is exported from `doc_kind: system_kb` doc tickets, so the motion reference will likely be a new doc ticket plus a regenerated index.

Planning the UAT: export the real `system_kb` tickets into a temp corpus, build it with the stub embedder, and search it. Checking how the existing suites call search.

Now reading the source material: DOC-72 (the survey) and DOC-71 §12.9.

Writing the reference. It's addressed to the Site consultant, names examples by what they show, and leaves out sizes, URLs, the register and citations.

DOC-74 created (it landed on xgd-working directly, which is fine for a ticket). Now the UAT; checking the worktree setup notes first.

Visible. Writing the UAT, modelled on REQ-123's toolbox search and REQ-358's priming walk.

The first ID in the result is probably DOC-74's own snippet mentioning DOC-72. Checking the result shape.

It is the top hit; I'll read the `uid` field instead of the first ID in the text.

No ESLint in this project, and vitest compiled the file. Checking the version-bump and promotion steps for this repo.

Removing any debug leftovers, then committing the UAT.

Now updating the ticket body (keeping the existing content, adding what landed) before merging back.

Merging back with the retry loop from the promotion notes (fast-forward, bump at the tip).

Moved to `free_coded`. Running the overlay rematerialise check the merge step calls for, then story points and cleanup.

REQ-472 is done: the motion reference is in the Site consultant's knowledge base, and the ticket is at `free_coded`.

**What I built**
- **DOC-74, "Motion and finishing touches: the Site consultant's reference"**, about 7K characters, marked `doc_kind: system_kb`. That marker is what `1c kb export` uses to put a document into `kb/system/`. It's written to the Site consultant in five parts:
  1. how to offer the signature effect, by cohort;
  2. the 11-pattern catalogue;
  3. the four taste tests;
  4. the don'ts, one line each;
  5. the clip-making rules, including the extra-pepper lesson.
- Examples are named by what they show (e.g. "a loch that barely moves under a hotel"). It leaves out site names, file sizes, the site register, citations, WCAG and the product implications.
- It isn't in the always-on priming. `priming.json` is unchanged, so the BUG-129 budget is too. The consultant finds it by searching.

**Tests**
- `tests/test_UAT_FC_REQ-472_motion_reference.test.ts` has three UATs, and all pass:
  - It indexes the real system corpus (with the test stand-in for the embedding model) and runs the consultant's own search. DOC-74 must be the top hit for "living photo", "hero video" and "finishing touches".
  - The document contains the five parts and none of the survey material listed above.
  - Priming doesn't carry it.
- REQ-358's check `every_document_priming_names_is_in_the_system_kb` fails, but not because of this work. Priming already names DOC-70, which isn't a `system_kb` document, and I didn't change priming.

**Commits**
- `2955d8d8` (the UAT) and `1d00375b` (version 0.2.675) are merged into xgd-working. The branch is cleaned up, story points are set to 2, and I added a "What landed" section to the ticket body.

**One step before the live Site consultant can find it:** `kb/system` is a local build artefact and isn't committed. The next `bin/build` (via `1c kb ensure`) will index DOC-74, or you can do it now with `bin/kb-release` from the main checkout. In the sandbox that needs `NODE_USE_ENV_PROXY=1` and the `1c_Admin_Token` credential. I haven't rebuilt the shipped index.

**Decision for you:** I didn't name DOC-74 in priming, because the budget is almost full. Until the DOC-71 stage guide exists, the consultant only reaches it through a search or the generated KB map. If you want an explicit "read DOC-74 at finishing touches" line, I'd have to pay for it by trimming other priming text.

<!-- xgd-chat-end -->