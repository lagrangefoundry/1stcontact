---
uid: report-50cf0afd
id: REPORT-5479
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:41:08.462256+00:00'
updated_at: '2026-09-29T05:41:08.462256+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — class **AA** (both added, no merge
  base at index stage 1). Intent/bookkeeping ticket (`bug-*`), so §2e
  governs, reinforced by §2b's strict-superset clause. Resolved to
  **ours** (`git checkout --ours` + `git add --sparse`).

  Ours is a strict superset of theirs, per fact:

  | fact | ours (HEAD) | theirs (CHERRY_PICK_HEAD c85e8a4a) |
  |---|---|---|
  | `title` | `Builder: markdown shows as source on first load, …` | `Untitled` |
  | `status` | `free_and_reconciled` | `draft` |
  | `updated_at` | `2026-09-19T15:15:29Z` | `2026-09-01T21:00:12Z` |
  | `completed_at` | `2026-09-14T10:29:07Z` | `null` |
  | `last_field_updated` | `status` | `created_at` |
  | extra fields | `chat_comment`, `severity`, `commits`, `version`, `story_points`, `bundled_in` | — |
  | body | full Symptom / Root cause / Fix / Test plan (111 lines) | `(new ticket)` placeholder |

  `created_at` is byte-identical on both sides. Every field present in
  theirs is present in ours with an equal or later value; theirs
  introduces no fact absent from ours. There is no same-fact divergence
  requiring a timeline tiebreak — ours is later on every differing fact.

  The incoming commit is the ticket's original *creation* commit
  (`xgd(ticket): create bug bug-034bf955`, 1 file, 18 insertions). HEAD
  already carries that same ticket carried forward through
  `seed_local_overlay` and `xgd(ticket): update bug bug-034bf955` to its
  reconciled state (`bundled_in: bundle-8e1807f6`). Taking theirs, or
  merging theirs' scalars in, would regress a reconciled ticket to a
  draft stub.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit
touches only the one ticket file above, so STEP 3's `git show $CPHEAD --
<file>` verification has no code targets. No UAT test files were
involved, and no test function on either side was deleted; the BUG-1301
precedence exception was not invoked and no hunk was dropped under it.

Substantively nothing incoming was discarded: theirs' entire content is a
subset of ours (table above), so the resolved file preserves every fact
the incoming side asserts, at an equal or later value.

## Tree state

`git status --porcelain` is empty: the AA line is gone and the staged
diff against HEAD is clean, because the resolution equals HEAD. Per
STEP 4 this is the anticipated no-net-change case — staged and exiting
normally; finalize is expected to skip the commit. `CHERRY_PICK_HEAD`
verified still present at `c85e8a4a271e02258160048179056e80b6c434a6`;
no `--continue`/`--skip`/`--quit`/`--abort` was run.
