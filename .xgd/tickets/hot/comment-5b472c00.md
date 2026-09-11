---
uid: comment-5b472c00
id: COMMENT-2641
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T00:36:26.631733+00:00'
updated_at: '2026-09-11T00:36:26.631733+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-35f630e7
  kind: note
---

**REPORT-3822 (`report-35f630e7`) — PASS.** 0 violations, 1 warning, 0 needs_review.

**What I checked.** All 23 intents in the ledger re-fetched: every one `free_and_reconciled`, none abandoned/deprecated, so Step 2.5's stale-vehicle case never arises. No intent has touched either story since BUNDLE-19 (2026-08-18). All **54 active ACs** (14 under STORY-98, 40 under STORY-101) have an AC-named test; none rests on a structural/AST-only check.

**The three violations from REPORT-3819 are genuinely closed** — verified by reading the committed test source, not by trusting the fix summaries:
- **AC-1039** — `form-presentation.test.ts:768–792` now asserts the sheet's `.fields-label` and `.builder-color__label` sets equal the origin's labels, exact in both directions, partitioned on the descriptor's `type`. A global label drop can no longer pass.
- **AC-997** — `image-picker.test.ts:701` drives all three controls (tile, alt text, a bounded framing axis read from the origin's descriptors), asserts one POST carrying all three, and deletes the old whole-`axes` equality that was the clause's deliberate opposite.
- **AC-1123** — `sheetOrder()` asserted against the descriptor sequence for the run (`:506`) and again for the picture (`:577`), where the sheet demonstrably mixes control shapes.

Warnings 5 (AC-1040's transparent-colour backstop) and 6 (AC-1050's colour-lands and unpainted-container clauses) are closed too. `git status` is clean; the two fix commits touch only test files.

**The one open finding** is AC-1044's leading bullet — *"a region exposing two fields to the box"*. No test exercises it, and I established no test can: `packages/site-schema/src/l1/edit.ts` derives exactly one `type: 'string'` field per region kind (`text` at `:980`, `alt` at `:1000`, none for painted containers), and `l1SegmentFields` has no `'module'` branch at all. The only available repair is an **ac-edit** recording that no region does this today — an ac-level action, not a uat one. REPORT-3821's "Warnings remaining: 0" overlooked it.

**Two caveats you should weigh.** Seven of the twelve suites here start a listening origin and every one dies at `listen EPERM 0.0.0.0` — vitest reports 4 failed *files* with 24 tests skipped and none run. That's the sandbox, not the code; the five socket-free suites execute and pass 20/20. So my reading of those seven suites is source-verified, not execution-verified in this session, and the fixers' claim of ~150 passing tests is neither confirmed nor contradicted here. Separately, `node_modules/@lagrangefoundry` is a gitignored symlink to a store above the worktree — without it every `WEBUI_INSTALLED`-gated assertion skips while the suites still report green.
