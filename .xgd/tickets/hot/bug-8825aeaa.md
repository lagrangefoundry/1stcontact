---
uid: bug-8825aeaa
id: BUG-394
type: bug
title: 'Shop: businesses already set up before BUG-393 still get no Terms of sale
  until something changes'
created_by: EPIC-29
created_at: '2026-11-09T00:21:27.809831+00:00'
updated_at: '2026-11-09T05:36:46.922703+00:00'
completed_at: null
last_field_updated: status
status: wont_fix
fields:
  severity: high
  parent_uid: epic-e3db69b8
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

Operator, 2026-11-08, after [[BUG-393]] was deployed: "BUG-393 is deployed but I'm still not getting buy buttons?" The business is the same one as BUG-393's: its site is not published, and payments, shipping and the seller details were already set up before the deploy.

## Root cause

BUG-393 writes the business's legal versions (`siteLegalFor(...).withoutSite`, via `catalogItemChanged`) **only when an event happens**: a Paperwork → Legal save (`publishLegalFor`), or a payments or shipping change (`rebuildCatalogFor` with `legal` / `payments` / `shipping`). A business that was already fully set up before the deploy never has such an event, so it still has no `legal_site_facts` record, `sellerReadiness` still says `termsOfSale: 'none'`, and Buy stays off. There is no catch-up step for businesses that were already ready.

## Fix

- **Catch up businesses that are ready to sell but have no Terms of sale version,** without waiting for an owner action. The scheduled job (the tick that already runs `runLegalRevisions`) finds such businesses in small batches with a cursor and runs the same no-site step for each. Bounded by construction (DOC-5 item 35): no per-business store query inside an unbounded loop, and no unbounded fan-out.

- Still only once the seller details are complete and selling is set up (payments and a shipping zone). Rule unchanged (operator, 2026-11-08): "DO block a buy until biz details are filled in and ToS are ready. DON'T block a buy waiting for PUBLISH if the site itself is unpublished."

- Nothing else changes: the reminder, the Terms of sale text, and what the first publish carries are as BUG-393 left them.

## Test plan

`test_UAT_FC_BUG-394_*`:

- A business that is ready to sell, has no published site and has **no legal facts record** gets a Terms of sale version from one scheduled tick, with no owner action. After that, `canSell` is true in the Shop tab and at checkout.

- A business missing a seller detail gets nothing written, and keeps its reminder.

- A second tick writes no further version.

- Batches respect their size limit and resume from the cursor.