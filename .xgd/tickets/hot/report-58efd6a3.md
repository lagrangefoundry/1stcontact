---
uid: report-58efd6a3
id: REPORT-5387
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T22:26:06.022872+00:00'
updated_at: '2026-09-28T22:26:06.022872+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — **UU**, intent/bookkeeping ticket (STEP 2e). Single frontmatter hunk; `updated_at`, `completed_at`, `last_field_updated` only. No body/content conflict. Resolved by composing the two intent ledgers chronologically rather than by raw `updated_at` comparison (BUG-1030); the composition yields the HEAD side exactly. Staged with `git add --sparse` (path is outside the sparse cone, DOC-986 §2/§4.1).

### Ledger composition

`xgd ticket history bundle-8eef3846` on the HEAD side shows the incoming operation **already replayed**, followed by one further operation:

1. `e9c19666` (Aug 31 16:59:50 -0700) — `status: reconciling → free_and_reconciled`, `completed_at: null → 2026-08-31T23:59:50.119536`, `last_field_updated: status`. This is the *same logical operation* as incoming `8da3c09f4e` (same author, same minute; differs only by ~0.3s of microsecond noise in the two timestamps).
2. `2ca3de8c` (Aug 31 17:00:08 -0700) — adds `result: pass`, `updated_at → 2026-09-01T00:00:07.956062`, `last_field_updated: result`. A later, distinct operation present only on HEAD.

The two sides are therefore not competing over the same fact: incoming contributes op 1, HEAD contributes ops 1 and 2. Replaying both in order gives HEAD's frontmatter verbatim. No disjoint edit from either side was discarded.

## Incoming changes preserved

Incoming `8da3c09f4e` carried exactly three field changes; all are present in the resolved file:

- `status: free_and_reconciled` — present (line 17; identical on both sides, so it never entered the conflict region).
- `completed_at` non-null — present (`2026-08-31T23:59:50.119536+00:00`, HEAD's microsecond stamp for the same completion event).
- `last_field_updated` advanced past `reconciling` — present, superseded to `result` by HEAD's strictly later op 2.

`updated_at` resolves to `2026-09-01T00:00:07.956062+00:00` (HEAD). Taking incoming's earlier value would have rolled the ticket backwards and dropped `result: pass`.

No BUG-1301 precedence exception was invoked; no hunk was dropped; no code or UAT files were involved in this conflict.

## Staging state

`git status --porcelain` is empty — no conflict-class lines remain, and the resolution is byte-identical to HEAD, so the cherry-pick carries no net change. Per STEP 4, staged and exiting normally; `--skip` was **not** called. `CHERRY_PICK_HEAD` is intact for the finalize step.
