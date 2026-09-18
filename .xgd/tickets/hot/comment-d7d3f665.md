---
uid: comment-d7d3f665
id: COMMENT-3151
type: comment
title: Comment on bug BUG-120
created_by: xgd
created_at: '2026-09-18T23:42:46.217166+00:00'
updated_at: '2026-09-18T23:55:02.150102+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b1404be6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e15d6833-d4af-4aa8-972f-afdec08a7e3c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b5f5caca-e40a-4d78-b947-1869c1be17ba-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:41:57.830440+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b5f5caca-e40a-4d78-b947-1869c1be17ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:55:01.957291+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Design is clear. Let me start the free-coding process.

Now the implementation.

Now the CSS and the page body.

Now the top form and the restart caption.

Now `console.ts` — surfacing the stale reference.

Typecheck clean. Let me run the existing suites.

Now the UAT.

All green. Now the ticket body — recording the decisions the UATs assert.

Now version bump and commit.

Fast-forwarded cleanly. Now claim `free_coded` and clean up.

Final verification in the main checkout:

BUG-120 is implemented and landed on `xgd-working` at `free_coded`.

## What changed

**`tools/repro-console/src/page.ts`**
- The address row now holds **[reproduce]** alone, with a visible caption under it naming both of its cases (new address → captured and numbered from 1; loaded address → reuses the capture on disk).
- **[run again]** and **[recapture]** are one `<section class="continue">` under the iteration list — a single form posting to `/run-again` with `formaction="/recapture"` on the second button, plus a hidden `url` holding the loaded site. The heading states the shared effect ("both of these append iteration N"); a `.effect` span beside each button states what separates them (re-fold the reference we have vs. re-roll it) and the consequence (comparable with the iteration above, or not, with the seam marked).
- The `title=` tooltip on [recapture] is gone rather than doubled.

**`tools/repro-console/src/console.ts`**
- New `staleReference()` reads `capture.json` from the loaded `bundleDir` on every page build and returns `staleCaptureDetail`'s own sentence — reused, not restated, since that function owns `CAPTURE_SCHEMA` and the axis registry. It renders above the two choices, and says nothing when the bundle is current.

POST targets, hold gating (`data-held="1"` on exactly the two continuations) and the `recaptured` seam are untouched.

## Evidence

`tests/test_UAT_FC_BUG-120_continuation_affordance.test.ts` — 6 UATs driving the real console over HTTP: grouping asserted from markup (including document order relative to Iteration 1), effects in visible text with no `title=`, the stale sentence present at schema 1 and absent at `CAPTURE_SCHEMA`, [recapture] pressed *as the group's own rendered form would send it* still appending and marking the seam, and the hold still gating both continuations and not the address row.

Regression: REQ-254 (+isolation), REQ-272, REQ-255/256/261/262/270/275/276, BUG-104/105/108/109/114 — all pass, plus `pnpm -r typecheck` clean. Verified again in the main checkout after merge-back: 43 tests, 0 failures.

Two notes worth stating plainly:
- Two REQ-254 tests that spawn the real `1c` fail inside a fresh `git worktree` (it lacks `apps/control-app/src/generated`, which is gitignored). Pre-existing and unrelated — they pass in the main checkout both before and after this change.
- One deliberate affordance consequence, recorded in the ticket body: **[recapture] against a *different typed address* is no longer reachable from the page** (the endpoint still accepts it, and [reproduce] on the new address followed by [recapture] reaches the same measurement). Keeping a second [recapture] beside the address box to preserve that path would have reinstated the defect.

Commits `5653de8931` (code + UAT) and `ad4ee02fc2` (version 0.2.274) are on `xgd-working`; branch cleaned, lock released. The ticket sits at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->