---
uid: report-67a42b15
id: REPORT-3172
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:46:30.009734+00:00'
updated_at: '2026-09-01T01:46:30.009734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (REQ-147) — **UU**, intent/bookkeeping ticket, rule **2e** (same field changed differently → per-fact timeline rule).

  The conflict is confined to a 4-line frontmatter hunk; the entire body and `fields:` block merged cleanly. Both sides diverged from a common base of `status: reconciling`, `updated_at: 2026-08-20T12:51:32`:

  - **Ours (HEAD, `e0ffd3bfb4` "seed_local_overlay", committed 2026-08-30 22:06)** — `status: bundled`, `updated_at: 2026-08-24T02:10:41`; the same commit also added `fields.chat_comment: comment-d6476701` and `fields.bundled_in: bundle-b3b7c399` (those lines are outside the conflict hunk and merged cleanly).
  - **Theirs (incoming, `95ffc177ff` "update request", committed 2026-08-23 18:15)** — `status: ready_to_reconcile`, `updated_at: 2026-08-24T01:15:24`. This is the commit's *only* change: 2 insertions / 2 deletions, both in this hunk.

  **Resolution: kept the HEAD-side fact.** The single contested fact is `status` (with its paired `updated_at`). HEAD's intent is later on both available orderings — ticket `updated_at` (02:10:41 vs 01:15:24) and commit date (Aug 30 vs Aug 23) — so the per-fact timeline rule in 2e selects it. This matches the auto-enrichment's stated rule for this file ("take the more recent commit by timestamp"). It is also corroborated by live matrix state: `xgd ticket get request-23fd6e61` reports `status: bundled` with `bundled_in: bundle-b3b7c399`, so accepting the incoming `ready_to_reconcile` would have regressed a request that is already bundled — while leaving the `bundled_in` field (which both sides carry post-merge) pointing at a bundle the status no longer acknowledged.

  No field was invented, and no field outside the conflict hunk was touched. `git ls-files -u` is empty; no conflict markers remain.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's code-preservation check has no code file to apply to, and the BUG-1301 precedence exception was not invoked anywhere.

For the ticket itself, the incoming commit's one change (`status: reconciling` → `ready_to_reconcile`) is deliberately not carried forward. That is not a discard of developer code: it is a lifecycle status that HEAD has since advanced past — `ready_to_reconcile` → `bundled` — under the 2e per-fact timeline rule. The developer's substantive content for REQ-147 (the request body, ACs, and the free-coded implementation write-up) is byte-identical on both sides and is fully present in the resolved file.

Consequence for the next step: this resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty), because the incoming commit's only effect was the superseded status field. Per STEP 4 this is expected and is not a failure — `cherry_pick_finalize_resolution` should detect the empty staged diff and skip the commit. `--skip` was not called here, and CHERRY_PICK_HEAD is left in place.
