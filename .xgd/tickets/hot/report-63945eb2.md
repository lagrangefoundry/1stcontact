---
uid: report-63945eb2
id: REPORT-3860
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:47:17.109473+00:00'
updated_at: '2026-09-11T01:47:17.109473+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU** (index-only; path is outside the
  sparse-checkout cone, so there were no working-tree markers). Intent/bookkeeping
  ticket → **rule 2e**, strict-superset branch. Resolved to the OURS blob
  (`139d3468`) via `git checkout --ours` + `git add --sparse`.

  Three-way picture:
  - base `6ec1ac7a` (both sides' merge base)
  - ours `139d3468` from `8729fe36` *xgd(ticket): seed_local_overlay request request-26dafd83*
  - theirs `8c223f37` from `f034eeee` *xgd(ticket): update request request-26dafd83*

  The OURS side already carries the incoming commit's **entire** body edit — the
  `## What landed` section and the removal of the resolved "Granularity" open
  question — byte-for-byte identical, plus bundling bookkeeping the incoming side
  never had: `status: free_coding` → `bundled`, `fields.commits` (3 working SHAs),
  `fields.version: 0.2.31`, `fields.bundled_in: bundle-87be4669`, and a later
  `updated_at` (2026-09-09T21:32:49Z vs the incoming's 2026-09-01T18:31:05Z).

  The only per-fact genuine disagreements are `status`, `last_field_updated`, and
  `updated_at`; on all three the OURS side is the later-positioned operation (8 days
  later, and it is the very bundling operation this reconcile run is executing).
  Taking the incoming side on those facts would have reverted the ticket out of
  `bundled` and dropped `bundled_in: bundle-87be4669`. The one remaining difference
  is a trailing newline the incoming serialization adds; taking the OURS blob whole
  keeps the file byte-identical to HEAD's canonical serialization rather than
  hand-editing a ticket file.

## Incoming changes preserved

Confirmed. `git diff <ours> <theirs>` over the two blobs shows **no body-content
difference whatsoever** apart from the trailing newline — every line of the incoming
commit's 72-line `## What landed` addition, and its deletion of the stale
"Granularity" open question, is present in the resolved (= HEAD) version. Nothing was
discarded; the incoming edit simply arrived in HEAD ahead of this cherry-pick.

No BUG-1301 precedence exception was needed — no hunk was dropped. No code or UAT
files were involved; this was the sole conflict in the tree.

Consequence for the next step: the staged tree nets to **no diff vs HEAD**
(`git diff --cached HEAD` is empty). Per STEP 4 this is the redundant-commit case,
not the discarded case — STEP 3's check confirms the incoming commit's key changes
are present in HEAD. `--skip` was NOT called; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.
