---
uid: request-ffe27606
id: REQ-637
type: request
title: 'Payments: invoice records, gap-free numbering and credit notes'
created_by: EPIC-9
created_at: '2026-11-03T00:43:19.154239+00:00'
updated_at: '2026-11-03T17:06:24.444314+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ddca7900
  commits:
  - working_sha: 595c3c7b316e84c9f22f06cd8e9460bd9f4be898
    reconcile_sha: null
    main_sha: null
  - working_sha: 1c3103d14dd7a76a5181241e7201af2f16d46ddc
    reconcile_sha: null
    main_sha: null
  version: 0.2.744
  story_points: 5
---

## Purpose

The first slice of [[EPIC-9]]: **our own invoice records**. Every payment we take is linked to an invoice, and every invoice links to the order or subscription it pays for ([[EPIC-9]], "Every payment is linked to an invoice"). This REQ builds the records, their numbering and credit notes. **It calls no Stripe API**, so it does not wait for the Stripe accounts ([[TODO-18]]).

It is the invoice half of the handshake in [[GOAL-55]], "Who owns what between the two epics". The Shop's Checkout endpoint ([[EPIC-31]]) asks for a draft invoice before opening Checkout. The webhook (a later [[EPIC-9]] child) marks it paid or voids it. Planned for week 1 of [[GOAL-55]].

## What an invoice is

