---
uid: comment-bdf7eb30
id: COMMENT-4874
type: comment
title: Comment on bug BUG-194
created_by: xgd
created_at: '2026-10-04T00:16:39.974025+00:00'
updated_at: '2026-10-04T00:22:43.294278+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-53356016
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6fb6845a-081b-4746-96b3-bae901b609fa",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="80750fec-4332-4ba0-a2c6-a5431be88e59-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:15:37.963805+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="80750fec-4332-4ba0-a2c6-a5431be88e59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:22:43.230271+00:00" -->
#### Claude
Reading the gate code and REQ-377 so I can scope this before coding.

The probe separates cleanly (34 hits on hearingzone, 0 on the other four bundles). Checking the symmetric variant to justify the direction rule.

Scope is clear. Recording the design on the ticket before cutting the branch.

Now the code change in the worktree.

Adding the probe after `emptySectionsOf`, the finding in `referenceCoverage`, and the verdict routing.

Known fresh-worktree artifact (control-app `generated/` missing); copying it from the main checkout.

Both suites pass. Now a real-bundle check against hearingzone and the four healthy references, via a throwaway test file.

Real-bundle result matches the ticket: hearingzone → `unstable-read` (34 runs), the other four → none. Running the wider gate regression scope.

All green. Typecheck and lint next.

Typecheck clean. Checking my notes on this project's version-bump/promotion mechanics before committing.

Plan: commit on the branch, lock, merge working into the branch, fast-forward back, then `move-to-free-coded` without `--version` so it bumps itself.

Fast-forwarded cleanly. Promoting to `free_coded` (auto-bump).

BUG-194 is implemented and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.470, 2 story points) and the branch has been cleaned up.

**What changed** (`tools/generate/src/cli/gate-core.ts`)
- **New finding, `unstable-read`.** It flags a text run that the reference's `multistate.json` puts in two places that can't both be true. At one width, the run has the same x, width and height in the shortest and tallest viewports, but sits higher on the page in the taller one by more than its own height. The finding gives the count and the first five runs, each with its width, both viewport heights and both `y` values.
- **Verdict.** This finding now makes the gate return `capture-incomplete`, ranked above every other verdict, the same way BUG-189's `empty-section` does. A structural failure or a pass underneath it no longer counts as evidence.

**One change from the ticket's wording:** the probe only fires when the run moves **up** in the taller viewport. The ticket's literal rule ("`y` differs by more than its own height") would trip on any healthy page with a full-viewport-height (`100vh`) hero, because everything below it legitimately moves down when the viewport grows. I ran both rules over the five reference bundles on disk:

| Bundle | Literal rule (either direction) | Rule as built (up only) |
|---|---|---|
| gigabytealchemy | 328 | 0 |
| joyfulculinarycreations | 254 | 0 |
| faelan | 18 | 0 |
| bluelotus | 0 | 0 |
| hearingzone510 | 34 | 34 |

On hearingzone510 the flagged runs include "Learn to train…" and the logo. The ticket body records this decision.

**Not built: proposed step 1, recording `scrollY` on every manifest.** Writing that field belongs to REQ-377 issue 1 step 3, which also makes the capture pipeline refuse a non-zero read. Once that exists, a gate check on the field would add nothing. The step-2 probe works on bundles already on disk without re-capturing.

**Tests**
- `tests/test_UAT_FC_BUG-194_unstable_read_coverage.test.ts` has 5 tests:
  - a run that moves up is reported;
  - runs that move down, change size, or move less than their own height are not;
  - the new finding beats a structural failure;
  - without it, the structural failure verdict is unchanged.
- The 23 existing gate test files passed (229 tests, 5 skipped), and the `tools/generate` typecheck is clean.
- Run against the real bundle, `referenceCoverage` on hearingzone510 returns `unstable-read`. I did not run the ticket's full `1c gate --sandbox` command.

All five bundles also report `stale-capture`. That was already happening and is unrelated to this change.

The ticket is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->