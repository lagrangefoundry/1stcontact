---
uid: bug-f253ae03
id: BUG-374
type: bug
title: 'Checkout: in the builder preview Stripe''s payment page hangs on its loading
  skeleton; Zone name help says buyers don''t see it'
created_by: EPIC-9
created_at: '2026-11-06T19:41:49.668651+00:00'
updated_at: '2026-11-06T20:25:56.067015+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9048028b
  commits:
  - working_sha: 9d31c340bcaf45856d3c8e404c0bbdc438dfade1
    reconcile_sha: null
    main_sha: null
  - working_sha: aa05ecd34fc0ea522ab01bbda0f465dd0dc2792c
    reconcile_sha: null
    main_sha: null
  version: 0.2.803
  story_points: 3
---

## Symptom (operator, 2026-11-06, dev, after redeploying with BUG-372)

In the builder preview, on the shop's checkout page, the owner picks a delivery region (Ireland) and presses **Continue to payment**. The preview turns into a blank page of grey boxes that shimmer as if loading, and nothing more happens. Reproduced twice.

## Cause

- Our side succeeded both times. Dev D1 `orders`: `ord_53e1…` (19:04 UTC) and `ord_9aad…` (19:35 UTC), both `mode=test`, `ship_country=IE`, zone Ireland, `status=pending`, each with a `checkout_session_id`. Stripe accepted both sessions (BUG-372's fix works).
- The checkout client (`packages/framework/src/modules/checkout/client.js`, ~line 133) sends the buyer to Stripe with `window.location.assign(r.data.url)`. In the builder the site runs inside the preview `<iframe>` (`apps/control-app/src/builder/panel.js` `makeFrame`), so Stripe's hosted Checkout page loads **inside the frame**. Stripe's hosted Checkout cannot run framed: it draws its loading skeleton (the shimmering grey boxes) and stops.
- BUG-283's `openExternalInNewTab` only catches a clicked off-site link. A scripted navigation, like this one, is not caught.
- BUG-368 made the draft's checkout work like the published site's, but it was only tested up to the session being created, not with a real browser following the redirect inside the frame. On the published site the page is top level, so the redirect works.

## Fix

1. **In the builder preview, Stripe's payment page opens outside the preview frame**, in a new browser tab. The builder stays where it is.
   - The tab is opened in direct response to the click, so popup blockers allow it. For example, open it first and set its address once the session URL arrives. If the session can't be created, close the tab and show the usual error in the preview.
   - Stripe's success and cancel return pages (the draft's own "order complete" / "cancelled" pages, BUG-368) open in that tab, and work there while the owner is signed in.
   - The preview shows a line such as "Payment opened in a new tab." while it waits.
2. **The published site is unchanged**: the visitor goes to Stripe in the same tab, as now.
3. More generally, no scripted navigation from a site to another origin happens inside the preview frame. Anything the site sends off-origin goes to a new tab, the same rule BUG-283 applies to clicked links.
4. **Zone name help text is wrong.** Settings → Shipping (`apps/control-app/src/builder/shipping.js`, `FIELD_HELP.name`) says "Buyers don't see it". They do: it is the shipping line on Stripe's payment page and on the invoice ("Shipping — Ireland"). New text: "Your own label for a group of destinations, e.g. “Ireland”, “Rest of EU”. Buyers see it: it names the shipping line on the payment page and the invoice (“Shipping — Ireland”)."

## Not in scope

The Shipping country list. After BUG-372 it is already exactly Stripe's `allowed_countries` list, so it cannot produce a code Stripe rejects (`EZ`, `EU` and the like are gone). No change needed.

## As implemented

- `packages/framework/src/modules/checkout/client.js`: when the checkout page is framed (`window.top !== window.self`; the builder preview), Continue opens a blank tab synchronously inside the click, then, when `start` returns Stripe's URL, drops the tab's `opener` and points it at that URL. The page says "Payment opened in a new tab." (`PAYMENT_IN_NEW_TAB`). If `start` fails, the tab is closed and the usual error shows. A top-level page (the published site) still uses `location.assign` in the same tab. `module-assets.ts` regenerated so the shipped `capabilities.js` carries the change.
- `apps/control-app/src/builder/panel.js`: the general rule (item 3). Each preview frame's `navigation` (the Navigation API) gets a `navigate` listener. A script-started navigation to another http(s) origin is cancelled and opened in a new tab (`noopener`), the same rule BUG-283 applies to clicked links. Form submissions and back/forward are left alone, because a form's body can't follow to a new tab. Browsers without the Navigation API get only the checkout-specific fix above.
- `apps/control-app/src/builder/shipping.js`: `FIELD_HELP.name` now reads "Your own label for a group of destinations, e.g. “Ireland”, “Rest of EU”. Buyers see it: it names the shipping line on the payment page and the invoice (“Shipping — Ireland”)." BUG-372's suite no longer pins the old "Buyers don’t see it" phrase.

## Test plan

Real Chromium (`CHROMIUM_LAUNCH_ARGS=--single-process` in the agent sandbox). The site's own rendered checkout page and its shipped `capabilities.js` run inside the real builder panel's frame. The Worker's `api/checkout/*` endpoints are stubbed, and "Stripe" is a page on another origin.

- `tests/test_UAT_FC_BUG-374_preview_checkout_opens_stripe_outside_frame.test.ts`
  - `…_preview_checkout_opens_stripe_outside_frame`: Continue in the framed page opens a new top-level page at Stripe's URL, with no `opener`. The frame's URL is unchanged, and the message reads "Payment opened in a new tab."
  - `…_published_checkout_goes_to_stripe_in_the_same_tab`: a top-level checkout page navigates in place to Stripe's URL, and no extra page opens.
  - `…_a_session_that_fails_leaves_no_tab_and_shows_the_error`: a refused `start` leaves only the builder page open, shows the refusal's error and leaves the frame unchanged.
  - `…_a_scripted_navigation_off_the_site_opens_a_new_tab`: a framed site page that calls `location.assign` to another origin opens a new tab at that URL, and the frame stays on its page.
- `tests/test_UAT_FC_BUG-374_zone_name_help.test.ts` › `test_UAT_FC_BUG-374_zone_name_help_says_buyers_see_it`: the Shipping editor's Zone name help reads the new sentence and no longer says buyers don't see it.