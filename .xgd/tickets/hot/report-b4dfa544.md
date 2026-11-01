---
uid: report-b4dfa544
id: REPORT-7699
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:17:29.228085+00:00'
updated_at: '2026-11-01T15:17:29.228085+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `package.json`: config/code file (UU), one conflicting hunk on the scalar `"version"` field. HEAD had `0.2.69` (from "Merge branch 'free-REQ-179' into xgd-working", 2026-11-01). Incoming had `0.2.64` (from 42c983dc30, "Merge branch 'free-BUG-50' into xgd-working", 2026-09-03). Kept HEAD's `0.2.69`. Rule: the enrichment's "take the more recent commit by timestamp", and HEAD's commit is about 2 months newer. Taking the incoming value would also move the version backwards (0.2.69 → 0.2.64), and 0.2.64 has already been superseded by later bumps on the working timeline. Conflict markers are removed, the file parses as valid JSON, and it is staged.

## Incoming changes preserved

42c983dc30's only other change in package.json is `"dev:control": "./bin/1c builder"`. It merged cleanly and is present in the resolved file. Its other files (apps/control-app/package.json, tools/generate/src/cli/dev-env.ts, tools/generate/src/cli/index.ts, tests/test_UAT_FC_BUG-50_builder_env_files.test.ts) are byte-identical between 42c983dc30 and HEAD (`git diff 42c983dc30 HEAD` is empty for them). So this commit is redundant on this branch: everything it does (BUG-50) has already landed. The staged diff against HEAD is empty, and the finalize step should skip the commit (BUG-1109/BUG-1122 shape). No developer code was discarded. The only value not taken is the stale version number.
