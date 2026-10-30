---
uid: report-2acca895
id: REPORT-6184
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T02:34:14.259440+00:00'
updated_at: '2026-10-05T02:34:14.259440+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts: request-6893f6ea (REQ-158) / 14fab3a5d9

**Pick:** `14fab3a5d9` (2026-08-31 17:25:55 -0700). It is a body edit that adds "What has changed under this ticket" and "Answers to the open questions (2026-08-31)", with `updated_at` → 09-01. Status is still `draft`.

**Conflict:** `UU .xgd/tickets/hot/request-6893f6ea.md`. Base `c7859dd33d`, ours `7cd88f9ec4` (== `HEAD:<path>`), theirs `12c843b588`.

## Evidence
- Ours `7cd88f9ec4` is **byte-identical** to xgd-working's `fbfce2c94e:<path>` (2026-09-09 14:32:50, the re-bundle into `bundle-87be4669`, `status: bundled`).
- `git diff :2: xgd-working:<path>` covers only the 09-11 `free_and_reconciled` flip (`updated_at`, `completed_at`, `status`). The body is identical to incoming's own tip.
- The pick is an ancestor of xgd-working. Eleven later xgd-working commits on this path (08-31 18:22 → 09-09) rewrote this body section, including the 09-01 `3325664f0f` reflow, so theirs' text is superseded by incoming itself. Nothing is lost.

## Resolution
`git checkout --ours` + `git add --sparse`. The result has **zero net change** from HEAD, and `git status --porcelain` is empty.

## Forecast
The remaining REQ-158 picks through `fbfce2c94e` should be `--ours`. Run the ours-vs-tip diff on the 09-11 `f74da06627` tip, because it carries the `free_and_reconciled` flip.
