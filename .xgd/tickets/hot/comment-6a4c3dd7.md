---
uid: comment-6a4c3dd7
id: COMMENT-5361
type: comment
title: Comment on request REQ-398
created_by: xgd
created_at: '2026-10-15T16:36:07.358239+00:00'
updated_at: '2026-10-15T16:43:58.828725+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-071115b2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "24957c0c-f14c-432c-a58d-5f1b8e44a914",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="577fff3a-9123-41c8-88f7-e3915020cbc5-user" -->

<!-- xgd-chat role="user" ts="2026-10-15T16:35:24.570052+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="577fff3a-9123-41c8-88f7-e3915020cbc5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-15T16:43:58.642383+00:00" -->
#### Claude
Reading the current stage tracker (REQ-390) code and the plan seed before cutting the branch.

Found the tracker's CSS; checking the panel's scroll container and the existing REQ-390 test next.

Design is clear; checking which existing tests pin the panel's stage shape, then I'll set the ticket to free_coding and cut the branch.

Safe. Moving the ticket to free_coding and cutting the branch.

Now the seed: one-sentence explanation beside each stage label.

Now plan-core: carry `about` into the client panel's view.

No shared tooltip component exists (only native `title`, which doesn't cover focus or tap), so the banner gets one small tip element of its own. Writing the panel changes.

Config words next.

Now the CSS: sticky one-line banner, per-state colours, and the tip.

Code is in. Checking whether there's a real-browser harness for the builder before writing the layout UAT.

The project's pattern for layout evidence in jsdom is reading builder.css; I'll go one better and inject it so `getComputedStyle` sees the real rules. Writing the REQ-398 UATs.

Now updating REQ-390's tracker test, whose marks and collapse assertions the banner supersedes.

All 9 pass (not skipped). Running the adjacent plan suites.

The workers suites fail to load in a fresh worktree (missing generated control-app artifacts — a known location artifact). Confirming that's the cause, and type-checking only my files.

Missing generated artifacts, as expected. I'll copy main's generated dir into the worktree (gitignored) so the route suites can actually run.

All 37 route tests pass. Lint/format check on the touched files.

No lint script in the repo and prettier isn't installed locally, so formatting stays a skipped check. Reading my notes on this project's version gate before committing.

Committing on the branch (no manual bump — the gate bumps itself).

Now the ticket body: keeping the existing content and adding what was decided during implementation, so every UAT has language behind it.

The body updated correctly; `get` just truncates its output. Merging back now: lock, merge with sparse checkout off, then rematerialize.

Merged. The printed script path doesn't exist, so I'm using the documented CLI form instead.

Nothing to rematerialize. Moving to free_coded (letting the gate do the version bump itself).

REQ-398 is done and at `free_coded`. It's merged into xgd-working, the version bump was recorded by the gate, and the branch is cleaned up. Both commits are recorded on the ticket.

**What you'll see:** the stage tracker is now one line pinned to the top of the plan panel: `Progress: 1✓ | 2✓ | 3. Refining | 4 | 5 | 6 | 7`. The questions and comps scroll under it.
- **Colours:** grey for not started, green with a ✓ for done, blue and named for in progress (the spinner shows there while a turn runs), and yellow with a dash and strike-through for skipped.
- **Skipped** is worked out each time the banner is drawn. The plan still stores only its three states, and the plan validator refuses a stored `skipped`.
- **Explanations:** hovering over a stage, tabbing to it or tapping it shows its name, a sentence about it, and its state in words (*Not started / In progress / Done / Skipped*). A second tap closes it. Clicking never changes anything.
- **Stage sentences:** I wrote one for each stage, stored in `plan-seed.json` beside its label. Please read them through; they're my wording and easy to change.
- **Collapse toggle:** removed, along with its `plan-stages-collapsed` setting.

**Decision for you:** if a stage is in progress *before* a stage that's done (say 3 in progress, 5 done), I keep stage 3 blue and named rather than showing it as skipped. Only not-started stages turn yellow. The ticket's rule says "not done", so read literally it would mark 3 as skipped. The ticket body records my reading, and it's a one-line change if you want the literal one.

**Tests:** the six new tests pass, as do the 46 other plan-panel tests and 37 server-side plan tests. The layout tests load the real `builder.css`, so "pinned" and "never wraps" are checked against the shipped styles. That's still jsdom, though; nothing has run in a real browser. I updated REQ-390's tracker test to match the banner and removed its collapse checks. There's no lint script in the repo and prettier isn't installed locally, so formatting wasn't checked.

To see it on dev you'll need to run `bin/deploy --env dev`, because dev serves a frozen snapshot.

<!-- xgd-chat-end -->