---
uid: report-9f65f090
id: REPORT-6280
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:25:43.496149+00:00'
updated_at: '2026-10-05T03:25:43.496149+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-6893f6ea (REQ-158) / 58d4f8ec81

**Conflicted path:** `.xgd/tickets/hot/request-6893f6ea.md` (UU, ticket path)
**Picked commit:** `58d4f8ec81` (2026-09-01 11:53:35 -0700), frontmatter-only.
**Resolution:** `--ours`. The result is zero net change from HEAD `1543af3c11`.

## Evidence
- Blobs: base `388f1c13bc`, ours `7cd88f9ec4` (== `HEAD:<path>`), theirs `6a2e03e293`.
- base→theirs: `updated_at` → 09-01T18:53:35 and `status` `ready_to_reconcile`→`free_coded`. This moves the lifecycle backward. There are no body changes.
- Ours `7cd88f9ec4` is the 09-09 `bundled` state (`bundled_in: bundle-87be4669`). It is byte-identical to xgd-working's `fbfce2c94e` (09-09 re-bundle).
- `git diff :2: xgd-working:<path>` shows only the later 09-11 `free_and_reconciled` flip (`f74da06627`). Incoming's own later commits (`625e291b9e` back to `ready_to_reconcile`, then the 09-09 re-bundle) supersede this pick's backward write. Ours already holds those later facts.

## Forecast
Later picks on this ticket up to the 09-09 trio are expected to be `--ours`. The tip `f74da06627` (09-11 `free_and_reconciled` + `completed_at`) is NOT `--ours`.
