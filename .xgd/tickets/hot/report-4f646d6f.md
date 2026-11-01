---
uid: report-4f646d6f
id: REPORT-7705
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:23:27.273649+00:00'
updated_at: '2026-11-01T15:23:27.273649+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — intent/bookkeeping ticket (request), rule 2e (strict superset → keep superset; frontmatter facts → later side). Resolved to HEAD (ours) via `git checkout --ours` + `git add --sparse` (path is outside the sparse cone). Net staged diff vs HEAD: none.

## Incoming changes preserved

Incoming commit `1ba93bae9d` (2026-09-04, "xgd(ticket): update request request-407a6fd8") did three things:
1. Set `status: draft`, `updated_at: 2026-09-04` — superseded by HEAD's later facts (`status: free_and_reconciled`, `updated_at`/`completed_at` 2026-11-01). Later timestamp wins per enrichment rule.
2. Added the "## Reopened 2026-09-04: admission is membership, not entitlement ([[DOC-42]])" amendment — already present verbatim in HEAD (line 186), so it is preserved.
3. Reflowed prose to unwrapped lines and restored the older `0.2.51` version-repair paragraph tail — HEAD has since extended that section (later merge notes, `0.2.67`/`0.2.68` bump explanation); taking incoming there would drop later live content.

The commit is therefore redundant (its substantive content already landed in HEAD via later commits c065710c38 / 89f5aab6f6 / 14e2729b85), not discarded. Staged diff vs HEAD is empty; finalize step should detect and skip.

Not touched (not part of this cherry-pick): unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-f3cde672.md`.

## Arbitration of last resort (BUG-1460)

Not invoked — resolved by rule 2e (HEAD is a superset with later-dated facts).
