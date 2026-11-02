---
uid: comment-78b03714
id: COMMENT-6808
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-02T19:02:13.331013+00:00'
updated_at: '2026-11-02T19:02:13.331013+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-15de9048
  kind: note
---

I filed the iteration 3 fix plan as **REPORT-8996** (`report-15de9048`). It has one batch.

**Why the 19 ACs are orphaned:** none of their tests actually fail. The scoped run passed 11 of 11 tests, but two test files never loaded:
- `tests/reconciliation-system-knowledge-base.test.ts` (AC-1291 to AC-1305, AC-1632, AC-1633)
- `tests/reconciliation-system-knowledge-base-read-seam.test.ts` (AC-2235 and AC-2236, new this iteration from BUG-55)

Both import `tools/generate/src/cli`. That chain reaches `apps/control-app/src/ai.ts`, which imports `./generated/ai-workers.js`. That file is gitignored and only `1c assets` writes it, and nothing runs that before the quality run. In this worktree the shims were written about a minute after the failed run, which matches the timing in iteration 2.

**What changes this time:** in iteration 2 the builder found the same cause but made no edits, and recommended generating the shims before tests. The plan acts on that recommendation:
- Add a vitest `globalSetup` to the node project (`vitest.node.config.mts`) that runs the real generator when the shims are missing.
- If the generator can't run, the whole run fails loudly instead of skipping.
- `generated/` must stay untracked; AC-1427 checks this and is included as a dependency test.

**Ladder:** decided at rung 3. The tests stand and no production code changes, because the import chain is intended at the reference ref. The builder reported no `blocked_by`, so the plan has no override or ruling.

**Weak-evidence flag:** after iteration 1's edit, the AC-1297 test passes without checking anything against the real store, because no real document has `doc_kind: system_kb` yet.

`test_scope` uses only exact `test_UAT_AC<N>_` tokens: the 19 orphans, the story's other ACs, and AC-1427.

The report is created locally. While it was being filed, the sandbox blocked an outbound connection to `github.com:22`, so if `xgd` tried to push it, that push did not happen.
