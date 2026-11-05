---
uid: report-400c64c1
id: REPORT-10956
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:46:43.625144+00:00'
updated_at: '2026-11-05T19:46:43.625144+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json`: UU, config/manifest scalar (`"version"`). The only conflicting line was the version field. Kept HEAD's `"version": "0.2.117"` and dropped incoming's `"version": "0.2.12"`. The enrichment rule ("take the more recent commit by timestamp") points to HEAD: HEAD-side `2de6a86da7` (chore(version): 0.2.117 for REQ-198) was authored 2026-09-06 and committed 2026-11-04. Incoming `afb334fe0d` (cherry-pick of `0fe586d1f6`) was authored 2026-08-24 and committed 2026-11-01. Flagged for post-merge review as the rule requires.

## Incoming changes preserved

The incoming commit `afb334fe0d` touches one file, `package.json`, and changes one line: version `0.2.4` -> `0.2.12`. That bump is stale. HEAD has since moved through a series of version bumps up to 0.2.117. Applying it would roll the version back 105 patch releases.

The commit message describes adding `[observability]` blocks to `apps/control-app/wrangler.toml` (BUG-37). That substantive change is ALREADY present on HEAD: `apps/control-app/wrangler.toml` has `[observability]` at line 35 and `[env.production.observability]` at line 294, with the "REPEATED UNDER [env.production]" rationale comment. No developer code is lost.

Net result: the resolution makes no change relative to HEAD. The cherry-pick will be empty when finalized. The finalize step should treat it as empty (skip / allow-empty) according to its own policy. This step did not run --continue or --skip.

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at tier 1 (most recent intent / later commit). Evidence: HEAD's `chore(version): 0.2.117 for REQ-198` is later by author date and by commit date than the incoming commit, and it supersedes the incoming 0.2.12 bump. Taking the incoming scalar would regress the version. Incoming side dropped for this one line. The incoming commit's substantive intent (wrangler observability) is already integrated on HEAD.
