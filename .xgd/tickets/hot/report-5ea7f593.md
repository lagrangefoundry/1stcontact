---
uid: report-5ea7f593
id: REPORT-7489
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:35:45.323611+00:00'
updated_at: '2026-11-01T07:35:45.323611+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` — intent/bookkeeping ticket (2e), index-only (outside sparse cone). Rule: one side is a strict superset → keep the superset (ours/HEAD, blob 7e3a5ef8cf).

Incoming 316d88911c changed exactly two things vs base d99b3b6357: (1) frontmatter `updated_at` → 2026-09-04T23:51:58 and `last_field_updated: body`; (2) the `## Ordering` section rewritten from "Blocked until REQ-178/179 reconcile" to "Not blocked — ordered … should come before REQ-170's entitlement editor".

HEAD already contains (2) verbatim, plus much later work on the same ticket (status `bundled`, story_points 3, commits/version/bundled_in fields, past-tense body rewrite, subject-column + memberships rename sections, test plan). For (1), HEAD's `updated_at` (2026-11-01T05:18:05) and `last_field_updated: status` are later facts and win per-fact. Taking incoming would have regressed status and discarded content.

Resolution staged via `git update-index --cacheinfo` (skip-worktree bit restored). Staged diff vs HEAD is empty — redundant commit; left for finalize to skip.

## Incoming changes preserved

Yes — the incoming commit's only substantive change (Ordering section text) is present byte-for-byte in the resolved file. Only its older frontmatter timestamps were superseded by HEAD's later values. No BUG-1301 drops.
