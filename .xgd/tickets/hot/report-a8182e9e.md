---
uid: report-a8182e9e
id: REPORT-2784
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:06:05.631012+00:00'
updated_at: '2026-08-31T07:06:05.631012+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-bde8d037.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`). Rules **2b** (AA: keep the strict superset, incoming wins when
  incoming is the larger version) and **2e** (bookkeeping ticket: "incoming only added a
  field the other side never touched → keep the superset") both point the same way, so no
  timeline lookup was needed — there is no competing fact on the HEAD side.
  Resolution: `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1 — the conflict existed only in the index).

  Diff between the two sides was exactly one line:

  ```
   @@ -21,4 +21,5 @@ fields:
      story_points: 2
      bundled_in: bundle-cceaba25
   +  chat_comment: comment-aef5f38c
    ---
  ```

  Byte-identical elsewhere: same `status: free_and_reconciled`, same `version: 0.0.175`,
  same `updated_at`/`completed_at`, same `commits[].working_sha`, same `bundled_in`, and
  an identical markdown body (Symptom / Root cause / Fix / Acceptance / Context). No
  `fields.intent_uid`, `fields.story_uid`, or `fields.capability_uid` was touched, and no
  content absent from both sides was introduced.

## Incoming changes preserved

Verified before staging: the resolved worktree file hashes to
`59466fbb0423e5f62f7c328ac2f17d17a87fd422`, which **is** the incoming (stage-3) blob from
cherry-pick commit `a0e5392e8d7fbc4e9220be4a612ef634cfe97fd3`
("xgd(ticket): update request request-bde8d037", 2026-08-23). The incoming commit touches
this one file and only this file (108 insertions, 0 deletions — it adds the file), so its
entire diff is present in the resolution.

Nothing from the HEAD side was discarded: the ours blob
(`997fcb447446ca2838b0f9bb2ee467855840f209`) is a strict subset of the incoming one, so
taking incoming loses no HEAD-side fact. No hunks were dropped, and the BUG-1301
precedence exception was not invoked — no test files, code files, or deletions were
involved in this conflict.

Note (informational, not a defect in this resolution): the `chat_comment: comment-aef5f38c`
reference the incoming side adds points at a ticket that is not currently present under
`.xgd/tickets/` in this worktree — it last appears in history at
`7db70d6594cb42ec21635f3f0769335734335c1d` ("xgd(resync): strip .xgd/tickets ... from main
snapshot (BUG-904)"). The reference is authored content on the incoming side, so it was
kept verbatim rather than pruned; a dangling `chat_comment` pointer is cosmetic and
inventing or deleting content is prohibited by 2e.

Cherry-pick state left intact: `CHERRY_PICK_HEAD` still present, no
`--continue`/`--skip`/`--quit`/`--abort` and no `reset`/`checkout <branch>` issued. Working
tree has no unmerged paths (`git diff --name-only --diff-filter=U` is empty); the file
stages as `M `.
