---
uid: comment-92c2dd4f
id: COMMENT-8140
type: comment
title: Comment on bug BUG-408
created_by: xgd
created_at: '2026-11-09T18:31:41.054404+00:00'
updated_at: '2026-11-09T18:49:22.186666+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5a671580
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9f424b74-d8ca-4856-a1e7-c57ad792fb7d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ea46e2d1-2495-426a-a830-76be5c6527a2-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T18:30:33.531565+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="ea46e2d1-2495-426a-a830-76be5c6527a2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T18:49:19.905652+00:00" -->
#### Claude
Decided on fixes for problems 1 and 2. Next I'm checking the tests that call `auditPage`, then problem 3 (the cancelled page's back field).

Problem 3 now: tracing how the cancelled page's `back` field is drawn and what the browser script does to it.

Following the cancelled page's render path to see why the slot comes out empty.

Writing a quick render probe of a site's own cancelled page with a few template shapes, to find which one draws the back field empty.

ASI issue in my probe (a line starting with `(`); fixing.

Console capture is flaky; I'll write the probe's output to a file instead.

I'll rewrite the probe cleanly rather than patch it with sed.

The published cancelled page draws the back link fine, so the collapse must depend on the site's own template or on the draft path. I'll look up the production issue for the actual page shape.

Progress: in the builder's draft, a site's own cancelled page is also drawn at its own address through the ordinary page path. Probing that render next.

Extending the probe to serve the rendered cancelled pages and run the real layout check in Chromium.

Root causes for all three are now clear. I'll set the ticket to `free_coding`, cut the branch, and move the work there.

The worktree is set up and its links point inside it. Now the code. Fix 1 goes in the design resolver: a component's type role passes down to controls inside the component box.

Fix 2 is in the style audit. `auditPage` will resolve the design itself, over the page's tree and every component slot. The "written by hand" check will read only what the page stored.

Now updating the two callers to pass the design instead of pre-resolving.

Removing the imports that are now unused.

Fix 3 is in the layout check's `collapsed` rule. Parts hidden on purpose, and empty live regions waiting for their script, are not sections that collapsed.

Now the UATs. Checking how existing suites drive `describe_page`, so I can test through the real entry point:

Writing the UAT file:

The fresh worktree needs the control app's generated files, which aren't tracked. Copying them in from the main checkout:

Five pass. The last fails only because `--single-process` Chromium can't open a second page. I'll reuse one page and resize its viewport instead.

All 6 pass. Now confirming they're red without the fixes: I'll stash the source changes under a unique tag and run the suite again.

Red without the fix (5 of 6; the own-role-wins case passes either way, as expected). The two `describe_page` failures took 3ms, so I'll check they fail on the assertion rather than a crash:

Both fail on the expected assertions. Next, the regression scope: the audit, design, checkout and layout-check suites, plus typecheck.

Six failures. Getting a baseline: the same failing files on unchanged code.

Confirmed: the starter design's `body` names a face, so the control is drawn in it. I'll update that REQ-349 expectation and note why.

The audit suites are green. Now typecheck, via `tsc` directly (not `pnpm`, which can rewrite the main checkout's links from a worktree):

Typecheck is clean apart from two existing errors in control-app files this change doesn't touch. Linting the changed files:

There's no ESLint in this repo. The harness said the new test file changed on disk after I wrote it, so I'll check what it now holds:

That's my own edit, so nothing unexpected. Next is the version bump. Reading the project's promotion notes first:

Plan: commit the fix on the branch, take the merge lock, merge `xgd-working` into the branch, bump the version there, then fast-forward `xgd-working`. Committing the code first:

Before merging, I'm updating the ticket body so it records the root causes, the design decision and the test plan. I'll keep the original report intact.

The ticket body is updated. Now taking the merge lock and merging `xgd-working` into the branch:

The merge was clean, with no conflicts. Bumping the version on the branch:

The version is unclaimed and the tests pass after the merge. Fast-forwarding `xgd-working` and rematerializing the ticket overlay:

That script path doesn't exist; this is a known quirk, and the CLI verb does the same job:

Nothing to rematerialize (0 candidates). Moving the ticket to `free_coded` with the full SHAs:

Cleaning up the branch and worktree. This has to be a standalone call so the sandbox exclusion applies:

I fixed BUG-408. It isn't a duplicate: nearby checkout bugs (BUG-369, BUG-373, BUG-396) touch the same code but none covers these three problems. The fix is merged into `xgd-working`, and the ticket is at `free_coded` (version 0.2.852, commits `84bed6b0` and `69890a0d`).

**What was wrong and what changed:**

1. **Controls in a button box.** There were two separate causes:
   - `describe_page` resolved the site's design for the page's own content but not for content inside a component's slots. So it reported "unstyled: font, size" on controls that do get a font from their role.
   - A control never takes lettering from the boxes around it. That rule exists so a form field inside a heading doesn't come out heading-sized, but it also meant a `button.secondary` box's lettering never reached the control inside it.

   Now `describe_page` resolves the design everywhere. A control inside a design-component box, with no role of its own, takes the component's lettering.
2. **Colour "written by hand".** The site's design defined its `text` colour as the same hex value as the palette's `text`. The check read the page after the design had been applied, so the component's colour looked like something the page wrote. It now judges only what the page actually stored. A colour the page really does write is still reported.
3. **"Takes no height" on the cancelled page.** The back link was always drawn properly; the warning was about the element next to it. On a page that is a single section, the layout check looks inside the checkout and found its empty status message (which the page's script fills in later), 0px tall at every width. Elements hidden on purpose were reported the same way. The check now skips both.

**Decision for you:** a role the control names itself still wins over the box's. The production page set `role: caption` on both controls, so they will now draw in the site's caption lettering, not the button's. To get the button lettering, the role needs removing from those two controls; that's a site edit, not code. I kept it this way to match how a text's own role already works. Making the box win instead is a small change if you'd prefer it.

**Tests:** 6 new tests, run in real Chromium and against `describe_page`. 5 failed before the fix; the sixth checks that the control's own role wins, which was already true. I changed one existing test: REQ-349's bare contact-form input expected a "font" finding. That was the same false report as problem 1, because the input is drawn in the starter design's body font. The related REQ-349 test that was already failing on `xgd-working` now passes. Across 31 related test files nothing new fails; five tests in REQ-447, REQ-454 and the REQ-350 flow were already failing before my change.

<!-- xgd-chat-end -->