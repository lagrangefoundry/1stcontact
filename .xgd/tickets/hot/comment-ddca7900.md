---
uid: comment-ddca7900
id: COMMENT-6958
type: comment
title: Comment on request REQ-637
created_by: xgd
created_at: '2026-11-03T00:48:55.887469+00:00'
updated_at: '2026-11-03T16:50:02.958297+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ffe27606
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "50dc2aa9-4cc8-44a9-9419-63b126da33d2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e8328899-3317-46f1-9d1a-17db38ff89f6-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:47:54.305878+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="e8328899-3317-46f1-9d1a-17db38ff89f6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:53:32.311628+00:00" -->
#### Claude
Reading the ticket and the Shop code to see what's already there before I settle the open questions. Continuing.

Before I build this, a few things need your call. I've read the ticket and the code it builds on: `shop.ts` and `shop-routes.ts`, migrations 0014 and 0040, the `Scope` marks in `scope.ts`, and the test-data sweep in `gutter.ts`.

**1. What happens to invoices when a contact is deleted.** The ticket asks you to confirm this before it's built, so I need an answer. The catch is that an invoice in this ticket points at an order, not a contact, and the orders table doesn't exist yet ([[EPIC-31]] builds it). Without a contact link, a contact deletion can't reach an invoice. Two options:
- **(a) Recommended:** this ticket adds no contact column. The proposed rule (draft and void invoices go with the contact; paid and credited ones are kept with the buyer's details as they were) gets built when orders exist and point at contacts. I'd record that on [[EPIC-31]] or [[EPIC-9]] so it isn't lost.
- **(b)** Add a contact link to invoices now, plus a snapshot of the buyer's name and email, and build the rule here. That would put buyer details on invoices before anything needs them.

Either way, I'll add invoices, their lines and their credit notes to the existing scheduled clean-up of test data, so test invoices are always removed.

**2. Linking an invoice to an order before orders exist.** If I declare a real foreign key to `orders` now, every invoice insert fails until the table exists. My plan, unless you object:
- The invoice gets two plain columns, an order id and a subscription id.
- The database refuses an invoice with neither or both.
- When [[EPIC-31]] creates `orders`, its migration adds triggers that enforce the link to a real order. Triggers can be added without rebuilding the invoices table.

I'll write this into the migration's comment.

**3. How an invoice gets marked as test data.** Nothing yet tells a request it is test traffic: the ticket that adds that mark to requests isn't built, and there are no orders to copy it from. My plan:
- A new draft takes the mark from the request's existing run id (the field the lead-capture path already sets).
- Credit notes, and anything the webhook does later, take it from the invoice itself.
- Copying it from the order is wired in when orders exist.
- No caller ever passes a flag.

**4. Smaller choices**, which I'll take unless you say otherwise:
- **Owner routes:** `GET /api/shop/invoices` lists them and `GET /api/shop/invoice?id=` returns one with its lines and credit notes. Test data and test-mode invoices only appear when the request adds `?synthetic=true` or `?mode=test`.
- **Number prefixes:** `INV-` and `CN-` for live, `TEST-INV-` and `TEST-CN-` for test.

The one I can't decide for you is question 1. Once you answer it (and raise any objection to 2–4), I'll cut the branch and build it.

<!-- xgd-turn id="aaec8a1a-bed8-4648-b320-3ba6ffba058c-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:30:24.198064+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="aaec8a1a-bed8-4648-b320-3ba6ffba058c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:49:55.708207+00:00" -->
#### Claude
All four questions are answered. I'm ready to code. Starting now.

Known issue (memory: branch exists; add worktree manually).

The ticket's answers settle all four questions, so I've cut the branch and I'm reading the sweep and the Shop tests before writing the migration and module.

Schema is settled; checking one SQLite behaviour (do child triggers see the parent during a cascade delete?) before writing the migration.

Cascade deletes see the parent already gone, so a "lines frozen once not draft" trigger won't block the sweep. Writing the migration.

A `CASE … END` inside a trigger body would confuse the BEGIN/END statement splitter; switching to `iif()`.

Now the invoices module.

Module written. Now the owner routes and the sweep.

Now the UATs. Checking how the inventory suite creates and deletes an item.

All 11 pass. Running the adjacent suites (gutter, inventory, migration checks) and the typecheck.

zsh didn't split the list (a known gotcha); rerunning with word-splitting.

Six failures; checking whether my change causes any of them or they're pre-existing.

REQ-180 and REQ-162 fail on code I didn't touch. Checking REQ-318 since it involves the migrate hook.

These look environmental (proxy warning, wrangler dry run). Confirming against the clean xgd-working checkout.

Baseline has 5 of the 6. Finding which one differs.

REQ-318's two tests pass on xgd-working and fail in my worktree, so they need a closer look.

That's a worktree artifact: the fresh worktree has no local `.wrangler/state` dev database ("0 applied migrations"), and the main checkout does. My change doesn't cause it. Now the typecheck.

Typecheck is clean. Checking the version-bump and promotion notes before committing.

Updating the ticket body first: I'm appending a "What landed" section and leaving the existing text unchanged.

Now the work commit on the branch.

Committed. Before merging back, I'm checking that no other session has taken migration number 0043 on xgd-working since I cut the branch.

No collision, and only ticket commits have landed since. Running the lock → merge → bump → merge-back → free_coded sequence.

REQ-637 is built, merged into xgd-working, and parked at `free_coded` (version 0.2.744, 5 story points). Your answers settled all four questions, so I built it as the ticket now reads. Nothing calls Stripe.

**What was added:**
- **Migration `0043_invoices.sql`:** creates the invoices, their lines and their credit notes.
  - Its comment says what [[EPIC-31]]'s orders migration must add later, and how each table should be treated when a contact's data is erased.
  - The database itself refuses:
    - an invoice with no target or with both
    - a change to an invoice's mode
    - a change to lines once the invoice isn't a draft
    - deleting a paid live real invoice or a live credit note
    - crediting more than the invoice's total
  - Issuing a credit note moves the invoice to part credited or credited in the same step. The state is stored as `part_credited`.
- **`apps/control-app/src/invoices.ts`:** the functions the Shop and the webhook will call: create a draft, mark paid, void, issue a credit note, read one invoice, list invoices.
  - Mark paid assigns the next number in the same database statement that marks the invoice paid, so payments at the same moment get consecutive numbers with no gaps.
  - Repeating a mark paid, or a credit note for the same refund, returns the first result and creates nothing new.
  - A draft that names another business's inventory item is refused.
- **Owner routes:** `GET /api/shop/invoices` and `GET /api/shop/invoice?id=` always return live, real invoices; query parameters can't change that.
- **Test-data sweep (`gutter.ts`):** test invoices are now always removed, with their lines and credit notes. The sweep's result gains an invoice count, so I changed one assertion in the REQ-268 gutter test to expect that extra field.

**Tests:** all 11 tests in `tests/test_UAT_FC_REQ-637_invoices.workers.test.ts` pass against a local D1 database, one per item in the ticket's test plan. The control app's typecheck is clean. I also ran the 35 suites that touch migrations, the Shop routes or the sweep: 6 tests failed, none in code I changed.
- **Also failing on xgd-working:** four of the six, in REQ-180 (two), REQ-162 and REQ-393.
- **Only in my branch's copy of the repo:** the two REQ-318 tests. They pass in the main checkout, and my copy had no local dev database ("0 applied migrations").

I appended a "What landed" section to the ticket body and left the existing text as it was.

<!-- xgd-chat-end -->