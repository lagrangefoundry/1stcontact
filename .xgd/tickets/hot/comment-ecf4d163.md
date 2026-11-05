---
uid: comment-ecf4d163
id: COMMENT-4860
type: comment
title: Comment on bug BUG-185
created_by: xgd
created_at: '2026-10-03T22:32:45.740283+00:00'
updated_at: '2026-10-03T22:46:07.396562+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5ed3855e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "528d1c80-c1b9-464c-a4c4-d6a629b9ecc2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5580f5a5-2a4c-4164-9408-2baea74cc305-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:30:58.484070+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5580f5a5-2a4c-4164-9408-2baea74cc305-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T22:46:05.239339+00:00" -->
#### Claude
Reading the project KB code; now tracing how the session's KnowledgeGet corpus is populated.

Scope is clear; no blocking questions. Updating the ticket, then cutting the branch.

Editing `CoRankedKnowledge` in the branch worktree.

Now the UAT. Checking the scripted model client's API.

Writing the view change in `knowledge.ts`.

Using a targeted predicate in `get` rather than loading every comment, since a chat ticket's comments include its whole transcript.

Now wiring the view into the session's project runtime.

Now the UAT. Checking how the REQ-173 suite drives a real upload, so the material carries a genuine `material_text` comment.

Writing the UAT file.

Running the new UAT in the worktree.

Both pass. Confirming they fail without the fix (reverting source only, then restoring).

Fails on the fence assertion first. Checking the read assertions also fail independently on unfixed code.

The exact reported `not_in_corpus` reproduces. One more check: with only the disclosure fix and no text view, the read should return the digest and fail the `Bennett Mill` assertion.

Each half of the fix is now independently pinned. Running the regression scope.

All 81 pass. Running the type and lint checks.

Typecheck clean (no ESLint in this repo). Bumping the version and committing.

Following the recorded recipe: commit without a manual bump, merge back, and let `move-to-free-coded` bump the version itself. Committing now.

Merged cleanly. Moving the ticket to `free_coded` and letting the gate bump the version itself.

Ticket is at `free_coded` (version 0.2.458, two commits). The fix grew a second half after I wrote the body, so I'm updating the body to match what actually landed.

BUG-185 is fixed and the ticket is at `free_coded`. The new tests pass and the related knowledge suites still pass (81 tests). I didn't need to ask you anything first.

There were two bugs, and the second only showed up once the first was fixed.

**1. Search found the document but `KnowledgeGet` refused it.** The chat session's knowledge is opened once and kept, and `KnowledgeGet` only accepts uids it has on record. The shared knowledge component adds every uid a search returns to that record. Our own search, which merges results from the project and system knowledge bases, skipped that step. So anything uploaded after the session started could be found but not read, which is exactly what you saw. The same code had also skipped three other things the component does to each result:
- **Untrusted marking:** results were not marked as client data (`<<<untrusted>>>`), so client documents reached the model as if we had written them. This is a security gap, and the fix closes it.
- **Turn references:** search hits from conversation transcripts were not tagged with the turn they came from.
- **`doc` filter:** `KnowledgeChunkSearch` ignored its "search inside this document" parameter.

**2. Even when let through, `KnowledgeGet` returned the generated description, not the document.** Since REQ-173, an uploaded document's ticket holds a short AI description, and the full text is stored separately in a comment. Search used the full text but reads used the description. So reading the whole document gave the same thing `get_library_item` gives, and reading the exact passage a search hit pointed to failed with `bad_range`.

**The fix:**
- Our merged search now runs its results through the shared component's own handling instead of re-implementing it. That fixes the refusal and the three skipped steps (`session-knowledge.ts`).
- Search and reads now both use the full document text (`knowledge.ts`). It is looked up fresh on each call, so a document uploaded mid-session reads in full on the turn it is found.

**Tests:** `tests/test_UAT_FC_BUG-185_search_hit_is_readable.workers.test.ts` uploads a document after the session has already taken a turn, then:
- searches for it and reads it whole, getting the full text;
- runs a passage search and reads the exact passage it points to.

On the old code both tests fail with `not_in_corpus`. With only the first fix applied, they fail on the description-only read and on `bad_range`. The type check is clean.

**Ticket:** two commits are recorded, the fix and an automatic version bump to 0.2.458, at 3 story points. The branch is merged and cleaned up, and the ticket body now describes what actually landed.

The full-text lookup is a temporary workaround in our code. The proper fix is a change in lagrange-framework so its search indexing reads the stored text itself; the code comment says to delete the workaround once that lands.

<!-- xgd-chat-end -->