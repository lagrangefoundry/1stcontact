---
uid: report-15f68ad8
id: REPORT-4749
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:55:08.896063+00:00'
updated_at: '2026-09-21T14:55:08.896063+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **AA** (both added), intent/bookkeeping
  ticket (§2e). Outside the sparse-checkout cone, so resolved via
  `git checkout --ours` + `git add --sparse`.

  Incoming commit is `3fc6491817 xgd(ticket): create bug bug-3ade1af4` — the
  ticket's original creation stub (2026-09-01, 18 lines). HEAD already carries
  the same ticket in its finished form (183 lines), landed on the target side
  by `7d4b20a363 xgd(ticket): seed_local_overlay bug bug-3ade1af4`
  (2026-09-11, +184) and advanced by `29bdc256d7` and `959fade37c`. None of
  those three are in the replay window — they are part of the target base, not
  of the queue — which is why the same path was added independently on both
  sides.

  Two conflict regions, both resolved in favour of HEAD:

  1. **Header block.** Field by field, the incoming side is a strict subset:
     `uid`, `id`, `type`, `created_by`, `created_at` are byte-identical on both
     sides; `title` (`Untitled` -> the real title), `updated_at`
     (`2026-09-01T19:01:30Z` -> `2026-09-19T15:15:31Z`), `completed_at`
     (`null` -> `2026-09-14T10:29:13Z`), `last_field_updated` (`created_at` ->
     `status`) and `status` (`draft` -> `free_and_reconciled`) are each the
     stub's initial value against HEAD's later one.
  2. **`fields:` tail and body.** The three fields the stub declares
     (`auto_merge_back`, `needs_review`, `priority`) sit outside the conflict
     markers and are common to both sides. HEAD additionally carries
     `chat_comment`, `severity`, `story_points`, `commits` (one working_sha),
     `version: 0.2.33` and `bundled_in: bundle-8e1807f6`, plus the full body
     (Symptom / three Causes / Test plan). The incoming body is the placeholder
     `(new ticket)`. Superset kept.

  This agrees with the auto-enrichment rule for this file ("take the more
  recent commit by timestamp"): HEAD's side is 2026-09-19, the incoming side
  2026-09-01. Flagged for post-merge review per that rule, though no fact was
  changed differently on both sides, so no per-fact tiebreak was needed.

## Incoming changes preserved

- Nothing was discarded. `3fc6491817` is a pure file-creation commit whose
  entire payload -- five header fields, three `fields:` entries, a placeholder
  body -- is either byte-identical to HEAD or superseded by a later value of
  the same field already present in HEAD. Verified by diffing
  `git show 3fc6491817:<path>` against `git show HEAD:<path>` key by key.

  The ticket's later history is still queued and will replay behind this one:
  `0170f868e2`, `cda495bd6e`, `d2b87a3946`, `d2414ced51` (window index 3203),
  `d137bd257e` (3481) and `79bbb8e08f` (4725) all sit after index 436 in the
  cherry-pick window, so any fact the stub would have contributed that a later
  update revises arrives on its own commit.

  No BUG-1301 precedence exception was invoked -- no hunk was dropped because a
  HEAD-side refactor had removed its target. No test file was touched, so 2f
  did not apply.

## Staging state

`git status --porcelain` is empty: no AA/UU/DU/UD lines remain, and
`git diff --cached HEAD` is empty -- the staged tree is byte-identical to HEAD,
since the resolution keeps HEAD's file whole and the incoming side adds
nothing. Per STEP 4, neither `--continue` nor `--skip` was called; finalize
will detect the clean staged diff. `CHERRY_PICK_HEAD`
(`3fc64918172b7674ada9a9019219032670f4c630`) is intact.
