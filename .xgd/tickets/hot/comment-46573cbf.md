---
uid: comment-46573cbf
id: COMMENT-3965
type: comment
title: Comment on bug BUG-151
created_by: xgd
created_at: '2026-09-26T20:20:48.588917+00:00'
updated_at: '2026-09-26T21:17:25.529229+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-be428558
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "785b6f07-105d-4e8b-b99e-c16cce6e8194",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ceb7829c-0875-479c-8e8c-af73a4d48fb4-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T20:19:16.319066+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ceb7829c-0875-479c-8e8c-af73a4d48fb4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T20:53:11.283735+00:00" -->
#### Claude
Ticket is detailed and unambiguous on the three defects. Let me start the process.

Now the values-diff pairing fix:

Now the UAT file:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="f7b9af9d-d05f-4c8c-92fb-b8e920517a28-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T20:54:38.324786+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="f7b9af9d-d05f-4c8c-92fb-b8e920517a28-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T21:17:25.032777+00:00" -->
#### Claude
I'll start by reading the ticket and checking the current state of the work.

A branch already exists from the prior session. Let me check its state.

The branch has no code commits — the prior session's work was lost. Let me read the rest of the ticket (issue 3) and check the source.

The branch is behind `xgd-working`. Let me bring it current.

Now implementing. Fix 1 — the layout-viewport width:

Now fix 3 — bounding the role ancestor walk in `semanticOf`:

Now fix 2 — the geometric join for unnamed textless fields:

Backticks break the template literal. Let me fix the comments I added inside `EXTRACT_SCRIPT`:

That over-reached — existing lines escape their backticks as `\``. Reverting and re-applying cleanly:

Now the UAT file:

All pass. Now verifying they actually fail against the pre-fix code (RED evidence):

Now the regression sweep across every capture / values-diff suite:

Let me verify the issue-2 fix against the round's real manifests (values-diff is pure, so stored manifests are re-runnable):

Real-data confirmation on the round's own manifests. Now updating the ticket body with the implementation record:

Now merging back to `xgd-working` under the shared lock:

BUG-151 is free-coded and landed on `xgd-working` at `0efbf668ed`, version `0.2.381`, ticket at `free_coded`.

## What changed

**Issue 1 — `extract.ts`**: `docW` (a *scroll* width) was doing two incompatible jobs. It now keeps only the one it's right for — bounding the visible region — and a new `layoutW = DOC.clientWidth || docW` answers "does this box span the page" at both full-bleed predicates. `clientWidth` rather than `innerWidth` because `innerWidth` includes the scrollbar gutter and a `width:100%` band doesn't; the `|| docW` fallback means no conventionally laid-out document can change verdict. Two things the ticket didn't name but that follow: a qualifying slice is now *recorded* at `layoutW` (leaving it at `docW` would just have traded nine false `missing` deltas for eleven false `size` ones), and the degenerate-single-band trigger reads `layoutW` too.

**Issue 2 — `values-diff.ts`**: added `boxIoU` (2D twin of the existing `verticalIoU`) and a 0.25 floor. An unnamed textless field now joins on its box, and below the floor declines to pair — honest `missing` over invented values. The name join keeps precedence, and it's inert for a pre-`box` manifest.

**Issue 3 — `semanticOf`**: the `[role]` branch is now an allowlist of roles a text run could legitimately *be*; landmarks and groupings are invisible to the walk. Added guard the ticket didn't name: an element's *own* role still wins, since reaching *through* a grouping role is the defect, not honouring one.

## Evidence

14 UATs in one file; **8 fail against the pre-fix source**, the other 6 are no-regression guards that pass on both sides. Regression scope — every suite importing `EXTRACT_SCRIPT`, `diffManifests`, `flattenSignals`, `isBandPaint` or reading `a11yRole` (66 files, three batches): **533 passed, 51 skipped** (Chromium-gated). `tsc --noEmit` clean.

Issue 2 also verified against the round's **own manifests** (values-diff is pure, so they re-run directly): 120 → 114 deltas, the eight false `(generic)` values gone including the headline `position @ (0,0) -> @ (0,2624)` — and two *real* residuals surfaced from behind the mispairing (a 44px displacement, a 43px gap error), which is the clearest sign that declining to pair measures more, not less.

## Two things to flag

**Issues 1 and 3 are not verified end-to-end on this round.** Both are extractor-side and the stored `actual-manifest.json` is a pre-fix extraction, so your `1c gate` / `1c values-diff` numbers can't move without a re-extraction. Chromium doesn't launch here (blocked at the Mach bootstrap level), so their evidence is jsdom UATs driving the real `EXTRACT_SCRIPT` over fixtures built to the measured shapes. Your own gate run is what confirms the round-level numbers.

**I did not add `1c reextract`.** Your issue-3 caveat is right that it's what makes extractor fixes observable against bundles on disk, but it isn't a one-line verb: to be useful it has to decide what it rewrites inside the bundle (`capture.json` alone leaves `multistate.json` carrying the stale `group`, so a re-fold has to follow), and that's a product decision about bundle mutability. Putting an unverifiable browser-only CLI surface inside a defect fix seemed the wrong trade — happy to scope it separately if you want it.

<!-- xgd-chat-end -->