---
uid: bug-b2aecde6
id: BUG-396
type: bug
title: 'Checkout: one page that fills in on region choice — no Continue, Cancel as
  a back link, payment form always appears'
created_by: EPIC-31
created_at: '2026-11-09T02:11:26.171071+00:00'
updated_at: '2026-11-09T20:22:07.652243+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-396716f6
  commits:
  - working_sha: c9401a78479855c5046ad4b7e3d3c2ac1af1b207
    reconcile_sha: null
    main_sha: null
  - working_sha: 5331c6111296fe57aa7097aa78da482b3362b5bd
    reconcile_sha: null
    main_sha: null
  version: 0.2.840
  story_points: 5
---

## Symptom (production, 2026-11-08)

A business has payments, shipping and Terms of sale set up, and is deliberately not published. The owner opens a product's checkout page in the builder preview and chooses a delivery region, **without clicking anything else**. The "Continue to payment" button immediately loses its label and shrinks to a small empty box, which does nothing when clicked. Since BUG-375, choosing a region is what starts payment: the page opens the session by itself and is meant to swap Continue for Stripe's form. So the owner never gets to press Continue; the swap happens with no form to show. Stripe's payment form never appears, so the buyer cannot pay.

Production Workers Logs for the session show the server side working. Every region change ran `quote` → `start` (200) → `cancel` (200) on the next change. So a Stripe session is opened each time, and the failure is in the page.

## Root cause (likely, still to be confirmed against the business's real checkout template)

- `checkoutActions` → `withPayment` (`packages/framework/src/l2/checkout.ts`) only inserts the `payment` mount (BUG-375) when the template has a **standard actions row**: Continue and Cancel in an end-aligned three-child row (`isStandardRow`). If the template places Continue some other way, `actionsOf` returns it unchanged, and `withPayment` returns the page **with no payment mount**.

- The checkout script (`packages/framework/src/modules/checkout/client.js`, `pay()`) then opens the session and calls `initEmbeddedCheckout`. It mounts only `if (mount)`, but **sets **`button.hidden = true`** either way**. The button disappears with no form in its place. The box styled around it stays, with no label: the "snub".

If the template turns out to have a mount, the next suspect is Stripe's form loading but staying invisible inside the preview frame. In that case the browser console on the checkout page will show the error. Confirm which it is first, by rendering this business's actual checkout page.

This is a fix to landed work (BUG-375, BUG-368).

## Fix

**The checkout page is one page that fills in as the buyer goes** (operator, 2026-11-08). The buyer clicks [Buy] on the product detail page and lands on the checkout page, which asks for a delivery region. Choosing a region fills in the rest of the **same page**: the shipping, the total, then Stripe's payment form. Nothing on the page suggests a further step. This changes part of BUG-367/BUG-368's checkout layout (explicit supersession: the Continue/Cancel actions row).

1. **No Continue button.** "Continue to payment" is no longer drawn on the checkout page, disabled or otherwise.

- Before a region is chosen, the page shows the item, the region choice and the prices it can already show.

- Choosing a region (or arriving, when the business ships at one rate) fills in the shipping and total, and the payment form appears below them.

- If the payment form can't be started, the page shows "Payment could not be started. Nothing was charged; please try again." with a **Try again** button in the form's place. That is the only time a button is drawn there. Any session already opened is cancelled, so its hold is released.

2. **Cancel is a quiet way back, never in the primary-action position.** It's a text link, not a button, at the top of the page above the item: "← Back to <item name>", or "← Back to the shop" when the item has no product page.

- It never sits where a primary call to action would: not beside or below the region choice, the total or the payment form.

- It does what Cancel does today. With a session open, it goes through the order-cancelled page, which releases the hold. Otherwise it goes straight back.

- A page's own `cancelLabel` still sets its wording.

3. **Every checkout page has the payment form's place**, whatever shape its template is: directly after the total, or at the end of the page when the template has no total. A checkout page is never drawn without one. With no actions row, the mount no longer depends on finding one (the BUG-375 `withPayment`/`isStandardRow` dependency goes).

4. **Nothing empty is left behind.** No label-less box or leftover styled wrapper appears at any stage: before the region, while the form loads, once it is shown, or after a failure.

5. **The consultant's guidance (DOC-47) describes this layout**: no Continue, Cancel as the top "back" link, and the payment form after the total. The consultant must not style a Cancel or Continue into a primary-button position.

## Test plan

UATs `tests/test_UAT_FC_BUG-396_*.test.ts`, in real Chromium against the rendered checkout page, with a stand-in for Stripe's script:

- A checkout page draws no Continue control. Its Cancel is a link placed before the item, with the "← Back to " wording, and is not a button.

