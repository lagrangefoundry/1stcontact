---
uid: comment-d8a8d7d1
id: COMMENT-1088
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T07:48:45.474046+00:00'
updated_at: '2026-08-16T07:48:45.474046+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a9ff561a
  kind: note
---

**REPORT-2089** (`report-a9ff561a`) — **FAIL**: 6 violations, 3 warnings, 0 needs_review.

## What I found

**STORY-86's AC tree is nearly clean** — one genuine coverage hole:

1. **Pinned-box content overflow is uncovered** (*4th raise*: REPORT-1319 → 1658 → 1730 → now). STORY-86's body names three envelope violations; `probes.ts:405-416` emits the third (`content height Npx exceeds pinned box height Mpx`); every AC that enumerates violations names only overlap and viewport clip. This one is fully repairable at ac level with no story-level dependency.

**STORY-84's AC tree carries the wave** — five findings tracing to BUNDLE-8/BUNDLE-10 intents that shipped in `fold.ts` and never reached the matrix (neither story records those bundles in its attribution chain):

2. **AC-731 contradicts shipped code** — states per-run backing boxes (BUG-14 retired that; `buildCards` groups by measured surface identity, `fold.ts:1599-1666`), states page base by run count (code uses greatest total band height, `fold.ts:2105-2130`; run count is only the fallback), and misses BUG-19's bar rule. A faithful UAT would pin the behaviour BUG-21 blamed for 2x-height buttons.
3. **AC-691 is incomplete vs BUG-18** — true but presents the widest-sample rule as the whole account; the responsive text tracks (`fold.ts:607-642`) are expressed by no AC.
4. **No AC mentions padding** (BUG-17/REQ-88, `foldPadding` + `responsivePaddingTracks`, three call sites each) — zero matches across all 34 AC bodies.
5. **No AC covers the self-painting run** (BUG-20/BUG-21, `isSelfPaintingRun`/`chipAxes`) — and AC-731 positively states the contrary rule.
6. **No AC covers the viewport-height response** (REQ-88 height probes → `{yFactor, heightFactor}`) — *new at this level*; the fold's second measurement axis is unexpressed.

Warnings: AC-710's text-only residual wording diverges from AC-705 (which says "text or kind label"); AC-705/AC-710 duplicate the report-shape authority; AC-729/AC-733 both specify and prescribe the source-less-media residual.

## Two things worth your attention

**REQ-136 is clean.** AC-1133/AC-1134 (added 2026-08-12) express its asks precisely, including the deliberate shadow-as-filter exclusion. No finding against them.

**This is the seventh attempt, and findings 2–6 cannot be closed at ac level alone.** STORY-84's body was last written 2026-08-12 and still describes the retired per-run model; today's story-level cycle (REPORT-2088, FAIL, 5 violations) filed exactly these four with `ac-edit`/`ac-add` follow-ups named. The two levels need repairing together — I flagged in the notes that if the ac-level editor can't touch story bodies, the residual inconsistency must be recorded explicitly rather than left implicit, since that omission is the likely reason this keeps recurring.

Every code claim was read in this worktree rather than inherited from the prior report; all 34 AC bodies were fetched and searched programmatically for each cited term.
