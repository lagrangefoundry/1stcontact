---
uid: report-7fd06bd3
id: REPORT-10978
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:03:24.464712+00:00'
updated_at: '2026-11-05T20:03:24.464712+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, version-scalar conflict only (`"version"` line). The enrichment's rule for this file was "intent unknown → take the more recent commit by timestamp, flag for post-merge review". Kept HEAD (`git checkout --ours -- package.json`, then `git add`).
  - HEAD: `2de6a86da7` chore(version): 0.2.117 for REQ-198, authored 2026-09-06 12:46 -0700.
  - Incoming: `2f21df1e91` fix(builder) BUG-43, authored 2026-09-01 15:35 -0700. Its whole diff is one line, `"version": "0.2.38"` → `"0.2.40"`.
  - HEAD's commit is the more recent one, so `0.2.117` is kept. Flagged for post-merge review per the rule. Low risk: applying incoming would move the version back from 0.2.117 to 0.2.40.

## Incoming changes preserved

Not preserved: the incoming commit has no other changes. On this branch its only content is the version bump to 0.2.40. The code changes its message describes (streamPrompt `site_changed`, the app.js reload) are not in this commit's diff. The resolution therefore nets to no change vs HEAD, and the next step should expect an empty cherry-pick (skip or allow-empty). I did not run `--skip` or `--continue`, and CHERRY_PICK_HEAD (2f21df1e91) is still present.

## Arbitration of last resort (BUG-1460)

- `package.json`: incoming hunk dropped. This came from the enrichment's timestamp rule, and STEP 3h tier 1 supports it: REQ-198's later version chore (0.2.116 → 0.2.117, 2026-09-06) supersedes the 2026-09-01 bump to 0.2.40. The incoming version value is stale on this branch. Applying it would lower the version by 77 releases and add no code.
