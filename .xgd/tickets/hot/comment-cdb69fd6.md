---
uid: comment-cdb69fd6
id: COMMENT-3047
type: comment
title: Comment on request REQ-270
created_by: xgd
created_at: '2026-09-18T02:10:18.049730+00:00'
updated_at: '2026-09-18T02:38:58.279972+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-e2dfcce5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "532fd0c2-55e2-45ed-a305-6b49adee151d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a49f6bf3-4d50-4554-adcf-b3b6165d0212-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:09:20.606096+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a49f6bf3-4d50-4554-adcf-b3b6165d0212-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T02:38:57.826706+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at the values-diff.ts side: `flattenSignals`, `bandBackgroundImageUrl`, section comparison, and section pairing.

The ticket is thoroughly specified. Let me start the free-coding flow.

Now let me write the capture schema module.

Now wire the stamp into the `Capture` type and the pipeline.

Now the `referenceCoverage` finding in gate-core.

Now issue 2 + 3 in the page script: band layers and the shared scrim helper.

Now issue 2 — keep the swallowed inner backdrops as layers of the slice that absorbed them.

Now make the geometric band record read its paint from the topmost layer.

Now the values-diff side: section `backgroundImageUrl` comparison and the anchor-population guard.

Clean. Now the console round-context surfacing (issue 1, item 3).

Now let me write the fixture and the test file.

Good — `backgroundImage` is already a known delta property. Now the test file.

Typecheck is clean. Now run the suite with Chromium enabled.

Now let me reorder the anchor test so its discriminating assertion leads.

Now the regression scope — the adjacent capture/values-diff/gate suites.

Pre-existing — same two failures on the untouched checkout. Continuing the regression sweep.

Now a broader sweep across the reproduction/gate/console families.

Now a full-suite sweep of the node project to catch anything else the stamp touched.

Pre-existing. Let me check the remaining suspects the same way.

Now let me commit the work on the branch.

Now the lock, merge, version bump, and fast-forward in one shot.

All 12 UATs pass on `xgd-working` after the merge. REQ-270 is landed at `free_coded`.

**What shipped** — four fixes, all in how a reproduction is *measured*:

1. **`capture.json` now records which extractor took it.** New `captureSchema` stamp (`tools/generate/src/cli/capture/schema.ts`); an unstamped bundle reads as schema 1. `referenceCoverage` emits a `stale-capture` finding naming both versions and the axes the current extractor records that this bundle lacks — driven by a declared axis inventory, each entry carrying a probe so an axis the bundle demonstrably has is never claimed missing. A finding, **not** an auto-recapture: requirement 29's stability argument stands. The console's round context prints every coverage finding verbatim, so a round learns its oracle is behind before it spends itself on a frozen residual.

2. **The band's paint comes from the layer that paints it.** `bandSlices()` keeps swallowed inner backdrops as `layers` of the slice instead of discarding them; the band takes `backgroundImage` from the topmost painted layer, while `backgroundColor` still comes from the outermost box. `backgroundImageUrl` joins the compared section axes (by mirrored basename), so a lost hero is a delta rather than a silence.

3. **A gradient-layer scrim is measurable on both sides.** `overlayOf` and `overlayInBox` share one `scrimOf`, reading the first *translucent* gradient stop (a fade-to-black scrim opens at alpha 0, so "first stop" would report nothing). Fixed in the extractor, so it's independent of fix 2.

4. **The anchor isn't compared across two populations.** Skipped when a smaller reference section sits inside the paired one, with `anchorComparable: false` + reason on `sectionPairing`. Not a wider tolerance — one absorbing the observed 0.14 would absorb a real 100px shift.

**Evidence**: 12 UATs in `tests/test_UAT_FC_REQ-270_capture_oracle_and_band_measurement.test.ts`. Five drive real Chromium against a committed fixture of the hero shape, measured both as a reference capture and through the reproduction path. RED-checked: with `extract.ts`/`values-diff.ts` reverted, all 6 UATs for issues 2–4 fail in exactly the ways the ticket describes. Regression scope green across the capture/values-diff/gate families; six synthetic fixtures in four existing suites now carry the stamp (setup only, no assertion changed).

Two things worth your attention:

- **The gigabytealchemy bundle still needs re-capturing.** That's deliberately your call — until it's taken, the 1051.13 residual stays frozen and REQ-269's fixes stay unverifiable. What changed is that the gate now says so instead of reporting a clean `pass` over a stale oracle.
- **Pre-existing failures I did not touch**, all reproducing with my changes reverted: `capture.test.ts` (×2), `req83-capture-to-l1-fold`, `REQ-211_runs_survive_a_capture`, `bug16`, `req58`, `req101-font-registry`. The first five throw `driverFactory was not supplied` from the test itself; `req101` reports 17 stray mirrored font files in the tree.

Ticket body updated with the implementation spec and test plan; status `free_coded`, commits `2f7f5c3d22` + `9c60b36641`, version `0.2.254`, 5 story points. Branch merged and cleaned. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->