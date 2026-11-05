---
uid: comment-51682ec2
id: COMMENT-5624
type: comment
title: Comment on request REQ-457
created_by: xgd
created_at: '2026-10-25T01:28:13.276021+00:00'
updated_at: '2026-10-25T01:52:34.254486+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ee7c61dc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b9a77aa5-eeab-4368-b1aa-9eb481e6f354",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f5a47712-eeb9-4ee0-b982-7ec5c1e5af48-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T01:26:56.998380+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f5a47712-eeb9-4ee0-b982-7ec5c1e5af48-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:52:33.207835+00:00" -->
#### Claude
Reading the ticket and the existing layout-check framework (REQ-429/REQ-449) before I cut a branch.

Still surveying: now how layout findings hold the hand-back in the host, and where the consultant priming / Delegate description live.

Layout side is clear. Now the consultant priming and `Delegate` description (with its budget).

Found the priming spots (copy rules and `delegation-method`). Locating the `Delegate` tool description and the priming budget test next.

Checking whether 1stcontact has a local override for the `Delegate` description (it's declared upstream in the framework).

Note from memory: Chromium may not launch in this sandbox, which would make the real-browser UATs skip. Checking that now, along with the priming budget note.

Browser UATs skip here (Chromium can't launch in this sandbox). Checking whether any Playwright engine launches, so I can verify the new in-page checks myself rather than blind.

Tracks render as interpolated `calc()`, so `l1ScalarAt` matches Chromium's computed size. Writing the checks now.

Tightening the unboxed comparison to compare bottoms directly rather than a derived height.

Now the four new check entries, appended to the registry.

Now the design handed to the page gets the type roles' sizes at each width.

Now the thresholds and their documentation in `layout-check.json`.

Adding the new kinds to the craft-kind set the replay scores, then type-check.

It passes, but zero-size jsdom boxes mean most checks returned early. Faking boxes so every check's code path actually runs:

Console output is suppressed by the config; writing results to a file instead.

No findings and no errors is suspicious; checking whether the script even found the root.

jsdom reports computed `opacity` as empty, so `shown()` hid everything. Adding explicit defaults to the probe page.

The hold test will follow REQ-449's workers pattern: one session per new finding kind. Next, the priming. Checking which existing wording is pinned by tests before I touch it.

Measuring the current priming size first (temporarily swapping the budget assertion to print the figure, per my notes).

Fresh worktree lacks the control-app's generated artifacts; copying them from the main checkout, as my notes say.

Baseline is 99,420 of 100,000 with my layout changes, so about 580 chars of room. Checking which nearby wording is pinned so I can make room by tightening.

99,871, under the 100,000 cap. Restoring the budget test and removing the probe.

Now the UATs. First the real-Chromium fixture file for the new checks.

Registry test passes; the five browser tests skip here as expected. Loosening one assertion where the edge side could tie, then writing the workers UAT (the hold and the priming).

Writing the workers UAT: each new finding kind holds the hand-back through the real route, the page is handed the type scale, and the priming carries the new rules.

All 9 pass. Now the regression scope: the REQ-429, REQ-449, REQ-446 and BUG-271 UATs the ticket names, plus the budget test, the pinned-priming suites, and every other layout-check suite.

REQ-408 fails the same way on clean xgd-working, so it predates this change. Re-running REQ-342, the budget test and the priming suites.

All green. Checking whether the repo has a lint step I should run.

I quoted 99,976 from an estimate; measuring it for real so the ticket is accurate.

No in-place replace in the CLI, so I'll rewrite the body with only that figure changed.

The file I read didn't have my appended section, which means I may just have overwritten the body with an older copy. Checking now.

I overwrote it. The appended version is still in the ticket-store commit `f283ba956f`, so I'll recover the body from there with the corrected figure.

That commit didn't have it either, so nothing new was written. Finding the commit that does hold the appended section:

The append never reached the store; `--append-body -` most likely didn't read stdin. Looking at what the latest commit actually holds:

The ticket now holds both the original body and the implementation section. Committing on the branch.

Committed `a8aa7933`. Now the merge-back: lock, merge xgd-working into the branch, bump the version there, fast-forward back, then the free_coded gate.

Another session changed `layout-check.ts` and the design schema meanwhile (likely REQ-456). The bump ran mid-merge; I'll sort that after resolving. Looking at the conflict:

Both sides add a field, so I'm keeping both. BUG-276's brand check now also checks that the logo sits off the screen's edge, so I'll look at whether my edge check would report the same logo twice.

BUG-276's message says it changed Delegate's goal description, so there is a local path to that description after all. Checking how before I conclude.

Reverting the bump for the merge commit; I'll bump at the tip once everything is in.

The merge commit is now a pure resolution. Adding the intent-not-layout note to the `Delegate` goal description beside BUG-276's logo note:

Adding a UAT that the `Delegate` tool the consultant is actually sent carries the note, reusing BUG-276's approach:

Over budget after the merge: 100,191 of 100,000. Checking whether clean xgd-working (with BUG-276) is already over on its own.

40 over. Trimming two more unpinned clauses: the tail of the "story is proof" sentence, and the second half of the "explain twice" sentence (only its first part is pinned by REQ-342).

99,961, under the cap. Re-running the full regression scope on the merged branch, now including BUG-276's suites.

Only the REQ-408 failure, which predates this change; type-check clean. Committing the follow-up.

Now updating the ticket's implementation section to match: the edge check without the logo, the `Delegate` goal note, and the new budget figure.

Ticket updated. Now the merge-back tail: lock, merge xgd-working in, bump at the tip, merge back, gate.

Merged back. Checking the bump commit contains only the version, then running the free_coded gate.

Ticket is at `free_coded`. Setting story points, then cleaning the branch (as its own call).

Done. Saving one lesson from this session: `--append-body -` silently appends a literal `-`. Checking the CLI-quirks hub first.

That quirk is already in my notes (`xgd-append-body-takes-a-string`); I just didn't check before using it, so no new memory is needed. Final check of the ticket:

REQ-457 is built and merged into xgd-working. The ticket is at `free_coded` (version 0.2.633, three commits, 8 points) and the branch is cleaned up. The tests that need a real browser haven't run yet, because Chromium can't start in my sandbox.

**New layout checks.** Each one holds the hand-back, has its thresholds in `layout-check.json`, and counts as craft in the builder replay:
- **Edge distance:** text and buttons must sit at least the design's gutter in from the screen edge, never less than 16px. Pictures can still run edge to edge.
- **Text fits its column:**
  - An h1 may take at most 3 lines on desktop and 4 on tablet and phone. h2 and h3 get 2 on desktop and 3 below that.
  - Body lines that are too long or too short are reported. The limit is 85 characters; the minimum is 40 on desktop and 28 on tablet and phone.
  - A button whose label wraps is reported. This catches "(530) / 555-0163".
- **Rows that should match:** REQ-449's row check now also covers a picture beside text with no box round it. They must end together, unless one is clearly the smaller (under 60% of the other).
- **Repeated shapes:** two sections in a row with the picture on the same side are reported. On a phone the halves are too narrow to count.
- **Off-scale text sizes:** text at a size none of the design's type roles uses at that width. The page is now handed each role's size per width.

**How the consultant briefs.** In both priming lists:
- "Order for the visitor" now says the first screen answers what the visitor is deciding, including the town and how far, and that prices and menu come before the story.
- A new "Name things plainly" rule: a playful line isn't set like a brand or a heading, and every promoted item is in the price list.

The full "brief the intent, not the layout, and never the same composition for several sections in a row" rule is on the `Delegate` goal description, which isn't counted against the priming budget. The priming carries a short form.

**Decisions I made:**
- BUG-276 landed while I was working and already reports the logo's distance from the screen edge. My edge check leaves the logo to it, so one logo isn't reported twice.
- Together with BUG-276's additions the priming went over its 100,000-character cap. To fit, I shortened my briefing paragraph and cut two clauses no test checks: "it is not the line that has to sell them" and "it is not a reason to keep the work". It now measures 99,961.

**Tests:**
- The workers suite (each new finding holds the hand-back, the type scale reaches the page, the priming and `Delegate` carry the rules) passes, 10 tests.
- The regression suites the ticket names, plus BUG-276 and BUG-129, also pass. One REQ-408 test fails, but it fails the same way on clean xgd-working.
- The five browser fixture tests skipped. I ran the in-page checks in jsdom with faked boxes and none of them threw, but that doesn't confirm the real-browser fixtures. Please run this outside the sandbox before promoting:
  ```
  node_modules/.bin/vitest run tests/test_UAT_FC_REQ-457_craft_and_journey.test.ts
  ```

<!-- xgd-chat-end -->