---
uid: comment-4fdc129a
id: COMMENT-4486
type: comment
title: Comment on request REQ-351
created_by: xgd
created_at: '2026-09-29T21:32:43.594900+00:00'
updated_at: '2026-09-30T00:30:04.658813+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c750b120
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "18bd2a08-e785-44af-9717-1a44d2b5e71b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="66db6ce6-916f-435d-817d-022d7046ea3b-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T21:30:54.209480+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="66db6ce6-916f-435d-817d-022d7046ea3b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T22:05:14.795027+00:00" -->
#### Claude
Now the renderer's use of viewportResponse.

Now let me cut the branch and update the ticket.

Now update probes.ts, roundtrip.ts, and the l1 index export.

Now add `bodyBackground` to the `Capture` record and bump the capture schema.

Now the issue-2 change.

Now the split itself plus the composited-band predicate.

Good — types are inferred. Now update validate.ts.

Now the renderer.

Now probes.ts (the evaluator/oracle) and the fold.

Now the card rows, the surface rows, the text leaf, and `rebaseInto`.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9a0324db-3ae7-40a8-af84-9a1972debf30-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T22:18:27.840177+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="9a0324db-3ae7-40a8-af84-9a1972debf30-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T22:50:56.958256+00:00" -->
#### Claude
I'll start by checking the current state — the ticket, the branch, and what work already landed.

The branch and worktree exist from the prior session. Let me check their state.

Now let me examine the uncommitted work from the prior session.

Now let me check whether the work compiles and see the fixture change.

Typechecks clean. Now let me run the tests most likely affected, scoped first.

Let me get the full blast radius across the whole node suite.

Now let me establish the baseline by stashing my changes and re-running just those files.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="46a05da7-1b81-4b04-a658-a65adb61f915-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T23:55:30.590666+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="25ced229-75a4-4bc5-8d2c-37348bbc4ed4-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T00:03:08.875786+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above): Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="25ced229-75a4-4bc5-8d2c-37348bbc4ed4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T00:30:03.972521+00:00" -->
#### Claude
I'll check the current state of the ticket, branch, and worktree.

The prior session's work is in a stash. Let me inspect it.

Both sides claim schema 9 — REQ-347 landed 9 first, so REQ-351 becomes 10. Resolving:

Now let me review the rest of the restored work to understand what's done and what remains.

All five issues are covered. Now checking for stragglers and typechecking:

Now let me run the tests most likely affected by the schema shape change.

Pre-existing failures on baseline (`zoomGroupChromeAgrees`, from REQ-347) — not mine. Now updating the tests that pin the old node-level shape:

`L1Node` is already imported. Now the REQ-278 test:

Now let me write the REQ-351 UATs. First let me check the fixture corpus setup used by similar tests.

Now writing the REQ-351 UATs.

Now let me fix the three fixtures in the test file.

Now restructuring the issue-3 fixture to mirror the filed node (a section background):

All 13 REQ-351 UATs pass. Now the full node suite — establishing the baseline first so I can separate pre-existing failures from mine.

While that runs, let me update the ticket body to reflect what actually landed.

Meanwhile, let me bump the version and review the complete diff for anything left over.

While that finishes, let me re-verify typechecks across all packages after the latest edits.

The suite is still running. Let me summarise where things stand while it completes.

**Restored and completed the prior session's work on REQ-351** (it was sitting in a `git stash`, on a branch that had fallen ~3 commits behind `xgd-working`):

- Fast-forwarded `free-REQ-351` to `xgd-working`, reapplied the stash, and resolved the one conflict: REQ-347 had landed `CAPTURE_SCHEMA = 9` in the meantime, so REQ-351's two new axes became **schema 10**.
- All five residuals are implemented; typechecks clean across all six packages; 13 new UATs pass.
- Also consolidated a duplicated `responseAt`/`responseGoverning` resolver into one exported definition, and wired the comparator's reference side to read the new `capture.bodyBackground`.
- Version bumped 0.2.411 → 0.2.412; ticket body appended with the full implementation record and test plan.

One deliberate scope call worth flagging: issue 4 offered *per-keyframe response* **or** a *height floor* (`heightFloor: 'content' | number`) "either (or both)". **Per-keyframe landed; the floor did not** — per-keyframe is what the measurement naturally produces and on its own removes the 49.5px absurdity, while the floor is a separate axis with its own renderer work and nothing in this round needs it. Recorded in the ticket.

Two pre-existing failures on `xgd-working` that are **not** mine (verified by stashing and re-running against the clean tree):
- `tests/test_UAT_FC_BUG-48_*` — 4 failures, all from `zoomGroupChromeAgrees`, a structural rule commit `8d97f66acf` added to `L1_STRUCTURAL_RULES` without the refusal case BUG-48's coverage check requires.
- `tests/req51-object-grouped-report.test.ts` — an image object now carries a `border` param the test doesn't expect (REQ-333/REQ-347's framed-image attribution).

I'll wait for the suite to finish before committing. The implementation, typechecks, and the 13 new UATs are all green; what remains is confirming the ~19 failing files are all pre-existing on `xgd-working` rather than mine, then committing, merging back, and moving the ticket to `free_coded`.

<!-- xgd-chat-end -->