- Choosing a region fills in the shipping and total on the same page, and mounts the payment form after the total. The URL doesn't change and no new tab opens.

- A one-rate business's checkout page shows the form on arrival.

- A checkout template of any shape (no standard actions row, no total) still renders a `payment` mount.

- When mounting fails, "Payment could not be started…" and a Try again button appear in the form's place, and `cancel` is posted for the opened order. Try again starts a new session.

- At no stage is there a visible element with no text and no content inside the checkout's action/payment area.

- With a session open, Cancel goes through order-cancelled and releases the hold.

- Regression: the BUG-375, BUG-367, BUG-368 and REQ-666 checkout suites. Their Continue/actions-row assertions are updated as superseded by this ticket.

Done: on production, the affected business's preview checkout fills in on region choice and shows Stripe's form, with Cancel as the top back link.

## What landed (2026-11-08)

**Root cause.** Not confirmed against the business's real template: that needs production admin access, which this session didn't have. The fix covers the likely cause either way. Any template without the standard actions row got no `payment` mount, and the script hid Continue regardless. The fix no longer depends on the template's shape.

- **`checkoutLayout`** (`packages/framework/src/l2/checkout.ts`) replaces `checkoutActions`/`withPayment`/`isStandardRow`/`actionsRow`. On every checkout page (not in the edit channel), it:
  - removes every `continue` and `cancel` the template placed, together with the boxes that held only them, so no empty styled wrapper is left;
  - prepends a `cancel` text link (body type, the design's text colour, no fill or border) to the top of the page;
  - places the `payment` mount after the total (in the nearest box that stacks its children), else at the end of the page, unless the template has its own;
  - adds, right after the mount, a hidden `paymentFailed` sentence and a hidden **Try again** button (`retry` control).
- Try again uses the design's primary look, or the template's own Continue look when that Continue carried a fill. Ship to is measured against it, keeping BUG-373's "as tall as the button" rule. Nodes the layout adds are resolved against the site's design, so they use its type.
- **Script** (`client.js`): there is no Continue. A region (or arrival, with one rate) starts the session and mounts the form. If start or mount fails, the page cancels any opened session, shows the sentence (or the Worker's own error) and Try again in the form's place, and hides the mount. Try again starts a new session. A refusal whose quote says the item can't be bought (just sold) shows the message only, with no Try again. Cancel keeps today's behaviour: it goes through order-cancelled while a session is open.
- **Component/meta.** Cancel defaults to "← Back to <item name>" when the item has a product page; otherwise "← Back to the shop", linking to the shop page. `cancelLabel` still wins. The `continue` control and `continueLabel` stay declared, so stored pages still validate, but nothing is drawn for them. There is a new `retry` control.
- **Schema.** New text bind field `paymentFailed`.
- **DOC-47** now describes this layout (applied to the system KB at merge).

**Known limit, out of scope.** The edit channel doesn't apply the layout, because it would shift stored addresses. A stored template's own Continue box can therefore still show there, empty, until the owner or consultant removes it.

## UATs

`tests/test_UAT_FC_BUG-396_checkout_fills_in.test.ts` (real Chromium, stand-in Stripe.js):
- `no_continue_and_cancel_is_a_back_link_above_the_item`
- `choosing_a_region_fills_in_the_same_page_and_the_form_follows_the_total`
- `a_one_rate_shop_shows_the_form_on_arrival`
- `a_template_of_any_shape_gets_the_payment_place`
- `a_template_with_no_actions_row_still_shows_the_form` (reproduces the production shape: Continue inside a site button box, own filled Cancel, no total)
- `when_the_form_cannot_start_it_says_so_with_try_again_and_releases_the_hold`
- `nothing_empty_is_left_at_any_stage` (before the region, while loading, with the form, after a failure; default and own template)
- `with_a_session_open_cancel_goes_through_order_cancelled`

**Superseded assertions.**
- Updated: BUG-367 checkout page/draft workers, BUG-373 select (now measured against Try again), BUG-375 single page, REQ-643 pages.
- Removed: `test_UAT_FC_BUG-367_checkout_buttons_in_chromium`, `test_UAT_FC_BUG-368_checkout_actions_in_chromium`, BUG-370's three checkout-row cases, and BUG-367's `continue_starts_disabled…`.

**Results.** BUG-363/367/368/370/373/374/375, REQ-643/644/666 and BUG-396 suites pass, node and workers. Two suites also fail on a clean checkout and are unrelated: `reconciliation-publish-revision`/`-beyond-l1-authoring` (5 cases). `BUG-377` rehearsal fails only inside a worktree.