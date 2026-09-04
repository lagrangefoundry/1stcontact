---
uid: report-5cf742d3
id: REPORT-3406
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:37:25.156740+00:00'
updated_at: '2026-09-03T23:37:25.156740+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **UU**, intent/bookkeeping ticket (rule 2e; also matches the auto-enrichment rule "take the more recent commit by timestamp"). Resolved to the **HEAD (ours)** side.

  Single conflict region (lines 8–18), covering one lifecycle fact expressed across four adjacent keys:

  | key | HEAD (ours) | incoming |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-09-02T01:34:00.748431+00:00` | `null` |
  | `last_field_updated` | `result` | `status` |
  | `updated_at` | `2026-09-02T01:34:36.152341+00:00` | `2026-08-31T21:51:22.991311+00:00` |

  Both sides changed the SAME fact (the request's lifecycle position), so 2e's per-fact timeline rule applies:
  - HEAD side produced by `d86637121a` — 2026-09-01 18:34:36 -0700
  - incoming `22c666b6fb` — 2026-08-31 14:51:23 -0700

  HEAD is ~28h later and is the downstream state: `ready_to_reconcile` is an intermediate step that `free_and_reconciled` has already passed through. Taking incoming would have regressed a completed, merged request back to a pre-reconcile status.

  Everything else HEAD added in the same frontmatter — `result: pass`, `merged_at_commit: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`, the collapsed `commits` entry carrying that `main_sha`, and the ~215-entry `orphan_commits` remap table — merged clean outside the conflict region and is retained. The incoming side touched none of those fields. No fields were invented; `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

No code/implementation files were in this conflict — the incoming commit `22c666b6fb` touches exactly one file (`.xgd/tickets/hot/request-13a5e206.md`, 2 insertions / 2 deletions), and it is a bookkeeping ticket, not source.

The incoming commit's literal lines are not present in the resolution, and that is the correct outcome under 2e rather than a discard. Its intent — advance `request-13a5e206` from `free_coded` toward reconciliation — has already been fulfilled in HEAD by a later route: HEAD records `status: free_and_reconciled`, `result: pass`, and `merged_at_commit: 4b43dd9a5c0fd50ed053a33ed3defcb63f7ed8cd`. The reconcile this commit was requesting has since happened and landed on main. This is the BUG-1109 / BUG-1122 "already landed through a different route" case, and STEP 3's redundant-vs-discarded test resolves to **redundant**: the incoming commit's key change is present in HEAD in superseded form, not simply absent.

The BUG-1301 precedence exception was not invoked; no hunk was dropped on refactor grounds, and no test function was deleted.

## Staging state

`git status --porcelain` shows no conflict-class lines. The staged tree is byte-identical to HEAD (index blob `e909dcbb97209588efd021442f7dcabf0e18405c`), so `git diff --cached` is empty. Per STEP 4 this is left for `cherry_pick_finalize_resolution` to detect and skip — `--skip` / `--continue` / `--quit` / `--abort` were not called, and `CHERRY_PICK_HEAD` is intact.
