---
uid: report-b6c8d732
id: REPORT-4345
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:58:28.521026+00:00'
updated_at: '2026-09-18T07:58:28.521026+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **AA** (both added), intent/bookkeeping
  ticket (`bundle-*`) → **rule 2e**, per-fact later-intent. Resolved to the HEAD
  side (`git checkout --ours` + `git add --sparse`; the path is outside the
  sparse-checkout cone on this reconcile branch, so the conflict existed only in
  the index).

  Sides, from `git ls-files -u` stage 2/3:
  - **Ours (HEAD)** — `4b197af0` *xgd(ticket): update bundle bundle-78f4e2fe*,
    2026-08-31 12:19:50 -0700. `status: free_and_reconciled`, `result: pass`,
    `completed_at` set, `commits[0].main_sha = 96a76934`, `merged_at_commit`,
    and a 21-entry `orphan_commits` remap.
  - **Theirs (incoming)** — `efdc5802` *xgd(ticket): create bundle
    bundle-78f4e2fe*, 2026-08-26 10:36:26 -0700. `status: ready_to_reconcile`,
    `completed_at: null`, no `result`, `commits` holding five raw
    `working_sha` entries with empty `working_sha_history`.

  The two blobs differ **only** in frontmatter bookkeeping. The entire markdown
  body (BUG-36 + BUG-37 + BUG-38, ~600 lines) is byte-identical apart from the
  incoming side missing its trailing newline. There is no competing prose edit,
  no disjoint field added on only one side, and nothing to compose: this is one
  ticket at two points of its own lifecycle. Every fact the two sides state
  differently is the same fact — status, completion, and which commits the
  bundle carries — recorded at creation on the incoming side and after the
  bundle finished reconciling on the HEAD side. HEAD is the later-positioned
  intent on every one of them (five days later, by the pipeline that rewrote
  them), so 2e's per-fact timeline rule selects HEAD for all of them. The
  auto-enrichment rule reached the same answer independently ("take the more
  recent commit by timestamp").

  Note on the `commits` list: the incoming side's five `working_sha` values
  (`ea48502d`, `2058a164`, `0fe586d1`, `999579b3`, `63df97c9`) do not appear
  verbatim in HEAD's `orphan_commits` old_sha column. They are not lost content
  — that list is the reconcile pipeline's own record of "which commits this
  bundle carries", and the pipeline superseded its pre-reconcile form with the
  post-merge form (`main_sha` + `merged_at_commit` + the orphan remap) as the
  bundle completed. Taking the earlier form back would roll a completed bundle's
  bookkeeping backwards. No content was invented; nothing was taken from outside
  the two sides.

## Incoming changes preserved

No code or implementation file was in this conflict — the sole conflicted path
is a bundle bookkeeping ticket, and its body is identical on both sides.

The incoming commit `efdc5802`'s effect is "ticket `bundle-78f4e2fe` (BUNDLE-21)
exists with this body". That effect is **present in HEAD**, via a later route:
HEAD already holds the same ticket with the same body, advanced to
`free_and_reconciled` / `result: pass`. This is the BUG-1109/BUG-1122 redundant
case, not a discard — STEP 3's guard is satisfied because the incoming commit's
content is in HEAD, not merely absent.

Accordingly the staged tree nets to no diff vs HEAD (`git status --porcelain`
is empty after staging). Per STEP 4 this is staged and exited @done as normal;
`--skip` was not called and `CHERRY_PICK_HEAD` (`efdc5802`) is still present for
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was invoked; no test function was touched.

Flagged for post-merge review as the enrichment rule directs, though the review
surface is nil: the resolution keeps a completed bundle ticket at its completed
state and changes no byte of the tree.
