---
uid: report-aa241059
id: REPORT-6350
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T04:08:37.522078+00:00'
updated_at: '2026-10-05T04:08:37.522078+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — request-8b33a146 (REQ-172) / e558098f12

- Pick: `e558098f12` (2026-09-01 14:20:09 -0700, `xgd(ticket): update request request-8b33a146`)
- HEAD: `7ef32ed2d6`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`
- Conflict: `UU .xgd/tickets/hot/request-8b33a146.md`
- Blobs: base `86372128b7` / ours `d6fbb21c84` (== `HEAD:<path>`) / theirs `a26f53ab34`

## Analysis

- base→theirs is frontmatter only: `updated_at` → 09-01T21:20:09, `last_field_updated` → status,
  `status` `draft`→`free_coding`, plus dropping the trailing EOF newline. No body content added.
- `git diff :2: xgd-working:<path>` is a single line: `updated_at` (ours 09-19T15:15:29.11 vs tip
  15:15:37.35). Ours already holds incoming's own end state (`free_and_reconciled`,
  `completed_at` 09-14, full body), so this 09-01 forward step is superseded by incoming itself.
- theirs→ours (+93/-31) is the later body growth that incoming's own subsequent commits added;
  theirs removes nothing from the body, so taking ours loses nothing.

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD (`git status --porcelain`
empty), CHERRY_PICK_HEAD intact. The enrichment's "take the more recent by timestamp" rule agrees
(ours `updated_at` 09-19 > theirs 09-01).

## Forecast

Later picks on this ticket before the xgd-working tip should also go `--ours`. The tip
(09-19, `updated_at` 15:15:37.35) is the exception: it wins `updated_at` by 8.2 s.
