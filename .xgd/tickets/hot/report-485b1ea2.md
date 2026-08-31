---
uid: report-485b1ea2
id: REPORT-2742
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:13:54.667439+00:00'
updated_at: '2026-08-31T06:13:54.667439+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — **AA** (both added), intent/bookkeeping ticket
  (rule **2e**, with 2b superset test). Out of the sparse-checkout cone (DOC-986 §2), so the
  conflict existed index-only with no working-tree markers; resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`
  (`--sparse` is not a valid `git checkout` option in this git build;
  `--ignore-skip-worktree-bits` is the equivalent).

  **Why ours:** the two sides differ in exactly 3 lines out of 296. Ours is a strict
  superset of theirs on every fact:
  - `updated_at`: ours `2026-08-24T02:10:41Z` vs incoming `2026-08-20T21:15:50Z`
  - `status`: ours `bundled` vs incoming `ready_to_reconcile`
  - `fields.bundled_in: bundle-b3b7c399` — present only on ours

  The entire 290-line ticket body and all other frontmatter fields (commits list,
  working_sha_history, depends_on, version, chat_comment) are byte-identical on both sides.

  Commit timestamps agree with the field timestamps and with the enrichment rule
  ("take the more recent commit"): ours is `8a09ff92` *seed_local_overlay* (2026-08-30),
  incoming is `9ef799f9` *update request* (2026-08-23). Ours is the later side on both
  measures, and the fields it advances (`status: bundled`, `bundled_in: bundle-b3b7c399`)
  are precisely this reconcile bundle's own bookkeeping — taking the incoming side would
  have reverted REQ-145 to `ready_to_reconcile` and dropped its membership in the bundle
  currently being reconciled.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b474390f.md`: **yes.** `git show 9ef799f9 -- <file>` is a
  whole-file add (296 insertions, 0 deletions). Every line of that content is present in the
  resolved version except the three bookkeeping scalars listed above, where the resolved
  version carries the strictly *newer* value for the same fact. No substantive ticket
  content from the incoming side was discarded, and no content absent from both sides was
  invented. `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

No code, test, or UAT files were involved in this conflict, so no BUG-1301 precedence
exception was needed and no hunks were dropped.

**Note for the finalize step:** this resolution nets to no diff vs HEAD (the staged blob
`dca76400` is HEAD's blob), because HEAD already carries a later revision of the same
ticket. Per STEP 4 this is the redundant-commit case, not the discarded case — STEP 3's
check passes: the incoming commit's content is present in HEAD, not absent from it.
`--skip` was not called; the finalize step will detect the clean staged diff.
