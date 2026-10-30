---
uid: report-422bde07
id: REPORT-5525
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:31:07.088029+00:00'
updated_at: '2026-09-29T09:31:07.088029+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Outside the sparse-checkout cone, so the conflict
  existed only in the index; resolved by composing a merged blob, writing it with
  `git hash-object -w` + `git update-index --cacheinfo`, then materialising it in
  the worktree so index and tree agree.

  The 334-line body is **byte-identical on all three stages** — the entire
  conflict is YAML frontmatter, where both sides added a `commits:` list at the
  same position. Resolved **per fact**, not per side:

  | fact | base | ours (HEAD) | theirs (`073b9b37bc`) | taken |
  |---|---|---|---|---|
  | `status` | `free_coding` | `free_coding` | `free_coded` | **theirs** |
  | `last_field_updated` | `body` | `body` | `status` | **theirs** |
  | `updated_at` | `21:49:43` | `21:49:43` | `21:51:18` | **theirs** |
  | `fields.version` | — | — | `0.2.44` | **theirs** (addition, no competing value) |
  | `commits[1].reconcile_sha` | — | `0cdcdaa491…` | `null` | **ours** (strict superset) |
  | `commits[*].working_sha_history` | — | `[]` | absent | **ours** (current schema; present in other `hot/` tickets at HEAD) |

  No fact was contested with two different non-null values, so no side was
  discarded wholesale. Trailing newline retained (theirs had dropped it).

## Incoming changes preserved

Verified against `git show $CHERRY_PICK_HEAD -- .xgd/tickets/hot/request-3f8737f2.md`.
Every line the incoming commit added or changed is present in the staged blob:
`status: free_coded`, `last_field_updated: status`,
`updated_at: '2026-09-02T21:51:18.823770+00:00'`, `version: 0.2.44`, and both
`working_sha` entries (`11ca5fea…`, `ecbed061…`).

The only incoming line not reproduced verbatim is
`commits[1].reconcile_sha: null`, superseded by ours' concrete
`0cdcdaa491aea665be5cc9b215b2a0f144be165e`. That is the reconcile commit this
resync branch exists to record; ours is strictly more informative than incoming's
placeholder, so this is a superset merge rather than a discarded change.

No hunks dropped under the BUG-1301 precedence exception. No test files involved.

## Staging state

`git status --porcelain` → `M  .xgd/tickets/hot/request-3f8737f2.md`; no
`UU`/`AA`/`DU`/`UD` lines remain. `CHERRY_PICK_HEAD` (`073b9b37bc`) left intact —
no `--continue`/`--skip`/`--quit`/`--abort` was issued.
