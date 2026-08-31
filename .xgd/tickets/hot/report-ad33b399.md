---
uid: report-ad33b399
id: REPORT-2684
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:11:21.223199+00:00'
updated_at: '2026-08-31T05:11:21.223199+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **AA** (both added), intent/bookkeeping
  ticket (rule 2e, plus 2b superset rule). Index-only conflict: `.xgd/tickets/` is
  outside the sparse-checkout cone (DOC-986 §2/§4.1), so there were no working-tree
  markers. Resolved via `git checkout --ours` + `git add --sparse`.

  Sides:
  - Ours (HEAD, reconcile-BUNDLE-20): `xgd(ticket): seed_local_overlay request request-554ac441`,
    `updated_at 2026-08-24T02:10:41Z`, `status: bundled`, `version: 0.2.9`, five
    `working_sha` entries, `bundled_in: bundle-b3b7c399`, `chat_comment: comment-98e86f10`,
    534 lines.
  - Theirs (incoming free_coded `9e5327cf`): `xgd(ticket): update request request-554ac441`,
    `updated_at 2026-08-22T23:55:22Z`, `status: free_coding`, `version: 0.2.1`, one
    `working_sha` entry, 383 lines.

  Ours is a strict superset per-fact, so no timeline arbitration was needed: every
  differing field on the incoming side is an *earlier* value of a field ours carries
  forward (`free_coding` → `bundled`; `0.2.1` → `0.2.9`; the incoming's single
  `working_sha 0e390334` is the first entry of ours' five-entry list), and the
  incoming body is a byte-exact prefix of ours' body. Ours additionally carries the
  two follow-up sections written after the incoming snapshot ("`bin/build` failed on
  a type-only reach into node", ACs 12; "the deploy secret guard asked the wrong
  question", ACs 13–16) and their version-bookkeeping notes. This also agrees with
  the enrichment rule (more recent by timestamp: 2026-08-24 > 2026-08-22).

## Incoming changes preserved

- `.xgd/tickets/hot/request-554ac441.md` — not a code file; no developer code at
  risk. The incoming commit's entire 384-line content is present in the resolved
  file: `diff` of the incoming blob against the resolution shows only additions on
  the ours side (later frontmatter field values and appended follow-up prose) and no
  incoming-only line. This is the redundant case described in STEP 4, not a discard:
  the incoming snapshot's content already reached HEAD via the later ticket updates
  that bundled this request. The staged result therefore nets to no diff vs HEAD;
  per STEP 4 no `--skip` was issued and finalization is left to
  `cherry_pick_finalize_resolution`.

No hunks were dropped under the BUG-1301 precedence exception. No test files were
involved. The cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `9e5327cf`) is
untouched.

Untracked-only, left alone (not conflicts): `.xgd/tickets/hot/comment-4218ef95.md`,
`.xgd/tickets/hot/report-7690f5ca.md`.
