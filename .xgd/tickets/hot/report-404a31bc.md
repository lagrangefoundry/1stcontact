---
uid: report-404a31bc
id: REPORT-4192
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:46:31.280535+00:00'
updated_at: '2026-09-14T00:46:31.280535+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** (same field changed differently on each side → keep the later-positioned intent, per fact).

  Incoming commit `3325664f` (`xgd(ticket): update request request-6893f6ea`, 2026-09-01 12:35:38 -0700, `last_field_updated: body`) is a 73-insertion/177-deletion rewrite: it reflows the prose of the whole lower half of the ticket from hard-wrapped form back to long-line form, collapses the `| | bytes |` table to bare paragraphs, and renumbers the "What is missing" list 3–6 → 1–4.

  The auto-merge conflicted on exactly one region — the front-matter block at lines 9–19. Everything else merged cleanly.

  Facts:
  - `status` — ours `bundled` (commit `c94654a3`, `seed_local_overlay`, 2026-09-09 14:35:22 -0700); theirs `free_coded` (2026-09-01). Ours is later-positioned by 8 days and lifecycle-downstream (`free_coded` → `ready_to_reconcile` → `bundled`), so ours wins — also what the auto-enriched rule prescribes ("take the more recent commit by timestamp").
  - `last_field_updated` — ours `status`, theirs `body`. This field names the field touched by the *most recent* update. On the resolved file the most recent update is ours' status→bundled transition, so `status` is the internally consistent value; taking `body` would assert the body edit was newer than a status change that in fact post-dates it by 8 days.
  - `updated_at` — kept ours (`2026-09-09T21:32:50`), the stamp belonging to the winning fact above.
  - `fields.bundled_in: bundle-87be4669` — ours-only; theirs and the merge base agree in not having it, so the auto-merge kept it. Taking theirs' `status` would have orphaned this field against a pre-bundling status.

  No field was invented; nothing outside the two sides was added.

## Incoming changes preserved

No code/implementation files were in conflict. For the one bookkeeping ticket:

**The incoming body rewrite is present in full.** Verified directly: `diff` of the resolved working file against the incoming blob (`:3:`) returns only the two front-matter hunks listed above — `updated_at`, `last_field_updated`, `status`, and the added `bundled_in`. Every one of commit `3325664f`'s 250 changed body lines is byte-identical in the resolution. The independent check `git diff :2: :3:` likewise shows no body divergence at all between ours and theirs, i.e. HEAD had already arrived at this exact body text (BUG-1109/BUG-1122: the effect landed through the seed overlay route). This is STEP 3's "present via a different route → redundant," not "absent → discarded."

The two bookkeeping fields not carried over (`status: free_coded`, `last_field_updated: body`) are superseded, not discarded: `free_coded` is an earlier point in this ticket's own lifecycle that HEAD advanced past eight days later. Rule 2e names this case and resolves it to the later intent.

Note for post-merge review (the enrichment flagged this file): the staged tree has **no net diff vs HEAD** for this path, since the resolution equals HEAD's content. Per STEP 4 this is expected and not a failure — `--skip` was not called; the finalize step will detect the empty staged diff. The STEP 3 guard is satisfied by the `diff`-verified body identity above, not by the empty staged diff.
