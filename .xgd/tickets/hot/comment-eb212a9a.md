---
uid: comment-eb212a9a
id: COMMENT-4879
type: comment
title: Comment on request REQ-379
created_by: xgd
created_at: '2026-10-04T01:23:12.830737+00:00'
updated_at: '2026-10-04T01:47:54.858531+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-77b12a80
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "33f85692-55e4-4470-86d0-2692c9273e94",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d72225ec-14ed-475c-846b-ec0d4147c831-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T01:22:19.011748+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d72225ec-14ed-475c-846b-ec0d4147c831-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T01:47:54.745945+00:00" -->
#### Claude
Reading the ticket and mapping the plan/panel/Delegate/digest code before implementing — the ticket is fully specified, so no blocking questions yet.

Branch `free-REQ-379` is cut; waiting on two code-mapping agents (panel/asks UI and Delegate/digest/publish) before designing the changes.

Copying the gitignored generated build artifacts into the worktree so the workers suites can run there.

Requirement 1 (panel progress line) is in; now waiting on the Delegate/digest mapping to design requirements 2–5.

Writing the UAT for the panel progress line while the second mapping agent finishes.

Now wiring the seeded features ask into `seedPlan` and syncing answers into `functionality`.

Requirements 1 and 6 are in and the plan suites pass (60/60); still waiting on the Delegate/digest map for requirements 2–5.

Tracing the delegation hook the host already has (`draftAccount`) to see where a builder session's start and finish can be observed.

Checking whether the framework's stream reports a tool call before it runs, which decides how the "announce before going quiet" line can be delivered mid-turn.

Design is settled (backend-stream wrapper for the announcement, plan-stored milestones for the digest); now checking the outcome constants before writing the cadence module.

Cadence module written (announces the first `Delegate` of a turn and records completed builder sessions); now wiring it into the host and the Delegate declaration.

Adding the Publish milestone to the publish route (best-effort, never blocks a publish).

Writing the end-to-end workers UAT for the announcement, milestones, stale phase, Publish and the features ask.

The plan's milestones weren't persisting — the store only keeps declared keys. Adding `milestones` to the storage key list and the ticket type pack.

Full suite: 81 failures across 43 files — many are likely pre-existing or worktree artifacts. Triaging the delegation/plan ones first, since those touch my change.

Most failures are pre-existing on clean `xgd-working` (REQ-295 delegation ones included). Four are mine: three REQ-356 plan tests and possibly BUG-134 — checking those now.

Updating the ticket body (existing requirements kept; implementation and design decisions appended) before committing.

Merge of `xgd-working` into the branch hit conflicts (others landed plan changes meanwhile) — resolving them now.

Merged state typechecks and the REQ-379 suites pass (9/9) along with the neighbouring plan and delegation suites. Committing the merge and fast-forwarding `xgd-working`.

Free_coded with the auto version bump (0.2.475). Tearing down the branch.

REQ-379 is implemented, merged into `xgd-working` and at `free_coded`. The commits are `1fc49e82` plus an automatic version bump to 0.2.475. The ticket body keeps your original requirements and adds sections on what was built and the design decisions.

**What the client and consultant now see**
1. **Panel progress line.** Directly under the "Getting to know your business" line, the panel shows "3 questions still to answer" (or "1 question"), and "All done — thanks, that's everything I need for now." when nothing is open. Skipped and withdrawn questions don't count. It updates when an answer saves and when the consultant adds a question mid-turn.
2. **Announce before going quiet.** `Delegate` now requires a `note` for the client. The first `Delegate` in a turn shows that note in the chat before the builder starts, so it streams ahead of the work. It is saved as the consultant's own words, so it stays in the transcript. If the model leaves the note out, a fallback sentence is shown instead.
3. **Pointer to the panel.** When questions are open, the same line adds "Meanwhile, N questions above need you.", using the same count as the panel.
4. **Milestones fall due.** The host now records three moments on the plan itself:
   - The first builder session that reports and actually changed the site marks the first pass complete.
   - Each later one counts as a revision round.
   - The first press of Publish marks the pre-publish checks due.
   The checks those moments trigger are marked due. The consultant's per-turn plan summary then says `Due: ask the client "Are we all happy with the layout?" …`. Asking or answering a check clears it.
5. **Stale phase.** When the plan's phase is behind what the build shows, the per-turn summary says so and tells the consultant to move it on with `set_phase`.
6. **Features first.** New plans start with a multi-select "Which of these does your site need?" question. Its options come from a new 13-item feature list in `plan-seed.json`. Answering it fills the plan's feature list, and changing the answer updates it. Existing plans don't get this question.

**Decisions I made that you may want to check**
- **The consultant can now ask checks, record the client's answer and move the phase.** These three operations were coordinator-only. With the group chat off there is no coordinator, which is why the phase never moved in Finding 18. They are now in a new group both roles get.
- **There was no feature catalogue in the code**, so I wrote the 13-item list myself. Please review the wording.
- **"Publish opened" means pressing Publish**, because the builder has no publish dialog. It fires once per plan, not on every republish, and never blocks the publish.
- **The status line appears once per turn.** A second hand-off in the same turn isn't announced again.

**Tests**
- Two new test files with 9 tests, all passing. They drive the real routes, database and builder handoff; only the model is faked.
- I updated older tests that conflicted with the new behaviour: 11 files that called `Delegate` without a note, and the REQ-356 and REQ-364 checks that assumed "a new plan has no questions" or "the consultant can't record check answers".
- Full suite on the branch: 81 failures before my fixes. I re-ran the failing files after fixing my regressions and again on clean `xgd-working`. Apart from 2 `copy-to-cloud` (BUG-134) cases that fail in the branch copy because a temp folder is missing there, every remaining failure also fails on clean `xgd-working`, including 3 existing delegation (REQ-295) failures. None of them comes from this change.
- Merging the latest `xgd-working` into the branch hit one conflict, an import list in `router.ts`, which I resolved. The merged state typechecks and the plan and delegation tests pass.

The ticket is at `free_coded`; promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->