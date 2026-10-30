---
uid: report-4d575f9a
id: REPORT-5287
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T04:04:07.009311+00:00'
updated_at: '2026-09-28T04:04:07.009311+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (§2e,
  bug-kind). Single conflicted hunk, entirely within the frontmatter:

  | field | ours (HEAD) | theirs (incoming `244ac3569b`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `bundled` |
  | `updated_at` | `2026-08-31T19:19:36.428122+00:00` | `2026-08-26T17:36:27.185079+00:00` |
  | `completed_at` | `2026-08-31T19:19:36.428122+00:00` | `null` |

  Resolved **ours**, per-fact. The three conflicted keys are one fact — the
  ticket's lifecycle position — and ours is strictly downstream of theirs
  (`bundled` → … → `free_and_reconciled`) and five days later by
  `updated_at`. Taking incoming would have regressed the status and blanked
  `completed_at`. The ticket body was untouched on both sides.

  Staged with `git add --sparse` — `.xgd/tickets/` is outside this resync
  worktree's sparse-checkout cone (DOC-986 §2/§4.1), so a plain `git add`
  refused the path.

## Incoming changes preserved

The incoming commit's full diff against its parent is three lines in the
frontmatter, expressing two facts:

1. `status: ready_to_reconcile` → `bundled` (with the `updated_at` bump).
   **Subsumed by ours.** HEAD carries `free_and_reconciled`, a later state on
   the same lifecycle axis, reached after the bundled state the incoming
   commit was recording. Nothing is lost: the incoming fact is an earlier
   point on a path HEAD has already travelled past.
2. `+  bundled_in: bundle-78f4e2fe`. **Already present in ours, verbatim**
   (line 31 of the resolved file) — it merged cleanly and did not appear in
   the conflict hunk at all, because HEAD had already received it.

Verified against `git show 244ac3569b -- .xgd/tickets/hot/bug-6612c4b7.md`.
No code/implementation files were in conflict, and the BUG-1301 precedence
exception was not invoked — nothing was dropped.

Note for the finalize step: the staged tree is identical to HEAD
(`git diff --cached` is empty), so this cherry-pick is an empty commit — the
post-watermark sync had already landed everything it carried. Per STEP 4 this
is staged and reported as normal; `--skip` was not called.
