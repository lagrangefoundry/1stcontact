---
uid: report-e9b18e67
id: REPORT-6072
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:45:59.929996+00:00'
updated_at: '2026-10-04T22:45:59.929996+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-119dd4af (REQ-159) / db39fce0f8

Conflicted path: `.xgd/tickets/hot/request-119dd4af.md` (UU, ticket path).

- Base `edc369d9b1`, ours `97468957db` (== HEAD blob), theirs `84206ff09a`.
- Theirs' entire delta (08-31 14:56): `updated_at` → 08-31, `last_field_updated: status`,
  `status: draft → free_coding`. Frontmatter only.
- Ours `97468957db` is byte-identical to xgd-working's own `294d87111c` (09-09 14:32:49,
  re-bundle into `bundle-87be4669`, `status: bundled`) — a later state on incoming's own
  lineage that supersedes this pick's `free_coding` write.
- `git diff :2: xgd-working:<path>` differs only by the later 09-11 `free_and_reconciled`
  flip (`b354b050e7`), which arrives as its own later pick.

Resolution: `--ours`, zero net change from HEAD. `git status --porcelain` empty,
CHERRY_PICK_HEAD intact.

Forecast for remaining picks on this ticket: `ad68bd8ac7`, `3013025820`, `1d262a55d6`,
`f3c81c5df5`, `ed7b3cc779`, `a077c28171`, `c09f4e8438`, `294d87111c` → `--ours`
(ours == `294d87111c`); the tip `b354b050e7` (09-11, `free_and_reconciled` + `completed_at`)
is NOT `--ours`.
