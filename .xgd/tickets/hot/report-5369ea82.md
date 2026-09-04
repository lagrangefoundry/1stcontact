---
uid: report-5369ea82
id: REPORT-3317
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:53:17.412964+00:00'
updated_at: '2026-09-02T18:53:17.412964+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` (REQ-151, "Site locale identity, and rendered lang/dir")
  — class **AA** (both added; no merge base). Bookkeeping/intent ticket, so **rule 2e**
  applied per-fact, not whole-file. Path is under `.xgd/tickets/` on a reconcile branch,
  so staged with `git add --sparse` (DOC-986 §2/§4.1).

  The two sides' **bodies are byte-identical** — `git diff` between the two blobs produces
  no hunk below the frontmatter. The entire conflict is four bookkeeping frontmatter facts:

  | fact | OURS (HEAD, `dffe9ecb`, Aug 31 07:22) | THEIRS (incoming, `61d15c3f`, Aug 23 13:20) | kept |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | OURS |
  | `completed_at` | `2026-08-31T14:22:31` | `null` | OURS |
  | `updated_at` | `2026-08-31T14:22:31` | `2026-08-22T21:55:22` | OURS |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* | OURS |

  **Resolution: OURS on every contested fact.** These are not competing edits to the same
  fact by two authors — they are the *same* lifecycle field at two points in time. HEAD is
  the later-positioned intent on all four (Aug 31 vs Aug 23) and is a strict superset:
  the status advanced forward along the lifecycle (`ready_to_reconcile` →
  `free_and_reconciled`), `completed_at` went from unset to set, and `bundled_in` is a
  field the incoming side never carried at all.

  Taking THEIRS would have reverted operator-owned reconcile status to an earlier value and
  dropped `bundled_in` outright — a silent backwards revert of state this very reconcile run
  produced. No content was invented; every retained value is present on the OURS side.

  This matches the enrichment block's own fallback rule ("take the more recent commit by
  timestamp"), which independently selects OURS.

## Incoming changes preserved

The incoming commit `61d15c3f` touches exactly one file and is a pure **add** (`A`,
167 insertions — the whole file as it stood on `xgd-working`). Verified with
`git show 61d15c3f -- .xgd/tickets/hot/request-4fcbd354.md`.

Every line of that 167-line body is present verbatim in the resolved file — the full
"Why" / "What changed" / design-decision / acceptance-criteria / "Tests" / operator-note
sections, and all stable frontmatter (`uid`, `id`, `title`, `created_at`, `priority`,
`story_points`, `auto_merge_back`, `needs_review`, both `commits[].working_sha` entries,
`version: 0.2.3`, `chat_comment`). Nothing in the incoming body is absent.

The only incoming values not carried forward are the four bookkeeping fields in the table
above, where HEAD holds a strictly later state of the same fields. That is supersession by
the later intent, not a discard of developer code: no substantive content of the incoming
commit is missing, so STEP 3's guard is satisfied and no @fail condition applies.

**Net staged diff vs HEAD is empty** — HEAD already carries this commit's full content via
the Aug 30 `seed_local_overlay` plus the Aug 31 status update. Per STEP 4 (BUG-1109/1122)
this is the *redundant*-commit case, not the discarded case (STEP 3 above distinguishes
them: the incoming commit's key changes are present in HEAD, not absent). `--skip` was
NOT called; the file is staged and the cherry-pick sequencer state is left untouched for
`cherry_pick_finalize_resolution`.

No code, config, or UAT test files were involved in this conflict. No BUG-1301 precedence
exception was invoked — no hunk was dropped on the grounds of a prior refactor.
