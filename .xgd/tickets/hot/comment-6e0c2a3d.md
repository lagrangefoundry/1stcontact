---
uid: comment-6e0c2a3d
id: COMMENT-7880
type: comment
title: Comment on bug BUG-366
created_by: xgd
created_at: '2026-11-05T23:03:54.651988+00:00'
updated_at: '2026-11-05T23:25:24.537146+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-00d5f738
  kind: chat_summary
  framing: 'BUG-366: free-coding the fix (shop import stock-not-tracked no longer
    holds back; live_set_by column records import vs owner; recovery on re-import;
    report Make these live). Design decisions: migration 0051 adds inventory_items.live_set_by
    (owner|import); existing rows marked import only when imported, not live, slug
    NULL (slug is set the first time an item is saved live, so a slug-less not-live
    item was never switched on). Owner Save marks owner only when live changes. Import
    re-evaluates import-owned not-live items: live when no remaining reasons. Make
    these live = POST /api/shop/items/live {ids}, owner action.'
---

<!-- xgd-summary-entry -->
2026-11-05: work landed as 7ef8b91a4d + version bump c23acc894b (0.2.792); ticket free_coded. Implementation section appended to body. xgd branch clean BUG-366 refused: merge lock held by BUG-365; worktree/branch free-BUG-366 still present (merged) — sweep later with clean --stale or rerun clean. Commit subject lacks [FREE-CODED] tag (already on xgd-working, not amended).


<!-- xgd-summary-entry -->
2026-11-05: xgd branch clean BUG-366 succeeded once BUG-365 released the merge lock — worktree removed, branch free-BUG-366 deleted, lock released. Free-coding of BUG-366 is complete (free_coded, v0.2.792).
