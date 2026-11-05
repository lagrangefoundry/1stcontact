---
uid: comment-331d93f6
id: COMMENT-4501
type: comment
title: Comment on bug BUG-160
created_by: xgd
created_at: '2026-09-30T00:06:56.648434+00:00'
updated_at: '2026-09-30T01:17:37.331379+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-654858d2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7ff61f94-bb61-4358-9c23-24fef85a8c15",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d31d3056-fc77-4981-ab85-1d5ff2c1fc45-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T00:05:54.970833+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d31d3056-fc77-4981-ab85-1d5ff2c1fc45-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T01:17:36.864903+00:00" -->
#### Claude
Ticket is thoroughly specified. Let me examine the code.

Now let me write the Issue 1 fix.

Now Issue 2 in values-diff.ts.

Now the test file.

Now commit.

Now lock, merge back, and mark the ticket.

Done. BUG-160 is at `free_coded`, commit `7d9a5ee` merged into `xgd-working`.

## What landed

**Issue 1 — `measuredAt` ignored `segments`** (`tools/generate/src/l1/probes.ts`)

A new `snapHoldWidth(geo, width)` answers "is this width inside a `snap` window on the node's own keyframe ladder, and where does that window start?"; `measuredAt` resolves the ladder at the hold width instead of at `width`, and `takeMeasured` passes `geometryOf(node)`.

On the index-alignment concern the ticket raised: **it's answered by not indexing.** The window is looked up by *width* against the node's ladder, never by position in the measured track — so a measured track that skips a width can't mis-read a different window's segment. A UAT drives exactly that case (3 keyframes vs a 2-point oracle).

Measured on `storage/references/gigabytealchemy.ai/index`: off-sample escape findings **18 → 0**, `offSample.pass` `false → true`. `sampleFidelity`, `onSample`, `recovery` and `contentRobustness` (209 findings, 38 escapes) are byte-identical before and after.

**Issue 2 — `arrangement` skipped without being counted** (`values-diff.ts`)

Both guards now emit one aggregate row each: a one-sided reading → `unmeasuredAxes` (side-shaped, mirroring `unreadableTransformAxes`); REQ-331's moved-box declination → `notComparableAxes` with `scope: 'element'`. Only the **asymmetric** case is counted — a pair neither side read is not a skipped comparison, and counting it put permanent rows on four other tests' fixtures, which is the inertness every other guard keeps.

Driven against the filed round's own manifests it reads *"no arrangement for **22 of 59** paired elements"*, reference side — the ticket's number exactly; `ownGeometryAgrees` declined 0 on that page, as predicted.

**Knock-on:** BUG-143's opportunistic real-bundle case asserted those 18 manufactured escapes. It now asserts their absence and says why, keeping its other claims (clean at rest, 38 escapes under 15% growth, gate carries the survivors). The claim it used to hold is still held by its own synthetic `snappingPage`.

**Verification:** 12 UATs, 7 of which fail against the unfixed tree (the other 5 are earned negatives). Full `vitest.node.config.mts` suite run before and after — failing-file set identical to baseline.

One process note: `git stash` is shared across all the sibling `free-*` worktrees, and a bare `pop` mid-run pulled another session's REQ-352 WIP into this worktree. I reverted it cleanly and their stash entry is intact — but I've saved that as a memory, and used copy-aside/`git restore` for baselines after that.

<!-- xgd-chat-end -->