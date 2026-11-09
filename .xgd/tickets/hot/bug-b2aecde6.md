---
uid: bug-b2aecde6
id: BUG-396
type: bug
title: 'Checkout: choosing a region hides Continue but no payment form appears (empty
  box, can''t pay)'
created_by: EPIC-31
created_at: '2026-11-09T02:11:26.171071+00:00'
updated_at: '2026-11-09T02:11:26.977308+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom (production, 2026-11-08)

A business has payments, shipping and Terms of sale set up, and is deliberately not published. The owner opens a product's checkout page in the builder preview and chooses a delivery region. The "Continue to payment" button then loses its label and shrinks to a small empty box, and clicking it does nothing. Stripe's payment form never appears, so the buyer cannot pay.

Production Workers Logs for the session show the server side working. Every region change ran `quote` → `start` (200) → `cancel` (200) on the next change. So a Stripe session is opened each time, and the failure is in the page.

## Root cause (likely, still to be confirmed against the business's real checkout template)

- `checkoutActions` → `withPayment` (`packages/framework/src/l2/checkout.ts`) only inserts the `payment` mount (BUG-375) when the template has a **standard actions row**: Continue and Cancel in an end-aligned three-child row (`isStandardRow`). If the template places Continue some other way, `actionsOf` returns it unchanged, and `withPayment` returns the page **with no payment mount**.
- The checkout script (`packages/framework/src/modules/checkout/client.js`, `pay()`) then opens the session and calls `initEmbeddedCheckout`. It mounts only `if (mount)`, but **sets `button.hidden = true` either way**. The button disappears with no form in its place. The box styled around it stays, with no label: the "snub".

If the template turns out to have a mount, the next suspect is Stripe's form loading but staying invisible inside the preview frame. In that case the browser console on the checkout page will show the error. Confirm which it is first, by rendering this business's actual checkout page.

This is a fix to landed work (BUG-375, BUG-368).

## Fix

1. **Every checkout page has somewhere for the payment form**, whatever shape its template is. If no standard actions row is found, the mount goes straight after the Continue control's row/box, or failing that at the end of the page. A checkout page is never published without one.
2. **Continue is hidden only once Stripe's form is actually on the page.** If there is no mount, or mounting fails, or the form doesn't appear, Continue stays visible with its label and works as the retry. Any open session is cancelled, which releases its hold. The buyer sees "Payment could not be started. Nothing was charged; please try again."
3. **When Continue is hidden, it is hidden completely.** The box styled around it goes too, so no empty, label-less shape is left on the page.

## Test plan

UATs `tests/test_UAT_FC_BUG-396_*.test.ts`, in real Chromium against the rendered checkout page, with a stand-in for Stripe's script:
- A checkout template whose Continue is **not** in the standard Continue/Cancel row still renders a `payment` mount. Choosing a region shows the form in it, and Continue is hidden with no visible leftover box.
- With the mount removed or mounting made to fail, choosing a region leaves Continue visible, labelled and clickable, shows the "could not be started" message, and posts `cancel` for the opened order.
- Regression: the BUG-375, BUG-367 and BUG-368 checkout suites.

Done: on production, the affected business's preview checkout shows Stripe's form after a region is chosen.
