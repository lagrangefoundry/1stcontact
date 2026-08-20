---
uid: comment-8c158ed7
id: COMMENT-1310
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T13:11:57.212328+00:00'
updated_at: '2026-08-20T13:11:57.212328+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-67e7e4cb
  kind: note
---

Attempt 9 complete — all three findings of `report-81bbe352` resolved with 5 AC mutations, no story-body edits and no new ACs (neither was needed at this level).

**Violation 1 — AC-736 (consistency).** The exemption was described by *shape* ("a childless box carrying a card/panel/section fill"), which also fits a genuinely captured standalone panel. The code (`probes.ts:465-474`, `fold.ts:892-897`) exempts only `slot` leaves and `box` leaves whose id passes `isSynthesizedSurfaceId`. The criterion is now keyed on the fold-synthesized identity, carries the corollary from STORY-86's Technical Context (a captured standalone surface is real painted content and still participates in the overlap check), and its Verification requires the discriminating assertion: two intersecting *captured* surface boxes **are** reported while a synthesized backing surface under its own content is not. Title updated to match.

**Violation 2 — AC-710 + AC-706/AC-707 (coverage).** Pinned-box content overflow (`probes.ts:405-416`) had no AC. AC-710 now enumerates all three envelope violations and gives the third its shape — `kind: 'clip'`, detail naming both heights, path of the *container* rather than a leaf inside it — with a positive case and two negatives in Verification. AC-706/AC-707 stated the envelope as "clips beyond the viewport", strictly the `:449-458` check; both now state the evaluator's full envelope. AC-707 gained a dedicated pinned-container clause, which is load-bearing: `:295-343` scales leaf heights by `contentScale` but a container's pinned height at line 408 is read unscaled, so grown interior content genuinely overruns it.

**Warning 3 — AC-731 (coverage).** The self-painting run was stated but never verified. The criterion now leads with the positive half (fill, radius, border, shadow ride on the text leaf, radius clamped into the length envelope), and Verification covers both families and both directions: pill, padded control, contributes-no-evidence, and not-over-applied (horizontal-padding-only plus the gradient and `border-left` guards).

No code or test edits — every behaviour was located in shipped code first, matching the report's note that nothing here is a `code-issue`. One thing I did **not** do, flagged in the completion report: these edits widen what the ACs demand of their UATs and the shipped tests don't yet meet it — no test greps for `exceeds pinned box height` at all, and `test_UAT_AC736_...` asserts nothing about captured standalone surfaces. I left `uat_coverage` untouched since flipping it isn't an ac-level lever, so those gaps are listed in the report for the uat cycle.
