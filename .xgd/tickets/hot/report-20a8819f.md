---
uid: report-20a8819f
id: REPORT-3532
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:02:04.962910+00:00'
updated_at: '2026-09-09T22:02:04.962910+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — class **AA** (both added; index stages 2+3, no stage 1).
  Intent/bookkeeping ticket (`request-*`), so rule **2e** applies, cross-checked against **2b**
  ("keep the superset") and the enrichment's timestamp rule. Both sides' commit subjects are the
  identical auto-commit `xgd(ticket): update request request-554ac441`, so intent was unknown from
  the subject alone and the file content was compared directly.

  `git diff <ours-blob> <theirs-blob>` is **5 insertions / 156 deletions** going ours → theirs. Every
  one of those 5 "insertions" is an *older value of a fact ours also carries*, not content unique to
  the incoming side:

  | field | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:34Z` | `2026-08-22T23:55:22Z` |
  | `completed_at` | `2026-08-31T14:22:34Z` | `null` |
  | `status` | `free_and_reconciled` | `free_coding` |
  | `fields.version` | `0.2.9` | `0.2.1` |
  | last body line | same text | same text (differs only by EOF-newline marker) |

  The 156 deletions are content present ONLY on ours: four additional `working_sha` ledger entries
  (`932f362e`, `92fc26e7`, `ec144c85`, `02bd4437`), `bundled_in: bundle-b3b7c399`,
  `chat_comment: comment-98e86f10`, and two whole follow-up narrative sections with ACs 12–16
  (the `bin/build` type-only-import reach into node, and the deploy secret guard rewrite).

  Ours is therefore a **strict content superset**; the incoming side is an earlier snapshot of the
  same ticket (incoming commit `9e5327cf`, Sat Aug 22 16:55 -0700 — it adds the file as 384 new
  lines; HEAD-side `5e6f3a68`, Mon Aug 31 07:22 -0700). Superset rule and "more recent by timestamp"
  agree, so: `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout cone —
  DOC-986 §2/§4.1 — so plain `git add` refused it).

  Taking theirs would have reverted `status` from `free_and_reconciled` back to `free_coding`,
  dropped four ledger SHAs and the bundle/chat linkage, and destroyed ACs 12–16 — i.e. carried stale
  frontmatter backwards over operator-owned state.

## Incoming changes preserved

The incoming commit `9e5327cf` contains no code files — its entire diff is this one bookkeeping
ticket, added whole. Its content is present in the resolved version: the resolved file is the
Aug-31 state of the same ticket, which contains the full Aug-22 body verbatim plus later additions.
Nothing the incoming side authored is absent; only its four superseded frontmatter scalars are, and
those are the same facts at later values, not distinct content.

No hunks were dropped under the BUG-1301 precedence exception, and no test functions were touched —
the conflict contains no test files.

The staged tree nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty), because HEAD
already carries this commit's effect by a later route. Per STEP 4 this is the BUG-1109/BUG-1122
redundant-commit case, not a discard: STEP 3's discriminator is satisfied — the incoming commit's
key changes are *present* in HEAD rather than simply *absent*. `--skip` was not called; the
finalize step will detect the clean staged diff.

Staged blob `bdbb4c39b160994225b21f21e7e154cc3ecafd4c` at stage 0; `git status --porcelain` shows no
remaining conflict-class lines.
