---
uid: comment-851c4e2b
id: COMMENT-8080
type: comment
title: Comment on bug BUG-401
created_by: xgd
created_at: '2026-11-09T07:14:44.677430+00:00'
updated_at: '2026-11-09T07:32:30.932912+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3e1aea5c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3c4dab1e-0d23-408b-ad34-8b6ed66c69b9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e98ff8a0-211c-4dd8-82b7-b9e449ba2bf7-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T07:13:44.073089+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="e98ff8a0-211c-4dd8-82b7-b9e449ba2bf7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T07:32:28.932447+00:00" -->
#### Claude
Not a duplicate (REQ-269/BUG-281 introduced the reset; none fixes the per-width interaction). Starting the free-coding flow.

Dependencies are already provisioned. Now the code change.

Typecheck clean. Now the UAT — finding an existing pattern that loads `renderL1Document` output into Chromium.

Writing the UAT now.

Fixing two test-harness issues (the bundled Chromium runs single-process, so one context per run; the control case needs `renderL1Fragment`'s controls seam), then re-running.

All 5 pass. Confirming they fail on the old renderer:

Old renderer reproduces the bug exactly (16px at 320/374). Fix restored. Now the adjacent regression scope — every suite that renders L1:

Need a baseline for these 10 — re-running the failing files on the old renderer:

AC931 compares CSS — checking it against the old renderer specifically:

AC931 is pre-existing. AC845 passed on the old renderer — checking it on the new one:

Both pass/fail identically to baseline (AC845 was a load flake; AC1627 is the fold, which I didn't touch). Remaining batches:

Same pre-existing clock-source scan as AC1445 (unrelated). Last batch:

Regression clean apart from pre-existing reds. Confirming the clock-scan hit isn't in my file:

Pre-existing (an inline client script), not from my diff. Now committing — checking the version-bump tool first.

Now the ticket body (keeping the existing content, adding what landed), then the merge-back.

Now lock, merge working into the branch, bump, fast-forward back, and promote (retry loop per the recorded race).

BUG-401 is fixed and merged into `xgd-working`. On a phone narrower than a heading's first size step, the heading now shows at its own size instead of shrinking to the body size. The ticket is at `free_coded` (version 0.2.846, 2 story points); I did not promote it to `ready_to_reconcile`. It isn't a duplicate: REQ-269 and BUG-281 brought in the heading reset, but neither covers how it interacts with per-width sizes.

**Cause:** the renderer writes a heading's per-width size first and the heading's own style after it. That style opens with `font-size: inherit` (the REQ-269 reset, which stops a heading using the browser's built-in sizes). Below the first size step, nothing later overrides the reset, so it wins. Form controls had the same problem with their `font: inherit` and `padding: 0` resets.

**Fix** (`packages/framework/src/l1/render.ts`):
- The renderer now notes which properties each element sizes per width.
- When it writes the element's own style, it removes any reset of exactly one of those properties.
- Where a shorthand reset also sets one (for example `font: inherit`), it keeps the shorthand and writes the first size again after it.
- Elements without such a reset produce exactly the same CSS as before.

**Tests:** the new file is `tests/test_UAT_FC_BUG-401_heading_per_width_size_below_first_width.test.ts`, 5 tests, all passing in a real Chromium.
- On the old renderer three of them fail, and the hero title measures 16, 16, 54, 56, 84px at widths 320, 374, 375, 768 and 1280.
- On the new renderer it measures 54, 54, 54, 56, 84px.
- The `h2`/`h3` tracks hold their sizes, a fixed-size heading keeps its size, and a heading with no size still inherits.
- Body text with per-width sizes is unchanged.

**Regression check:** I ran all 138 test files that render pages. Ten tests in eight files fail, and I've judged them unrelated:
- **Same result on the old renderer:** AC931 fails there too, and AC845 passes when run alone, so its failure was flakiness under load.
- **About other things:** contact-form setting names, a missing node-schema key, locale and slug fixtures, date validation, and the fold for AC1627, which this change doesn't touch.
- **Clock scans (AC1445 and REQ-152):** both flag a `Date.now()` call in a browser-side script in `render.ts` that my change didn't touch.

Live sites won't show the fix until the next `bin/deploy` from `xgd-working`.

<!-- xgd-chat-end -->