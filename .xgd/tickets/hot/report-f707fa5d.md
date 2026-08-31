---
uid: report-f707fa5d
id: REPORT-2954
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:03:03.842887+00:00'
updated_at: '2026-08-31T15:03:03.842887+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e, with 2b superset test). Outside the sparse-checkout cone, so resolved
  via `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).
  - Ours (HEAD, `434f316f19` `xgd(ticket): seed_local_overlay request request-0cdfdc5b`):
    `updated_at: 2026-08-24T02:10:41Z`, `status: bundled`, `fields.bundled_in: bundle-b3b7c399`.
  - Theirs (incoming `458b7fc9c2` `xgd(ticket): update request request-0cdfdc5b`, free_coded,
    authored 2026-08-23): `updated_at: 2026-08-20T02:59:27Z`, `status: ready_to_reconcile`,
    no `bundled_in`.
  - The two sides differ on exactly three lines; the entire 369-line body, all `fields`
    (priority, story_points, depends_on, commits + working_sha_history, version 0.1.61,
    chat_comment) are byte-identical. Ours is therefore a strict superset: it carries every
    fact the incoming side asserts, plus the later lifecycle state. No fact is asserted
    differently in a way that loses incoming content — `status` and `updated_at` are the
    same fact advanced forward by HEAD, and the timeline rule points the same way (HEAD's
    `updated_at` is 4 days later than the incoming side's). Kept ours per 2e's superset
    clause. No content was invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — the incoming commit is a whole-file add (370
  insertions). Every line of it is present in the resolved file except `updated_at` and
  `status`, where HEAD holds the strictly later value of the same field, and HEAD
  additionally carries `bundled_in`. Nothing the developer authored is discarded: this is
  the redundant-commit case (BUG-1109/BUG-1122), not the discarded-commit case — the
  incoming commit's substance is already in HEAD via the later bundling of the same ticket.
- No code/implementation files were in conflict, so no BUG-1301 precedence drops were
  needed and no test function was deleted.
- Resulting staged diff vs HEAD is empty. Per STEP 4 this is left for
  `cherry_pick_finalize_resolution` to handle; no `--skip`/`--continue`/`--abort` was run
  and `CHERRY_PICK_HEAD` (`458b7fc9c239c9e76eb9bc17687c05f0906bcc91`) is still present.
