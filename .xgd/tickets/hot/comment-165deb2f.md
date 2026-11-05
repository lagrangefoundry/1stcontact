---
uid: comment-165deb2f
id: COMMENT-7353
type: comment
title: Comment on bug BUG-335
created_by: xgd
created_at: '2026-11-03T23:05:52.906997+00:00'
updated_at: '2026-11-03T23:11:39.243992+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-03a42831
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9eb5372b-96e9-47fa-853d-0939b1f2b51e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="355c3a1e-a9d5-4c3b-9a19-4044fcd3fb12-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T23:04:58.913009+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="355c3a1e-a9d5-4c3b-9a19-4044fcd3fb12-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T23:11:36.552887+00:00" -->
#### Claude
Known case (memory: branch exists; `git worktree add` it, link node_modules).

Writing the fix (batch the `IN (…)` lookups in `hydrate()`) and a workers UAT that stocks 150 live items.

Writing the UAT now (150 live items, draft preview pages + Shop API list).

The `price` field follows the shop's default currency, which this fixture doesn't set; assert on `prices` instead.

Without the fix both UATs fail (good); with it one still fails — checking why.

Shop suites green (25/25), typecheck clean. Lint, then commit.

Now the ticket: append an implementation section (keeping the existing body), then move to free_coded.

BUG-335 is fixed and the ticket is at `free_coded`. A business with more than 100 live items now renders in the draft and edit previews, on the published site, and in the builder's screenshots (BUG-337).

**Fix:** D1 accepts at most 100 bound values per query. `hydrate()` in `apps/control-app/src/shop.ts` put every item id into a single `IN (…)` lookup for prices and another for categories. Those lookups now run in batches of at most 100 ids, and the results are joined. Each id is in exactly one batch, so every item keeps its current order (prices by currency then market, categories by position). It's one code path for any number of items.

**UAT:** `tests/test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts` runs against real D1 with 150 live items, each with a EUR price and one of two categories.
- **Draft preview:** `/shop` and `/shop/2` return 200 and together show all 150 names and prices. The 150th item's own page shows its price and category.
- **Shop API:** `GET /api/shop/items` returns all 150 items, each with exactly the price and category it was saved with.

Without the fix both tests fail; with it both pass. The other Shop test suites (REQ-631, REQ-633, REQ-634) also pass, 25/25 together with the new file, and the typecheck is clean.

**Process notes:**
- `xgd branch cut` failed in the sandbox: it couldn't write `.git/config` to set up the git hooks. The fix was one function plus one test, so I worked directly on `xgd-working` under the session lock instead of a branch worktree. I've released the lock and removed the empty `free-BUG-335` branch the failed cut had left behind.
- Commit `61628ed08ca4777805fbad62e9a8c4179359d7d7` (version 0.2.749, story points 1) is the only one recorded on the ticket.
- I added "What landed" and "UATs" sections to the end of the ticket body and left the existing text as it was.

Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->