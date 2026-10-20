---
uid: comment-de4386af
id: COMMENT-5525
type: comment
title: Comment on bug BUG-233
created_by: xgd
created_at: '2026-10-20T03:32:20.570546+00:00'
updated_at: '2026-10-20T03:39:25.866960+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2fd35b1d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "54c3aa2c-1e4f-4ced-920a-d00a2fee7781",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d107ada7-b649-4fbe-a20b-6380714c70f7-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T03:31:36.142486+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d107ada7-b649-4fbe-a20b-6380714c70f7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T03:39:24.863795+00:00" -->
#### Claude
The ticket is clear. Let me look at the code.

I've marked BUG-233 as `free_coding` and cut its branch. Next I'm removing the story-board append from builder briefs and adding the new rule to the consultant's delegation guidance.

Now the code edits.

Now priming.json: rewrite the false "Builders are given both with every brief" sentence (both variants) and add the rule to `delegation-method`.

Now tests. Find any test pinning the old block, and see how existing delegation UATs drive `reportingDelegationToolbox`.

I'll write a workers UAT that builds a real board (pin → heart → offer → choose) and then delegates through the real route.

Now remove the REQ-408 `storyBrief` case.

Passing. Next I'll confirm the first test fails on the old code, so it isn't proving nothing.

Now the regression scope: REQ-408 suites, the delegation suites, and the priming suites.

Six failures. Checking them against the same files on a clean tree (the parent commit) before blaming either side.

Same six fail without my change, so none come from this fix. Restoring my work.

Typecheck is clean. Now the version and gate memories, then the commit.

Committing on the branch (staging only my files).

Now updating the ticket body to record what landed, before the merge.

Now taking the lock and merging into xgd-working.

Builders no longer get the story board appended to their briefs. A brief now reaches the builder exactly as the consultant wrote it. The fix is merged into `xgd-working` and BUG-233 is at `free_coded`; promoting it to `ready_to_reconcile` is your call.

**What changed**
- **Host:** the append in `delegate()` (`account-core.ts`) is removed outright. So are the `story` field on `WorkerLimits`, the `story:` option in `host-core.ts`, and `storyBrief()` / `STORY_BRIEF_MAX_CHARS` in `story-core.ts`, which nothing else used. There is no setting to bring the old behaviour back. The REQ-408 comment that argued for appending is replaced by one stating the new rule.
- **Consultant guidance:** the delegation method in `priming.json` gains one paragraph. When a brief asks for words on the site, the consultant quotes the client's chosen headline and the notes it needs, word for word, and says they are the client's own words. Otherwise it leaves the board out.
- **A false sentence fixed:** the story-board section of the consultant's priming said "Builders are given both with every brief". That stopped being true, so in both priming variants it now reads: "The board is yours: a builder sees the client's words only when you quote them in its brief."

**Tests**
- I added `tests/test_UAT_FC_BUG-233_briefs_carry_no_story_board.workers.test.ts`. It runs through the real routes and builds a real board first: pin notes, heart one, offer headlines, choose one. It has three cases:
  - A logo-resize brief reaches the builder with none of the board in it.
  - A brief that quotes the client arrives intact, with the headline appearing exactly once.
  - The consultant's priming contains the new rule.
- Both delegation cases fail on the old code, so they are testing the change.
- I removed the REQ-408 test case for `storyBrief`, since that function is gone; the commit message says so.
- Across 36 test files (REQ-408, the delegation and priming suites, and related tickets), 264 tests pass and 6 fail, in REQ-295 and REQ-342. The same 6 fail on the commit before my change, so none come from this fix.

I updated the ticket body with a "What landed" and "Tests as landed" section and kept your original text. The ticket records two commits: the fix (`9c0b1f18`) and the version bump the gate added (`c3ea6fc7`).

<!-- xgd-chat-end -->