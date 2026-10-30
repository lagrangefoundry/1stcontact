---
uid: report-1934cb1a
id: REPORT-6321
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:51:49.931538+00:00'
updated_at: '2026-10-05T03:51:49.931538+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-bbff35c7 (REQ-160) / 9081f1b091

- Branch: resync-10bbd54c, HEAD 7ef32ed2d6, apply target 397daf02997f5670ac4ce7c26f12ed9050b0f66d
- Pick: 9081f1b091 (2026-09-01 12:54:48 -0700), big body add: cursor/delta bullets and the two-index merge
- Conflict: UU `.xgd/tickets/hot/request-bbff35c7.md` (ticket path)
- Blobs: base 0dd8738e54 / ours 27754d7053 (== HEAD) / theirs 64d8cce688

## Analysis
- `git diff :3: :2:` is frontmatter only: the body theirs adds is already in ours byte-identically.
  Ours' extra frontmatter (`free_and_reconciled`, `completed_at`, `commits`, `version 0.2.34`,
  `bundled_in: bundle-8e1807f6`) is the later lifecycle state.
- `git diff :2: xgd-working:<path>` is a single `updated_at` line (tip 15:15:35.06 vs ours 15:15:30.96).
  Ours already equals incoming's end state apart from that timestamp.

## Resolution
`git checkout --ours` + `git add --sparse`. No net change from HEAD. CHERRY_PICK_HEAD is intact.
The same pick was resolved the same way on reconcile-BUNDLE-29 (REPORT-6149).

## Forecast
Later pre-09-19 picks on this ticket should be `--ours`. The xgd-working tip `40c4cda1b4` (09-19) is
the exception: it wins `updated_at` alone, by 4.1 s.
