---
uid: report-f41d92c6
id: REPORT-4833
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:04:40.896421+00:00'
updated_at: '2026-09-23T18:04:40.896421+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — conflict class `UU` (index-only; path
  lives outside the sparse-checkout cone, so it was staged with
  `git add --sparse`). File class: intent/bookkeeping ticket (`bug-*`),
  STEP 2e. Rule applied: **one side is a strict superset — keep the
  superset (HEAD verbatim)**.

  Evidence: the merge base (stage `:1:`, 17 lines) is the original draft stub
  (`title: Untitled`, `status: draft`, body `(new ticket)`). The incoming side
  (stage `:3:`, 18 lines, from `daaaeaeabc "xgd(ticket): update bug
  bug-93851fea"`) is that same stub plus exactly one added field:
  `chat_comment: comment-0948105e`. HEAD (stage `:2:`, 104 lines) is the fully
  developed ticket — `status: free_and_reconciled`, real title, `completed_at`,
  `severity`, `commits[]`, `version: 0.2.35`, `story_points`, `bundled_in` —
  and **already carries `chat_comment: comment-0948105e`** at line 17. The
  incoming side's entire delta over the base is therefore already present in
  HEAD, so no per-fact timeline arbitration was required (the metadata's
  "take the more recent commit by timestamp" fallback did not need to be
  exercised — there is no genuinely competing fact).

  Resolution: removed the three conflict markers, keeping the HEAD text. The
  resolved blob is byte-identical to stage `:2:` (verified by diffing the
  extracted `:2:` blob against the working file), and a marker grep returns 0.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-93851fea.md` — **preserved.** The incoming commit's
  sole contribution relative to the merge base is the field
  `chat_comment: comment-0948105e`, and that field is present in the resolved
  file. No hunk was dropped; the BUG-1301 precedence exception was not needed
  and was not used.

No code/implementation files (`xgd_source/**`, `tests/**`, `bin/**`) were in
conflict, so no UAT test function was touched or deleted.

## Note on net effect

Because the resolution is byte-identical to HEAD, this cherry-pick leaves no
net change: `git status --porcelain` is empty and `git ls-files -u` reports
zero unmerged entries. Per the mission's instruction, `--skip` was NOT called
here — the in-progress cherry-pick is left intact (`CHERRY_PICK_HEAD` =
`daaaeaeabcfea6516c620ca6adb35799e5076aa9`) for Python's finalize step, which
detects the clean staged diff and skips the commit.
