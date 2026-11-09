---
uid: bug-ea74aee1
id: BUG-395
type: bug
title: 'Builder load: D1 overloaded on a large catalog, so Settings, Shop and the
  preview return 503'
created_by: EPIC-29
created_at: '2026-11-09T01:08:08.149585+00:00'
updated_at: '2026-11-09T02:09:48.085097+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-e3db69b8
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-bbf77505
  commits:
  - working_sha: 19daefc2961b4aaa92055033ee454c421ebda59b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2c86933fa0bc996d1608c96641d283953df6468e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.839
---

## Symptom

Operator, 2026-11-08, production, on the business being used to test real payments: Settings shows "Shipping: GET /api/shop/shipping → 503" and "Shop: GET /api/shop/fulfilment → 503".

## Evidence (Workers Logs, 1stcontact-control-app)

- The 503s are not specific to Shop. In the same second, every builder endpoint for the business returned 503 or 500: `settings/payments`, `settings/currency`, `shop/shipping`, `shop/fulfilment`, `shop/taxonomy`, `paperwork/legal`, `senders`, `messages`, `message-templates`, `domain`, `domain/changes`, `hostname`, `refusals`, `network/*`, `launch`, `plan`, `publish/status`, `ai/session`, `activity/surface`, and the preview's `draft/capabilities.js`.
- The error behind them: **`D1_ERROR: D1 DB is overloaded. Too many resources consumed within a 10 second window`**. It is logged as `preview_legal_pages_unread`, and the unhandled ones become `index.ts`'s catch-all 503 ("a configuration failure").
- **It happens in bursts, at builder load.** On 2026-11-08 at 16:55 and 16:59 (local), about 90 requests landed within the minute: the builder's start-up calls plus the preview's photos for the products on the page shown (`preview/<site>/draft/shop-photos/<item>/0`): **only 4–8 items, 16–24 requests per burst, yet each one took 6.5–8.8 s** of wall time, and many ended 500, several `material/file` reads (up to 5.4 s) and `publish/status` (up to 6 s). Minutes without a reload were fine, and a reload at 17:04 got through without errors. So it is intermittent and load-triggered, not a dead binding.
- The business has **nearly 2,000 images** in its Library, and its site is unpublished, so the preview serves the shop photos from the draft. Operator: "This site has nearly 2000 images". The photo count requested is small; the cost of each request is the problem.

## Cause (confirmed)

**Every Library file read scanned every attachment the business holds.** A preview photo (`preview/<site>/draft/shop-photos/<slug>/<n>`) and a Library `material/file` read both go through `materialFile`, which calls the ticket store's `attachments({uid})`. In `@lagrangefoundry/ticketing` (lagrange-framework) that pages through **all** attachment records of the tenant, 200 per statement, and filters by `fields.subject_uid` in JavaScript. A Library picture is one attachment record, so on this business each photo cost about 11 statements returning ~2,000 rows. Measured: a photo request on a business with 2,000 pictures issued 22 D1 statements against 12 on one with 20. Twenty of them at builder load, alongside the start-up calls, exceeded D1's ten-second budget, and every call in the window failed. This is the same trap as BUG-341: one whole-type read per item.

The builder's start-up reads themselves were not the problem: measured on 2,000 pictures, they issue the same 60 statements with 10 items as with 50.

## What changed

1. **One indexed statement for a ticket's attachments.** `ticketStoreFor` (control-app `tickets.ts`) overrides the scoped store's `attachments({uid, trashed})` with a single tenant-bound statement on a new partial expression index, `tickets_attachment_subject` on `(tenant_id, json_extract(fields, '$.subject_uid')) WHERE type = 'attachment'` (migration `0061_attachment_subject_index.sql`). Rows go through the component's own record mapping and projection, so callers get the same tickets in the same uid order. Every caller benefits: preview photos, Library `material/file`, captures, `materialFile` generally. A photo request now costs 11 indexed point lookups, the same whatever the size of the Library.
2. **An overloaded store is transient, not a configuration failure.** A D1 "overloaded" error (`D1 DB is overloaded` / `Too many resources consumed within a 10 second window`, matched on the error or its causes) is answered with **503**, `retry-after: 1`, `x-store-busy: 1` and JSON `{ error: "The store is busy for a moment. Please try again in a few seconds.", code: "STORE_BUSY" }`. Both exits do this: the router's own catch, and `index.ts`'s catch-all, which used to answer it as a plain-text "configuration failure" 503 (`store-busy.ts`).
3. **The builder retries a busy read once.** The builder's shared `send` (`builder/api.js`) retries a GET once when the answer is a 503 marked `x-store-busy`, after the `retry-after` wait (held to 0.25–2 s). Writes are never repeated. If the retry is busy too, the card shows the plain sentence above rather than `GET /api/shop/shipping → 503`.

## Design decisions

- **The real fix belongs in the component** (lagrange-framework `ticketing`: `_attachmentsOf` should narrow by subject in SQL, JS and Python peers together). Per the cross-repo rule no code lands there from this session. The override in `tickets.ts` is the 1stcontact-side bound until that lands, and is deleted then. The component's internal cascade on archive (`_attachmentsOf` inside `archive`/`restore`) still scans, which is rare and acceptable here.
- Raw SQL rather than the accessor's `equals` narrowing: the accessor's JSON equality binds the path as a parameter, which no expression index can serve, so it would still scan every attachment row inside SQLite.
- The retry is in `send`, not per card, so every builder read gets it. Only a response the Worker marks busy is retried, never an arbitrary 503.
- No ticket is filed in lagrange-framework from this session (the operator did not ask for one). Recommended follow-up.

## Test plan

`tests/test_UAT_FC_BUG-395_builder_load_is_bounded.workers.test.ts`, through the production router over real D1/R2 with the business's D1 handle wrapped to count statements and rows read:
- `test_UAT_FC_BUG-395_a_preview_photo_costs_the_same_with_20_and_2000_library_pictures`: a preview photo request on a business with 2,000 Library pictures issues the same number of statements as on one with 20 (≤ 12), and reads no more rows. It fails on the old code (22 against 12).
- `test_UAT_FC_BUG-395_a_builder_load_on_2000_pictures_and_50_items_stays_under_its_ceiling`: with 2,000 Library pictures, the builder's start-up reads (currency, shipping, fulfilment, taxonomy, refusals, payments, domain, hostname, plan, launch, publish status) cost the same with 10 items as with 50, under 70 statements. Every preview photo costs the same constant (≤ 12), so a load with 50 items stays under 70 + 50 × 12.
- `test_UAT_FC_BUG-395_an_overloaded_store_answers_a_settings_read_as_retryable`: with D1 refusing as overloaded, `GET /api/shop/shipping` answers 503 with `retry-after` and `x-store-busy` and the plain sentence, both through the router and through the Worker's own outer catch.
- `test_UAT_FC_BUG-395_the_shipping_card_retries_a_busy_store_once_and_shows_the_data`: the builder's shipping transport meets a busy store once, retries, and returns the data. If the store stays busy it retries exactly once and surfaces the plain sentence.

Regression: Library/material/capture/shop-photo workers suites and builder jsdom suites. The failures there are the same as on clean xgd-working (stale suites, plus worktree-only `dist-assets`/webui artifacts).