---
uid: report-855b72c3
id: REPORT-7745
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:48:34.047487+00:00'
updated_at: '2026-11-01T15:48:34.047487+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184) — intent/bookkeeping ticket (2e). Conflict confined to frontmatter lifecycle fields (updated_at, completed_at, status). Kept OURS: `free_and_reconciled` @ 2026-11-01 vs incoming stale `ready_to_reconcile` @ 2026-09-05. Rule: more recent by timestamp / superset (ours is the later lifecycle state). Body identical on both sides.
- `.xgd/tickets/hot/request-93cc89ff.md` (REQ-185) — intent/bookkeeping ticket (2e), outside sparse cone (index-only). Kept OURS (stage 2): status `bundled` in bundle-39edf66d @ 2026-11-01, with commits list, version 0.2.70, and expanded body ("platform_operator is the name that landed", PLATFORM_ADMINS implementation, ownership predicates, seed export). Incoming is the stale 2026-09-05 `free_coding` snapshot whose body is a strict subset. Rule: superset / more recent by timestamp. Resolved with `git update-index --cacheinfo` and skip-worktree re-applied so sparse state is preserved.
- `.xgd/tickets/hot/request-b813aa4a.md` — intent/bookkeeping ticket (2e), outside sparse cone (index-only). Kept OURS (stage 2): `free_and_reconciled` @ 2026-11-01 with `bundled_in: bundle-94dbe947`. Incoming is the stale 2026-09-05 `free_coded` snapshot without bundle linkage; the only other difference is a trailing newline. Rule: superset / more recent by timestamp.

Flag for post-merge review (per enrichment rule "intent unknown"): all three files. In each case the incoming side is an older snapshot carried by the merge commit "Merge xgd-working into free-REQ-185 before promotion". Taking it would have moved each ticket's lifecycle backwards and dropped its commit/bundle records.

## Incoming changes preserved

No code files were in conflict. The incoming side of all three ticket files has no facts newer than HEAD: every differing field on the incoming side is an older value of a field that HEAD has since advanced. The other file in the commit, `comment-c4e1817d.md`, applied cleanly and is staged unchanged.
