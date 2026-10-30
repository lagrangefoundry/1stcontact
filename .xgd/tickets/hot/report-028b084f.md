---
uid: report-028b084f
id: REPORT-5487
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:06:23.601521+00:00'
updated_at: '2026-09-29T07:06:23.601521+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **UU (both modified)**, intent/bookkeeping
  ticket (`request-*`), so the §2e per-fact rule applies (not §2d ledger replay —
  this is not a story/acceptance_criterion/capability matrix ticket). Path is outside
  the sparse-checkout cone (`core.sparseCheckout=true` with `!/.xgd/tickets/**`, 11%
  of tracked files present), so the conflict existed only in the index with no
  working-tree markers; resolved by writing the chosen blob directly into stage 0
  (`git update-index --cacheinfo 100644,284e1e08f9921da12386ff32cd829bfb1441369a`),
  then `git sparse-checkout reapply` to restore the `skip-worktree` bit so the path
  did not read as worktree-deleted.

  Per-fact resolution — every fact the incoming side touches is superseded on HEAD:

  | Fact | Base | Incoming (`e558098f12`) | Ours (HEAD `35a579abb2`) | Winner |
  |---|---|---|---|---|
  | `status` | `draft` | `free_coding` | `free_and_reconciled` | ours (later lifecycle state; `free_coding` is a stage already passed through) |
  | `updated_at` | 09-01 21:16:28 | 09-01 21:20:09 | **09-19 15:15:29** | ours (later) |
  | `last_field_updated` | `title` | `status` | `status` | identical |
  | body | short original | **byte-identical to base** | strict superset | ours (incoming contributes nothing) |

  No fact is changed differently on both sides, so there is no genuine intent
  conflict to split: ours is a strict superset on content and strictly later on
  lifecycle. Resolution = take ours (blob `284e1e0`) whole.

  HEAD additionally carries `completed_at`, two `commits` entries, `version: 0.2.37`
  and `bundled_in: bundle-8e1807f6`, plus body sections absent from both base and
  incoming (BUG-41/BUG-42 consequences, the SVG/HTML rules, the reader-destruction
  and missing-bytes notes, the `markdown.js` re-export note, and a two-suite test
  plan). None of that is disturbed.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so there is no developer code to preserve or discard.

The BUG-1301 precedence exception was **not** invoked: nothing was deleted, and no
UAT function on either side was touched.

The incoming commit's entire delta against the merge base is three header lines
(`status: draft -> free_coding`, `last_field_updated: title -> status`, and the
matching `updated_at` bump) plus a dropped trailing newline; its body is
byte-identical to base. Diff confirming this:

```
8c8
< updated_at: '2026-09-01T21:16:28.404448+00:00'
> updated_at: '2026-09-01T21:20:09.705813+00:00'
10,11c10,11
< last_field_updated: title
< status: draft
> last_field_updated: status
> status: free_coding
96c96
< the field.
> the field.
\ No newline at end of file
```

Every one of those facts is superseded by a strictly later value on HEAD, so the
incoming intent is not discarded — it is already subsumed. Verified via
`git show $CPHEAD -- <file>` against the resolved blob.

## Staging state

`git ls-files -u` is empty and `git status --porcelain` is clean.
`git diff --cached HEAD` is empty: because ours wins on every fact, this
cherry-pick contributes no net change, so the finalize step should detect the
clean staged diff and skip the commit. Per instruction,
`--continue`/`--skip`/`--quit`/`--abort` were NOT invoked; `CHERRY_PICK_HEAD`
remains at `e558098f127aec0d84278d63cbc2b43cc8ccd526`.
