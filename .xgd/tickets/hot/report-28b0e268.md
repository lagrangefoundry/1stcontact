---
uid: report-28b0e268
id: REPORT-7351
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:10:03.316898+00:00'
updated_at: '2026-11-01T06:10:03.316898+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- package.json — UU, config scalar (`version`). Enrichment rule: intent unknown, take the more recent commit by timestamp. Ours = 2d59060f2e "bump to 0.2.57 for BUG-46" (2026-10-31) vs incoming 9632cd6ae0 (2026-09-02, carries 0.2.48). Kept HEAD's 0.2.57 — taking incoming would roll the version back nine bumps. FLAGGED for post-merge review per enrichment rule.
- tests/req177-discontinue-raw-server.test.ts — AA, test file. Rule 2b (keep strict superset) + enrichment timestamp rule. HEAD's version (4ea164bc3b, reconcile bundle-5607a08d, 2026-10-30) is the same file already integrated and strengthened by an earlier reconcile: identical structure, every incoming assertion present, plus the net.Server#listen no-bind check, non-vacuity probe, and usage-text-after-refusal check. Only other difference: test names were renamed from test_UAT_FC_REQ-177_* to AC-linked test_UAT_AC2064_*/AC2065_*. Kept HEAD. FLAGGED for post-merge review per enrichment rule.

## Incoming changes preserved

- tests/req177-discontinue-raw-server.test.ts: all three incoming test cases are present in the resolved file under their AC-linked names (serve refused as unknown command w/ exitCode 1; help offers only wrangler-dev builder; capture fixture binds loopback origin), with every incoming assertion retained. No test function was removed — the incoming FC-named functions are the same tests HEAD renamed during the bundle-5607a08d reconcile; keeping both copies would duplicate the tests verbatim.
- package.json: incoming's only change in this file is the stale 0.2.48 version string; HEAD's later bump supersedes it.
- The rest of the incoming commit (non-conflicted files) applied cleanly. The staged result likely nets to no diff vs HEAD for these two files because HEAD already carries REQ-177's effect.
