---
uid: bug-cb0cf782
id: BUG-363
type: bug
title: 'catalog product page: text bound to `buy` (link) renders nothing; checkout
  page says "This can''t be bought right now"'
created_by: xgd
created_at: '2026-11-05T22:00:47.234021+00:00'
updated_at: '2026-11-05T23:12:58.691515+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  parent_uid: epic-95bc3b15
  chat_comment: comment-97fe617c
  session_id: e85b4550-3bae-42cc-894f-62ea1162fd67
  commits:
  - working_sha: 6fec4e2e2d3a169d2ce0af05a5b9b7821dcf8c9b
    reconcile_sha: null
    main_sha: null
  - working_sha: 2963f2532d48c7092abea5a7550f6b815973415a
    reconcile_sha: null
    main_sha: null
  version: 0.2.791
  story_points: 5
---

**Setup:** Product template page with a `catalog` component (mode product). In its `product-page` slot, a text node `{kind: text, component: button.primary, text: "Buy this piece", bind: {field: "buy", link: true}}`. The validator accepted `buy` as a text bind field. Three checkout pages exist: `checkout` (checkout component, mode checkout), `checkout-complete` (mode complete), `checkout-cancelled` (mode cancelled), all nav false.

**Expected:** On an available (not sold) item's product page, the Buy node renders as a link into checkout for that item.

**What happened:**
- The operator viewed the draft and saw no Buy button on the product page, after a reload. The sibling `enquiry` node renders on available items in grid cards, so item availability data is present.
- The draft preview of the product template shows a sold item (where Buy correctly does not appear), so the template preview alone can't test Buy.
- Opening `/checkout` directly shows the message "This can't be bought right now". That may be correct when no item is in hand, but it may also mean payments are not set up for the shop. Nothing on the site-editing surface says which.
- In a draft screenshot with `after`, clicking a grid card's link on a collection page "changed nothing", so I could not reach an available item's product page from the draft to look myself.

**Asks:**
1. Under what conditions does `buy` render (payments connected? item has a price? draft vs published?) Document it alongside `sold`/`enquiry`/`commission` in DOC-47 / REF-l1, which still say "Buying is not built yet" and list no `buy` field.
2. Give the consultant some way to see whether the shop can take payment (e.g. describe_site or list_behaviors stating checkout readiness).
3. Let the draft preview of the product template choose an available item, or let a draft screenshot open `/shop/<item>`, so Buy can be checked.


## Confirmed cause (EPIC-19 session, 2026-11-05)

Buy is hidden on purpose, and nothing says why. The operator was viewing an **available** piece (a €600 pendant), not the sold one.
- `tools/generate/src/render/render.ts:586` sets `canBuy = catalog.canTakePayments && shipping.countries.length > 0`.
- For this business, dev D1 has **no `stripe_connections` row** (payments never connected) and **no `shipping_zones`** (no country to ship to). So `canBuy` is false: Buy is dropped from every product page, and checkout says "This can't be bought right now".
- The `buy` bind itself works.

**So the fix is visibility, not rendering:**
- **In the draft,** an available piece's Buy slot shows a placeholder that only the owner sees (never on the published site), for example "Buy appears here once payments are connected and you ship somewhere (Shop tab)". It names what's missing: payments, shipping, or both.
- **The checkout page says which condition is missing** instead of "This can't be bought right now". Visitors to the published site keep a neutral message.
- **The consultant can read checkout readiness** (payments connected in which mode, shipping zones and countries) from a tool it already uses (`describe_site` or `list_behaviors`), so it can answer "why no Buy?" directly. Today it guessed between three causes.
- Asks 1 and 3 above stand.

Folded in from BUG-361 item 4, which is withdrawn in favour of this ticket.

**Update:** The operator confirms an AVAILABLE item (in-stock, €600, collection "LO Originals"), opened at /shop/<item> in the draft preview after a hard reload, still renders no Buy element. The "sold item" explanation is ruled out. The same item's page shows the enquiry action, so the `enquiry` binding works and only `buy` does not. Still unknown: whether `buy` renders only when payments are connected, only on the published site, or not at all yet. The catalog v1 entry in list_behaviors declares no setting or control for buying, and DOC-47 still says "Buying is not built yet". Needed: the documented conditions for `buy`, and a draft-preview signal that says why it is hidden.

Update: operator confirms the shop's Stripe configuration is not set, which is the likely cause of the missing `buy` link and of /checkout saying "can't be bought right now". Remaining defect: nothing in the draft preview, describe_page, list_behaviors (catalog v1) or the checkout page says that `buy` is hidden because payments aren't configured. The consultant and the client could only find it by elimination. Suggest a draft-only hint on bound `buy` nodes and on the checkout component when payments are unconfigured, and documenting the `buy` binding and its gating in REF-l1 / DOC-47. Will re-verify once Stripe is connected.

**Update 2026-11-05:** the operator reports Stripe is now connected for the shop, and the Buy control still does not render on an in-stock item (9ct Gold Rough Garnet Pendant, €600) on the product template. The product-page slot has a text node bound to `buy` with `link: true` (id product-buy, component button.primary) between price and enquiry; the `enquiry`-bound sibling renders, `buy` does not. So payments configuration is ruled out as the cause: either `buy` is not populated by the catalog binding in the draft/preview, needs publishing to appear, or is not implemented. Nothing in the preview indicates which.


