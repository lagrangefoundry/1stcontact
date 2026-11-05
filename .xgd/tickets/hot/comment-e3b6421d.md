---
uid: comment-e3b6421d
id: COMMENT-7777
type: comment
title: Comment on bug BUG-337
created_by: xgd
created_at: '2026-11-04T18:57:14.506679+00:00'
updated_at: '2026-11-04T18:57:14.506679+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-a4fb6901
  kind: note
---

Won't fix: duplicate of BUG-335. The reported 'offset 281' is where the 101st bound parameter falls in the old, unbatched inventory_prices IN-list in shop.ts hydrate(). D1 binds at most 100 parameters per statement. The fix, commit 61628ed08ca4777805fbad62e9a8c4179359d7d7 (prices and categories loaded in batches of 100 ids, UAT test_UAT_FC_BUG-335_shop_over_100_items), landed 15 minutes after this ticket was filed and is in the current dev snapshot. Nothing remains to change under this ticket.