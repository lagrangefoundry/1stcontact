---
uid: report-905e0c2b
id: REPORT-6098
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:02:00.843711+00:00'
updated_at: '2026-10-04T23:02:00.843711+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — request-909e42f8 (REQ-164) / f7493a90cd

- Pick: `f7493a90cd` (2026-08-31 15:09:07), `free_coding` → `free_coded`; adds `fields.commits` (858d63202f, c056002a52) and `fields.version: 0.2.22`. Frontmatter only.
- Conflicted path: `.xgd/tickets/hot/request-909e42f8.md` (ticket path).
- Blobs: base `6d821b7982`, ours `3b6c6a92fb`, theirs `5a490754fb`.

## Analysis
- Ours is `status: bundled` (updated_at 2026-09-09T21:32:49), `bundled_in: bundle-87be4669`. Its frontmatter is byte-identical to xgd-working's re-bundle commit `5a60c25f99`, a later commit in this ticket's ledger than the pick.
- Ours already contains the pick's `commits` list and `version: 0.2.22` byte-for-byte. The pick's only other changes are `status`/`updated_at`, and ours supersedes them with later values.
- The pick does not touch the body.
- `:2:` vs the xgd-working tip differs only by the later 09-11 `free_and_reconciled` flip (`44947863ce`). That is a later pick, not this one.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change against HEAD `5b4029a7f0`. No content is lost because ours is a superset of what the pick adds.
