---
uid: report-c68fdc5a
id: REPORT-6257
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:13:58.234995+00:00'
updated_at: '2026-10-05T03:13:58.234995+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Conflict

Cherry-pick `6e301eb747` (2026-09-01 11:14, xgd-working) on `.xgd/tickets/hot/request-909e42f8.md` (REQ-164), `UU`.

- base `:1:` `abf84be948` (= previous pick `a4e81f7825`'s result)
- ours `:2:` `3b6c6a92fb` (== `HEAD:<path>`, unmoved)
- theirs `:3:` `2c0d1f8bda`

## Analysis

Theirs' delta from base: `updated_at` → 09-01T18:14, `last_field_updated: body`, and a lossy body
reflow (paragraphs unwrapped, `*em*` → `_em_`, blank lines inserted between bullets, code-fence
language dropped, a stray blank line inside fences). No new content.

`git diff --stat :2: 5a60c25f99:<path>` is EMPTY — ours is byte-identical to xgd-working's own
later 09-09 re-bundle blob. Incoming therefore itself superseded this reflow; taking theirs would
regress the body and the lifecycle (`bundled` / `bundle-87be4669`).

## Resolution

`git checkout --ours` + `git add --sparse`. Zero net change from HEAD; `git status --porcelain`
empty, CHERRY_PICK_HEAD intact.

## Forecast

Remaining picks on this ticket: `7123292250` (09-02), `f73aee4cb9`, `f03a4ed5dd`, `5a60c25f99`
(09-09) — all `--ours` (ours == `5a60c25f99`). The tip `44947863ce` (09-11, `free_and_reconciled`)
is NOT `--ours`.
