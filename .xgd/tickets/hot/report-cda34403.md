---
uid: report-cda34403
id: REPORT-3337
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:42:35.381215+00:00'
updated_at: '2026-09-02T19:42:35.381215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e).
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved via
  `git checkout --ours` + `git add --sparse`.

  Per-fact comparison of stage 2 (ours, reconcile branch, updated_at
  2026-08-31T19:19:38) against stage 3 (theirs, free_coded commit
  e74606d80dba6cfadcf7a0d7277e55846162edae, updated_at 2026-08-24T01:50:12):

  - `fields.commits` (`working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40`,
    `reconcile_sha: null`, `main_sha: null`) — byte-identical on both sides.
  - `fields.version: 0.2.10` — identical on both sides.
  - `status` — the only genuinely conflicting fact. Base was `free_coding`;
    incoming advanced it to `free_coded`, ours advanced it further along the
    same lifecycle to `free_and_reconciled`. Ours is the later-positioned
    intent (2026-08-31 reconcile vs 2026-08-24 free_coding) and is downstream
    of `free_coded` on the same axis, so ours is kept. Taking incoming here
    would have reverted operator-owned lifecycle state.
  - `completed_at`, `updated_at` — ours only (set by the same later reconcile
    operation that set the status).
  - `fields.bundled_in: bundle-78f4e2fe` — ours only; incoming never touched it.
  - Body (`## Symptom` onward) — identical apart from ours restoring the
    trailing newline.

  Ours is therefore a strict superset of theirs, so rule 2e's superset clause
  applies. No content was invented and no `intent_uid`/`story_uid`/
  `capability_uid` field was touched.

## Incoming changes preserved

The incoming commit's only changes to this file were: add `fields.commits`,
add `fields.version: 0.2.10`, and advance `status` off `free_coding`. All
three are present in the resolved (ours) version — the first two verbatim, the
third subsumed by the further advance to `free_and_reconciled`. Nothing from
the incoming side was discarded.

No code/implementation files were in conflict, and no hunk was dropped under
the BUG-1301 precedence exception.

Note for the finalize step: because HEAD already carried every fact this
commit introduces (via the later reconcile update fefe99569a), the staged tree
nets to no diff vs HEAD. This is the redundant-commit case of BUG-1109/BUG-1122,
not a discard — STEP 3's check confirms the incoming commit's key changes are
present in HEAD rather than absent. Per STEP 4 no `--skip` was issued and the
cherry-pick sequencer state (CHERRY_PICK_HEAD) is left intact for
cherry_pick_finalize_resolution.
