---
uid: report-afa81f3e
id: REPORT-1150
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-03T05:07:43.255928+00:00'
updated_at: '2026-08-03T05:07:43.255928+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-4ff83a8b
---

All issues from the review are addressed and verified.

## Issues fixed

**Critical — stale reproduction artifact**
`storage/sites/gigabytealchemy/draft/pages/home.json` — migrated all 33 nodes carrying the retired anchor shape to the `{x, width}` term model shipped in the same bundle (`startPx→x.px`, `startFraction→x.fraction`, `widthPx→width.px`, `widthFraction→width.fraction`). No capture bundle is checked in (`storage/references/` is gitignored, line 146), so the mechanical migration was the available path, exactly as the review's fallback specifies. I verified the file's serialization is exactly `JSON.stringify(doc, null, 2) + '\n'` and round-trips identically, so the diff contains only anchor reshaping. `1c render gigabytealchemy` now exits 0; zero retired keys remain in `storage/`. The `borderLeft.widthPx` occurrences that remain are the legitimate border axis, not the anchor key.

**Warning — no guard on committed L1 documents**
`tests/reconciliation-l1-responsive-and-column-axes.test.ts:951` — added `test_UAT_AC765_committed_site_documents_satisfy_the_l1_envelope` under AC-765 (the AC owning the column/anchor axes whose schema change caused the defect). It walks every JSON under `storage/sites` recursively — a superset of the draft + revisions paths the review asked for — validates each doc carrying an `l1` key, and reports the offending file path plus the first 5 `path :: message` errors. It also asserts the L1 doc set is non-empty so the guard can't go vacuous. **I confirmed it actually catches the defect**: reintroducing a single stale `widthFraction` made it fail with the file named; restoring made it pass.

**Nit — duplicated validator traversal** (`packages/site-schema/src/l1/validate.ts`)
Folded the dangling-anchor pre-pass into `walk()` via a `hasColumn` parameter and deleted the second walker. `children` recursion now appears once (line 363) instead of twice. Checked first that no test depends on error ordering — both dangling-anchor assertions use `.some()`, AC-687 uses `toContain` on paths.

**Nit — inlined font-barrier budgets** (`tools/generate/src/cli/capture/playwright-driver.ts:33-45`)
Hoisted to named `FONT_LOAD_BUDGET_MS = 4000` / `FONTS_READY_BUDGET_MS = 2000` and interpolated; the emitted in-page script is byte-identical.

**Nit — untyped omit** (`tools/generate/src/l1/forms.ts:180`)
`submitSlotFrom` now uses a rest-destructure instead of two casts through `unknown`. `geometry`/`visibility` are optional on every union variant, so this typechecks with no cast at all.

## Verification

| Check | Result |
|---|---|
| `1c render gigabytealchemy` | **exit 0** (was exit 1) |
| `1c --help` | exit 0 |
| `tsc --noEmit` × site-schema, framework, generate | **all exit 0** |
| `npx vitest run` (full) | **868 passed, 1 failed** |

## One thing I did not fix, and why

**The remaining suite failure is not mine and is not a regression.** `tests/bug17-fold-padding.test.ts` needs `storage/references/gigabytealchemy.ai/index/multistate.json`, which is gitignored and was never committed. I proved it pre-exists by stashing both my files and re-running at clean HEAD — identical `ENOENT`. It's an environment dependency on a local capture bundle absent from this worktree. Note the scoped run the review cites (117 passed) deselected it. Separately, it is still `test_UAT_FC_BUG-17_*`-named, which looks like an FC-orphan question for the reconciliation review loop, not this one — and I'm scoped out of matrix changes.

**Review warning #2 (unwired lint/build gates) I deliberately left alone.** Wiring it means adding eslint config + dependency across the monorepo and a root build/typecheck script — a large infrastructure change that would surface a cascade of pre-existing violations mid-fix-loop. It's also outside the Fix-It Prompt's stated scope ("two changes"), and `.xgd/quality.yaml` in a branch worktree is synced from `xgd-working` at workflow start, so an edit here would be inert and against the project's config rules. Flagging it as genuinely open for an operator decision.

## Confidence

**High** for the critical issue and the guard warning — both are directly verified against the exact commands the reviewer ran, and the guard is proven to fail on the defect rather than merely asserted. The main residual risk is the reviewer treating the pre-existing `bug17` failure as a gate failure; the stash-and-rerun evidence above should settle that, but it depends on the environment supplying the gitignored capture bundle.
