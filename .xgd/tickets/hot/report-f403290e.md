---
uid: report-f403290e
id: REPORT-1384
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-06T04:27:39.327789+00:00'
updated_at: '2026-08-06T04:27:39.327789+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-ee56a66e
---

All four gaps are closed and the suite is green. Final state:

## Summary

**Stories created**: none — no uncovered behavior; every gap was evidence, not documentation.

**Stories modified**
- `story-d5de22a5` (STORY-75) — **Gap 2**. Its four dormant ACs were activated and given UAT evidence; `uat_coverage` refreshed `fail` → `needs_review` (matching its peers updated by this bundle). All 14 of its ACs now carry `test_UAT_AC<N>_*` coverage.
  - **AC-815** `active` ← 2 UATs (collapsed-header subtree, off-canvas block clamp)
  - **AC-816** `active` ← 8 UATs (nested backdrop, fill beneath image, full-bleed vs card, translucent scrim, and the four fold UATs)
  - **AC-817** `active` ← 3 UATs (missing / mirrored-basename / wrong asset)
  - **AC-818** `active` ← 1 UAT (`capture_skips_module_invariant_elements`, from the REQ-96 file — that is where the invariant evidence actually lives, not in the BUG-27 file the review pointed at)
- `story-24098299` (STORY-86) — **Gap 3**. **AC-705** and **AC-737** bodies restated to the post-REQ-96 fold shape: a captured control is no longer dropped *and* no longer a `field` residual — it binds to its behavior module's seam. The contradiction with AC-733 is gone.

**Stories deleted**: none.

**Code changes**
- `packages/site-schema/src/issues.ts` **(new)** — **Gap 1**. Union-error localisation. The node vocabulary is a `z.union`, so any shape failure inside a node collapsed to a bare `/root — Invalid input`. `projectIssues` discovers the discriminator empirically (the key whose mismatch excluded every branch but one), recurses into the surviving branch, and composes paths — so a smuggled `keyframes` now reports at `/root/reveal`, a nested one at `/root/children/0/reveal`. Ambiguous unions are left untouched rather than guessed at.
- `packages/site-schema/src/l1/validate.ts`, `packages/site-schema/src/validate.ts` — both validators project through it.
- `tests/reconciliation-l1-language.test.ts` — AC-726's assertion encoded the very limitation I removed (`toContain('/root')`). Strengthened, not relaxed: each malformed axis now asserts its exact offending path *and* that the message names the refused key.
- `tests/reconciliation-3probe-gate.test.ts`, `tests/reconciliation-3probe-gate-evaluator.test.ts` — AC-705/AC-737 expectations moved to the post-REQ-96 shape (`slot` leaf present; `field` residual asserted **absent**, count 3 → 2).
- `tests/reconciliation-1c-astro-free-render.test.ts` — **Gap 4**. `seedModules` was doubly stale: no `slot` binding, and a `config.view` REQ-96 deleted. Now mounts into a named L1 slot.
- `tests/bug27-nested-backdrop-capture.test.ts`, `tests/req96-control-composition.test.ts` — 14 FC-named UATs renamed to their AC numbers; describe labels re-homed to `story-d5de22a5`.
- `tests/req96-control-composition.test.ts`, `tests/bug17-fold-padding.test.ts`, `tests/req101-font-registry.test.ts` — the **Advisory**: 4 UATs read the gitignored `storage/references/` tree and could never pass in a clean worktree. Gated with `it.skipIf(existsSync(...))`, the same pattern the repo already uses for Chromium. Nothing weakened — they assert exactly as before where the oracle exists.

**Verification** (ran, did not assume): full `pnpm vitest run` → **931 passed, 0 failed, 67 skipped, 144 files**, up from 927/8/63. The 4 AC-named failures (AC-820, AC-705, AC-737, AC-739) are fixed; the 4 environment-blocked FC ones now skip. `pnpm -r build` passes. Code edits are in the working tree; ticket edits auto-committed.

**Confidence: high** for Gaps 1, 3, 4 — each was a specific failing assertion, now passing, with the fix landing on the side the review recommended. **Moderate** for Gap 2: the ACs are active and every one maps to passing UATs, but two judgment calls are visible to a re-reviewer — I mapped the four *fold* UATs to AC-816 (they also duplicate AC-812's stronger UAT, so a reviewer may prefer them deleted as redundant), and I sourced AC-818's evidence from the REQ-96 file rather than the BUG-27 file the review named. Both are defensible; neither leaves an AC unevidenced. One thing I could not do: the review noted STORY-75 has no report from this run, and I have no way to produce a workflow report from here.
