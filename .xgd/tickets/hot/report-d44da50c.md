---
uid: report-d44da50c
id: REPORT-2946
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:45:49.360331+00:00'
updated_at: '2026-08-31T14:45:49.360331+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **AA (both added)**, intent/bookkeeping
  ticket (REQ-149), rule **2b / 2e "keep the superset"**. Resolved to the **OURS**
  (HEAD) version, staged with `git checkout --ours` + `git add --sparse`.

  Basis: OURS is a strict superset of THEIRS. A full blob diff (theirs
  `735995e4` → ours `6546223f`) is `155 insertions, 4 deletions`, and the only
  four theirs-side lines absent from ours are values ours has advanced past:

  | theirs (incoming, `9e5327cf`, 2026-08-22) | ours (HEAD, `b6ac2faa`, 2026-08-30) |
  |---|---|
  | `updated_at: 2026-08-22T23:55:22` | `updated_at: 2026-08-24T02:10:41` |
  | `status: free_coding` | `status: bundled` |
  | `version: 0.2.1` | `version: 0.2.9` |
  | file ends mid-`## Follow-up: the builder must not fail silently` (no trailing newline) | same line present, followed by two further follow-up sections |

  Every byte of the incoming body is contained verbatim in ours; ours adds four
  more recorded `commits[]` entries, `bundled_in: bundle-b3b7c399`,
  `chat_comment: comment-98e86f10`, and the two later follow-up sections
  ("`bin/build` failed on a type-only reach into node" and "the deploy secret
  guard asked the wrong question", with ACs 12–16). No per-fact conflict exists
  where the two sides state the same fact differently — ours simply carries the
  later value for each.

  The auto-enriched metadata's fallback rule ("intent unknown on one or both
  sides — take the more recent commit by timestamp") points the same way:
  ours is the later commit (2026-08-30 vs 2026-08-22) and the later
  `updated_at` (2026-08-24 vs 2026-08-22).

## Incoming changes preserved

Yes — no incoming content was discarded.

The incoming commit `9e5327cf` ("xgd(ticket): update request request-554ac441")
introduces the file as 384 lines. All 384 are present in the resolved file,
which is that content plus later additions. This is the redundant-commit case
described in STEP 4, not the discarded-commit case in STEP 3: the incoming
commit's key changes are present in HEAD, reached by a different route (the
`seed_local_overlay` commit that carried the ticket's later state), rather than
absent.

No BUG-1301 precedence exception was invoked; no hunk was dropped. No code,
implementation, or UAT test files were in conflict — the single conflicted path
is a bookkeeping ticket.

Because HEAD already holds a superset, the staged tree nets to no diff vs HEAD
(`git status --porcelain` reports no `M` line for the path). Per STEP 4 this is
expected and is not a failure; `cherry_pick_finalize_resolution` will detect the
clean staged diff and skip the commit. `--skip`/`--continue`/`--abort` were not
called and `CHERRY_PICK_HEAD` is intact.
