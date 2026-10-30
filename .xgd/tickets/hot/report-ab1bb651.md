---
uid: report-ab1bb651
id: REPORT-6199
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:43:07.608964+00:00'
updated_at: '2026-10-05T02:43:07.608964+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution: request-3bc4b835 (REQ-167) / 76b69e1a7d

- Branch: resync-10bbd54c, HEAD `c18b39200e`
- Picked: `76b69e1a7d` (2026-08-31 17:50:40 -0700) "xgd(ticket): create request request-3bc4b835"
- Path: `.xgd/tickets/hot/request-3bc4b835.md` (AA, which is the BUG-904 strip artifact)

### Evidence
- Blobs: ours `ec7bfaafc8` (== `HEAD:<path>`), theirs `7dd2d04f6e` (the creation-time draft), xgd-working tip `26a9d7b06d`.
- This is the create-commit shape. HEAD's history for the path starts at `seed_local_overlay` `741376297f` (09-09), which postdates the pick.
- In `git diff :3: :2:`, the only `-` lines are the draft lifecycle values (`updated_at` 09-01, `last_field_updated: created_at`, `status: draft`). Ours is a strict superset of the draft.

### Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain` is empty), and no content is lost.

### Forecast
- Ours vs the xgd-working tip differs only in frontmatter: the tip has `updated_at`/`completed_at` 09-11 and `status: free_and_reconciled`, while ours has 09-09 and `bundled`.
- The 08-31 picks (`e302557b19`, `9331c1feb4`, `14ad649903`, `14cd3cdd41`) and the 09-02/09-09 bundle quartet picks should be `--ours`.
- The tip pick (`392ef4fc5f`, 09-11, the genuine intent) is the exception, and incoming should win it.