- **A request for payment.** It is ours, and it is authoritative, not a cache of anything in Stripe. Orders and invoices stay separate concepts: an order is a request for goods, an invoice a request for payment.
- **Every invoice belongs to one business** and **links to exactly one target: an order or a subscription.** Never both and never neither, enforced by the database, not only by the code. This REQ creates invoices for **orders** only. The subscription target exists so that subscription invoices (Stripe's, cached later) fit the same model.
  - The orders table does not exist yet ([[EPIC-31]] builds it). **Decided (Q2 below):** two plain columns, `order_id` and `subscription_id`, with a `CHECK` that exactly one is non-null. No `REFERENCES orders` now, because D1 enforces foreign keys and every insert would fail until the table exists. Record this in the migration's comment.
- **Every invoice records its source**: `internal` (ours) or `stripe` (a cache entry, later). This REQ only ever writes `internal`.
- **Every invoice records its mode**, `test` or `live`, fixed when it is created and never changed. The mode comes from the caller (the order's stored mode); this REQ does not decide it.
- **Every invoice is in one currency**, an ISO 4217 code. Every line is in that currency.

## Lines and totals

- **An invoice has one or more lines.** Each line has:
  - a description
  - a quantity (a positive integer)
  - a unit amount
  - the line amount (quantity × unit amount)
  - a kind: `item` or `shipping`
  - optionally, the inventory item it came from (`inventory_items`, 0040)
- **The description and amounts are a snapshot**, copied when the invoice is created. Editing or deleting the inventory item later never changes an invoice.
- **All amounts are integers in the currency's minor units**, as `inventory_prices` already does.
- **The total is computed by us from the lines**, never accepted from the caller.
- **No tax calculation in this REQ.** Totals are what the buyer pays. VAT is an open question in [[EPIC-9]]. Don't build tax columns ahead of it.

## States

| Invoice | |
|---|---|
| `draft` | created, no number, no money taken |
| `paid` | the money is taken; it has a number and a paid time |
| `part credited` | paid, with credit notes totalling less than the invoice |
| `credited` | paid, with credit notes totalling the whole invoice |
| `void` | was a draft and never got paid; has no number |

- **Only a draft can be voided.** A paid invoice is never voided or deleted; money going back is a credit note.
- **Lines can be changed only while an invoice is a draft.**

## Numbering: gap-free, per business, assigned when the money is taken

- **A draft has no number.** The number is assigned in the same atomic step that marks the invoice paid. An abandoned or expired checkout voids its draft, so it never consumes a number.
- **Numbers are sequential and gap-free within a series.** A series is per business and per mode: test-mode invoices have their own series, so test traffic can never leave a gap in the live one.
- **Two invoices of one business marked paid at the same moment get two consecutive numbers**, never the same one and never with a gap between them.
- **Marking an already-paid invoice paid again changes nothing and consumes no number.** Webhooks are retried; the second call returns the same invoice and number.
- **The displayed number is a prefix plus the sequence**, for example `INV-1`. The test series' prefix makes a test invoice unmistakable at a glance, for example `TEST-INV-1`. Invoices cached from Stripe later keep Stripe's own numbers under a different prefix ([[EPIC-9]], "One Invoice concept, two sources").
- **Marking paid also records which payment paid it** (the Stripe payment's id, passed in by the caller), and when.

## Credit notes

- **A credit note is issued against a paid invoice**, for any amount from 1 minor unit up to what remains uncredited. Each one moves the invoice to `part credited` or `credited`.
- **Credit notes are numbered gap-free too**, in their own series per business and per mode (for example `CN-1`, `TEST-CN-1`), assigned when issued.
- **A credit note records an optional reason**, and the refund it accounts for (the Stripe refund's id) when there is one.
- **Issuing a credit note for a refund that already has one changes nothing.** Refund webhooks are retried too.
- A credit note never changes the invoice's lines or total.

## Test data ([[DOC-54]])

- **Invoices, lines and credit notes carry `synthetic` and `run_id`**, like the tables 0014 gave them to.
- **The mark rides `Scope.runId`** (Q3 below), so no caller passes a flag (R2).
- **Synthetic and test-mode records never reach the owner's routes** (R3, Q4 below). The module's functions return them only when the call site asks in code.
- **Synthetic invoices are always collected** by the scheduled test-data sweep (`gutter.ts`), whatever their state.

## Deleting a contact: deferred to the orders table

An invoice in this REQ points at an order, not a contact, so a contact deletion cannot reach it. **This REQ adds no contact column and builds no contact-deletion rule** (Q1 below). The rule belongs to [[EPIC-31]]'s orders, which link the buyer; it is recorded in [[EPIC-9]], "Contact deletion and invoices".

## The interface

**For the Shop** (called from its Checkout endpoint and from the webhook dispatch, both later):
- create a draft for an order, from lines, a currency and a mode
- mark paid, given the Stripe payment id: assigns the number; idempotent
- void a draft
- issue a credit note, given an amount and optionally a refund id: idempotent on the refund id
- read an invoice with its lines and credit notes, and list a business's invoices for one order

**For the owner:** `GET /api/shop/invoices` lists the business's invoices and `GET /api/shop/invoice?id=` returns one with its lines and credit notes, under the business's existing authorisation, in the same style as `/api/shop/items` and `/api/shop/item`. They return **live, real invoices only**; no query parameter turns on synthetic or test-mode rows (Q4). This is what the Shop tab's nested invoice rows and [[EPIC-9]]'s billing tab will read. **No UI in this REQ.**

Put the code beside the Shop's (`apps/control-app/src/shop.ts`, `shop-routes.ts`) or in its own module, as fits. The migration is the next in `db/migrations/`.

## Out of scope

- anything that calls Stripe: Checkout sessions, webhooks, the payment cache, Connect ([[EPIC-9]]'s next child)
- the orders table and the Checkout endpoint ([[EPIC-31]])
- invoice PDFs, emailing invoices, tax/VAT
- subscription invoices, beyond the target and source columns existing
- letting an owner choose a prefix or a starting number

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, against real D1 (miniflare), through the interface above and the owner read route:
1. **A draft has no number**, and its total is computed from its lines whatever the caller claims.
2. **Mark paid assigns the next number;** a second mark-paid of the same invoice returns the same number and consumes nothing.
3. **Concurrent mark-paid** of several drafts in one business yields consecutive numbers with no gaps or duplicates.
4. **Void** works on a draft and is refused on a paid invoice. An expired-then-voided draft leaves no gap in the series.
5. **Test and live series are independent:** a test invoice paid between two live ones leaves no gap in the live series.
6. **Exactly one target:** an invoice with no target, or both, is refused by the database.
7. **Credit notes:** partial then full credit moves the invoice to `part credited` and then `credited`. An over-credit is refused. A repeated refund id issues no second note.
8. **The snapshot holds:** editing or deleting the source inventory item leaves the invoice line unchanged.
9. **Owner reads** never return synthetic or test-mode invoices, even when the request adds `?synthetic=true` or `?mode=test`. The module's read functions do return them when the call site asks (a scope with `includeSynthetic`, a test-mode option), and a scope carrying a run id sees only that run's invoices.
10. **Business isolation:** one business's reads never return another's invoices.
11. **Paid live invoices cannot be deleted:** the database refuses deleting a real, live invoice that is not `draft` or `void`, and the test-data sweep removes a synthetic invoice with its lines and credit notes.

## Answers to the implementation questions (2026-11-03)

The coding session asked four questions in this ticket's chat before building. [[EPIC-9]]'s session answered them, and the sections above are updated to match.

**Q1. Contact deletion: option (a).** No contact column on invoices, and no buyer-details snapshot yet. The rule is built where the buyer is linked, which is [[EPIC-31]]'s orders. It is recorded in [[EPIC-9]], "Contact deletion and invoices", so it isn't lost. Putting buyer details on invoices before anything reads them would add personal data with no use. What this REQ does build:
- invoices, lines and credit notes are added to the scheduled test-data sweep in `gutter.ts`, so synthetic invoices are always collected
- lines and credit notes reference their invoice `ON DELETE CASCADE`
- **a trigger refuses deleting an invoice with `synthetic = 0`, `mode = 'live'` and a status other than `draft` or `void`.** "A paid invoice is never deleted" is a tax-record rule, so the database enforces it, not only the code. Test-mode and synthetic invoices are not tax records and stay deletable.

**Q2. The order link: as proposed.** Plain `order_id` and `subscription_id` columns, a `CHECK` that exactly one is set, and an index on `(business_id, order_id)`. The migration's comment says what [[EPIC-31]]'s orders migration must add, without rebuilding this table:
- triggers on insert and update of `invoices.order_id`, refusing an order that doesn't exist or belongs to another business
- a rule for deleting an order that has invoices: refused while any invoice on it is `paid`, `part credited` or `credited`
- `subscription_id` stays a plain column until subscriptions exist

**Q3. The test-data mark: as proposed.** A new draft takes `synthetic` and `run_id` from `Scope.runId`, exactly as `captureLead`'s marked writes do ([[REQ-268]]). Mark paid, void and credit notes take them from the invoice row. Copying the mark from the order is wired in when orders exist. Every invoice read goes through `realOnly`, so a scope with a run id sees only that run's invoices. **The mode is separate from the mark:** the caller passes `test` or `live`, and neither is inferred from the other.

**Q4. Routes and prefixes: accepted, with one change.** The routes are as proposed, but **the owner routes take no `?synthetic=true` or `?mode=test`.** No owner route in the control app sets `includeSynthetic` from a request. `Scope` makes it default-deny, set only at a call site written on purpose, and a query parameter would let any owner see the test gutter. [[EPIC-9]] also already says test orders are hidden from the Shop tab. So the routes always return live, real invoices. The module functions take the scope and a mode option, so the Shop, the webhook and the tests can ask for the others in code. A platform-operator view of test invoices, for our own test business, is a later ticket if it's wanted. Prefixes: `INV-` and `CN-` for live, `TEST-INV-` and `TEST-CN-` for test.

**The deletion rule itself** was confirmed by the operator on 2026-11-03 and lives in [[EPIC-9]], "Contact deletion and invoices", aligned with [[DOC-37]]. Paid orders are kept with the buyer reduced to the statutory minimum, and the contact's subscriptions are cancelled. It is built by [[EPIC-31]] and later [[EPIC-9]] children, not here. Two things this REQ does take from it:
- **the migration's comment declares each table's erasure behaviour** for [[DOC-37]] §7's registry when it exists. Paid live invoices, their lines and their credit notes are `retain-with-reason` (tax records); every other invoice row is `delete`.
- **invoices hold no buyer identity** (no name, email or address column), as [[DOC-37]] §6.3 requires of every store but the identity store


## What landed (2026-11-03)

- **Migration `0043_invoices.sql`:** `invoices`, `invoice_lines` and `credit_notes`. The comment holds the order-link contract for [[EPIC-31]] (Q2) and each table's erasure behaviour for [[DOC-37]] §7.
  - The `part credited` state is stored as `part_credited`.
  - A paid state carries `sequence` and `number`; a draft or void invoice has neither. The database enforces this with a `CHECK`, and a unique index makes each number unique within its series (business and mode).
- **The database enforces these rules, as well as the code:**
  - exactly one target per invoice
  - an invoice's mode cannot change
  - lines can be inserted, updated or deleted only while their invoice is a draft (a cascade from a permitted invoice delete still works)
  - a paid live real invoice cannot be deleted, and neither can a live real credit note
  - credited amounts can never exceed the total, so an over-credit is refused
  - an `AFTER INSERT` trigger on `credit_notes` moves the invoice to `part_credited` or `credited` in the same statement that issues the note
- **`line.inventoryItemId` is a plain column,** not a foreign key, so deleting the item never reaches the invoice. A draft whose line names another business's inventory item is refused.
- **Module `apps/control-app/src/invoices.ts`:**
  - **Writes:** `createDraftInvoice`, `markInvoicePaid`, `voidInvoice`, `issueCreditNote`.
    - Mark paid assigns the number inside the single `UPDATE` that changes the state.
    - Mark paid is refused with a 409-class `InvoiceStateError` on a void invoice. A repeated mark paid returns the existing number.
    - Voiding an invoice that is already void changes nothing. Voiding a paid invoice is refused.
    - Write paths find the invoice by id and business, not through `realOnly`: a webhook holds no run id, and the mark comes from the row.
  - **Reads:** `readInvoice` and `listInvoices` (optionally for one order).
    - Both go through `realOnly(scope)`.
    - Both take `{ mode: 'test' | 'live' | 'any' }`; the default is `live`.
- **Owner routes in `shop-routes.ts`:** `GET /api/shop/invoices` and `GET /api/shop/invoice?id=`. They always use the bare business scope and `mode: 'live'`; query parameters are ignored. An `InvoiceStateError` is answered 409.
- **Sweep (`gutter.ts`):**
  - `collect` (used by `collectRun` and `sweepSynthetic`) also deletes synthetic invoices under the same predicate; lines and notes go by cascade.
  - `Harvest` gains an `invoices` count.
  - The sweep counts contacts and invoices, refuses (`ImplausibleHarvestError`) if either exceeds `MAX_HARVEST`, and no longer returns early when there are no contacts.
  - Because of the new `Harvest` field, the REQ-268 gutter UAT's "swept clean" assertion now expects `{ contacts: 0, accounts: 0, invoices: 0 }`.
- **Test schema factory** applies `0043`; `atHead` now probes the `credit_notes_apply` trigger.

**UATs:** `tests/test_UAT_FC_REQ-637_invoices.workers.test.ts`, eleven tests, one per test-plan item above. It also checks that lines are frozen after payment, that the mode can't change, and that a line can't name another business's inventory item.