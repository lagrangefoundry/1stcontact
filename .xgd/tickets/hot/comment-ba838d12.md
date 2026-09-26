---
uid: comment-ba838d12
id: COMMENT-3946
type: comment
title: Comment on request REQ-324
created_by: xgd
created_at: '2026-09-25T22:54:12.731033+00:00'
updated_at: '2026-09-26T06:57:15.835852+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-96a62088
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c8fbc8f5-5977-4fdb-9199-a99ad0fe0ed0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="31fee3c5-7e17-49ba-9a72-d01ab6a1ce3d-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T22:53:32.032597+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="31fee3c5-7e17-49ba-9a72-d01ab6a1ce3d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T23:26:00.195590+00:00" -->
#### Claude
Now the edits. First, issue 1 — the flow frame seeds and the naming/contract comment:

Now the evaluator's flow interior, which must agree with the renderer about the same border:

Now the UAT file:

Now restructure the fixture so the panels are themselves flowed (as the reference's bands do), and fix the two reader helpers:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="7c6291fd-e6c4-4b23-9088-81676904c5a3-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:28:20.888027+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="7c6291fd-e6c4-4b23-9088-81676904c5a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T23:59:32.339841+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="137712eb-2179-4d53-b67b-2c7e589dc11b-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T06:50:13.127426+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="137712eb-2179-4d53-b67b-2c7e589dc11b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T06:57:15.329305+00:00" -->
#### Claude
Committed on the branch. Now the merge-back.

Green after the merge. Fast-forwarding `xgd-working`:

REQ-324 is free-coded and landed on `xgd-working`.

## What was implemented

Both issues in `tools/generate/src/l1/probes.ts`, in the order the brief required.

**Issue 1 — flow leads measured from the border box.** `plan()` now seeds both the flow cursor and the leading-offset origin from the node's own *content* box (border box + its own `surfaceBorderInset`). `rewrite`'s `lefts`/`tops` are renamed `borderLefts`/`borderTops`, and the contract is stated once in its doc comment: an L1 child's `geometry.x/y` is relative to its parent's **padding** box. `childFrame` is unchanged, as the brief asked. Fixed on both axes, not just the x the one available reference could exhibit.

One consequence the brief didn't name: `evaluateLayout`'s `layoutInFlow` measured its flow interior from the border box inset by padding alone, while already donating the border inset to *absolute* descendants. A corrected lead read against an un-inset frame lands short — so the interior now insets by the node's own border too, and its natural content height adds both horizontal edges back.

**Issue 2 — a one-run panel never flowed.** `rewrite` now admits a single promotable pinned child of a fold-synthesized surface as its own one-member region, before the `components.length === 0` return. `keepsAbsolute` children stay unpromotable, which preserves BUG-142's collapse exemption (pinned by its own UAT). Second unnamed consequence: `withContentInset`'s slack subtracts the node's bottom border edge, which the border-box span doesn't already carry — zero on an accent rule, which is why the reference couldn't show it.

## Evidence

4 UATs in `tests/test_UAT_FC_REQ-324_a_bordered_panel_flows_from_its_content_box.test.ts` over an authored four-panel document (the recovery is demand-driven, and reference bundles aren't committed), using real `promoteToFlow` / `evaluateLayout` / `contentRobustnessProbe` / `renderL1Document`.

Verified offline against the real reference bundle by the brief's own two probes:
- `promoteToFlow` prints `RECOVER card-4 … x 32` (was 36), and `card-3`/`card-7` as `place flow` with their `29.25` heights gone.
- `1c l1-gate` tallies `offSample {'escape:card-5': 20, 'overlap:-': 4}`, `contentRobustness {'overlap:-': 186}` — `escape:card-3`, `escape:card-7`, `escape:section-band-2`, `escape:section-band-4` all 0, exactly the brief's "Right". card-5's 20 remain (REQ-302's).

The browser-backed `1c gate` end-to-end confirmation was **not** run — Chromium can't launch in this sandbox.

28 fold/layout/probe/gate suites green, plus `tsc --noEmit` on `tools/generate`; re-run green after merging `xgd-working` (which had landed BUG-148's region-lead work).

Ticket body was appended to — not replaced — with an implementation-notes section covering the three consequences beyond the brief, so the UATs are motivated by ticket language. Status `free_coded`, commits `a750b9376c` + the version bump, version `0.2.370`, 3 story points. Branch merged and cleaned.

<!-- xgd-chat-end -->