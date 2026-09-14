---
uid: report-556cdef8
id: REPORT-4205
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:10:24.229347+00:00'
updated_at: '2026-09-14T03:10:24.229347+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent/bookkeeping
  ticket (rule 2e), sparse-excluded so the conflict existed only in the index
  (no working-tree markers; inspected via `git show :1:/:2:/:3:`).
  **Resolution: took ours** (`git checkout --ours --ignore-skip-worktree-bits`,
  `git add --sparse`), because ours is a strict superset of theirs.

  - Ours = `xgd(ticket): seed_local_overlay request request-8b33a146` — the
    fully-evolved overlay state: real title, `status: bundled`,
    `last_field_updated: status`, `fields.commits` (2 working shas),
    `fields.version: 0.2.37`, `fields.bundled_in: bundle-8e1807f6`, and the
    complete ~130-line ticket body.
  - Theirs = `xgd(ticket): update request request-8b33a146` (a705404b3e) — the
    ticket at creation state: `title: Untitled`, `status: draft`,
    `last_field_updated: created_at`, body `(new ticket)`, plus one added line.
  - Accepting theirs would have rewound the ticket to its draft snapshot and
    dropped the bundling bookkeeping this reconcile run depends on. No field is
    changed differently on the two sides, so the 2e timeline rule does not
    engage — this is the "one side is a strict superset" case.

## Incoming changes preserved

The incoming commit a705404b3e touches one file and contributes exactly one
line to it:

```
   priority: medium
+  chat_comment: comment-972387b5
```

That line is **already present** in the ours/HEAD version of
`.xgd/tickets/hot/request-8b33a146.md`, under `fields:` in the same position
(the seed_local_overlay commit carried it). Verified by reading stage 2 of the
index directly: `fields.chat_comment: comment-972387b5`.

So the incoming commit's entire effect is present in the resolution — this is a
genuinely redundant cherry-pick (STEP 4 / BUG-1109 case), not a discard. No
BUG-1301 precedence exception was invoked; no hunk was dropped.

`git diff HEAD --stat` against the staged tree is empty, which is the expected
outcome. Per STEP 4, `--skip` was NOT called; the finalize step will detect the
clean staged diff.

## Post-merge review flag

The auto-enrichment classified this as "intent unknown on one or both sides →
flag for post-merge review." Flagging it here for completeness, though the
redundancy above makes it low-risk: the resolved ticket is byte-identical to
HEAD, so nothing about REQ-172's state changed in this cherry-pick.
