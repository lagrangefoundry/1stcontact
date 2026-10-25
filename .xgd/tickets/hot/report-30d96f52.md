---
uid: report-30d96f52
id: REPORT-6713
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:24:19.732735+00:00'
updated_at: '2026-10-25T23:24:19.732735+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157, "The fidelity surface"). File class: intent/bookkeeping ticket (2e). Rule: one side is a superset, so keep the superset, which is OURS (HEAD).
  - Incoming (e7b09994, "update request request-3f8737f2", 2026-09-02) did two things: it appended the "Field evidence" section from CHAT-35 and bumped updated_at/last_field_updated=body.
  - HEAD (updated 2026-10-25) already has that section word for word, except for two lines:
    - The italic header adds a "Restored:" sentence. It says the section was overwritten by a body rewrite and then put back.
    - The "Status note" paragraph has been rewritten as "Status note, updated." The original said the ticket was still `draft` waiting on REQ-154/155/156/149. That is no longer true: all four have landed and the ticket is `bundled` in bundle-5607a08d.
  - On top of that, HEAD carries later changes the incoming side does not have: status `bundled`, commits/version/bundled_in fields, the caretaker→consultant rename (REQ-174), and the Decisions, Behaviour and As-built sections.
  - Where the two sides differ on the same fact (the status note, updated_at, last_field_updated, status), HEAD is the later-timestamped side, so it also wins under the enrichment rule ("take the more recent commit by timestamp").
  - Staged by writing HEAD's blob (be50fd03) to index stage 0 (`git update-index --cacheinfo`), then re-setting skip-worktree because the path is outside the sparse cone. The working tree was left alone, and the result is the same as `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

- The incoming commit's only real content, the "Field evidence" section (backdrop-or-subject finding, describe.ts/REQ-163 description not attached to the asset, the three stacked failures), is present in HEAD verbatim.
- Two incoming elements are not kept, on purpose. Each was superseded by a later edit of the same ticket:
  - the stale "Status note for scheduling" paragraph (replaced by "Status note, updated" in HEAD);
  - the 2026-09-02 updated_at.
- Net staged diff vs HEAD is empty. This commit is redundant, not discarded: its effect already landed through the later restoration in HEAD. Finalize should detect the empty diff and skip it.
- No code files were involved.

## Flag for post-merge review

Per the enrichment rule ("intent unknown on one or both sides"), this file is flagged for a light post-merge review. The suggested check is that the "Field evidence" section appears exactly once in REQ-157's body.
