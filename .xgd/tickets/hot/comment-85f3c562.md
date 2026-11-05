---
uid: comment-85f3c562
id: COMMENT-3041
type: comment
title: Comment on bug BUG-100
created_by: xgd
created_at: '2026-09-17T23:06:09.115145+00:00'
updated_at: '2026-09-17T23:23:14.184662+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-14025216
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "07b0ab11-85c9-460f-b0bc-0ba9b0d71028",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b58f0137-30a1-4bc8-8b08-d6a729596cc6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T23:04:46.904592+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b58f0137-30a1-4bc8-8b08-d6a729596cc6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:23:12.940218+00:00" -->
#### Claude
Ticket read. The body is already a full diagnosis — I'll append the implementation decisions rather than replace anything, then cut the branch.

Ticket scoped and at `free_coding`. Cutting the branch.

Now the fix.

Now the UAT suite.

Let me typecheck and run the suite.

All 7 pass. Now verify they actually fail against the unfixed code (the RED check), and run the regression scope.

Now the real-bundle check the ticket names as the acceptance signal.

Full adjacent scope green. Committing.

Now lock, merge back, and claim.

Done. BUG-100 is at `free_coded`, commit `0fc7f11e97f6` merged into `xgd-working`, version `0.2.240`.

**The fix** — `referenceCoverage()` in `tools/generate/src/cli/gate-core.ts` now builds its `referenced` set from every field that can hold an image handle (element `src`, element `backgroundImageUrl`, section `backgroundImageUrl`) instead of `elements[].src` alone, and tests membership by mirrored-asset basename using the existing exported `assetBasename()` from `values-diff.ts` rather than a second normaliser. On the real `gigabytealchemy.ai` bundle it now returns `referencedImages: 1`, `unreferencedImages: []`, `findings: []` — the ticket's stated pass condition, with `sections: 8 / pageHeightPx: 4428 / pxPerSection: 554` matching the numbers recorded for iteration 2.

**Judgements I made**, both recorded in the ticket body:

- **The verdict ladder is unchanged.** The ticket left this open. I kept `coverage.findings.length` outranking `deltas > 0`, and kept `unreferenced-image` escalating on its own: the hijack was caused by the finding being *false*, not by the ordering, and demoting it would invalidate REQ-94's own AC (`test_UAT_FC_REQ-94_capture_incomplete_when_reference_is_impoverished` pins exactly that escalation). Superseding a matrix entry is an intent-level call, not an implementer's.
- **The proxy is widened, not disabled** — an asset nothing in the manifest names is still reported and still escalates. Two of the seven UATs pin that direction.

**Tests** — `tests/test_UAT_FC_BUG-100_coverage_background_images.test.ts`, 7 UATs on the same offline seams REQ-94's suite uses (no browser, nothing we own mocked). Five fail against the unfixed code. Regression scope: 53 capture/fold/values/gate suites, 436 passed / 20 skipped, plus both import-graph boundary suites (`assetBasename` is pure, so the new value import pulls nothing into the Worker graph). `tools/generate` typechecks clean.

Two things worth flagging:

1. **I cleared a stale merge lock.** `.xgd/working-merge.lock` was held by REQ-267 with PID 99856, which was dead; I waited ~5 minutes, confirmed the PID was gone and that `xgd-working` had no `MERGE_HEAD` and a clean tree, then removed the lock file by hand (the error message's own suggested recovery) rather than running `xgd branch clean REQ-267`, which would have torn down that ticket's worktree. If REQ-267 is a live session it will need to re-acquire.
2. **The branch worktree was missing `apps/control-app/src/generated/`**, so the suite couldn't even import. I copied it from the main checkout — build output, gitignored, not part of the commit.

<!-- xgd-chat-end -->