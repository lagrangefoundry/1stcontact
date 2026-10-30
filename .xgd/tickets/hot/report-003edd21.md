---
uid: report-003edd21
id: REPORT-5724
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:18:06.015734+00:00'
updated_at: '2026-09-30T10:18:06.015734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `d0bab67c2b`

Picked commit: `d0bab67c2b` — `xgd(ticket): update bug bug-034bf955`
(author 2026-09-15T18:48:35-0700 = 2026-09-16T01:48:35Z). HEAD `e70d1e699c`.
Apply target `9ac98712a708888db67f8aff21f22b16bd98094e`. Anchor `report-377b581e`.
`prior_stage_failure` empty.

Same shape as REPORT-5722 / REPORT-5695 and the rest of this branch's queue, but on
`bug-034bf955` (BUG) rather than `request-01ea4eec`: a backward `free_and_reconciled
→ bundled` lifecycle write from 09-16 landing on a HEAD that already carries the
09-19 re-advance.

## Files resolved

One path, `.xgd/tickets/hot/bug-034bf955.md`, class `UU`. Intent/bookkeeping ticket
(§2e), outside the sparse-checkout cone — index-only conflict, no working-tree
markers. Resolved `--ours` via `git checkout --ours` then `git add --sparse`, each
as its own Bash call.

**Zero net change**: `git status --porcelain` is completely empty and
`git diff --cached --stat HEAD` is empty, so finalize will skip the commit.
`CHERRY_PICK_HEAD` verified still present after staging.

Index stages:

| stage | blob | state |
|---|---|---|
| `:1:` base   | `77da6e144a` | `updated_at` 09-14T10:29:07.362661, `status: free_and_reconciled`, no trailing newline |
| `:2:` ours   | `64c6c0f135` | `updated_at` 09-19T15:15:29.760393, `status: free_and_reconciled`, trailing newline added |
| `:3:` theirs | `a67d8704da` | `updated_at` 09-16T01:48:34.974306, `status: bundled`, no trailing newline |

`completed_at` (09-14T10:29:07.362661), `last_field_updated: status`, and the entire
111-line body are byte-identical on all three sides. The whole conflict is two
frontmatter scalars plus an EOF newline.

## Incoming changes preserved

Theirs' delta from base is exactly two fields:

- `status: free_and_reconciled` → `bundled` — a **backward** lifecycle move.
- `updated_at` → 09-16T01:48:34.974306.

Nothing is discarded, and this is not a judgement call about which side is more
correct — the incoming result is literally an ancestor state on the HEAD side:

- HEAD-side commit `21006caccb` (author 2026-09-19T08:15:29-0700) has pre-image blob
  `a67d8704da`, which **is** stage `:3:`, i.e. the exact tree content this pick is
  trying to produce. That commit then moves it forward: `status: bundled →
  free_and_reconciled`, `updated_at: 09-16T01:48:34.974306 → 09-19T15:15:29.760393`.
- HEAD-side commit `730c848cb8` then appends the missing EOF newline, producing
  stage `:2:` (`64c6c0f135`).

So xgd-working's own later state for this ticket is the value ours already carries.
Per §2e's per-fact timeline rule, both contested facts (`status`, `updated_at`)
resolve to the later-positioned intent, which is ours on both counts (09-19 > 09-16).
Ours also strictly supersets theirs on the EOF newline. Taking `--ours` loses no
developer intent; taking `--theirs` would roll the ticket backwards and drop the
newline fix.
