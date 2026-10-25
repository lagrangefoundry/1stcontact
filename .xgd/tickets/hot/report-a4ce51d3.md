---
uid: report-a4ce51d3
id: REPORT-6710
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:20:45.623036+00:00'
updated_at: '2026-10-25T23:20:45.623036+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47) — AA (both added), intent/bookkeeping ticket (2b/2e). Incoming commit 83f816e8c1 is the original `create bug` (status `draft`, updated_at 2026-09-02). HEAD side is the same ticket after it moved on (status `bundled`, bundled_in bundle-5607a08d, commits list, version 0.2.43, updated_at 2026-10-25, plus the "What was implemented" and "Test plan" sections). HEAD is a strict superset: every line of the incoming body is present word for word, and the only frontmatter differences are fields HEAD later advanced. Rule: keep the superset. HEAD is also the more recent side by timestamp, which matches the enrichment's fallback rule. Staged with `git add --sparse` (the path is outside the sparse cone). Staged blob = HEAD blob b0ba8eb8.

## Incoming changes preserved

Nothing from the incoming side is lost: all of its content (the ticket body as created) is already in HEAD's version. The resolution makes no change against HEAD. The commit is redundant (its effect is already in HEAD), not discarded, so the finalize step should treat it as an empty pick.

## Flag for post-merge review

The enrichment marked intent as unknown on one side, so this file is flagged for post-merge review. Expected impact: none.
