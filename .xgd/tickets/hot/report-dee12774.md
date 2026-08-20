---
uid: report-dee12774
id: REPORT-2314
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T02:25:11.904121+00:00'
updated_at: '2026-08-20T02:25:11.904121+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- `package.json` — config/scalar conflict (UU), version line only.
  - Ours (HEAD, `xgd: sync from xgd-working 097e8bc90814 (post-watermark)`): `0.1.59`
  - Theirs (`caeb60b40`, `fix(builder): preview a run's glyph gradient instead of its transparent colour [FREE-CODED]`): `0.1.39` → `0.1.40`
  - Rule applied: **later commit by timestamp wins** (enrichment rule for unknown intent on one side). HEAD's sync commit is chronologically later than the incoming free-coded commit, and `main` has advanced 19 patch versions past the incoming bump. Kept `0.1.59`. Taking the incoming side would have regressed the project version.
  - Flagged for post-merge review per the enrichment rule — though the risk is nil here: the incoming bump is a monotonic version counter already superseded, not developer logic.

No other conflict classes were present. `git status --porcelain` is now empty; the resolution is staged.

## Incoming changes preserved

`caeb60b40` touched four paths. The three code/test paths applied with **no conflict and no residual diff** — they were already present at HEAD, landed earlier through the post-watermark sync path.

Verified by content comparison, not by inspection:

```
git diff caeb60b40 HEAD --stat -- \
  apps/control-app/src/builder/page-style.js \
  apps/control-app/src/builder/builder.css \
  tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts
```

→ empty output: HEAD's content for all three files is byte-identical to the incoming commit's content.

- `apps/control-app/src/builder/page-style.js` — identical at HEAD. `readGlyphFill()` and the `readTypography` glyph-paint carry-across are present.
- `apps/control-app/src/builder/builder.css` — identical at HEAD.
- `tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts` — identical at HEAD. No UAT function was deleted or altered; all 220 lines of the incoming test file are in the tree.
- `package.json` — the only file where a side was chosen. The incoming change here is a version bump, not developer code; discarding it in favour of the strictly-greater HEAD version preserves intent.

## Net effect

The resolved tree is identical to HEAD (`git diff HEAD` is empty) — the BUG-34 glyph-fill-preview fix already reached `main` by a different path, so this pick contributes no new content. Per the stage instructions, `--skip` was **not** called: the resolution is staged and `CHERRY_PICK_HEAD` (`caeb60b40`) is intact for the finalize step, which detects the clean staged diff and skips the commit.
