---
uid: comment-4b164113
id: COMMENT-4640
type: comment
title: Comment on bug BUG-164
created_by: xgd
created_at: '2026-09-30T23:20:02.122176+00:00'
updated_at: '2026-09-30T23:20:03.233274+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fff67a01
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "692c0a9d-87e3-4e3a-904c-be6ae2a90f1e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="55682f85-6b34-4f5a-ab62-c658090cbcaf-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T21:06:50.958101+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="55682f85-6b34-4f5a-ab62-c658090cbcaf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T22:09:25.332905+00:00" -->
#### Claude
Reading the ticket and the overlap probe code now; L1 already appears to have a `paintOrder` axis, which would enable the ticket's "option 1" fix.

Scoping items 2 and 3: checking what the gate already receives from the perceptual and values sides.

Writing the paint-order model into the envelope evaluator now.

Now the edits: the finding kind, the paint-key helper, and the check in the overlap loop.

Code edits are in. Writing the UAT file, modelled on the BUG-112 test's fixtures.

Copying the generated modules into the worktree (a known step for fresh worktrees), then rerunning.

The onSample probe samples several viewport heights per width, so findings repeat. Adjusting the test to read one sample.

Both suites pass. Now checking against the real faelan.com bundle: its current `l1.json` and the iteration-4 page that shipped with the buried headline.

With `paintOrder` present (the fold after REQ-347), the gate passes, which is correct. Now stripping `paintOrder` to reproduce the iteration-4 document:

On the faelan bundle without `paintOrder`, all three probes now fail, naming "FAELAN" and the tagline as buried; image-vs-image pairs stay exempt. Running the broader regression scope next.

The full node suite takes more than 10 minutes, so I'm starting it detached and will check its log.

Meanwhile, typecheck and lint on the changed files:

Typecheck is clean, and the repo has no prettier config. Waiting on the full suite.

While that runs, I'm checking this repo's version-bump convention.

The convention is a patch bump of `package.json`'s version in the commit. Bumping to 0.2.422:

`xgd-working` has already moved to 0.2.422, so I'm taking 0.2.423.

Waiting for the full-suite result.

The suite is still running. I'll act on the completion notification.

Waiting for the suite to finish.

Waiting.

Vitest refuses the long filter list, so I'll run it in chunks.

All 82 layout/fold/gate test files pass (663 tests; the skips are real-bundle tests whose bundles aren't in the worktree). Committing:

Committed. Now the lock and the merge into `xgd-working`.

Version counter only; taking the max (0.2.423).

Merged. Updating the ticket body to match the final implementation and add the real-bundle evidence:

Now the gate command. From past sessions, it rebuilds main's ticket index and can take 20+ minutes, so I'm running it detached:

Waiting for the gate command.

That notification is the original full run finishing. Checking its summary for anything in the areas this change touches:

The full run finished at 4916 passed and 30 failed across 18 files. None of those files touch the probe, gate, fold or layout code: they cover ports/filing services, fonts, the KB corpus, deploy commands and vocabulary scans. Still waiting on the gate command.

The gate command is still rebuilding main's index (the known slow path). Re-arming the wait:

Waiting.

Past the first index rebuild (17 min); it's now saving the index. Re-arming:

Waiting.

It's now `free_coded`, but the tool reports 2 commits and I passed one. Checking what it recorded:

The second commit is the tool's own auto version bump (0.2.424), added because I left out `--version`. That's expected. Setting story points and cleaning up the branch:

I fixed Item 1 (the `stacked` exemption) and left Items 2 and 3 for later. BUG-164 is at `free_coded` with the code merged into `xgd-working`, but I couldn't remove the branch and worktree (see the end).

**What changed**
- **Paint order is now modelled.** The layout checker (`tools/generate/src/l1/probes.ts`) now works out which element paints on top, the same way the renderer does: an element with `paintOrder` sits at that level, and everything else paints in document order.
- **New `buried` finding.** Under `stacked`, if a text run overlaps an image or painted box and ends up underneath it, the check reports `buried` (e.g. `FAELAN is painted beneath image`). Other `stacked` pairs stay exempt: text on top of a photo, photo over photo, text over text.
- **Gate wording.** `buried` gives a `structural-failure` verdict. The diagnosis lists it separately from overlaps. The next step asks for a `paintOrder` above the picture instead of "declare `stacked: true`", because the pair is already declared.
- **Flow recovery ignores `buried`.** Moving the text wouldn't unbury it.

**Checked on the real faelan.com bundle**
- As the fold writes it today, with `paintOrder` from REQ-347 (headline 20 over photos 15/5), the gate passes, which is correct.
- With `paintOrder` removed (the iteration-4 shape), all three layout checks fail with only two findings: `FAELAN is painted beneath image` and `Artist • Musician • Creator is painted beneath image`. The photo-over-photo pairs stay exempt.

**Tests**
- 5 new UATs in `tests/test_UAT_FC_BUG-164_stacked_overlap_paint_order.test.ts`. The BUG-112 UATs and all 82 layout/fold/gate test files pass (663 tests), and `tsc` is clean.
- The full node suite: 4916 passed, 30 failed in 18 files. None of those files are in the layout/fold/gate area this change touches; they cover ports and filing services, fonts, the KB corpus and deploy commands. I didn't confirm whether they also fail without this change. Other sessions were running suites on the machine at the same time.

**Deferred (written up in the ticket)**
- **Item 2**, a "was it painted" measure in values-diff: needs the capture to check in the browser whether each element actually shows.
- **Item 3**, flagging a top-ranked region over a text element that otherwise matches: needs `regions.json` passed into `reconcileGates`, which currently only gets the region count.

**Ticket state**
- Commits: `52827e75e2` (the fix) and `38afada3c0`, a version bump to 0.2.424 that `move-to-free-coded` added itself.
- Story points: 3. The body describes the final behaviour, the bundle results and the test plan.

**Not cleaned up:** `xgd branch clean BUG-164` refused because the `xgd-working` merge lock is now held by REQ-349's session. The `free-BUG-164` branch and worktree are fully merged. Run `xgd branch clean BUG-164` once that lock is released.

<!-- xgd-chat-end -->