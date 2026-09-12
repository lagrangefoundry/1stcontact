---
uid: report-59d06fde
id: REPORT-4108
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:07:44.943937+00:00'
updated_at: '2026-09-12T19:07:44.943937+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e).
  Resolved by taking the HEAD side. Only the YAML frontmatter conflicted; the
  body prose auto-merged cleanly.

  Per-fact judgement (diff of stage :2: vs :3: showed frontmatter hunks only):
  - `updated_at` / `completed_at` / `last_field_updated` / `status`: same fields
    changed differently. HEAD is the later-positioned intent
    (`2026-08-31T19:19:36`, `status: free_and_reconciled`) vs incoming
    (`2026-08-24T21:55:26`, `status: free_coded`). HEAD kept — reverting to
    `free_coded` would undo already-integrated reconcile lifecycle state.
  - `fields.commits` / `fields.version` / `fields.bundled_in`: HEAD is a strict
    superset — it records two additional `working_sha` entries
    (`0fe586d1…`, `999579b3…`), `working_sha_history`, `version: 0.2.13` (vs
    incoming `0.2.11`) and `bundled_in: bundle-78f4e2fe`. Superset kept.

  `git checkout --ours` was verified lossless before staging: `git diff HEAD`
  on the path is empty, so no auto-merged incoming content was dropped. Staged
  with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986).

## Incoming changes preserved

Incoming commit `a9248d67` made exactly two changes to this file:

1. **Body prose** — replaced `## Still outstanding (not in this ticket)` with
   `## Observability — added here` plus a new `## Deployment` section. **Already
   present in HEAD.** `git diff` between stage :2: (ours) and stage :3: (theirs)
   contains *no* body hunks at all — HEAD's section list already reads
   `… Superseded / Observability — added here / Deployment / Reproduction
   (historical) / Relationship to BUG-36`. The developer's prose landed on the
   HEAD side by an earlier route; nothing was discarded.

2. **Frontmatter bookkeeping** (`updated_at`, `status: free_coded`, etc.) —
   superseded by HEAD's later state, per rule 2e's timeline/superset test above.

No code files were in this conflict. The BUG-1301 precedence exception was not
invoked; no hunk was dropped as obsolete.

Net result: the resolution stages to no diff vs HEAD, because the incoming
commit's substantive content is already in HEAD (redundant, not discarded — the
STEP 3 check confirms presence, not absence). Per STEP 4 this is staged and
exited `@done`; the finalize step will detect the clean staged diff and skip the
commit. `git cherry-pick --skip` was NOT called.
