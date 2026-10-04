---
uid: comment-92b673f3
id: COMMENT-4875
type: comment
title: Comment on bug BUG-195
created_by: xgd
created_at: '2026-10-04T00:16:42.264807+00:00'
updated_at: '2026-10-04T00:23:14.446710+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-09d594a1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "16c5e426-822d-4519-acbd-7887605f6fc2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a838951c-6f72-467c-9b78-e562331fd340-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:15:38.225939+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a838951c-6f72-467c-9b78-e562331fd340-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:23:13.950890+00:00" -->
#### Claude
I'm reading `measuredTextHeights` and `oracleBoxes` in `probes.ts` to confirm the fix the ticket proposes before I cut the branch.

Now the edit. I'm exporting `selfSurfaceLines` from the fold and using it in the oracle.

Next, the UAT. I'm checking how the existing containment tests drive the probes.

I've written the UAT. Next I'm running it with the fix, then without it, to check that it really catches the bug.

The worktree is missing the build artifact. I'm copying it from the main checkout, since it's gitignored.

Both pass with the fix. Now the negative check: I'm reverting the fix temporarily.

Without the fix both fail, and the escape is reproduced. Next I'm running the regression scope: every suite that uses the oracle, the probes or the fold.

All 30 suites pass. Next I'm running the typecheck.

Typecheck is clean. Next I'm trying the ticket's own real-bundle check, `l1-gate` on hearingzone510, from the worktree code.

It's read-only and emits JSON. I'm running it against the main checkout's reference bundle twice, once with the old code and once with the worktree's fixed code.

The real bundle reproduces the ticket's numbers exactly before the fix (565 escapes, 114 for these runs). After the fix: 477 and 26, with fidelity unchanged. I'm checking what the remaining 26 are.

SCHEDULE AN APPOINTMENT still measures 43 at 320 and 375. I'm inspecting the captured elements at those widths.

Next I'm committing on the branch, merging into xgd-working, then running the free_coded gate without `--version` so it does the bump itself.

Now the ticket body: I'm keeping the original report and appending what landed.

I've fixed BUG-195 and it's parked at `free_coded`. On the real bundle, the label still shows 26 escapes on the document the gate grades today (down from 114). They go away only once the bundle is refolded.

**The fix:** the probes now measure a button label's height by its line block, the same way the fold places it, instead of by the button's full border box. Before, the top came from the line block and the height from the 43px button, so the label looked 15px "below" its own card. I took the height from the fold's own `selfSurfaceLines` (now exported from `fold.ts`) and used it in `oracleBoxes` in `probes.ts`. The fold already uses that function to place and size the run, so both sides now use the same calculation. Only the height changes, so where text is matched for fidelity stays the same. I didn't use the ticket's first idea, `renderedTextBox.height`: that's the 13px glyph height, not the 13.5px line block the fold uses.

**Tests and checks:**
- **New tests:** `tests/test_UAT_FC_BUG-195_a_button_label_is_measured_by_its_lines.test.ts`, using hearingzone510's 320px button. They check that the label is measured at about 13.5px, not 43, and that the probe reports no escape. Both fail without the fix.
- **Existing suites:** all 30 that touch the oracle, the probes, the gate or REQ-370 pass (216 passed, 4 skipped), and the `tools/generate` typecheck is clean.
- **Real bundle, as it is today:** the gate grades the bundle's saved `l1.json`, which it flags as stale. Escapes go from 565 to 477; for the three button labels, from 114 to 26. All 26 are SCHEDULE AN APPOINTMENT at 320, 375 and 768px. The old fold placed it by its lines there, but today's code treats that rounded button as a self-painting "chip" at those widths.
- **Real bundle, refolded with current code (run on a copy):** escapes for the three labels go from 96 to 8. The normal-size and between-widths checks now report none. The 8 left all come from the stress check that enlarges the text and keeps the card fixed, which is meant to fire.

To see the gate clear these three labels on your end, run `1c refold --ref storage/references/www.hearingzone510.com/index`. I didn't, because it rewrites the reference bundle in your checkout.

The commit is `fbb5d72`, plus the version-bump commit the gate added. It's merged into xgd-working, the branch is cleaned up, story points are set to 2, and the ticket body now says what landed and how it was checked.

<!-- xgd-chat-end -->