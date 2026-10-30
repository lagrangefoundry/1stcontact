---
uid: report-da7e4805
id: REPORT-6041
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:27:37.340802+00:00'
updated_at: '2026-10-04T22:27:37.340802+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — doc-8d51d90d (Premium, Non-Template Web Design — Differentiation Audit)

- Picked commit: `e6f718b3891ba08d0f418c29000489376d9ad83e` (2026-08-31 12:43:20 -0700, "update doc doc-8d51d90d")
- HEAD: `d5678200bb`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`; prior_stage_failure empty
- Conflicted path: `.xgd/tickets/hot/doc-8d51d90d.md` (ticket path, frontmatter only), AA
- Blobs: no base (pick parent is BUG-904 strip `0d11a0146e`) / ours `e9383411e9` (== `HEAD:<path>`) / theirs `d736af7439`

### Analysis
The AA status comes from the BUG-904 strip: the pick's parent deleted the ticket tree. It is not a real divergence.

This is the mirror shape. HEAD's history already contains a replay of this pick: `8179f38266`, with the same subject and the same author date (2026-08-31 12:43:20). Its blob is byte-identical to theirs (`d736af7439`). HEAD then moved on with `1d4f51b394` (09-11), which gives ours. So theirs is already in HEAD's lineage, and ours is its successor.

`git diff :3: :2:` touches only frontmatter: `updated_at`, `last_field_updated` and `doc_kind` (architecture → system_kb). The bodies are identical.

### Resolution
`--ours`, zero net change from HEAD. `git status --porcelain` is empty, CHERRY_PICK_HEAD is intact, and HEAD has not moved.

### Forecast
The remaining xgd-working picks on this path are:
- `08189543f7` (08-31 14:59:35). Main's `1d4f51b394` is a replay of it: both rewrite the same parent blob `d736af7439` with the same flip (`doc_kind` architecture → system_kb). Expect `--ours`.
- `f1062da685` (09-08, tip). Sets `doc_kind: architecture`. This is genuine intent after main's replay, so incoming wins `doc_kind` (same precedent as doc-721a48c9). xgd-working tip blob `d25f855e27` differs from ours only in `updated_at` and `doc_kind`.

Verify each of these live when it arrives.
