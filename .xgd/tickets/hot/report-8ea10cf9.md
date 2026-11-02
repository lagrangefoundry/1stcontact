---
uid: report-8ea10cf9
id: REPORT-8216
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:44:19.979924+00:00'
updated_at: '2026-11-02T01:44:19.979924+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-4a4ca4a1.md` — class 2e (intent/bookkeeping ticket; request ticket, sparse/index-only conflict). Rule: one side is a strict superset → keep superset. Resolved to HEAD (stage 2, blob d2ffd57ef5) via `git update-index --cacheinfo`, skip-worktree flag restored (file is outside sparse cone).
  - Incoming (9ff824558f, 2026-09-06T19:32): status free_coding→free_coded, added `commits` (3 working SHAs) and `version: 0.2.114`.
  - HEAD (2026-11-01T23:18): status→bundled, same 3 `commits` entries and `version: 0.2.114`, plus `bundled_in: bundle-5052a63c`, story_points 3→5.
  - Body untouched on both sides. HEAD contains every incoming fact; the only differing scalars (status, updated_at) are later on HEAD, consistent with the metadata rule "take the more recent commit by timestamp".

## Incoming changes preserved

No code files. For the ticket, incoming's additions (commits list, version) are present verbatim in HEAD; incoming's status `free_coded` is superseded by HEAD's later lifecycle state `bundled`. Resolution nets to no diff vs HEAD — the commit is redundant (its effect already landed), not discarded. Flagged for post-merge review per enrichment rule (intent unknown on HEAD side), though no content risk is expected.