**Update (2026-11-05, 22:48 UTC):** the operator connected Stripe (test mode, state ready) and still saw no Buy button. That is expected under the rule: the business still has **no shipping zones**, so `canBuy` stays false. This is exactly the confusion the placeholder and the readiness read above are meant to remove: the owner fixed one of the two conditions and got no feedback that a second one exists.

Update: the operator has now configured Stripe for the shop. Buy still does not render on an in-stock item (€600 pendant) in the draft. So the missing Buy is not explained by payments being unconfigured. Either `buy` is gated on publishing, which nothing says, or it isn't implemented in the catalog product-page render. `enquiry` on the same node tree renders fine.

Update: once Stripe was connected AND shipping zones were configured, the Buy control now renders on an in-stock item (so shipping zones are a hidden precondition too, and the preview gave no hint of either). New defect: clicking Buy returns the visitor to the same product detail page instead of going to /checkout. The element is `{kind: text, component: button.primary, bind: {field: "buy", link: true}}` in catalog v1 slot product-page. The href comes from the component's `buy` binding, not from page content, so the generated buy link appears to resolve to the item's own URL. A checkout page exists at /checkout (checkout v1, mode checkout) with complete/cancelled pages at /checkout-complete and /checkout-cancelled. Expected: Buy goes to the checkout (with the item carried), or straight to Stripe. Also worth documenting: how the buy link finds the checkout page.


## What this fix does (BUG-363 free-coding session, 2026-11-05)

1. **Buy goes to checkout, even with `link: true`.** A bound text node's link is the field's OWN href first (`buy` → `/checkout/<item>`, `enquiry`/`commission` → their form). `bind.link: true` links to the record's own page only for a field with no href of its own (`name`, `price`, …). Today `link: true` on `buy` sends the visitor back to the product page they are on. Same rule for the checkout page's record.
2. **The builder preview says why Buy is missing (owner only).** In the builder's preview channels (draft, edit, revision — the renders `unpublishedPages` marks as the builder's), an available item whose Buy is withheld because the business can't sell draws the `buy` node with a hint instead of nothing, naming exactly what is missing:
   - payments: "Buy appears here once Stripe is connected (Settings → Payments). Only you see this."
   - shipping: "Buy appears here once you add a shipping zone (Settings → Shipping). Only you see this."
   - both: names both.
   The hint never links into a checkout (there is none yet); a node with `link: true` links to the item's own page like any field without a destination of its own. The enquiry link still shows beside it, as on the published site. A sold item shows no hint. A published render never carries the hint.
3. **The checkout page says which condition is missing (owner only).** In the builder's preview, the checkout page's `unavailable` node reads "Checkout opens once … Only you see this." instead of its own neutral wording when the business can't sell, and its root carries `data-checkout-blocked="payments shipping"` (whichever are missing). The page's script sees the marker and asks for no quote, so it no longer covers the page with "This can't be bought right now." Published checkout pages (written only when the business can sell) keep the neutral wording and get no marker.
4. **The product template preview draws an available item.** The product-page template page, drawn in the builder, shows the first AVAILABLE (not sold) live item, falling back to the first live item, so Buy can be checked on the template itself.
5. **The consultant can read checkout readiness.** `describe_site` carries `checkout`: `{ canTakePayments, shipsTo: [country codes], buyShows, missing: ['payments' | 'shipping'] }`, where the host knows the business (the control app; absent in the `1c` CLI). So "why no Buy?" is answered by reading, not by elimination.
6. **Docs.** DOC-47's "Buying is not built yet" is replaced by when Buy shows (live + available item, Stripe connected, at least one shipping zone; draft or published makes no difference), where it links (`checkout/<item>`, the site's own checkout page or the framework default), that `link: true` doesn't change a field's own destination, the builder-only hints and `describe_site`'s `checkout`. REF-l1 is projected from the schema, so the bind schema's `field` and `link` comments now say the same, and the next KB build carries it.

## Landed

Commits `6fec4e2e2d3a` (fix + UATs) and `2963f2532d48` (version 0.2.791). Files: `packages/framework/src/l1/render.ts` (`bindL1` link rule), `packages/framework/src/modules/product-catalog/{items,component}.ts` (`buyBlockers`, `buyBlockedNote`, hint, template item), `packages/framework/src/modules/checkout/{component.ts,client.js}`, `tools/generate/src/render/render.ts` (`catalogPropsFor` sets `buyBlockers` only when `unpublishedPages`), `apps/control-app/src/catalog.ts` (`checkoutReadinessFor`), `router.ts` → `ai.ts` → `host-core.ts` → `toolbox-core.ts` (`describe_site.checkout`), `packages/site-schema/src/l1/schema.ts` (comments).

## Test plan

- `tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts` (node), `tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts` (workers, real D1 Shop tables, no Stripe connection). All four node UATs fail on the old code.
- `test_UAT_FC_BUG-363_*` (framework, node vitest): Buy with `link: true` links to `/checkout/<slug>`; builder hint on an available item names payments / shipping / both, and never appears without the builder flag; checkout page's unavailable message names the missing condition only with the flag; template product page draws the first available item.
- Toolbox: `describe_site` includes `checkout` when the host lends readiness, and omits it otherwise.
- Regression scope: the catalog/checkout/render suites (`REQ-633`, `REQ-643`, `REQ-650`) and the toolbox describe_site suites.