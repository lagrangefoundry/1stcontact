---
uid: report-9e994c01
id: REPORT-4867
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T19:24:04.940570+00:00'
updated_at: '2026-09-23T19:24:04.940570+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule §2e plus the enrichment's "take the more recent commit by
  timestamp" directive. The conflict hunk covered exactly four frontmatter
  lines; no body conflict.

  | | `updated_at` | `completed_at` | `last_field_updated` | `status` |
  |---|---|---|---|---|
  | base (`fb09a00e79`) | `2026-09-01T00:01:02` | `null` | `status` | `reconciling` |
  | HEAD (`e909dcbb97`) | `2026-09-02T01:34:36` | `2026-09-02T01:34:00` | `result` | `free_and_reconciled` |
  | incoming (`9355f06b96`) | `2026-09-02T01:34:01` | `2026-09-02T01:34:01` | `status` | `free_and_reconciled` |

  HEAD carries the later timestamp (`01:34:36` vs `01:34:01`) and won per the
  rule. This is not a per-fact split: the incoming side's only contribution is
  the `reconciling → free_and_reconciled` transition, which HEAD already
  contains — the `status:` line itself never entered the conflict hunk. HEAD
  additionally holds a subsequent `result` write and, outside the hunk, the
  full `orphan_commits` block plus the collapsed `commits` entry
  (`main_sha: 4b43dd9a5c`), none of which exist on the incoming side. Keeping
  the incoming timestamps would have rewound `updated_at` by 35 seconds and
  reset `last_field_updated` from `result` to `status`, misreporting which
  field was written last.

  Flagged for post-merge review per the enrichment rule (intent unknown on
  both sides — both commit subjects are the bare
  `xgd(ticket): update request request-13a5e206`).

## Incoming changes preserved

No code, test, or config files were in conflict — this was a single ticket-file
conflict, so STEP 3's `git show $CPHEAD -- <file>` code verification does not
apply and no BUG-1301 precedence exception was invoked.

The incoming commit's semantic contribution is nonetheless preserved: its
status transition to `free_and_reconciled` is present verbatim in the resolved
file. Because HEAD's side won in full, the resolved blob is identical to HEAD's
(`e909dcbb97`) and the path shows clean rather than staged-modified in
`git status --porcelain` — the expected shape for a subsumed cherry-pick.
Python's finalize step will detect the empty staged diff and skip the commit.

Cherry-pick left paused: `CHERRY_PICK_HEAD` still present at `a785e4bd9e`.
No `--continue`/`--skip`/`--quit`/`--abort` was issued.
