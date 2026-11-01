---
uid: report-c85a128f
id: REPORT-7479
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:29:42.183928+00:00'
updated_at: '2026-11-01T07:29:42.183928+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179), UU, intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Resolved to the HEAD (ours) side, blob 4fcc0134, via `git update-index --cacheinfo` (index-only, path is outside the sparse cone). Skip-worktree bit restored afterwards.

## Incoming changes preserved

Incoming commit 5b9777f0 ("xgd(ticket): update request request-b813aa4a", updated_at 2026-09-04) made two changes against base 49e4e16b:
1. Reflowed the body markdown (unwrapped paragraphs, blank lines between list items, `json` fence changed to a plain fence). HEAD already contains this exact reflow, byte-identical across all shared sections, so it is preserved.
2. Frontmatter `status: ready_to_reconcile -> draft` plus updated_at. HEAD has since gone further: it has `status: bundled` and `bundled_in: bundle-94dbe947`, `depends_on: [REQ-178]`, a second commit entry, story_points 4, version 0.2.69 and updated_at 2026-11-01. HEAD also carries the "Reopened 2026-09-04" amendment body, which was the reason for the draft transition in the first place.

Not a code file. The resolution nets to no diff vs HEAD because the commit is redundant: its effect already landed in HEAD by a later route (BUG-1109/BUG-1122 shape). Nothing was discarded. Taking the incoming side would have removed the reopen amendment and moved the status back from bundled to draft.

Not touched (not part of the conflict): unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-07e7c0fa.md`.
