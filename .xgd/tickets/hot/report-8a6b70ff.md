---
uid: report-8a6b70ff
id: REPORT-4135
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T22:37:04.535643+00:00'
updated_at: '2026-09-12T22:37:04.535643+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — **UU**, class **2e**
  (intent/bookkeeping ticket).

  Incoming commit `a4af54d04d` (2026-08-29 21:33:05 -0700) is a 2-line frontmatter
  edit: `updated_at` → `2026-08-30T04:33:05Z` and `status: ready_to_reconcile` →
  `reconciling`. It is the immediate successor of `3fa48a6b72` (resolved in the
  previous step of this same cherry-pick sequence, 39 seconds earlier) and flips the
  status field back to the value it held before that commit.

  HEAD-side latest is still `8e07e6015d` (2026-08-31 07:23:04 -0700), unchanged from
  the previous step: `status: free_and_reconciled`, `completed_at` set,
  `last_field_updated: result`.

  Applied 2e per-fact resolution:
  - `status` / `updated_at` — same fact changed on both sides; genuine conflict.
    HEAD is the later-positioned intent (2026-08-31 vs 2026-08-30, ~1.5 days), so
    HEAD wins. Matches the auto-enrichment rule for this file ("intent unknown on one
    or both sides; take the more recent commit by timestamp and flag for post-merge
    review").
  - `completed_at` / `last_field_updated` — incoming carries its parent-chain base
    values here and changed neither; only HEAD changed them, so HEAD's values carry
    (non-overlapping).
  - `fields.commits` (24 working-sha entries collapsed to one with `main_sha`
    populated), `fields.orphan_commits` (~140 old_sha→new_sha rewrite mappings),
    `fields.merged_at_commit: eef7a8b48b`, `result: pass` — HEAD-only fields that
    incoming never touched. Preserved intact.

  Verified the resolution was a marker-only removal: the conflict region was exactly
  the 4 contested lines, the incoming commit touched only 2 lines and both fall inside
  that region, so no auto-merged incoming content existed outside the markers to drop.
  `git diff HEAD` on the resolved file is empty, confirming nothing beyond the markers
  was altered.

  No `intent_uid` / `story_uid` / `capability_uid` fields were modified, and no content
  absent from both sides was introduced.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a
bundle bookkeeping ticket, not source. STEP 3's code-file guard therefore has no
subject here, but the redundant-vs-discarded distinction was still checked explicitly:

- The incoming edit sets a bundle *lifecycle status* (`reconciling`) that HEAD has
  already passed through and exited. HEAD carries BUNDLE-20 at terminal
  `free_and_reconciled` with `completed_at: 2026-08-31T14:22:24Z`, `result: pass`,
  `merged_at_commit: eef7a8b48b`, and all 24 working shas collapsed into a single
  merged entry. A bundle holding a completion timestamp, a pass result and a merge
  commit is unambiguously downstream of `reconciling`.
- So the fact incoming asserts is superseded in HEAD via the normal lifecycle route,
  not missing from it — STEP 3's "present via a different route (redundant)" case, not
  "genuinely absent (discarded)". Re-applying incoming would roll a finished bundle
  backwards into an in-progress state.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply here.

### Note for post-merge review

Per the enrichment rule's "flag this file for post-merge review": the resolution is
byte-identical to HEAD, so this cherry-pick stages to an **empty diff vs HEAD** — the
same outcome as the preceding commit in this sequence, and expected for a superseded
bookkeeping status update. Per STEP 4 the finalize step is left to detect the clean
staged diff and skip the commit; no `--skip`, `--continue`, `--quit` or `--abort` was
issued from here, and `CHERRY_PICK_HEAD` is intact.

Worth a human glance at the sequence level rather than per-commit: this is the second
consecutive incoming commit whose only content is a status flip on this one bundle
ticket, both landing as no-ops against an already-completed HEAD. The remaining
commits in the bundle may include more of the same churn.
