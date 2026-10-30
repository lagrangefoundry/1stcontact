---
uid: report-16fcb1fc
id: REPORT-5979
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:53:17.168658+00:00'
updated_at: '2026-10-04T21:53:17.168658+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution — request-01ea4eec / 1e81362033

**Pick:** `1e81362033` (2026-08-23 16:28:01 -0700, `xgd(ticket): update request request-01ea4eec`)
**Conflict:** `AA` on `.xgd/tickets/hot/request-01ea4eec.md` (artifact of the BUG-904 ticket-tree strip; no base).
**Resolution:** `--ours` — zero net change from HEAD `d5678200bb`.

## Evidence

- `:3:` (theirs) blob `beafdf2ee6` is byte-identical to `a85ff47461:<path>` — HEAD's own
  replay of this pick (same subject, same author date 08-23 16:28:01). The pick is already
  in HEAD's lineage.
- `:2:` (ours) blob `e5c0842463` == `HEAD:<path>`, the later state reached via HEAD's
  `2a21e34677` / `389bcc385c` (seed_local_overlay) and `7278f30c41` (09-19 update):
  `free_and_reconciled`, `completed_at` 09-14, `commits`, `version 0.2.32`,
  `bundled_in: bundle-8e1807f6`, and the revised body.
- `git diff :2: xgd-working:<path>` is a single line: `updated_at` 15:15:32.21 (ours) vs
  15:15:50.66 (incoming tip). Every other field and the whole body are byte-identical, so
  incoming's own tip already holds ours' content.

## Forecast

Remaining picks on this path (`ffce0148a9`, `e0795d9332`, … up to the xgd-working tip) should
resolve `--ours`, except the tip pick, which wins `updated_at` alone (by ~18.4 s).
