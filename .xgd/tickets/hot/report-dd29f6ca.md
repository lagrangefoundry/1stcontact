---
uid: report-dd29f6ca
id: REPORT-4415
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:11:05.472416+00:00'
updated_at: '2026-09-19T12:11:05.472416+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41) — class **UU**, rule **2e** (intent/bookkeeping ticket), sub-rule "one side is a strict superset of the other: keep the superset". Resolved to **ours** (`2ac4f433`).

  The path is outside the sparse-checkout cone, so the conflict existed only in
  the index with no working-tree markers (DOC-986 §2/§4.1). Resolved with
  `git checkout --ours --` followed by `git add --sparse --`, each as its own
  standalone call.

  Three-way stage analysis:

  | stage | blob | lines | state |
  |---|---|---|---|
  | base | `fae1a2e4` | 17 | `title: Untitled`, `status: draft`, body `(new ticket)` |
  | theirs (incoming `daaaeaea`, 2026-09-01) | `44148bf6` | 18 | base + exactly one line: `chat_comment: comment-0948105e` |
  | ours (HEAD `0e3ad824`, 2026-09-17) | `2ac4f433` | 104 | real title, `status: bundled`, `completed_at`, `severity`, `commits`, `version: 0.2.35`, `story_points`, `bundled_in: bundle-8e1807f6`, plus the full Symptom / Root cause / Fix / Test plan body |

  The incoming side is a stale early snapshot of the same ticket taken before it
  was triaged, worked and bundled. Its *entire* delta over base is the single
  `chat_comment: comment-0948105e` line, and ours already carries that exact
  line (`fields.chat_comment`, ours line 17). There is therefore no competing
  fact between the two sides — nothing in the incoming version is absent from
  ours, so no per-fact `xgd working-timeline` tiebreak was needed.

  This also agrees with the auto-enrichment's fallback rule for this file
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp"): the ours-side commit `0e3ad824` (2026-09-17 13:23:48 -0700)
  post-dates the incoming commit `daaaeaea` (2026-09-01 13:43:37 -0700) by
  sixteen days.

  Taking the incoming side, or any part of it, would have reverted a bundled
  ticket back to `Untitled` / `draft` / `(new ticket)` and discarded the
  ticket's entire worked body along with the `commits`, `version` and
  `bundled_in` bookkeeping this bundle depends on.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket (rule 2e).

STEP 3 check for `.xgd/tickets/hot/bug-93851fea.md`: `git show daaaeaea -- <file>`
shows the incoming commit's complete diff as one added line:

```
+  chat_comment: comment-0948105e
```

That line is present verbatim in the staged resolution. The incoming change is
preserved — present in HEAD via a different route (carried forward through the
ticket's subsequent evolution), which is the *redundant*, not *discarded*, case
described in STEP 4. No hunk was dropped, so the BUG-1301 precedence exception
does not apply here.

## Staging state

`git status --porcelain` is empty: the conflict class line is gone and the
staged blob (`2ac4f433`) is identical to `HEAD:.xgd/tickets/hot/bug-93851fea.md`,
so this pick nets to no diff vs HEAD for this file. Per STEP 4 this is not a
failure and `--skip` was **not** called — the finalize step will detect the
clean staged diff and skip the commit.

The cherry-pick sequencer is untouched: `CHERRY_PICK_HEAD` is still present at
`daaaeaeabcfea6516c620ca6adb35799e5076aa9`. Git writes were limited to
`checkout --ours` and `add --sparse` on this single path.
