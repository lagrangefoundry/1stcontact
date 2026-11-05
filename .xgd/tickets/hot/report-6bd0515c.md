---
uid: report-6bd0515c
id: REPORT-10970
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:56:59.276075+00:00'
updated_at: '2026-11-05T19:56:59.276075+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — config/version scalar (UU). The enrichment rule was "intent unknown → take the more recent commit by timestamp". Kept HEAD's `"version": "0.2.117"`, from 2de6a86da7 "chore(version): 0.2.117 for REQ-198", committed 2026-11-04. The incoming b2f0d35227 "chore: bump version for REQ-165 projected reference" was committed 2026-11-01 and authored 2026-09-01. Staged with `git add`.

## Incoming changes preserved

The incoming change was not kept. b2f0d35227's only change is `"version": "0.2.29"` → `"0.2.30"`. Applying it would move the version back from 0.2.117 to 0.2.30. The commit is stale on this branch: it claimed the next free version back in September, and 87 bumps have landed since. No code files were involved. The staged index now matches HEAD, so the cherry-pick is empty. Finalization should skip it (or commit it empty).

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 (intent and timeline evidence), together with the enrichment's most-recent-timestamp rule. Evidence: the HEAD version commit is newer, and the incoming commit's stated reason (to claim 0.2.30 as the next version) no longer holds here. Dropped: the incoming side (0.2.30). Follow-up: REQ-165 no longer has a dedicated version number. If one is needed, it should be a fresh bump (0.2.118+), not this commit.
