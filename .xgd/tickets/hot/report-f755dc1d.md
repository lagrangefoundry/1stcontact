---
uid: report-f755dc1d
id: REPORT-6162
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:23:53.557049+00:00'
updated_at: '2026-10-05T02:23:53.557049+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync conflict resolution: bundle-8eef3846 tip pick 8da3c09f4e

- Branch: resync-10bbd54c, HEAD c6986ef69e, apply target 397daf02997f5670ac4ce7c26f12ed9050b0f66d
- Pick: 8da3c09f4e (2026-08-31 16:59:50 -0700, "xgd(ticket): update bundle bundle-8eef3846"). This is xgd-working's tip for this path.
- Path: .xgd/tickets/hot/bundle-8eef3846.md (UU)
- Blobs: base d5eb9622a1 / ours fb4a6e5694 (== HEAD) / theirs dc9df1d3ff

## Analysis
Theirs only changes three things relative to base: `status` reconciling → free_and_reconciled, `completed_at` null → 08-31T23:59:50.420544, and `updated_at` → 08-31T23:59:50.420544.

Ours is main's finished reconcile of the same bundle:
- `status: free_and_reconciled`, the same as theirs.
- `completed_at` 08-31T23:59:50.119536, which differs from theirs by 0.3 s.
- `updated_at` 09-01T00:00:07, which is later than theirs.
- It also has `main_sha 90527353c0`, `merged_at_commit`, the full `orphan_commits` map and `result: pass`.

So ours is a strict superset of, and later than, the incoming tip. Taking theirs would throw away main's reconcile record.

## Resolution
`git checkout --ours` followed by `git add --sparse`. Net change is zero (`git status --porcelain` is empty) and CHERRY_PICK_HEAD is intact.

That completes the bundle-8eef3846 series on this resync: c2efcb99cb, 232a68212a and 8da3c09f4e all resolved --ours.
