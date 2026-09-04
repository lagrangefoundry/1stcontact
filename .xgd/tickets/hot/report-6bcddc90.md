---
uid: report-6bcddc90
id: REPORT-3428
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:37:00.808653+00:00'
updated_at: '2026-09-04T00:37:00.808653+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU, intent/bookkeeping ticket (rule 2e).
  Resolved by taking the HEAD side (`git checkout --ours`, `git add --sparse`),
  because HEAD is a strict superset of the incoming commit and is the
  later-positioned intent.

  Incoming commit `8da3c09f4ea1738d466282ffbe1aca5a5c5f039f`
  (committed 2026-08-31T16:59:50-07:00) changed exactly three frontmatter
  facts on bundle-8eef3846 ("BUG-39 + REQ-154"):
    - `status`: `reconciling` -> `free_and_reconciled`
    - `completed_at`: `null` -> `2026-08-31T23:59:50.420544+00:00`
    - `updated_at` bump

  HEAD already carries the same transition, landed via the reconcile route
  in `e9c19666d8512ffdb60b891a3e91fabb0692f8f1` (2026-08-31T16:59:50-07:00),
  and then advanced further in `2ca3de8c4964d32a23287ce38381e53b2267a3e8`
  (2026-08-31T17:00:08-07:00 — later than the incoming commit), which added
  facts the incoming side never had at all:
    - `result: pass`
    - `fields.merged_at_commit: 90527353c0fa4b9fd3ae91ba6285c7d791a25c53`
    - `fields.orphan_commits`: ~170 old_sha/new_sha remap pairs
    - `fields.commits` consolidated to the post-merge-back form
      (`working_sha: null`, `main_sha: 90527353...`) replacing the two
      pre-merge working-sha entries the incoming side still lists

  Per-fact judgement (2e), no field was taken from a mixture:
    - `status` — both sides agree on `free_and_reconciled`; no conflict.
    - `completed_at` — same event, recorded ~0.3s apart
      (HEAD `...23:59:50.119536`, incoming `...23:59:50.420544`). Same fact,
      later-positioned intent wins -> HEAD. Grafting the incoming timestamp
      would have desynchronised it from HEAD's `result`/`merged_at_commit`
      record of the same completion.
    - `updated_at` / `last_field_updated` — HEAD is later
      (`2026-09-01T00:00:07`, `last_field_updated: result`) and consistent
      with its own `result: pass` write.
    - `commits`, `orphan_commits`, `merged_at_commit`, `result` — present
      only on HEAD; kept.

  The document body (`# Bundle` onward) is byte-identical on both sides.
  No content was invented, and no `intent_uid`/`story_uid`/`capability_uid`
  field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bundle-8eef3846.md`: PRESERVED. Verified against
  `git show 8da3c09f4ea1738d466282ffbe1aca5a5c5f039f -- <path>`. Every fact
  the incoming commit asserts is present in the resolved file:
  `status: free_and_reconciled` (identical value) and a non-null
  `completed_at`. Nothing from the incoming diff is absent from the result —
  it arrived in HEAD by a different route (the reconcile-side bookkeeping
  write) before this cherry-pick replayed it.

  No hunks were dropped under the BUG-1301 precedence exception; it did not
  apply here. No code, test, or UAT files were involved in this conflict.

## Note on the staged diff

This resolution nets to no diff versus HEAD — the staged blob equals HEAD's
blob, so the file no longer appears in `git status --porcelain` at all. Per
STEP 4 this is the BUG-1109/BUG-1122 redundant-commit case, not a discard:
STEP 3's check confirms the incoming commit's key changes ARE present in
HEAD, rather than merely absent. Staged and exiting normally; `--skip` was
not called and the cherry-pick sequencer state (CHERRY_PICK_HEAD) is left
intact for `cherry_pick_finalize_resolution`.
