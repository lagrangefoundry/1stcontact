---
uid: report-0bfb1dee
id: REPORT-3335
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:38:06.156160+00:00'
updated_at: '2026-09-02T19:38:06.156160+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, index-only conflict (path is outside
  the sparse-checkout cone, so there were no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse` per DOC-986 §2/§4.1).
  Class: intent/bookkeeping ticket → STEP 2 rule **2e**, applied per-fact.

  Incoming commit: `c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b` (2026-08-23
  18:48:30 -0700, `xgd(ticket): update bug bug-db356ff8`) — the immediate
  successor to `5af1ff94`, which the previous step (37/0) resolved and which the
  finalize step skipped as redundant. HEAD is therefore still
  `fefe99569a4a95eec545673c3249acf67d62a6f0` (2026-09-02).

  The incoming commit's whole delta against its own parent (`8f92f712`) is a
  status advance plus one field:

  | Fact | Base `8f92f712` | Incoming `c1d2a2ff` | HEAD `6d962ce5` | Kept |
  |---|---|---|---|---|
  | `fields.story_points` | absent | `3` | `3` | incoming value (already in HEAD) |
  | `status` | draft | free_coding | free_and_reconciled | HEAD |
  | `last_field_updated` | body | status | status | identical on both sides |
  | `completed_at` | null | null | 2026-08-31T19:19:38 | HEAD |
  | `updated_at` | 2026-08-24T01:48:23 | 2026-08-24T01:48:29 | 2026-08-31T19:19:38 | HEAD |
  | `fields.commits` / `fields.version` / `fields.bundled_in` | absent | absent | present | HEAD |
  | trailing newline at EOF | present | removed | present | HEAD |

  HEAD is a strict superset. The one field the incoming commit adds —
  `story_points: 3` — is already present in HEAD verbatim. On every fact where
  the two sides differ, the incoming value is the older state that HEAD's later
  intent has since superseded: `free_coding` is an upstream lifecycle position
  of `free_and_reconciled`, and HEAD additionally carries reconcile bookkeeping
  the incoming side never had (`working_sha: ea48502d…`, `version: 0.2.10`,
  `bundled_in: bundle-78f4e2fe`). Taking the incoming side on those facts would
  walk a completed, bundled ticket backwards to `free_coding` and drop the
  commit/version records. `last_field_updated: status` is identical on both
  sides, so it is not in conflict at all.

  The only remaining difference is cosmetic: the incoming blob has no trailing
  newline at EOF. HEAD's serialization (written by the xgd ticket store itself)
  keeps it. Not a fact worth reverting bookkeeping over. No content was
  invented, and no field present on the incoming side is absent from the result.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-db356ff8.md` — confirmed. The incoming commit's only
  substantive change, `fields.story_points: 3`, is present in the resolved file.
  `git diff HEAD c1d2a2ff -- .xgd/tickets/hot/bug-db356ff8.md` shows the
  `story_points` line as context, not as a delta, which is the direct evidence
  that it already landed in HEAD. Nothing was discarded.

## Note on the staged result

The resolution nets to no diff vs HEAD — the staged blob is `6d962ce5db`, which
is HEAD's own blob. This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: STEP 3's distinguishing check passes, since the incoming commit's key
change is *present* in HEAD via the post-watermark sync rather than absent. Per
STEP 4 I did not call `--skip`; the staged tree is left for
`cherry_pick_finalize_resolution` to detect and skip. `CHERRY_PICK_HEAD` is
untouched and still reads `c1d2a2ff87`.

No code, test, or UAT files were involved in this conflict, so the BUG-1301
precedence exception did not arise.
