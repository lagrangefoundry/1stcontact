---
uid: report-21c8e73e
id: REPORT-6674
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:34:55.534012+00:00'
updated_at: '2026-10-25T22:34:55.534012+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` (REQ-156): an intent/bookkeeping ticket (2e). Both sides are xgd ticket-update commits.
  - **Rule:** I applied the enrichment rule (take the more recent commit by timestamp) together with 2e's superset rule. I kept HEAD for both hunks with `git checkout --ours` and staged it with `git add --sparse`.
  - **Frontmatter hunk:**
    - HEAD: updated_at 2026-09-16, status `bundled`, completed_at set.
    - Incoming: updated_at 2026-09-01, status `free_coded`, completed_at null.
    - HEAD is the later state of the same ticket.
  - **Commits hunk:** HEAD is a strict superset of incoming. It has the same three working SHAs plus `working_sha_history`, `reconcile_sha` e86aecc on d612c1a, and `bundled_in: bundle-8e1807f6`.
  - **Flag:** the enrichment rule asks for post-merge review of this file.

## Incoming changes preserved

- There are no code files in this conflict.
- The incoming commit's only effect was an older status update (`free_coded`) to REQ-156. HEAD has since moved past it to `bundled`, so the commit is redundant, not discarded.
- The staged result has no diff against HEAD. Finalize should detect this and skip the commit.
