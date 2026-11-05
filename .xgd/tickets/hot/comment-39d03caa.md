---
uid: comment-39d03caa
id: COMMENT-7756
type: comment
title: Comment on bug BUG-337
created_by: xgd
created_at: '2026-11-04T15:34:18.417924+00:00'
updated_at: '2026-11-04T18:57:26.819083+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a4fb6901
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fb89273a-517a-496a-be2d-f3279d3afde0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5a03ba45-9fc2-4c23-83c6-59f3e5f85334-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T15:32:49.592029+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5a03ba45-9fc2-4c23-83c6-59f3e5f85334-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T15:38:31.983198+00:00" -->
#### Claude
I didn't write any code for this ticket. It's the same bug as BUG-335, and that one was fixed 15 minutes after this ticket was filed.

**How I know:** the error says "offset 281". In the old Shop query that loads item prices, `SELECT item_id, currency, market, amount FROM inventory_prices WHERE item_id IN (?,?,…`, the 101st `?` sits at exactly character 281. D1 allows 100 values per query, so it failed on the shop's 101st live item. So the trigger was the shop's item count, not the ~1,615 Library items.

**Timeline:**
- BUG-337 was filed at 14:55 PST on 2026-11-03.
- BUG-335's fix, commit `61628ed08c` ("load prices and categories in batches of 100 ids", with its own test), landed at 15:10 the same day.
- That fix is in `dist/worker.js` and in the dev snapshot rebuilt this morning at 07:32.

I also checked the other places in control-app that build a list of values like this. None of them can grow with a site's items or Library on the draft/edit render path.

I've added this diagnosis to the ticket and left it at `draft`. Closing it is your call. I'd mark it a duplicate of BUG-335 once you've confirmed that site's draft and edit pages render on the current dev deploy. I haven't loaded that site's draft myself to confirm.

<!-- xgd-turn id="162d2d7c-5d39-49ac-8ec9-2658d472f8e4-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T18:56:31.893803+00:00" -->
#### You
Please move the ticket to won't fix and explain why

<!-- xgd-turn id="162d2d7c-5d39-49ac-8ec9-2658d472f8e4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:57:21.118684+00:00" -->
#### Claude
The status changed; the comment failed because the verb is `add-comment`. Retrying with the right verb.

BUG-337 is now at `wont_fix`. I added a comment to the ticket (COMMENT-7777) explaining why.

**Why won't fix:** it's a duplicate of BUG-335, which is already fixed.
- **The cause:** the error's "offset 281" is where the 101st value falls in the old Shop query that loads item prices. D1 allows at most 100 values per query, so any business with more than 100 live Shop items failed. That made every draft and edit render fail.
- **The fix:** commit `61628ed08c` now loads prices and categories in batches of 100 item ids. It landed 15 minutes after this ticket was filed, with its own test (`test_UAT_FC_BUG-335_shop_over_100_items`).
- **Where it is:** the fix is in the current dev snapshot.
- **Nothing left to change:** no other query on the draft/edit render path grows with a site's item or Library count.

No code was written under this ticket. As before, I haven't loaded that site's draft pages myself to confirm they render now.

<!-- xgd-chat-end -->