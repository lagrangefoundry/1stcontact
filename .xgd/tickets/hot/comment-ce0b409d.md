---
uid: comment-ce0b409d
id: COMMENT-4487
type: comment
title: Comment on bug BUG-169
created_by: xgd
created_at: '2026-09-29T21:33:21.178806+00:00'
updated_at: '2026-09-29T21:56:16.349232+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5dc60778
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3e0fdc07-603b-4129-84ab-cf3b8e5704e3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c780db3e-7892-43e0-a42c-8da31afa7247-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T21:31:30.210716+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c780db3e-7892-43e0-a42c-8da31afa7247-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T21:56:15.702521+00:00" -->
#### Claude
Ticket is clear and self-contained — no blocking questions. Items 1 and 2 are in scope; item 3 is explicitly capture-side and belongs to the gap ticket. Starting the free-coding flow.

Now the axis rows themselves:

Now `values-diff.ts` — `flattenCapture`, the recorded-value resolution, and the comparison:

Now the `bodyBackground` delta property and the comparison itself:

Now wire the two call sites so the bundle's ladder actually reaches `flattenCapture`:

Now the UAT suite:

Now the real-artifact check the ticket specifies, using the bundle and the iteration-4 manifests it cites:

Now update the ticket body to cover everything the UATs assert, before committing:

Now lock, merge back into `xgd-working`, then record the ticket:

Done. BUG-169 is at `free_coded`, commit `4a05598` merged into `xgd-working`.

## What changed

**The root cause, restated:** the reference side of the `bodyBackground` axis inferred the canvas from the widest painted band — and so did the reproduction. Both sides read `#7a7a7a`, the axis was `role: 'carried'` so nothing compared them anyway, and the page's single largest disagreement was reported as zero deltas.

**Item 1 — read what the bundle recorded.** A manifest axis's reference side now takes a `CaptureManifest` (`{ capture, recorded? }`), mirroring how `CaptureBand` already carries a section's `captureSchema`: what a bundle knows about a manifest-level axis lives in two files, and the axis's input is where to say so. `recorded` is `Pick<ValueManifest, 'bodyBackground'>` — narrow on purpose. A new `recordedManifestOf` resolves it from the projection at the capture's *own* width (the canvas is per-projection; a media-query canvas differs across the ladder), returning `undefined` rather than a default. `pageBaseOf` survives as the pre-ladder fallback and now says so. `flattenCapture` takes the ladder; both call sites hand it the whole bundle.

**Item 2 — compared, not carried.** `role: 'compared'`, with the comparison written into `diffManifests` — `role` alone only drives `UNMEASURED_AXES`, the same as for `viewport` and `subScales`. One `§canvas` / `document` delta, new `bodyBackground` property, `color` kind, Type A, skipped when either side never recorded one.

Item 3 is capture-side and needs a re-capture, so it stays with the gap ticket.

**Against the real artifacts** (bundle + iteration-4 `actual-manifest.json`): `expected` went `#7a7a7a` → `#ffffff`, deltas 20 → 21, with `expected #ffffff, actual #7a7a7a`. Exactly the ticket's prediction.

**Two things worth your decision, both recorded in the ticket body:**

1. The delta lands in the existing `color` kind, which is `LOW` tier, and the report ranks by tier before severity — so the page's biggest defect still sorts below every `MEDIUM`/`HIGH` row. That's how `color`/`surfaceFill` already treat a completely wrong band fill. Giving the canvas its own higher tier would move gate thresholds on every reference, so I left it and flagged it rather than deciding for you.
2. The pre-existing failure `test_UAT_FC_BUG-64_a_genuinely_live_turn_still_gates_the_composer` fails identically on the unmodified tree — unrelated to this change, but it's failing.

7 UATs, 5 of which fail pre-change; the other 2 pin the fallback and unmeasured-not-clean behaviour the change preserves. Regression scope: 92 suites, 749 passed, 1 pre-existing failure.

<!-- xgd-chat-end -->