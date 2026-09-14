---
uid: report-c8af3d82
id: REPORT-4202
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:02:15.961822+00:00'
updated_at: '2026-09-14T03:02:15.961822+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Rule applied: *one side is a strict superset of the other → keep the superset.*

  The incoming commit `235bdfc0` ("xgd(ticket): update bug bug-034bf955",
  free_coded, xgd-working) adds exactly one line to the `fields:` block:
  `chat_comment: comment-77992e39`. That is its entire diff.

  The HEAD side ("xgd(ticket): seed_local_overlay bug bug-034bf955") is the
  seeded local overlay for BUG-42, and **already carries that exact field**,
  plus the full ticket: title ("Builder: markdown shows as source on first
  load, and never renders in the Library"), status `bundled`, the
  Symptom/Root cause/Fix/Test plan body, and `severity`, `commits`,
  `version`, `story_points`, `bundled_in`.

  Index stages confirm this directly:
  - stage 1 (base) — draft stub, no `chat_comment`
  - stage 3 (theirs) — draft stub **+** `chat_comment: comment-77992e39`
  - stage 2 (ours) — full ticket, **includes** `chat_comment: comment-77992e39`

  Every field theirs sets, ours sets identically. There is no same-field
  divergence, so the timeline rule was not reached — ours is a proper
  superset and was kept whole. No content was invented, and no field was
  modified beyond what one side already declared.

  Mechanics: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1),
  so the conflict existed only in the index with no working-tree markers —
  the file never materialized on disk. Resolution was applied by pointing the
  index entry at the stage-2 blob (`91ed8fa`), which collapses stages 1/2/3 to
  stage 0 without touching the working tree. The `skip-worktree` bit that this
  clears was then re-set, so the sparse state is unchanged (`git ls-files -v`
  reports `S`, as before).

## Incoming changes preserved

Confirmed. The incoming commit's sole change — `chat_comment:
comment-77992e39` — **is present** in the resolved stage-0 blob
(`git show :0:.xgd/tickets/hot/bug-034bf955.md` → line 17). Nothing from the
incoming diff is absent.

No hunks were dropped, so the BUG-1301 precedence exception does not apply
here. No test files were involved.

Note for the finalize step: this resolution nets to **no diff vs HEAD**
(`git diff --cached HEAD` is empty). Per STEP 4 this is the *redundant*
case, not the *discarded* case, and STEP 3 is what distinguishes them — the
incoming commit's key change is present in HEAD via the seeded overlay, which
had already landed the same field through a different route (BUG-1109/BUG-1122
shape). `--continue`/`--skip`/`--quit`/`--abort` were NOT called; the
cherry-pick sequencer state is intact (`CHERRY_PICK_HEAD` =
`235bdfc02d07f5d924bdb77dff605d34781f86b0`) for
cherry_pick_finalize_resolution to act on.
