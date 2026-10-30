---
uid: report-c3cfceed
id: REPORT-4547
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:52:54.757174+00:00'
updated_at: '2026-09-20T20:52:54.757174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — class **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e** (per-fact later-positioned intent), staged
  with `git add --sparse` (outside sparse-checkout cone, DOC-986 §2/§4.1).

  Only the frontmatter status block conflicted:

  | fact | OURS (HEAD, resync branch) | THEIRS (CHERRY_PICK_HEAD 9099dbbd88) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `bundled` |
  | `updated_at` | `2026-08-31T14:22:44Z` | `2026-08-24T02:10:41Z` |
  | `completed_at` | `2026-08-31T14:22:44Z` | `null` |

  Both sides mutate the SAME fact (the ticket's lifecycle status) — a genuine
  intent conflict under 2e, resolved per-fact by later-positioned intent. HEAD
  carries the terminal state recorded a week after the incoming commit's
  `ready_to_reconcile → bundled` transition; taking THEIRS would regress a
  completed ticket back to `bundled` and null out `completed_at`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-23fd6e61.md`: the incoming commit has two hunks.
  - `fields.bundled_in: bundle-b3b7c399` — **present** in the resolved file
    (merged cleanly; already carried forward in HEAD).
  - status/`updated_at`/`completed_at` → `bundled` — **intentionally
    superseded**, not discarded. This is the 2e per-fact timeline rule, not a
    BUG-1301 precedence drop: the ticket's lifecycle advanced past `bundled` to
    `free_and_reconciled` on the HEAD side at a strictly later timestamp, so the
    incoming value is a stale earlier position on the same fact rather than a
    disjoint edit.

  Net effect: the resolved tree is byte-identical to HEAD
  (`git diff --cached HEAD` is empty), because HEAD already contains everything
  this commit contributes. Finalize is expected to detect the empty staged diff
  and skip the commit.

## Verification

- `git status --porcelain` — empty; no UU/AA/DU/UD lines remain.
- Conflict-marker count in the staged blob: 0.
- Staged frontmatter parses as valid YAML.
- `CHERRY_PICK_HEAD` (9099dbbd88) left intact; no `--continue`/`--skip`/
  `--quit`/`--abort` issued.
