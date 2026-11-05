---
uid: comment-4ec4f4e0
id: COMMENT-5630
type: comment
title: Comment on request REQ-459
created_by: xgd
created_at: '2026-10-25T18:58:41.483214+00:00'
updated_at: '2026-11-04T19:02:49.868061+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5ef628c4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8a29390d-fbc1-4e9f-9fe7-60845e231e51",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e5853924-fdc7-44f1-b531-3dbfafaab527-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T18:57:03.926470+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e5853924-fdc7-44f1-b531-3dbfafaab527-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T19:20:38.903633+00:00" -->
#### Claude
Reading the chat pane code to find where the per-step working note is written into the transcript.

Still tracing: the host sends the step note only as a `progress` frame, so the italic chat line probably comes from the consultant's own text. Checking the priming next.

Checking what a `Delegate` result reports, so the end-of-turn line can say if work ended early.

Next: how a workers UAT reads a reopened conversation's transcript.

Writing the design into the ticket, then cutting the branch.

Worktree ready. Checking where the cadence exports are used before changing them.

No priming text describes the note as chat text, so the parameter descriptions are the only model-facing change. Editing `cadence-core.ts`.

Now the wrapper loop: track hand-offs and record the summary at round end.

The failed-hand-off bookkeeping I just wrote is muddled, so I'm replacing it with an explicit per-hand-off state.

Host side done. Type-checking.

Typecheck clean. Now the chat pane's live line in `chat.js`.

Chat side written. Reading how the BUG-245 jsdom suite drives a turn, to model the new UAT on it.

Writing the jsdom UAT.

The line isn't attached yet. Debugging whether the frames reach it.

The stream is throwing. Logging the error temporarily.

A local `working` flag in `unwrapped` shadows my option. Renaming the option to `workLine`.

jsdom UAT passes. Now the workers UAT through the real routes, modelled on the REQ-379 suite.

Both steps came back but the round was judged "early", so the round-end status isn't the value I assumed. Checking what the backend's `done` carries.

Checking whether any AC references the REQ-379 UAT names I renamed.

No AC links the old names, so the renames stand. Running the related suites: BUG-244/245/257/265/215, REQ-390/431/436 and the delegation suites.

Long path filters find nothing (a known vitest quirk), so I'll pass short ticket-id filters instead.

Several failures. Getting a baseline from the main checkout, which has none of my changes.

Every failure but two is already red on clean working. The new ones are `REQ-416_talking_while_it_builds` and `BUG-247`, both chat-pane suites, so they're mine. Looking at them.

Related suites now match the baseline. The host change touches every delegating turn, so next I run every suite that scripts a `Delegate` call.

The filter list is too long again. Splitting it into two halves.

Delegate suites are clean apart from BUG-275, which fails on the baseline too. Checking the priming/declaration budget suites, since `Delegate` gained a parameter.

All three fail identically on clean working. Final typecheck, then version bump and commit.

Following the gate order from memory: lock, merge `xgd-working` into the branch, bump, commit, then fast-forward back.

I committed with a placeholder message before merging. Rebasing onto `xgd-working` makes the history linear, then I can amend the tip with the real message and the version bump (no reset used).

Re-running my UATs on the rebased tip, since other sessions' commits came in.

Fast-forward landed. The rematerialize script path from the lock message doesn't exist, so I'm using the `xgd` CLI form instead.

Now syncing the ticket body: the renamed REQ-379 UATs and the REQ-416/BUG-247 supersession.

REQ-459 is built and merged into `xgd-working` as `fcf43c3d1d`. The ticket is at `free_coded` with version 0.2.638 and 3 story points, and its body describes the final design. My UATs and the related suites I re-ran pass. A dozen suites in that set are failing, but they fail the same way on clean `xgd-working`; they're listed in the ticket.

**What changed**
- **Chat transcript (host, `cadence-core.ts`):** a `Delegate`'s note is no longer written into the reply. It only feeds the progress area. The "Meanwhile, N questions need you: [answer them]" link is still said at the first hand-off.
- **Past-tense summary:** `Delegate` takes a new optional `done` parameter, the same step in the past tense ("Built your home page."). When a round that delegated ends, the host records one italic line, e.g. *Built your home page first draft, then tidied the phone view (18 minutes).* That line is what a reopened conversation shows; no "about N minutes" survives.
- **Early endings:** if a hand-off didn't come back or the round ended early, the line ends "— stopped before the rest was finished". If nothing came back it reads "Stopped before the build was finished (…)". The consultant's own reply still says what was left.
- **Chat pane (`chat.js`):** one working line per turn sits at the end of the conversation. It reads the same `progress` frames as the status widget, using the same rule (the model's line beats the host's heartbeat). Each step replaces its text, so a turn never adds a second line. It is never a message, and it is removed when the turn ends, leaving the summary in its place.

**Decisions worth checking**
- **`done` is optional, not required.** Making it required would get every existing `Delegate` call without it refused. Without it the summary falls back to "Finished a build", and repeated identical phrases are said once.
- **Capture and screenshot steps stay status-only** and are not part of the summary. Only builds get a past-tense line.
- **This overrides three earlier decisions, and I updated their tests:**
  - REQ-379: the note is no longer the consultant's words in the transcript.
  - REQ-416: it had removed the older in-chat working line from REQ-390. This brings back one line, which is never a message.
  - BUG-247: it asserted no progress text in the chat. It now asserts the text is only in that one working line.
- I renamed the two REQ-379 tests to match; no acceptance criterion referenced the old names.

**Tests**
- New UATs:
  - `tests/test_UAT_FC_REQ-459_one_progress_story.test.ts` drives the real chat pane through two steps and the end of the turn.
  - `tests/test_UAT_FC_REQ-459_one_progress_story.workers.test.ts` covers the real routes: no note in the reply, one summary, a reopened transcript, and a refused hand-off.
- Re-run: about 60 related suites, including every one that scripts a `Delegate` call.

**One loose end:** `xgd branch clean REQ-459` refused because the merge lock is now held by BUG-278. The `free-REQ-459` worktree and branch are still there (already merged). Run `xgd branch clean --stale` or `xgd branch clean REQ-459` once BUG-278 releases the lock.

I haven't seen this in the real builder against a live model. The new parameter's description is the only thing telling the model to fill `done`, so it's worth watching on the next first-draft run.

<!-- xgd-turn id="d0a2a39d-463c-486c-8829-301b5e90397e-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T19:00:33.738508+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

Blocking details:
- branch `free-REQ-459` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-459`
- branch HEAD: `fcf43c3d1de404807c4d0cae7ab83e02b5454d00`

<!-- xgd-turn id="d0a2a39d-463c-486c-8829-301b5e90397e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T19:02:46.237699+00:00" -->
#### Claude
Cleanup is done; checking the ticket's status before reporting.

REQ-459's free-coding is complete. The step left over last time (`xgd branch clean REQ-459`) ran this time: the `free-REQ-459` worktree is removed, the branch is deleted and the lock is released.

- The ticket is at `free_coded`, with commit `fcf43c3d1d` recorded and 3 story points.
- That commit is in `xgd-working`.

It's ready for you to promote to `ready_to_reconcile` whenever you want.

<!-- xgd-chat-end -->