---
uid: report-fed06c3e
id: REPORT-11002
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:21:39.795364+00:00'
updated_at: '2026-11-05T20:21:39.795364+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — config/manifest file (UU), single scalar conflict on `"version"`. Rule applied: enrichment resolution rule ("take the more recent commit by timestamp and flag for post-merge review"). HEAD side `2de6a86da7` "chore(version): 0.2.117 for REQ-198" (authored 2026-09-06) is more recent than incoming `7fb5ba6f33` "feat(people): the User tab" (authored 2026-09-04). Kept HEAD's `0.2.117` (`git checkout --ours`, `git add`). **Flagged for post-merge review** per the enrichment rule.

## Incoming changes preserved

Incoming commit `7fb5ba6f33`'s entire diff on this branch is one line in `package.json`: `"version": "0.2.66"` -> `"0.2.71"`. That line is NOT in the resolution: HEAD is already at `0.2.117`, so applying `0.2.71` would move the version backwards. No code files conflicted. The resolution has no net diff vs HEAD, so the cherry-pick is empty; the finalize step should handle it as an empty pick.

## Arbitration of last resort (BUG-1460)

- `package.json`: the incoming hunk was dropped. Resolved at tier 1 / by the enrichment rule: the later commit `2de6a86da7` (REQ-198 version bump to 0.2.117) supersedes the incoming bump to 0.2.71, so the incoming change is stale on this branch. HEAD side kept; incoming side dropped.
