---
uid: report-64bea218
id: REPORT-3217
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T05:15:54.052805+00:00'
updated_at: '2026-09-01T05:15:54.052805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (rule **2e**, request-* ticket). Resolved per-fact, which resolved to ours in full:
  - `fields.commits` (`working_sha: 29c0e86d…`) and `fields.version: 0.2.16` — added by the incoming commit `04d4a984`; **already present on the HEAD side** (auto-merged, outside the conflict hunks). Kept.
  - `fields.bundled_in: bundle-8eef3846` — HEAD-only field the incoming side never touched. Kept under the strict-superset rule.
  - `status` — genuine same-field conflict: HEAD `bundled` vs incoming `free_coded`. Later-positioned intent wins: HEAD's `seed_local_overlay` commit `afd19974` (2026-08-31T05:05Z) postdates the incoming `04d4a984` (2026-08-28T16:38Z). `bundled` is also the downstream lifecycle state of `free_coded`, so taking incoming would have regressed the very bundling this reconcile run depends on.
  - `updated_at` — carried with the winning `status` edit (2026-08-31T05:05:09Z).
  - Body prose — no conflict; HEAD's unwrapped body applied cleanly (the incoming commit touched frontmatter only, 7 insertions / 2 deletions).

  Staged with `git add --sparse` (path outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

The incoming commit `04d4a984` changed exactly four frontmatter facts. All four are accounted for in the resolved file:

- `fields.commits` — **present verbatim** in the resolved file.
- `fields.version: 0.2.16` — **present verbatim** in the resolved file.
- `status: free_coding → free_coded` — **present via a later route**: HEAD already carries `free_coded`'s successor, `bundled`, set by `afd19974` three days after the incoming commit. Superseded, not discarded.
- `updated_at` — bookkeeping timestamp; HEAD's is the later of the two and belongs to the winning edit.

No hunk was dropped under the BUG-1301 precedence exception; no code or test files were involved in this conflict.

**Note on the net-zero staged diff.** The resolved file is byte-identical to HEAD (`git diff HEAD` empty), so this cherry-pick stages no change. This is the redundant-commit case (BUG-1109 / BUG-1122), not a discard: the incoming commit's substantive content (`commits`, `version`) is *present* in HEAD via the `seed_local_overlay` route, which is the STEP 3 test for telling redundant from discarded. `--skip` was deliberately not called; CHERRY_PICK_HEAD is intact for `cherry_pick_finalize_resolution`.

**Flagged for post-merge review** per the enrichment's "intent unknown on one or both sides" rule — though the per-fact analysis above is unambiguous, so the flag is procedural rather than a live concern.
