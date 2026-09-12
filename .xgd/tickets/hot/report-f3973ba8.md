---
uid: report-f3973ba8
id: REPORT-4134
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T22:33:55.675483+00:00'
updated_at: '2026-09-12T22:33:55.675483+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — **UU**, class **2e** (intent/bookkeeping ticket).
  Conflict region was a single 4-line frontmatter block (`updated_at`, `completed_at`,
  `last_field_updated`, `status`). Incoming commit `3fa48a6b72` (2026-08-29 21:32 -0700)
  touched only 2 of those lines (`updated_at` → `2026-08-30T04:32:26Z`,
  `status: reconciling` → `ready_to_reconcile`). HEAD-side commit `8e07e6015d`
  (2026-08-31 07:23 -0700) rewrote the same block plus a large disjoint set of fields
  incoming never touched.

  Applied 2e per-fact resolution:
  - `status` / `updated_at` — same fact changed on both sides; genuine conflict. HEAD is
    the later-positioned intent (2026-08-31 vs 2026-08-30, ~1.5 days), so HEAD wins.
    Matches the auto-enrichment rule for this file ("intent unknown on one or both sides;
    take the more recent commit by timestamp and flag for post-merge review").
  - `completed_at` / `last_field_updated` — incoming left these at their base values;
    only HEAD changed them, so HEAD's values carry (non-overlapping).
  - `fields.commits` (24 entries collapsed to one with `main_sha` populated),
    `fields.orphan_commits` (~140 old_sha→new_sha rewrite mappings),
    `fields.merged_at_commit: eef7a8b48b`, `result: pass` — HEAD-only additions,
    untouched by incoming. Preserved.

  No `intent_uid` / `story_uid` / `capability_uid` fields were modified, and no content
  absent from both sides was introduced.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bundle
bookkeeping ticket, not source.

The incoming commit's two-line change is intentionally not present in the resolution, and
this is the 2e timeline rule firing, not a discard of developer work:

- The incoming edit is a bundle *lifecycle status* regression. HEAD has already advanced
  BUNDLE-20 past `ready_to_reconcile` to terminal `free_and_reconciled`, with
  `completed_at` set, `result: pass`, `merged_at_commit: eef7a8b48b` recorded, and all 24
  working shas collapsed to a single merged entry. A bundle carrying a completion
  timestamp, a pass result and a merge commit is unambiguously downstream of
  `ready_to_reconcile`; re-applying incoming would roll a finished bundle backwards.
- The fact incoming asserts (`status`) is therefore superseded in HEAD via the normal
  lifecycle route, not missing from it — STEP 3's "present via a different route
  (redundant)" case rather than "genuinely absent (discarded)".

No hunks were dropped under the BUG-1301 precedence exception; it did not apply here.

### Note for post-merge review

Per the enrichment rule's "flag this file for post-merge review": the resolution is
byte-identical to HEAD, so this cherry-pick stages to an **empty diff vs HEAD**. That is
the expected outcome for a superseded bookkeeping status update, and per STEP 4 the
finalize step is left to detect the clean staged diff and skip the commit — no `--skip`,
`--continue`, `--quit` or `--abort` was issued from here, and `CHERRY_PICK_HEAD` is intact.
