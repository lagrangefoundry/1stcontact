---
uid: report-844bcad1
id: REPORT-7143
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:26:27.076410+00:00'
updated_at: '2026-10-31T23:26:27.076410+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `package.json` — UU, config/code file (2c/2g scalar conflict). Conflict on `"version"`: HEAD `0.2.50` (d2da20f994, chore(version): bump to 0.2.50 for REQ-175) vs incoming `0.2.51` (68db393777, fix(repo): resolve package.json left conflicted by a raced merge, REQ-178). Resolved to incoming `0.2.51`.
  - Enrichment rule "take the more recent commit by timestamp": by author date the incoming commit is later (2026-09-02T17:01:39 vs 17:00:34). HEAD's committer date (2026-10-31) is just when this reconcile replayed it, not when it was authored.
  - The incoming commit chose 0.2.51 on purpose, to sit above 0.2.50 (the same value HEAD carries), because the two version bumps are independent. Keeping it matches that intent and the incoming-wins rule for scalars.
  - Validated: file parses as JSON, version = 0.2.51, no conflict markers remain.

## Incoming changes preserved

- `package.json`: the incoming commit's only change (conflict markers removed, `"version": "0.2.51"`) is present in the staged result. Staged diff vs HEAD: `0.2.50` -> `0.2.51`.
