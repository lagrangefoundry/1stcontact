---
uid: report-71e105cd
id: REPORT-4417
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:14:56.605821+00:00'
updated_at: '2026-09-19T12:14:56.605821+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41) — class **UU**, rule **2e**
  (intent/bookkeeping ticket), resolved per-fact; every fact landed on **ours**
  (`2ac4f433`).

  Incoming commit: `370ff625` — *"xgd(ticket): update bug bug-93851fea"*,
  Martin Westhead, 2026-09-01 13:49:57 -0700, 8 insertions / 3 deletions. This
  is the third link in the same chain of ticket-update commits for BUG-41
  (`daaaeaea` at scope `138/0` → `dadea5a9` at `139/0` → `370ff625` here): the
  merge base is `e14b489d`, exactly the blob `dadea5a9` produced.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Resolved
  with `git checkout --ours --` then `git add --sparse --`, each as its own
  standalone Bash call.

  Per-fact comparison of the incoming blob (`c1b3b220`) against ours
  (`2ac4f433`) — a full `diff -u` of the two shows only these differences:

  | fact | theirs (`c1b3b220`) | ours (`2ac4f433`) | kept | why |
  |---|---|---|---|---|
  | `fields.commits` (`working_sha: d019bab7…`, `reconcile_sha: null`, `main_sha: null`) | added by this commit | **identical** | — | no conflict |
  | `fields.version` | `0.2.35` | **identical** | — | no conflict |
  | title, `severity`, `chat_comment`, `last_field_updated`, body (~100 lines) | unchanged | **byte-identical** | — | no conflict |
  | `status` | `free_coded` | `bundled` | ours | later lifecycle position |
  | `updated_at` | `2026-09-01T20:49:57` | `2026-09-16T01:48:36` | ours | later |
  | `completed_at` | `null` | `2026-09-14T10:29:09` | ours | later |
  | `fields.story_points: 2`, `fields.bundled_in: bundle-8e1807f6` | absent | present | ours | ours-only addition |

  Ours is a **strict superset** of the incoming version. The two facts this
  commit actually introduces — the `commits` entry and `version: 0.2.35` — are
  already present in ours, byte-for-byte including the `working_sha`
  `d019bab77200d88dd613c94e0bbaa93b300ed526`. The only divergences are the three
  lifecycle scalars, where ours holds the unambiguously later state: `bundled`
  is downstream of `free_coded`, and ours additionally records
  `bundled_in: bundle-8e1807f6` — the very bundle this reconcile run is
  processing. Taking the incoming side on those scalars would have reverted the
  ticket out of its own bundle.

  No `xgd working-timeline` tiebreak was needed: there is no fact on which the
  incoming side is later or carries content ours lacks.

  This also agrees with the auto-enrichment's fallback rule for this file
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp"): the ours-side blob descends from commits dated 2026-09-17 and
  later, against the incoming commit's 2026-09-01.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket (rule 2e).

STEP 3 check for `.xgd/tickets/hot/bug-93851fea.md`: `git show 370ff625 -- <file>`
shows the incoming commit (a) adding `fields.commits` with
`working_sha: d019bab77200d88dd613c94e0bbaa93b300ed526`, (b) adding
`fields.version: 0.2.35`, (c) advancing `status` `free_coding` → `free_coded`
with a new `updated_at`, and (d) dropping the trailing newline at EOF.

Items (a), (b) and (d) are present **verbatim** in the staged resolution. Item
(c) is present in HEAD via a different route: the ticket has since advanced past
`free_coded` to `bundled`, which supersedes rather than discards the incoming
lifecycle edit. This is the *redundant*, not *discarded*, case described in
STEP 4. No hunk was dropped, so the BUG-1301 precedence exception does not apply.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` returns nothing: the UU
class line is gone and the staged blob (`2ac4f433`) is identical to
`HEAD:.xgd/tickets/hot/bug-93851fea.md`, so this pick nets to no diff vs HEAD.
Per STEP 4 that is not a failure and `--skip` was **not** called — the finalize
step will detect the clean staged diff and skip the commit.

The cherry-pick sequencer is untouched: `CHERRY_PICK_HEAD` is still present at
`370ff625932c4b97f5947725759ae1243bced452`. Git writes were limited to
`checkout --ours` and `add --sparse` on this single path.
