---
uid: report-6c7cb35c
id: REPORT-3593
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:58:54.139596+00:00'
updated_at: '2026-09-09T23:58:54.139596+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `package.json` — UU, config/scalar conflict (2g + enrichment rule "take the more
  recent commit by timestamp"). Sole conflicted hunk was the `version` scalar:
  HEAD `0.2.20` (commit 510d4082, `[FREE-CODED] REQ-162 — version 0.2.20`,
  2026-08-31 14:41 -0700) vs incoming `0.2.11` (merge de71981f,
  `Merge branch 'free-BUG-37' into xgd-working`, 2026-08-24 14:42 -0700).
  Kept HEAD's `0.2.20`: it is both the later commit by timestamp and the higher
  version. The incoming `0.2.10 → 0.2.11` bump is release bookkeeping, not
  developer code intent; regressing to `0.2.11` would move the package version
  backwards. Resolved with `git checkout --ours -- package.json`, then
  `git add -- package.json`.

No other conflict-class entries existed in the tree (`git status --porcelain`
showed only `UU package.json`; everything else was untracked `??` noise).

## Incoming changes preserved

The incoming commit de71981f touched three files. The two substantive ones
merged cleanly and were verified to be present in HEAD already:

- `tools/generate/src/store/d1r2-store.ts` — incoming adds the per-isolate
  `ASSEMBLED` memo for BUG-37 (`const ASSEMBLED = new Map<string, { version:
  number; result: LoadResult }>()`, `assembledKey()`, and the accompanying
  doc comment). Verified present in HEAD via
  `git grep -c 'const ASSEMBLED = new Map' HEAD -- tools/generate/src/store/d1r2-store.ts`
  → 1 hit. `git diff --stat HEAD -- tools/generate/src/store/d1r2-store.ts`
  is empty, so no conflict and nothing dropped.
- `tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` — present in
  HEAD (`git ls-tree -r --name-only HEAD` lists it). No test function from
  either side was deleted.

- `package.json` — the only file where incoming's change was not carried over,
  and the change in question is exclusively the `version` scalar. This is not a
  discard of developer code: the incoming commit's actual BUG-37 work is already
  in HEAD (above), and per the resync scalar rule the higher/later version on
  HEAD is kept.

Net effect: the staged tree matches HEAD (this commit's substantive content
already landed through an earlier sync). Per STEP 4 this is the redundant-commit
case, not the discarded-commit case — STEP 3's check passed because the incoming
commit's key changes are demonstrably *present* in HEAD rather than absent.
Staged and exiting @done without calling `--skip`; the finalize step will detect
the clean staged diff. `CHERRY_PICK_HEAD` was left intact — no
`cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>`
was run.
