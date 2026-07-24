---
uid: comment-b2175fc6
id: COMMENT-394
type: comment
title: Comment on bug BUG-8
created_by: xgd
created_at: '2026-07-23T17:23:40.393055+00:00'
updated_at: '2026-07-23T17:32:20.972679+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3aa2d0c9
  kind: chat_transcript
---

<!-- xgd-turn id="fb1e491e-462f-4d9f-bb7c-21675a565cd5-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T17:23:38.193371+00:00" -->
#### You
Please free code a fix to this

<!-- xgd-turn id="fb1e491e-462f-4d9f-bb7c-21675a565cd5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T17:32:20.941507+00:00" -->
#### Claude
I'll start by reviewing the current ticket state and understanding the code involved in this bug.

The ticket has a detailed root cause. Let me examine the relevant code.

The headings have distinct text keys, so they align fine. The bug must involve other elements. Let me reproduce the actual failure to see the 13 residuals.

Let me run the actual gate to see the concrete residuals.

The CLI has a pre-existing build issue. Let me reproduce through the vitest harness instead, which uses vite transforms.

Let me reproduce the failure with a quick vitest scratch test using the real gigabytealchemy capture.

Now let me write a scratch test to reproduce the exact 13 residuals from the real capture.

Console output is suppressed. Let me write results to a file.

The gate currently **passes** with 0 residuals. This is surprising given the ticket. Let me check the folded keyframe tracks and whether the capture changed.

The most recent commit touches snap-at-breakpoint. But my scratch passes. Let me check what `cmdL1Gate` actually does — it may differ from my reproduction.

The `sampleFidelity` path in `cmdL1Gate` matches my scratch exactly, and it passes. Let me check the commit ordering — whether the recent "fix snap-at-breakpoint evaluator" landed before or after the ticket was filed.

Ticket was filed 8 min *after* the snap fix. Yet my reproduction passes. Let me inspect the actual folded keyframe track for the cards to confirm what's really happening.

The cards now have correct 768 keyframes — positivity's is exactly `(299,1831,171)`, matching the oracle. The bug does not reproduce on current HEAD. The most recent commit "fix snap-at-breakpoint evaluator" is suspicious. Let me verify whether it's the fix by testing against its parent.

This is the key finding. Commit `6ebc8ee8` (REQ-92) **already root-caused and fixed "Finding 2 (768px cascade)"** — the exact bug BUG-8 describes. The fix was the half-open interval `[a.at, b.at)` in `evalGeometry`, landed 8 minutes *before* BUG-8 was filed.

Critically, the ticket's hypothesized root cause (buildResponsiveTable dropping the 768 cell) is **wrong**: the data shows positivity's 768 keyframe is present and exact `(299,1831,171)`. The real cause was the evaluator's closed-interval matching, already fixed. Let me confirm the full gate and idempotency suites are green.

All green. Now let me build the regression test the ticket asks for. First I need to understand the synthetic capture shape for `foldToL1`.

court
<invoke name="Bash">
<parameter name="command">cd /Users/martin/Projects/1stcontact; ls tools/generate/src/cli/capture* 2>/dev/null; find tools/generate/src -name "capture*"; echo "=== types ==="; grep -rn "interface MultiStateCapture\|interface StateProjection\|interface ValueManifest\|interface ValueElement" tools/generate/src/cli/capture/ 2>/dev/null</parameter>
<parameter name="description">Locate capture module</parameter>
</invoke>Now I understand the shapes. Let me check how the existing bug tests name their UAT functions.

The bug is already fixed by REQ-92; the ticket's hypothesized cause was wrong. The right deliverable is the **reflow-at-breakpoint regression guard** the ticket explicitly asks for. Let me check `evaluateLayout`'s leaf shape, then write it.

Now I'll write the regression test. Let me remove the scratch file and create the proper test.

All 3 pass. Now let me confirm the test actually **catches** the regression by temporarily reverting the half-open interval to a closed one, then restore it.

The test correctly catches the regression — 2 of 3 fail with the closed interval (the keyframe-presence test rightly stays green, since the fold is unaffected). Let me restore the file.

Restored and green. Now let me run the regression scope — the fold/probe/gate suites plus static guardrails.

All 37 pass. Now the free-coding ceremony. First, bump the version.

Note there's a stray `tests/_scratch_bug9.test.ts` (not mine — belongs to another session's BUG-9 work); I correctly left it out. Let me verify my commit contents, then update the ticket body.

Now update the ticket body to reflect the verified reality, then move to free_coded.

Done. Here's what I found and did.

## The bug was already fixed — I added the guard

**BUG-8 (Finding 2, the 768px cascade) was already resolved by REQ-92** (commit `6ebc8ee8`), which landed 8 minutes *before* this ticket was filed. On current HEAD the gigabytealchemy `sampleFidelity` probe passes at 768 and every other width, 0 residuals.

**The ticket's stated root cause was wrong.** It hypothesized that `buildResponsiveTable` drops the reflowed 768 cell so the card loses its keyframe. The data disproves that — the three card headings key on distinct text, align cleanly through the reflow, and each keeps its exact 768 keyframe (`Positivity → 768:(299,1831,171)`, matching the oracle). Capture and fold were always correct.

**The real cause** was in the analytic `evalGeometry`: it matched a geometry segment *ending* at a breakpoint with a **closed** upper bound (`width <= b.at`), so at exactly 768 the `snap` segment ending there returned the held lower (375) frame and cascaded the page below. REQ-92 changed it to the half-open `[a.at, b.at)` interval (renderer's highest-`min-width`-wins semantics).

So no production fix was warranted — fabricating one would be dead code. Instead I delivered the ticket's explicit acceptance criterion: **the reflow-at-breakpoint regression guard**.

## What I committed (free-coded, `free_coded`, v0.0.180)

`tests/bug8-reflow-breakpoint.test.ts` — 3 UATs (`test_UAT_FC_BUG-8_*`) driving a synthetic stack→row reflow at 768:
1. every card keeps a keyframe at the reflow breakpoint (fold doesn't drop the cell),
2. the reflowed frame wins at the exact breakpoint — never the held lower frame,
3. `sampleFidelity` clean at every width.

I verified the guard bites: reverting the interval to closed turns 2/3 UATs red (the keyframe-presence UAT correctly stays green — the fold is unaffected). Full fold/probe/gate regression scope: **37/37 pass**.

Ticket body updated to the verified reality; commit `b59b9c4f` recorded; story_points 1.

Two notes:
- The ticket **title** still asserts the disproven "Fold drops the reflowed cell" hypothesis. I left it as-is per the title rule, but it's now misleading — want me to rename it to something like *"Reflow-at-breakpoint 768px cascade (fixed in REQ-92) — add regression guard"*?
- There's an untracked `tests/_scratch_bug9.test.ts` in the tree — not mine (BUG-9 work), so I left it alone.

<!-- xgd-chat-end -->