---
uid: comment-d64035b0
id: COMMENT-5635
type: comment
title: Comment on bug BUG-281
created_by: xgd
created_at: '2026-10-25T19:29:09.375691+00:00'
updated_at: '2026-11-05T18:16:31.007915+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d24bc1ee
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "37387e97-4b1e-4f06-86a0-9c1c162c36de",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7261a8b5-f7f5-4483-bd84-7dd5f2023886-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T19:27:41.127008+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2f29d934-74a4-4015-a07e-bc7302b2fc90-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:08:41.206176+00:00" -->
#### You
Is this ticket finished?

<!-- xgd-turn id="2f29d934-74a4-4015-a07e-bc7302b2fc90-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:11:08.234445+00:00" -->
#### Claude
Yes, my part of BUG-281 is done. It's waiting on reconcile, which the dispatcher runs, not this session.

- **Status:** `ready_to_reconcile`. You've already promoted it, so the dispatcher will pick it up on its own.
- **Code:** both commits are on `xgd-working`: the fix (`fix(l1): a heading role is a heading; check the page outline [FREE-CODED]`) and the version bump to 0.2.643. Resync rebased them, so they now sit on `xgd-working` as `30f209b5e1` and `280bc873b4`. The ticket still records the original SHAs (`c93459ea…`, `54e71950…`). That's expected, because readers map recorded SHAs to their rebased versions automatically.
- **Tests:** I re-ran `tests/test_UAT_FC_BUG-281_a_heading_role_is_a_heading.test.ts` just now and all 6 pass.
- **Not yet on main:** that happens when reconcile runs. It will turn the `FC_` tests into AC-linked UATs and move the ticket to `free_and_reconciled`.

Nothing else needs doing here unless you want changes before reconcile picks it up.

<!-- xgd-turn id="7261a8b5-f7f5-4483-bd84-7dd5f2023886-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T20:03:38.872839+00:00" -->
#### Claude
Reading the ticket and render code; the fix is in `packages/framework/src/l1/render.ts` where text picks its element. Now checking how `role` reaches the renderer.

Found that roles are resolved (and dropped) in `resolveL1Type`; now locating the REQ-429 heading checks that need to see the result.

Reading the layout-check registry so the new heading-outline check fits its pattern.

Resolver done. Now adding the `heading_outline` layout check.

Check added. Now writing the UAT, modelled on the REQ-447/REQ-456 suites (which use a browser launch that works in this sandbox).

Fresh worktree is missing the generated control-app files; copying them from the main checkout (known setup step) and re-running.

All 5 pass. Confirming they fail without the fix, then running the adjacent suites.

BUG-48's failure is pre-existing (fails on the unpatched tree too). Checking the 6 browser-gated suites that skipped here for assertions my new check could break.

Gated suites now run in the sandbox. Baselining those 5 failures against the unpatched tree before reading them.

Same 5 fail without my change. Making sure none of them now fails *additionally* because of the new findings:

Those are pre-existing `edge_distance` failures, unrelated. Now a broader sweep of the node test suites in batches.

28 failures in batch 1 — most look environmental (worktree/browser). Baselining those exact files against the unpatched tree.

Those were load flakes (pass alone; AC977 fails on baseline too). Now the `test_UAT*` files in two batches.

Batch 2: no new failures. Last batch.

No new failures across the node project. Checking the workers project for suites that render role headings or the critic text.

Flake under load (passes alone twice). Now lint and typecheck on the changed files.

Typecheck clean (no eslint in this repo). Reading the free_coded promotion notes before committing.

Updating the ticket body (keeping the existing content) with what landed and the decisions made, then committing.

Adding a UAT for the header/footer rule too, so every behaviour in the body has evidence. Checking how the starter site stores its header part.

Verifying the new header UAT really exercises the part rule (temporarily disabling just that line):

Mutation caught. Updating the test-results line in the ticket, then committing.

Committed `c93459ea`. Now the merge-back and promotion sequence (lock → merge working in → bump → xgd-merge → move-to-free-coded).

Merged and at `free_coded`. Since the merge auto-merged two of my files with newer `xgd-working` changes, re-running the UAT and the layout-check suites on the merged tree before cleaning up.

One thing worth remembering for future sessions: the browser-gated suites can run in this sandbox.

BUG-281 is fixed and merged into `xgd-working`, and the ticket is at `free_coded`. Its commits are `c93459ea` (the fix) and `54e71950` (version bump to 0.2.643), with 3 story points. I didn't need to ask you anything first; the ticket answered it all.

**What changed**
- **A heading role now makes text a heading.** Text whose own role is `display` or `h1` renders as `<h1>`, `h2` as `<h2>`, and `h3` as `<h3>`. A `heading` level set on the node still wins. Body, lead, quote, small and caption stay as paragraphs, and so does text that only inherits a heading role from its container. I did this in `resolveL1Type`, where roles are already resolved, so the renderer, spacing, the layout checks and the critic all see the same headings.
- **One `<h1>` per page.** A heading explicitly set to level 1 takes it; otherwise the first `display`/`h1` text does, and later ones become `<h2>`.
- **The site's shared header and footer never take the page's `<h1>`.** I added this rule, which wasn't in the ticket: a `display` business name in the header renders as `<h2>`, so the page's own headline keeps the `<h1>`.
- **New layout check, `heading_outline`.** It reports a page with no `<h1>` (`no_h1`) and a heading that skips a level, such as an `h3` straight after the `h1` (`skipped_heading`). Like the existing header check, it only runs on real site pages, not on bare test pages.

**Decision for you to confirm:** these headings now also get heading spacing and stay grouped with the text below them. When a heading role doesn't set its own space above and below, it takes the default heading space instead of body spacing. Font sizes don't change. I think this is right, since a heading should behave like one, but it means some existing pages may shift vertically. If you want a purely semantic change, I can restrict it to the element name only.

**Tests**
- `tests/test_UAT_FC_BUG-281_a_heading_role_is_a_heading.test.ts` has 6 tests run in a real browser, and all pass. Five fail without the fix. The sixth checks that an explicit level wins, which already worked before.
- I ran the whole node test project and the related workers tests against the unpatched code: no new failures. The tests that fail fail without my change too, or pass when rerun alone, including REQ-415, REQ-418, BUG-237 and BUG-276, which fail on spacing from the screen edge (`edge_distance`).
- One existing test changed: BUG-237's "contact form has no findings" now also ignores `no_h1`, the same way it already ignores the header findings.
- After the merge I reran the BUG-281, REQ-429, REQ-447 and REQ-420 tests on the merged code, and all passed.

The ticket body keeps your original text, with new sections for what landed, the decisions above, and the test results. Moving it to `ready_to_reconcile` is up to you.

<!-- xgd-chat-end -->