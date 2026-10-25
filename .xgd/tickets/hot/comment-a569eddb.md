---
uid: comment-a569eddb
id: COMMENT-4831
type: comment
title: Comment on bug BUG-180
created_by: xgd
created_at: '2026-10-03T17:57:54.820234+00:00'
updated_at: '2026-10-03T18:20:28.066848+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a78cf9fb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a81bba78-c386-4f33-9635-fefc565b0286",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="50761119-9725-4d79-9e79-04c235dbe33f-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T17:55:16.420286+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="50761119-9725-4d79-9e79-04c235dbe33f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T18:20:25.068138+00:00" -->
#### Claude
Confirmed the cause: the schema itself says layout keyframes are discrete with no `segments` companion. Now mapping which node keys carry segment-bearing tracks.

Plan is clear; ticket body is fully specified so no questions. Moving ticket to `free_coding` and cutting the branch.

Now fix 1 — explicit axis list in `holdAcrossReflowWindows`.

Also making the author-facing `flowL1` refuse (rather than throw) on an invalid recovery:

Code changes done; writing the UAT file now.

Passing. Checking the first UAT genuinely fails without the fold fix:

RED→GREEN confirmed. Now the adjacent suites (BUG-142, BUG-173, REQ-278, REQ-337, BUG-113, BUG-160, REQ-350, BUG-8 reflow) plus a typecheck:

Known fresh-worktree artifact (missing generated control-app code). Copying it in from the main checkout and re-running:

Adjacent suites green. Typecheck:

Typecheck clean. Now the real bundles — they live only in the main checkout, so I'll run the worktree's `1c repro` against them by absolute path:

The gate runs to a verdict. It fails on quality (a poor page, which the ticket allows), not on a crash. Next I'll commit, following the project's promotion recipe:

Committing on the branch:

Now I'll update the ticket body, keeping the existing content and appending the implementation record:

Now lock, merge, move to free_coded, clean:

BUG-180 is fixed and the ticket is at `free_coded`. It's merged into xgd-working as commit `c8102d98c0`, plus the version-bump commit that `move-to-free-coded` added, with 3 story points. All three affected sites now reproduce instead of failing at `repro`.

**Fix 1: the hold no longer writes `segments` onto `responsiveLayout`.** `holdAcrossReflowWindows` (`tools/generate/src/l1/fold.ts`) used to treat anything with a `keyframes` array as a track. It now holds only an explicit list: `geometry`, the tracks under `responsive`, and the tracks under `responsivePadding`. The ticket asked me to choose between this and adding `segments` to the layout schema. I left `responsiveLayout` alone: its schema already documents that a layout mode is discrete and snaps, so there was nothing to hold.

**Fix 2: an invalid recovery is declined, not fatal.**
- `promoteToFlow` now throws a dedicated `InvalidRecoveryError`.
- `chooseRecovery` catches only that error: it serves the pre-recovery page and keeps the validation message. Any other error still ends the run.
- `1c repro` and `1c l1-gate` both print `recovery declined: produced an invalid L1 document — <detail>`.
- The gate no longer runs the recovery a second time, which would have thrown again.
- The "stack this group" edit (`flowL1`) now refuses an invalid result as `SCHEMA_INVALID` instead of crashing.
- An invalid fold output still fails, as the ticket specified.

**Testing:**
- **New UATs:** the new tests in `tests/test_UAT_FC_BUG-180_responsive_layout_has_no_segments.test.ts` pass. The hold test fails without fix 1.
- **Override for the declined-recovery test:** with fix 1 in, nothing real produces an invalid recovery any more, so I added an optional override that lets the test simulate one.
- **Real-bundle UAT:** this one can only run in the main checkout, where the bundles live; I ran the same scenario by hand instead.
- **Manual runs:** on copies of the three bundles, `1c refold` then `1c repro` exits 0 and writes a page for hearingzone510, bluelotus and joyful. None of the three needed the fallback: each recovery was valid and declined on cost. `1c l1-gate` on bluelotus runs to a verdict, which is FAIL on quality.
- **Existing suites:** the 15 related test files pass (91 tests), including BUG-113, BUG-142, BUG-173 and REQ-278/337/350, and the typecheck is clean.

**Quality is poor on two sites.** hearingzone510 is served with a 5139px worst-case miss and 42 out-of-tolerance samples, and joyful with 7234px and 74. That's a fold-quality issue, not part of this bug.

**Your step:** restart the console and press **[recapture]** on all three sites. Each should reach `gate` and render a page.

<!-- xgd-chat-end -->