---
uid: report-ff6c1438
id: REPORT-3378
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T22:04:41.577531+00:00'
updated_at: '2026-09-02T22:04:41.577531+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e** (intent/bookkeeping ticket, per-fact resolution). Two conflict hunks, both in frontmatter; the body merged cleanly because the incoming commit touched only frontmatter.

  - **Hunk 1 — `updated_at` / `status` (same fact, changed differently on both sides).** Ours: `status: bundled`, `updated_at: 2026-08-31T05:05:09Z` (from `afd199743a`, 2026-08-31, `seed_local_overlay`). Incoming `04d4a9841d` (2026-08-28): `status: free_coded`, `updated_at: 2026-08-28T16:38:43Z`. Timeline rule applied per-fact: the HEAD-side commit is the later-positioned one (2026-08-31 vs 2026-08-28), and `free_coded → bundled` is a forward lifecycle transition, so HEAD's value is the incoming transition already carried forward, not a competing one. Kept HEAD. Taking incoming here would have reverted an operator-owned status field backwards.
  - **Hunk 2 — `fields.bundled_in` (addition on one side only).** Ours adds `bundled_in: bundle-8eef3846`; incoming has no such field. Non-overlapping addition, HEAD is the superset — kept. Dropping it would have orphaned the ticket's record of its membership in `bundle-8eef3846`.

  No field was invented; no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit `04d4a9841d` made exactly three frontmatter changes. All three are accounted for in the resolved file:

- `fields.commits: [{working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e, reconcile_sha: null, main_sha: null}]` — **present** (line 21–24), merged without conflict; byte-identical on both sides.
- `fields.version: 0.2.16` — **present** (line 25), merged without conflict; identical on both sides.
- `status: free_coding → free_coded` — **present via a later route.** HEAD already carries this transition and one further step beyond it (`bundled`, plus `bundled_in`), applied on 2026-08-31 — after the incoming commit. The developer's status intent is therefore in HEAD, superseded rather than discarded.

No hunk was dropped under the BUG-1301 precedence exception; no code or test files were involved in this conflict.

**Net effect:** the resolved tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is empty). Per STEP 4 this is a redundant commit, not a discarded one — STEP 3's discriminator confirms it: the incoming commit's key changes (`commits`, `version`) are already present in HEAD, having landed through the 2026-08-31 overlay seed. Staged and left for `cherry_pick_finalize_resolution` to skip; `CHERRY_PICK_HEAD` untouched.
