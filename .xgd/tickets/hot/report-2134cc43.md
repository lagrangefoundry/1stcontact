---
uid: report-2134cc43
id: REPORT-3408
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:42:25.264805+00:00'
updated_at: '2026-09-03T23:42:25.264805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**), sparse-excluded path so the conflict existed only in the index with no working-tree markers (DOC-986 §2/§4.1). Resolved with `git checkout --ours` + `git add --sparse` on the **strict-superset** branch of 2e.

  - **Incoming** (`9a6417c0b0` `xgd(ticket): update request request-909e42f8`, free_coded) changed exactly two things vs the merge base: added `fields.chat_comment: comment-6fb39b2a`, and dropped the trailing newline.
  - **Ours** (`def57cbbb1` `xgd(ticket): seed_local_overlay request request-909e42f8`) contains **both** of those facts already, plus a disjoint set the incoming side never touched: `status: draft` → `bundled`, `updated_at`, `last_field_updated`, `fields.commits` (`858d63202f`, `c056002a52`), `fields.version: 0.2.22`, `fields.bundled_in: bundle-203b1dc2`, the reflowed request prose, and the appended `# What landed` implementation record.
  - No fact is asserted differently on the two sides, so no `working-timeline` tie-break was needed — this is 2e's "keep the superset", not a genuine intent conflict.

## Incoming changes preserved

Verified against the staged blob (`git show :<path>`):

- `fields.chat_comment: comment-6fb39b2a` — present at line 20.
- Missing trailing newline — confirmed by `od -c` on the tail; the blob ends `...move-to-free-coded\` ran` with no `\n`.

Both of the incoming commit's changes are therefore present in the resolution. No hunk was dropped, so the BUG-1301 precedence exception was not invoked.

## Note: resolution nets to no diff vs HEAD

The staged blob and the HEAD blob are the same object (`561e1e92b81b6f120afa61c401b44316c208f90a`). This is the redundant-commit case (BUG-1109/BUG-1122), **not** a discard: STEP 3's distinguishing check confirms the incoming commit's key change is *present* in HEAD — HEAD's `seed_local_overlay` commit carried `chat_comment: comment-6fb39b2a` and the newline strip in alongside its own bundling fields, landing the same effect by a different route. Per STEP 4 no `--skip` was issued; the finalize step will detect the clean staged diff.

No code, test, or spec-ticket files were involved. `CHERRY_PICK_HEAD` (`9a6417c0b0bce72249b68fe72f85dcdf0c04fef1`) is intact; the only git writes were `checkout --ours`, `add --sparse`.
