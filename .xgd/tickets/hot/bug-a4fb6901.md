---
uid: bug-a4fb6901
id: BUG-337
type: bug
title: 'Draft and edit renders fail with "origin resolver failed: D1_ERROR: too many
  SQL variables" (site with ~1,600 library items)'
created_by: xgd
created_at: '2026-11-03T22:55:51.960615+00:00'
updated_at: '2026-11-04T18:56:57.206666+00:00'
completed_at: null
last_field_updated: status
status: wont_fix
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-39d03caa
---

**What I was doing:** After a deploy interrupted a session, I took screenshots of the draft and edit views of a site's pages (Home and Preloved, which carry the `catalog` component v1, plus the shared header and footer).

**Expected:** The pages render.

**What happened:** Every width, in both the `draft` and `edit` channels, shows only a black page with one line of text:
`origin resolver failed: D1_ERROR: too many SQL variables at offset 281: SQLITE_ERROR`
The independent review saw the same on Home and Preloved at desktop, tablet and phone. The site's change count is unchanged (89), so the pages' content hasn't moved. The same pages rendered correctly before the deploy.

**Likely cause:** The origin resolver builds a query with an IN-list bound per item, and it goes over D1/SQLite's bound-parameter limit (D1 allows 100). This site's library holds about 1,615 items (mostly catalogue product images), and the catalog draws on Shop items. Probably a regression in the deploy: the IN-list needs chunking, or replacing with a join or subquery.

**Repro:** A site with a large library (≥ a few hundred items) and a page with `catalog` mode=grid. Screenshot `draft` for that page.

**Impact:** Every page on the site is unviewable, both for the client in View/Edit and for the builder's own checks.


---

## Diagnosis (2026-11-04): duplicate of BUG-335, already fixed

- The reported `offset 281` is where the **101st `?`** falls in the old, unbatched query in `apps/control-app/src/shop.ts` `hydrate()`: `SELECT item_id, currency, market, amount FROM inventory_prices WHERE item_id IN (?,?,…` (the prefix is 81 characters, then each id adds `?,`). So the failure came from Shop item hydration (prices and categories over every live item id), not from the Library's ~1,615 assets. D1's limit is 100 bound parameters per statement.
- This is exactly **BUG-335** ("Shop: preview fails with 'too many SQL variables' when a business has more than 100 live items"). This ticket was filed at 14:55 PST on 2026-11-03. The fix, commit `61628ed08ca4777805fbad62e9a8c4179359d7d7` ("load prices and categories in batches of 100 ids", with UAT `test_UAT_FC_BUG-335_shop_over_100_items`), landed at 15:10 the same day.
- The fix (`inBatches`, `MAX_BOUND_IDS = 100`) is in both `apps/control-app/dist/worker.js` and the current dev snapshot (`.dev-snapshot/worker/worker.js`, rebuilt 2026-11-04 07:32).
- No other `IN (…)` list in the draft/edit render path is bound per item. The other `IN` lists in control-app (`domains.ts` hosts, `delegates.ts`/`people.ts` business ids, `spend.ts` turn ids, `shop.ts` category filter) are bounded by small inputs.

**No code change made under this ticket.** Recommended: close as a duplicate of BUG-335 once the operator confirms the site's draft renders on the current dev deploy.