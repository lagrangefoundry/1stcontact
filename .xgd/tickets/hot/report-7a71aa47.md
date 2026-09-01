---
uid: report-7a71aa47
id: REPORT-3184
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:31:28.378006+00:00'
updated_at: '2026-09-01T02:31:28.378006+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, index-only conflict (outside the
  sparse-checkout cone on the reconcile branch, DOC-986 §2/§4.1: no working-tree
  file and no markers on disk, so the sides were read via `git show :1:/:2:/:3:`).
  Intent/bookkeeping ticket, rule **2e**, resolved per-fact to the HEAD (ours)
  content via `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse`.

  Incoming commit `1975a687` (`xgd(ticket): update bug bug-6612c4b7`,
  2026-08-24T14:09:26-0700, `free_coded`) is a **single insertion**:
  `+  chat_comment: comment-a4e77428` under `fields:`.

  | fact | base (:1) | ours (:2, HEAD) | theirs (:3, incoming) | resolution |
  |---|---|---|---|---|
  | `fields.chat_comment` | absent | **`comment-a4e77428`** | **`comment-a4e77428`** (added) | both sides identical — no conflict; incoming's value is what stands |
  | `updated_at` | 2026-08-24T21:06:30Z | **2026-08-26T17:36:27Z** | 2026-08-24T21:06:30Z (**unchanged vs base**) | HEAD — incoming made no decision here |
  | `status` / `last_field_updated` | draft / title | **bundled / status** | draft / title (unchanged vs base) | HEAD |
  | `fields.{commits,version,bundled_in}` | absent | **present** | absent (unchanged vs base) | HEAD |
  | body | draft-era | **rewritten** (confirmed root cause, memoisation fix, observability) | byte-identical to base | HEAD |

  No competing fact existed — the one field incoming touched, HEAD already held
  at the identical value — so the `xgd working-timeline` tiebreak was not needed.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md`: the incoming commit's entire content is the
  line `chat_comment: comment-a4e77428`, and that line is **already present in
  HEAD verbatim**, confirmed by
  `git show HEAD:.xgd/tickets/hot/bug-6612c4b7.md | grep chat_comment`
  (line 18). It arrived through HEAD's later bundling write rather than through
  this commit.

  Nothing was discarded. This is the redundant-commit case (STEP 4 /
  BUG-1109/BUG-1122), and STEP 3's discriminator is satisfied in the "present in
  HEAD via a different route" sense, not the "simply absent" sense. The staged
  diff vs HEAD is therefore empty; per STEP 4 the resolution was staged and left
  for `cherry_pick_finalize_resolution` to skip. No `--skip`/`--continue`/
  `--abort` was issued; `CHERRY_PICK_HEAD`
  (1975a6876b6a366ea6354226d9e23c37de42d5d2) is intact.

  Context on why HEAD already had it: the immediately preceding commit in this
  bundle, `a9021e47` (the resolution filed as REPORT-3183), deleted the
  duplicated `fields.title` from a HEAD blob that already carried
  `chat_comment`, `commits`, `version` and `bundled_in` from the 2026-08-26
  `status: draft -> bundled` write. This commit's insertion is the working
  timeline re-deriving a field the reconcile branch had already recorded.

No code, UAT or config files were in conflict, so the BUG-1301 precedence
exception did not arise and no hunk was dropped under it.
