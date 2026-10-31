---
uid: report-bda40b7f
id: REPORT-7129
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:15:01.322693+00:00'
updated_at: '2026-10-31T23:15:01.322693+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md`: intent/bookkeeping ticket (request), rule 2e "one side is a strict superset, keep the superset". Resolved to HEAD (stage 2) and staged with `git add --sparse` because the path is outside the sparse cone.
  - Incoming `98fd8ebabc` ("update request request-20bd7d63", 2026-09-02) changed only two things from the merge base: (a) a new `updated_at`, and (b) a new section appended at the end, "Where this happens: `capture_site` finishes the job it starts", with its Acceptance list.
  - HEAD has section (b) word for word. It also has a later frontmatter state (`status: bundled`, commits list, `version: 0.2.54`, `bundled_in: bundle-fd009b93`, `updated_at` 2026-10-31), plus the later sections "Corrections found while building this" and "Also true of the finished work".
  - The only fact both sides changed is `updated_at`, and HEAD's value is the later one. This also matches the enrichment's "take the more recent commit" rule.

## Incoming changes preserved

- The incoming body addition is present in full in the resolved file (checked by diffing the base, ours and theirs stages). Nothing from the incoming commit was dropped except its superseded `updated_at` timestamp.
- The resolution nets to no diff vs HEAD, because the incoming commit's effect had already landed on this branch. This is a redundant commit, not a discarded one (BUG-1109/BUG-1122). Finalize should detect the empty staged diff.
- No code files were involved. The BUG-1301 precedence exception and STEP 3h arbitration were not used.

## Flag for post-merge review

- The enrichment asked for this file to be flagged because one side's intent was unknown. Flagged here, though the superset relationship leaves nothing ambiguous.
