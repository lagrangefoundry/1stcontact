---
uid: report-5d69399a
id: REPORT-6689
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:50:41.310039+00:00'
updated_at: '2026-10-25T22:50:41.310039+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e), outside the sparse cone and so conflicted only in the index. Resolved by keeping the HEAD (ours) version, blob fa5ea5a3, and staged it with `git add --sparse`.
  - Incoming 9223fddb ("xgd(ticket): update bug bug-8dfa60ea", 2026-09-02T00:29Z) changed only frontmatter relative to the merge base: `status` draft -> free_coding, `last_field_updated` body -> status, and `updated_at`. Its body is byte-identical to the base.
  - HEAD's version is the later state of the same facts: updated_at 2026-10-25, `status: bundled`, `bundled_in: bundle-5607a08d`, plus commits and version fields. It also has the rewritten body, including the "Superseded in part by BUG-44" section.
  - The one fact both sides changed differently is `status`. The rule is to take the later-positioned side per fact. HEAD's `bundled` follows the incoming `free_coding` in the lifecycle and is about two months more recent, so HEAD wins. The incoming change contributes nothing HEAD lacks, so HEAD is a strict superset in substance.

## Incoming changes preserved

No code files were in conflict. The incoming commit's only effect, advancing status to free_coding, has already been overtaken on HEAD, which has since moved the same ticket to bundled. The staged result therefore has no diff against HEAD, because the commit is redundant on this branch rather than discarded. No hunks were dropped under the BUG-1301 exception.

The cherry-pick is still paused (CHERRY_PICK_HEAD = 9223fddb); `--continue` and `--skip` were not run.
