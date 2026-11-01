---
uid: report-c69b5a39
id: REPORT-7385
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:29:44.124762+00:00'
updated_at: '2026-11-01T06:29:44.124762+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — intent/bookkeeping ticket (2e). UU in two hunks: frontmatter (updated_at / completed_at / last_field_updated / status) and the trailing paragraph of the body. Resolved to HEAD (`git checkout --ours` + `git add --sparse`; path is outside the sparse cone).

## Incoming changes preserved

Incoming commit `746de9cd07` (2026-09-02 17:10 -0700, "update request request-407a6fd8") makes only two changes:
1. Status transition `free_coded` → `ready_to_reconcile`, with updated_at 2026-09-03T00:10:53Z.
2. Drops the trailing newline after the final "no UAT." line.

HEAD's version of the same fields is strictly later: `status: free_and_reconciled`, updated_at/completed_at 2026-11-01T05:03Z. That is past `ready_to_reconcile` in the lifecycle. HEAD's body is a superset of the incoming body: it adds the "Reopened 2026-09-04" DOC-42 amendment and the third/fourth commit sections that come after the incoming commit's final paragraph. Applying the incoming frontmatter would roll the ticket back two months and two lifecycle states. Applying its body hunk would delete those later sections. The incoming effect is superseded by later history already in HEAD, so this is a redundant/stale commit, not discarded developer code. The resolution stages no diff against HEAD; finalize should detect this and skip.

## Arbitration of last resort (BUG-1460)

Tier 1 (most recent intent). Same ticket on both sides; HEAD's later updates (status free_and_reconciled, DOC-42 reopen) supersede the incoming Sep-2 status bump. The incoming hunk was dropped.
