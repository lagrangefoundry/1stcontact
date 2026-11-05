---
uid: comment-30b52b1e
id: COMMENT-7806
type: comment
title: Comment on bug BUG-350
created_by: xgd
created_at: '2026-11-05T02:19:04.157014+00:00'
updated_at: '2026-11-05T02:36:18.712099+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6098ded8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "97fe71ee-f949-4740-826a-938c04938043",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3a716751-8170-480e-9196-89535e5f43d7-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T02:18:41.990986+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="3a716751-8170-480e-9196-89535e5f43d7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T02:36:12.266009+00:00" -->
#### Claude
Reading the ticket and the capture code. There's already a `list_references` op, so I'm checking whether the consultant actually has it, and how `capture_site` and `describe_site` are declared.

I have enough to start. Moving the ticket to free_coding and cutting the branch.

Branch is cut. Now I'm making the worktree runnable (node_modules links and generated files), as past sessions recorded.

The branch cut had already made a partial `node_modules`, so some of my links landed inside real directories. Rebuilding those cleanly.

Setup is done. Now the code: `fidelity-core.ts` first, for the shared capture listing and `capture_site` reuse.

Writing the `fidelity-core` changes.

Now the declaration: the `capture_site` description, the `refresh` parameter, the result fields, and the guidance line.

Now wiring `captures` into `describe_site` in `toolbox-core`, and from there into the consultant's host.

Wiring is in. Typechecking.

All 4 pass on the first run. Checking they fail without the fix, so they're real evidence.

Without the fix all four fail; with it all four pass. Now the regression scope: every suite that names `capture_site` or `describe_site`, plus the priming and manual budget suites.

18 failures across 8 files. Re-running those 8 files on the unfixed code to see which were already red before this change.

The REQ-416 failure is a timing flake: it passes when run alone. AC-2044, though, calls `capture_site` twice on the same address and expects the second call to recapture. I'm reading it.

Before the fix 17 suites fail, so this one is likely mostly baseline too. Re-running the 14 failing node files on the unfixed code to compare.

REQ-157 passes now. Checking whether any test suites outside `tests/` reference these tools.

The regression scope is clean apart from failures that were already there. Committing the change on the branch.

Committed. Updating the ticket body to match what was built, keeping the existing text.

Ticket body is updated. Now the merge back, using the order that has worked before: lock, bring xgd-working into the branch, bump the version on the branch, then fast-forward.

The ticket moved to free_coded, but the gate printed a warning about the version script. Reading the full message.

The ticket is free_coded with both commits and version 0.2.778. The warning was the gate's usual reminder text, not an error. Setting story points, then cleaning up the branch.

BUG-350 is fixed and merged into xgd-working. The ticket is at `free_coded` with commits `bceed017…` and `cad05585…`, version 0.2.778 and 3 story points. I didn't need to ask you anything first; the ticket was specific enough.

**What the consultant sees now**
- **`describe_site` lists the site's captures.** Each one shows its bundle name, the address it came from and when it was taken. It's the same list `list_references` gives, so the existing capture is visible on the consultant's first move.
- **`capture_site` doesn't recapture a recent capture.** If the same address had a full capture in the last 30 days, it returns that bundle straight away with `reused: true`, the capture date and its age in days, and no page is loaded. The www and non-www forms of the address count as the same. A light comparison-site capture is never returned in place of a full one.
- **`refresh: true` forces a new capture**, as before. Every capture result now includes its `captured_at` date.
- **The guidance is updated.** The `capture_site` description used to say "Capturing is cheap… capture again whenever it may have moved". It now says a capture takes minutes, to look at existing captures first, and to use `refresh` only when the client says the site has changed or the capture is clearly stale. The "Reproduce a site you were shown" steps now start with "look at an existing capture before capturing again".

**Where I departed from the ticket**
- **No page count in the list.** Each capture is of one address, and the `pages` number in a capture result counts the screen widths recorded, not pages of the site. Listing it as a page count would mislead.
- **A reused result has no `reference` field.** Writing the capture up again would re-run the image describer, which is the repeated work this fix is meant to avoid.
- **Old behaviour changed on purpose.** AC-2044 expected a second capture of the same address to update it in place; that now needs `refresh: true`. I updated that test to pass `refresh: true`. I also added `refresh` to a REQ-157 test that lists every allowed parameter. Both changes are recorded in the ticket body.

**Tests**
- **New UATs:** four `test_UAT_FC_BUG-350_*` tests in `tests/test_UAT_FC_BUG-350_an_existing_capture_is_seen_not_retaken.workers.test.ts`, one per item in the ticket's test plan. They run through the real chat routes; only the model and the browser are faked, and the fake browser counts page loads. All four fail without the fix and pass with it.
- **Regression scope:** 29 Worker suites and 98 Node suites that touch these tools, the tool descriptions or the priming text. Many of them fail, but they fail the same way on xgd-working without this change (17 Worker tests, 43 Node tests). Two differed:
  - A REQ-416 Worker test failed in the full run on a 5-second timeout but passes run alone. I'm treating it as a timing flake.
  - The REQ-157 test above, which passes after the `refresh` addition.

The ticket body describes what was built, so it's ready for you to promote to reconcile whenever you choose.

<!-- xgd-chat-end -->