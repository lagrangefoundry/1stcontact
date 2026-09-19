---
uid: report-2229d2ab
id: REPORT-4394
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:05:25.094895+00:00'
updated_at: '2026-09-19T11:05:25.094895+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, out-of-sparse-cone (conflict existed in the index only; no working-tree markers). Rule **2e** (intent/bookkeeping ticket — `request-*`). Resolved to the **ours/HEAD** side: `git checkout --ours` materialized it (verified `git hash-object` == stage-2 blob `2e26c89eae`, byte-for-byte, no conflict markers), then `git add --sparse`.

  Fact-by-fact basis (ours-vs-theirs diff is frontmatter only — the body is byte-identical on both sides, including the trailing-newline change, so no prose content was at stake):

  | fact | incoming (`free_coded`, e0795d93, Sep 1) | ours (HEAD, `bundled`, 997058fc, Sep 17) | taken |
  |---|---|---|---|
  | `fields.commits[0].working_sha` | `ab467d6ce366…` | `ab467d6ce366…` (identical) | either — same value |
  | `fields.version` | `0.2.32` | `0.2.32` (identical) | either — same value |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | ours (superset) |
  | `completed_at` | `null` | `2026-09-14T10:29:15` | ours (superset) |
  | `status` | `free_coded` | `bundled` | ours (later per-fact timeline) |
  | `updated_at` | `2026-09-01T18:57:55` | `2026-09-16T01:48:29` | ours (later) |

  Ours is a **strict superset** of incoming, so 2e's superset clause governs. `status` is the only genuinely competing fact, and there the per-fact timeline rule also selects ours: `bundled` is the lifecycle state immediately downstream of `free_coded`, and ours' own `bundled_in: bundle-8e1807f6` records that this very reconcile bundle already consumed the `free_coded` transition. Taking incoming's `free_coded` would regress an operator/workflow-owned status field and drop `bundled_in` + `completed_at`. No field was invented; nothing was taken that is not on one side.

## Incoming changes preserved

Both substantive facts the incoming commit introduced are present **verbatim** in the resolved file and in HEAD:

- `fields.commits: [{working_sha: ab467d6ce36618c333604d6b1587cfb6d19557ff, reconcile_sha: null, main_sha: null}]` — identical on both sides (no diff hunk).
- `fields.version: 0.2.32` — identical on both sides (no diff hunk).

Verified against `git show HEAD:.xgd/tickets/hot/request-01ea4eec.md`, which reports `working_sha: ab467d6ce366…`, `version: 0.2.32`, `bundled_in: bundle-8e1807f6`, `status: bundled`.

The only incoming fact not carried forward is `status: free_coded`, superseded by HEAD's later `bundled`. That is **present via a different route**, not discarded: the free_coded→bundled transition already landed on the bundle branch. Per STEP 3/STEP 4 this is the redundant-commit case, not an @fail.

No hunk was dropped under the BUG-1301 precedence exception; no code or UAT test files were involved in this conflict.

## Net staged diff

`git diff --cached --stat HEAD` is empty — the resolution nets to **no diff vs HEAD**, because the bundling that produced HEAD already carried this commit's effect. Per STEP 4 (BUG-1109/BUG-1122) this is not a failure and `--skip` was **not** called. `CHERRY_PICK_HEAD` remains intact at `e0795d9332b24701db6217dab55e2976424b613e` for `cherry_pick_finalize_resolution`, which will detect the clean staged diff and skip the commit.
