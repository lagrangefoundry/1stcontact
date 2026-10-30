---
uid: report-c0b6a5bd
id: REPORT-6033
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:22:27.354912+00:00'
updated_at: '2026-10-04T22:22:27.354912+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — request-b88b79fe / 3b9156ae89

- Branch: resync-10bbd54c, HEAD d5678200bb, apply target 397daf02997f5670ac4ce7c26f12ed9050b0f66d
- Picked: 3b9156ae89 (2026-08-30 17:52:48 -0700), `.xgd/tickets/hot/request-b88b79fe.md`, UU
- Blobs: base 0b2fc295c6 / ours 36e51a0c74 (== HEAD blob) / theirs 2ca0c4af0c

## Analysis
Theirs is a body reflow. It unwraps the hard-wrapped prose, rewrites `*em*` as `_em_`, and flattens the two
markdown tables into paragraphs. It also sets `updated_at` to 08-31T00:52 and `last_field_updated` to `body`.
Ours carries that body byte for byte. `git diff :3: :2:` touches only the frontmatter, where ours holds
the later 08-31T05:05 `status: bundled` + `bundled_in: bundle-8eef3846`, plus a trailing newline.
Ours == xgd-working's next commit `aae17fd9bf` (08-30 `bundled`), apart from that newline.

## Resolution
`git checkout --ours` + `git add --sparse`. Zero net change from HEAD, and `git status --porcelain` is empty.

## Forecast
Still pending on this ticket: `aae17fd9bf` (ours == its blob apart from the newline) → `--ours`.
The tip `58ba7fca8e` (08-31 `free_and_reconciled`) is NOT `--ours`.
