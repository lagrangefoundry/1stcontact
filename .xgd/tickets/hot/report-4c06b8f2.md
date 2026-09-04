---
uid: report-4c06b8f2
id: REPORT-3416
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:02:36.949247+00:00'
updated_at: '2026-09-04T00:02:36.949247+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `package.json` — UU (both modified), config/manifest scalar conflict. Single
  conflicting hunk: the `version` field, nothing else in the file.
  - Ours (HEAD, `e322692c9f`, Mon Aug 31 15:08:35 2026): `0.2.22` — a
    bookkeeping bump because 0.2.21 had been claimed at the working tip by a
    concurrent ticket auto-commit.
  - Theirs (incoming, `115f0d39ec`, Mon Aug 31 15:16:24 2026): `0.2.20` →
    `0.2.23`, the version stamp carried by the REQ-159 project-KB feature
    commit.
  - Rule applied: 2g (config scalar — incoming wins), reinforced by the
    enrichment's "take the more recent commit by timestamp." Incoming is the
    later commit (15:16 vs 15:08), and 0.2.23 is also strictly higher than
    HEAD's 0.2.22, so the version stays monotonic. A search of all commit
    subjects found no other commit claiming 0.2.23, so this does not collide
    with a concurrent bump.
  - Resolution: `"version": "0.2.23"`.

No other conflict classes were present — `package.json` was the only UU, and
there were no AA/DU/UD/AU/UA entries. The rest of the cherry-pick applied
cleanly (`apps/control-app/src/knowledge.ts`,
`apps/control-app/src/tickets.ts`, `apps/control-app/wrangler.toml`,
`kb/knowledge_bases.json`, `tests/support/stub-embedder.ts`,
`tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts`,
`tests/test_UAT_FC_REQ-159_project_kb_config.test.ts`,
`tools/generate/src/cli/assets.ts`, `tools/generate/src/cli/kb.ts`).

## Incoming changes preserved

- `package.json`: `git show 115f0d39ec -- package.json` shows exactly one hunk,
  `-  "version": "0.2.20",` / `+  "version": "0.2.23",`. The resolved file
  contains `"version": "0.2.23"`, so the incoming change is present in full.
  Nothing from the incoming side was dropped.

No hunks were dropped under the BUG-1301 precedence exception; none applied.
No UAT test functions were touched — the three incoming test files
(`tests/support/stub-embedder.ts`,
`tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts`,
`tests/test_UAT_FC_REQ-159_project_kb_config.test.ts`) staged cleanly as adds
without conflict.

## Note for post-merge review

The enrichment flagged `package.json` for post-merge review because intent was
unknown on one side. The substance is narrow: two concurrent version bumps
raced, HEAD's 0.2.22 was itself a collision-avoidance bump, and the branch now
carries 0.2.23. If a later commit on the bundle branch also stamps 0.2.23, that
duplicate stamp — not this resolution — is what would need fixing.
