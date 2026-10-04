---
uid: comment-fd4f41e6
id: COMMENT-4903
type: comment
title: Comment on request REQ-386
created_by: xgd
created_at: '2026-10-04T20:50:45.966668+00:00'
updated_at: '2026-10-04T21:02:18.636427+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7d9b6e27
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "480c146a-b025-495b-bc60-064b81d3504d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d9cf2eb0-75bc-439f-8ade-2e82be2ac02d-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T20:49:26.047999+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d9cf2eb0-75bc-439f-8ade-2e82be2ac02d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T21:02:17.687680+00:00" -->
#### Claude
I'm working out which tool names the consultant actually calls for the slow operations (the image tools live in the framework). Next I'll pick the ones that get the announce line.

Confirmed that on the API path, prose deltas stream before a tool call runs, so the consultant's belief is wrong. I'm checking how a failed tool call's output looks, so I can detect retries.

Failures come back as `Error: …` strings, so detecting a retry is cheap. Now checking the real capture and fidelity durations, to set honest estimates.

No host-side retries exist; the consultant re-issues the call itself, so retries can be seen on the stream. I'm checking the per-turn guidance keys and the turn-clock JSON pattern next.

Branch cut. Now I'm reading the current `cadence-core.ts` in the worktree to extend it.

Now extending `cadence-core.ts`.

Writing the changes to `cadence-core.ts` now.

Now the per-turn reminder in `priming.json`.

The reminder went into the consultant's list. Next I'm looking at how the REQ-379 test scripts a backend stream, so my UAT follows the same pattern.

The REQ-379 tests drive the real `/api/ai/prompt` route with a scripted model. I'll do the same, so I'm checking whether `capture_site` is reachable in the workers test environment.

I'll model the UAT on REQ-378: the real routes, a fake browser, and a scripted model. One unreachable URL is captured twice (a failure, then a retry) before a good one.

The worktree is missing `apps/control-app/src/generated`, which these suites import. Checking my memory note on how to restore it.

I'll symlink the generated directory from the main checkout (it's gitignored) and run the new suite.

The ignore rule matches a directory, not a symlink, so I'll copy the directory instead.

The fake browser captures any URL, so nothing failed. Checking how REQ-378 produces a real capture refusal.

I'll use a private address that the capture's SSRF guard refuses. That gives a real failure.

The new suite passes. Now the regression scope: tests that call the slow tools (they now get extra text lines), the cadence tests, and the priming/reminder tests.

I shortened the reminder and moved it after `commission-construction`, and both suites now pass. Next I'm confirming the REQ-295 failure is pre-existing on clean working.

The REQ-295 failure is pre-existing. Rerunning the full regression scope in the worktree, then running the typecheck.

Typecheck is clean. Before committing I'm checking my notes on how version bumps and the free_coded gate work in this repo.

Plan: commit on the branch, merge into `xgd-working` under the lock, then run `move-to-free-coded` without `--version` so it bumps the version itself. Committing now.

Committed. Now I'm syncing the ticket body to the final reminder wording, then taking the merge lock.

BUG-203 holds the merge lock (it was acquired seconds ago). I'll wait for it to clear.

I'm waiting for BUG-203 to release the merge lock. When it does, I'll merge `free-REQ-386` into `xgd-working`, run `move-to-free-coded` (it will bump the version itself), and clean up the branch.

The merge was clean. Before promoting, I'm running a quick check of the new suite and REQ-379's suite on the merged `xgd-working`.

REQ-386 is done: it's on `xgd-working` and the ticket is at `free_coded` (version 0.2.491, two commits recorded). The new tests pass, and so does the REQ-379 cadence suite after the merge.

**What the client sees now**
- **Slow tool calls are announced.** Before `capture_site`, `screenshot`, `compare`, `check_fidelity`, `CreateImage` or `EditImage` runs, one line appears in the chat with a rough duration, e.g. *Capturing https://joes-plumbing.test/ — about 5 minutes.* The host writes this line itself, so it appears even if the consultant says nothing.
- **Built on REQ-379's mechanism.** I extended the same stream wrapper that shows `Delegate`'s note, rather than adding a second status channel. `Delegate` behaves as before.
- **Every slow call gets its own line,** not just the first one in a turn. The "Meanwhile, N questions above need you" count appears only on the turn's first line, so it isn't repeated.
- **Retries are reported.** If a call repeats one that failed earlier in the same turn, the line says *…again (attempt 2; the last try failed)*. It can't say "2 of 3": there is no retry limit, because the consultant re-issues calls itself.
- **Per-turn reminder.** The consultant is now told every turn: *"Busy for more than about 20 seconds? Tell your client first: about a minute, 5 minutes or 30 minutes. They see what you write before a tool call as you write it."*

**The consultant was wrong about delivery.** Text written before a tool call does reach the client as it's written; the framework streams it before the call runs. So I didn't add a `note` parameter to these tools. That would have cost tokens on every call and meant changing the framework-owned image tools. The consultant can give context in its own words, and the host adds the duration.

**Decisions for you to check**
- **The time estimates are guesses.** They're in a new file, `tools/generate/src/cli/ai/slow-tools.json`: `capture_site` is about 5 minutes, the other five about a minute each. Values must be 1, 5 or 30, or the file fails to load.
- **`screenshot` and `compare` may be under 20 seconds in practice.** If so, remove them from the file so they stop getting a line.
- **I had to move and shorten the reminder.** Existing REQ-342 and REQ-171 tests require a fixed order for these reminders and a 600-character total.

**Tests:** the new test drives the real chat routes with a scripted model and a fake browser. A private address is captured (the SSRF guard really refuses it), captured again, then a good site is captured. The relevant existing suites (54 workers tests, 207 node tests) all pass. One REQ-295 config test (its REQ-341 case) fails, but it fails the same way on clean `xgd-working`.

<!-- xgd-chat-end -->