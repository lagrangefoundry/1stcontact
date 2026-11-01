---
uid: report-e005d2ff
id: REPORT-7751
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:51:53.492912+00:00'
updated_at: '2026-11-01T15:51:53.492912+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-93cc89ff.md` (REQ-185). File class: 2e, intent/bookkeeping ticket (it is a request ticket, held in the hot tier because of the sparse checkout). Rule: when one side is a strict superset of the other, keep the superset. Resolved with `git checkout --ours`, then `git add --sparse`.
  - The ticket bodies are byte-identical on both sides. Only the frontmatter differs.
  - HEAD (ours): `status: bundled`, `bundled_in: bundle-39edf66d`, `updated_at: 2026-11-01T14:13:50`, `last_field_updated: status`.
  - Incoming (1fb89871cc, "update request request-93cc89ff"): `status: free_coded`, no `bundled_in`, `updated_at: 2026-09-05T01:53:46`, `last_field_updated: body`.
  - HEAD already contains the incoming body edit and also moves the status forward to bundled. HEAD is also the more recent side by timestamp, which matches the enrichment rule. Taking the incoming side would have lost `bundled_in` and set the status back to free_coded.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only substantive change is the ticket body edit, and that edit is already present in HEAD verbatim. The staged resolution therefore makes no net change against HEAD: the commit is redundant, not discarded (BUG-1109/BUG-1122 shape). Finalize is expected to detect the empty staged diff.

Flagged for post-merge review because the enrichment metadata marked the intent as unknown. Low risk, since the bodies are identical.
