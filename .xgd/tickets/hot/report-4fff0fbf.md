---
uid: report-4fff0fbf
id: REPORT-3310
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:34:19.863606+00:00'
updated_at: '2026-09-02T18:34:19.863606+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **AA** (both added), intent/bookkeeping ticket
  (rule 2e; the AA shape is why rule 2b applies too — resolved as "one side is a strict
  superset, keep the superset"). Resolved to the **HEAD/ours** blob (`9a0a98ce`) via
  `git checkout --ours` + `git add --sparse`.

  The two sides differ **only in frontmatter** — `git diff <ours-blob> <theirs-blob>`
  produces no hunk below the `---` fence; the 268-line body is byte-identical. The
  frontmatter deltas, all of which run HEAD-later:

  | Fact | Ours (HEAD) | Theirs (incoming `fb1d4d62`, 2026-08-23) |
  |---|---|---|
  | `updated_at` | `2026-08-31T14:22:42` | `2026-08-17T20:06:08` |
  | `completed_at` | `2026-08-31T14:22:42` | `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `fields.commits` | one entry, `7ebc721b` folded into `working_sha_history` | two entries, `7ebc721b` still a separate head |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent |

  Every contested fact resolves to HEAD on both available orderings — ticket `updated_at`
  (Aug 31 > Aug 17) and commit date (HEAD-side `ecd40fbc` Aug 31 > incoming `fb1d4d62`
  Aug 23) — and HEAD is additionally a semantic superset: it carries advanced status,
  `completed_at`, `bundled_in`, and still retains the incoming side's `7ebc721b` working
  sha, relocated into `working_sha_history` by the normal xgd commit-collapse. The incoming
  side contributes no fact that HEAD lacks, so nothing was combined and nothing was dropped.

  The conflict-intent enrichment reported intent unknown on both sides and prescribed
  "take the more recent commit by timestamp, flag for post-merge review" — that is the rule
  applied. Flagged accordingly, though the superset relation makes the outcome unambiguous
  rather than a coin-flip on timestamps.

## Incoming changes preserved

- `.xgd/tickets/hot/request-18a48d63.md` — preserved. The incoming commit is a whole-file
  add (268 insertions, 0 deletions), so its "change" is the ticket in full; that content is
  present in HEAD verbatim for the body and in superseded-but-inclusive form for the
  frontmatter. This is the redundant case STEP 4 describes, not the discarded case STEP 3
  guards against: the incoming commit's key content is present in HEAD via a later route
  (the post-watermark sync that advanced the ticket to `free_and_reconciled` and bundled it
  into `bundle-b3b7c399`), rather than merely absent.

- No hunks were dropped under the BUG-1301 precedence exception; no code, test, or UAT files
  were involved in this conflict.

## Net effect

The resolution leaves **no staged diff against HEAD** (`git status --porcelain` shows no
tracked entries) — expected, since HEAD already contains a strictly later revision of the
only conflicted file. Per STEP 4 this is staged and exited as normal; `--skip` was not
called and `CHERRY_PICK_HEAD` is left in place for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.
