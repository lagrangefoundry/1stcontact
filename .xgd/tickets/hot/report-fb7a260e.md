---
uid: report-fb7a260e
id: REPORT-4581
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:47:55.386978+00:00'
updated_at: '2026-09-20T23:47:55.386978+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**. Resolved to the HEAD side on both hunks because HEAD is a strict superset of the incoming side.

  Cherry-picked commit: `e2ef5e9851` ("xgd(ticket): update bug bug-23d1ec27"). It carries exactly two changes:
  1. Adds `chat_comment: comment-72dd436d` to `fields:`.
  2. Strips the file's trailing newline (`\ No newline at end of file`).

  Both conflict hunks were context collisions, not competing facts — HEAD has moved well past the picked commit's parent:

  | Hunk | HEAD (kept) | Incoming |
  |---|---|---|
  | frontmatter `fields:` | `chat_comment` **plus** `commits:` (working_sha `759cd874`), `version: 0.2.15`, `story_points: 3`, `bundled_in: bundle-8eef3846` | `chat_comment` only; none of the later fields exist yet |
  | end of `## Reproduce` | closing fence + the "in a fresh worktree … `./bin/1c assets` emits it" note | bare closing fence, no trailing newline |

  Per 2e (one side a strict superset → keep the superset), HEAD wins on both. Taking "theirs" would have deleted the bundling/commit metadata (ticket is `status: bundled` into `bundle-8eef3846`) and the build-artefact note, in order to import a change HEAD already has. No fact was changed differently on the two sides, so no per-fact timeline arbitration was needed.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **preserved**. The incoming commit's sole substantive change, `chat_comment: comment-72dd436d`, is present in the staged index version at line 18 (verified with `git show :.xgd/tickets/hot/bug-23d1ec27.md`). It was already on the HEAD side, carried in by an earlier commit in this resync queue, which is why the file needed no edit to satisfy it.

- The one incoming hunk not reflected is the trailing-newline strip (`\ No newline at end of file`). This is a whitespace artifact, not a developer change; no BUG-1301 precedence exception is being invoked for it.

No code, test, or spec-matrix files were involved in this conflict. No test function was deleted.

## Staging state

`git status --porcelain` is empty after staging: the resolved content is byte-identical to HEAD, so the staged diff is clean. This is the expected no-net-change case (the picked commit's content already landed on this branch via an earlier path). Per instructions, `--skip` was **not** called — finalize will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` (`e2ef5e9851`) is left intact.
