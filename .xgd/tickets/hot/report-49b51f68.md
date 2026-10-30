---
uid: report-49b51f68
id: REPORT-4537
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:27:00.304889+00:00'
updated_at: '2026-09-20T20:27:00.304889+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (kind `bug`, so rule **2e**, not 2d: it is not a spec ticket
  `story-`/`acceptance_criterion-`/`capability-`). Resolved to **ours**
  as the strict superset. Staged with `git checkout --ours --` then
  `git add --sparse --` (path is outside the sparse-checkout cone on
  resync branches, DOC-986 §2/§4.1).

  Incoming commit: `6ffb45e6e6 xgd(ticket): update bug bug-db356ff8`
  (2026-08-23). HEAD: `acb0d7985c xgd(reconciliation): terminal state
  complete`.

  Both sides carry the same commit subject, so the auto-enrichment
  could not disambiguate intent and fell back to "take the more recent
  commit by timestamp and flag for post-merge review." The content
  comparison makes that determination unambiguous rather than
  arbitrary — see below — so no post-merge review is warranted.

  `git diff :3:<path> :2:<path>` shows that the ONLY content ours
  removes relative to theirs is five superseded lines:

      -updated_at: '2026-08-23T23:42:40.733621+00:00'
      -completed_at: null
      -last_field_updated: body
      -status: draft
      -Scope drafted, awaiting operator confirmation before coding.

  Four superseded frontmatter scalars, plus the placeholder `## Status`
  paragraph. Each is the SAME fact changed on both sides, so 2e's
  timeline rule decides per fact, and HEAD is later-positioned
  (`updated_at` 2026-08-31T19:19:38 vs 2026-08-23T23:42:40) with the
  terminal values: `status: free_and_reconciled`, `completed_at` set,
  `last_field_updated: status`, and a Status paragraph recording both
  halves landed and verified.

  Everything else in ours is additive over theirs: `fields.story_points`,
  `fields.commits`, `fields.version`, `fields.bundled_in`, and the
  `# Implementation — the tenant fix` section. No field or section
  present only on the incoming side was dropped.

## Incoming changes preserved

No code/implementation files were in this conflict set, so there is no
`xgd_source/**`, `tests/**`, or `bin/**` file to verify against
`git show $CHERRY_PICK_HEAD -- <file>`.

For the one ticket file, the incoming commit's sole body addition —
the `## Implementation — landed and verified end to end (2026-08-23)`
section, including its `### A third finding, met while running it` and
`### The client secret was never printed into the session`
subsections — is present **verbatim** in the resolved file. Verified
directly: that text appears in the diff as unchanged context, not as a
removal, when comparing stage 3 (theirs) to stage 2 (ours).

No hunk was dropped under the BUG-1301 precedence exception. No UAT
test function was deleted. No
`git cherry-pick --continue/--skip/--quit/--abort` was invoked;
`CHERRY_PICK_HEAD` (`6ffb45e6e6a1946f9fbf1eabc76afb39aa31c025`) remains
present for the finalize step.

Note for the finalize step: because ours was a strict superset, the
staged resolution is byte-identical to HEAD and `git status --porcelain`
is empty — the staged diff is net-zero. That is the expected outcome
here, not a failure to stage.
