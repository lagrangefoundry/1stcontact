---
uid: report-28751a6f
id: REPORT-4191
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:44:37.959060+00:00'
updated_at: '2026-09-14T00:44:37.959060+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** (same field changed differently on each side → keep the later-positioned intent, per fact).

  The auto-merge left exactly one conflicted region: the status/`updated_at` pair in the front matter. Everything else merged cleanly, because the incoming commit `1e5185e9` touched only those two lines (`git show 1e5185e9 -- <path>` is a 2-insertion/2-deletion header diff); the large ours-vs-theirs body divergence (prose rewrapping, list renumbering 3–6 → 1–4) is entirely a HEAD-side edit against an unchanged incoming body, so git resolved it without conflict.

  Facts:
  - `status` — base `ready_to_reconcile`; ours `bundled` (commit `c94654a3`, `seed_local_overlay`, 2026-09-09 14:35:22 -0700); theirs `free_coded` (commit `1e5185e9`, 2026-09-01 12:35:35 -0700). Genuine same-fact conflict. Ours is later-positioned by 8 days and lifecycle-downstream (`free_coded` → `ready_to_reconcile` → `bundled`), so ours wins. This is also what the auto-enriched resolution rule prescribes ("take the more recent commit by timestamp").
  - `updated_at` / `last_field_updated` — stamps belonging to the `status` fact above; kept ours to match.
  - `fields.bundled_in: bundle-87be4669` — ours-only, never touched by theirs; preserved by the auto-merge. Taking theirs' `status` would have left this field orphaned against a pre-bundling status.

  No field was invented; no content outside the two sides was added.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted file is a bookkeeping ticket, resolved under 2e's per-fact timeline rule rather than 2c's incoming-is-authoritative rule.

The incoming commit's two header lines (`status: free_coded`, `updated_at: 2026-09-01T19:35:35`) are deliberately not in the resolved file. That is supersession, not a discard: `free_coded` is an earlier point in this ticket's own lifecycle that the HEAD side already advanced past (to `ready_to_reconcile`, then `bundled` with `bundled_in: bundle-87be4669`) eight days later. Replaying it would regress the ticket's status. Rule 2e names exactly this case and resolves it to the later intent.

Note for post-merge review (the enrichment flagged this file): the staged tree has **no net diff vs HEAD** for this path, since the resolution equals HEAD's content. Per STEP 4 this is expected and not a failure — `--skip` was not called; the finalize step will detect the empty staged diff. STEP 3's discard guard is satisfied by the supersession argument above, not by the empty diff.
