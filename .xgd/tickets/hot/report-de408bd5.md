---
uid: report-de408bd5
id: REPORT-4403
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:35:20.173877+00:00'
updated_at: '2026-09-19T11:35:20.173877+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, rule **2e** (intent/bookkeeping
  ticket; `bug-*`, lives in `hot/`). Out of the sparse-checkout cone, so the
  conflict existed only in the index with no working-tree markers. Resolved to
  the HEAD side as a strict superset, staged with `git add --sparse`.

  Incoming commit: `08bbde06` `xgd(ticket): update bug bug-3ade1af4`
  (free_coded, 2026-09-01T19:28:24Z).
  HEAD side: `xgd(ticket): seed_local_overlay bug bug-3ade1af4`
  (updated_at 2026-09-16T01:48:35Z).

  The two sides' **bodies are byte-identical** (`git diff <stage2> <stage3>`
  touches frontmatter only). Every differing fact is a lifecycle field on which
  HEAD is strictly ahead:

  | fact | base (`036c1169`) | incoming (`2a59e08e`) | HEAD (`1f50971c`) |
  |---|---|---|---|
  | `status` | `free_coding` | `free_coded` | `bundled` (past `free_coded`) |
  | `last_field_updated` | `body` | `status` | `status` (same as incoming) |
  | `updated_at` | 09-01T19:27:33 | 09-01T19:28:24 | 09-16T01:48:35 |
  | `completed_at` | `null` | `null` | 2026-09-14T10:29:13 |
  | `fields.commits` | absent | added (`e5d76233…`) | present, identical |
  | `fields.version` | absent | `0.2.33` | `0.2.33`, identical |
  | `fields.bundled_in` | absent | absent | `bundle-8e1807f6` |
  | `title` | "23 failures … ten UATs" | unchanged from base | "27 failures + 30 collection errors … eleven UATs" |

  `title` is not a competing fact: the incoming side left base's title untouched,
  so only HEAD edited it (2e "non-overlapping fields changed on each side: apply
  both"). The remaining facts are the same lifecycle axis, where HEAD holds the
  later state — HEAD is a strict superset of the incoming side, so no
  `working-timeline` tie-break was needed and nothing from either side was lost.

## Incoming changes preserved

Every change in `git show 08bbde06 -- .xgd/tickets/hot/bug-3ade1af4.md` is
present in the resolved file:

- `status: free_coding → free_coded` — present, and advanced further to
  `bundled` by the HEAD-side seed_local_overlay commit. `last_field_updated`
  matches the incoming value exactly (`status`).
- `fields.commits` (`working_sha: e5d762332d1ae0c00f387b0822f19f41b8c934d1`,
  `reconcile_sha: null`, `main_sha: null`) — present verbatim.
- `fields.version: 0.2.33` — present verbatim.
- `updated_at` bump — present, superseded by a later timestamp.
- Incoming also dropped the file's trailing newline; HEAD's blob is what was
  staged, so that whitespace-only change is not carried. No content is affected.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note on the net diff

The staged tree has **no diff vs HEAD** (`git status --porcelain` and
`git ls-files -u` are both empty). This is the redundant-commit case described
in STEP 4, not the discarded-changes case in STEP 3: the incoming commit's key
changes are all present in HEAD, having reached it by a later route (the
`seed_local_overlay` commit carried the ticket past `free_coded` to `bundled`).
Staged and exiting `@done` as instructed — `--skip` was not called and
`CHERRY_PICK_HEAD` (`08bbde06`) is intact for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

The enrichment rule asked for a post-merge review flag (intent unknown on one
side). Flagging `.xgd/tickets/hot/bug-3ade1af4.md`: BUG-40's status is
`bundled` into `bundle-8e1807f6` on the reconcile branch while the working-side
history still carries it at `free_coded`; if xgd-working is later re-read for
this ticket's state, HEAD's `bundled` + `bundled_in` is the correct value.
