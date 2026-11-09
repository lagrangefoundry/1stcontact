---
uid: bug-1c0aef3f
id: BUG-412
type: bug
title: 'Checkout component v1: defaults that don''t work on a first pass (no price,
  unlabelled totals, huge order photos, terms in the wrong font and place, inset slot)'
created_by: EPIC-19
created_at: '2026-11-09T20:23:05.726922+00:00'
updated_at: '2026-11-09T20:29:04.155619+00:00'
completed_at: null
last_field_updated: status
status: wont_fix
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e1486757
---

## Source

PLATFORM_ISSUE-16 (production, 2026-11-09). The consultant rebuilt a shop's three purchase pages from scratch using only the current checkout guidance and the component's defaults (`checkout` v1, modes `checkout`, `status`, `cancelled`), and the operator reviewed them in the preview and live. A first pass with no special help should produce a usable purchase flow, and it doesn't. Already tracked elsewhere, so not repeated here: Try again / Request cancellation styling and the cancelled page's empty back link (BUG-408), the delivery select's width, padding, font and centring (BUG-373), opening a piece's page (BUG-409).

## Problems

**Checkout (mode `checkout`)**
1. **The price is drawn where the page can't control it.** The component draws the piece's price itself, left-aligned under the region select, wherever the page places its `price` bind. The placed bind paints blank in the draft. No total appears either.
2. **No photo.** For a one-off piece the photo is the buyer's confirmation they're buying the right thing.
3. **The terms line is the component's own text,** drawn under the region select in the browser's default serif. No page setting reaches its font or position, and it belongs under the payment area.
4. **The default region prompt is cut off at 375px.**
5. **The page jumps when the payment form loads,** because no space is reserved for it.

**Order detail (mode `status`, linked from order emails)**
6. **Line photos at their own size:** huge and uneven. The page measures 469px wide at a 375px viewport.
7. **An unlabelled money summary:** bare figures, and a bare "1001" for the order number.

**Cancelled (mode `cancelled`)**
8. **No way back to the same piece.** For one-of-a-kind stock that's still available, "Return to checkout" should be the main action, with "Back to the shop" second. Nothing exposes the piece's checkout address.

**Every mode**
9. **The slot is inset about 48px a side,** so slot content runs 96–1184px at 1280 while the site's content measure is 48–1232px, and the page's own heading sits further left than the component. The page can't remove it.

**Guidance**
10. **The reference contradicts the guidance:** it still lists mode `complete` and `continueLabel`, both retired. The guidance also doesn't say that the `page` slot only exists if content is supplied when the component is added, or which item fields (price, photo, total) are bound in each mode.

## Expected behaviour

1. **The price, photo and totals are binds the page places,** each drawing wherever the page puts it. The defaults put a small square photo (about 64–80px) and the price beside the piece's name, and Delivery and Total under it once a region is chosen, with the total emphasised. The component never draws a second, unplaceable price.
2. **The terms line is a placeable control** (`terms`) drawn in the site's body type. Its default position is under the payment area.
3. **The default prompt fits at 375px** (wraps or uses a shorter default), and **the payment area reserves its height** before the payment form loads, so nothing jumps.
4. **Order detail defaults:** line photos are fixed square thumbnails (about 64–80px) beside each name. The page never exceeds the viewport width. The summary is labelled Subtotal / Delivery / Total with the total emphasised, and the order number is labelled ("Order 1001").
5. **The cancelled page offers "Return to checkout"** for the same piece when it's still available, as the main action, with "Back to the shop" second. It offers only "Back to the shop" when the piece has gone.
6. **The slot fills the page's content measure** like any section, with no inset of its own.
7. **The reference and guidance agree:** retired settings removed, and the guidance says how to get the `page` slot and which binds each mode offers.
8. **Defaults only, on an empty page, gives a usable flow** in all three modes at 375 and 1280.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*`, rendering each mode with defaults only, for a real catalogue item, at 375 and 1280:
- checkout: the price and photo appear beside the name, no second price is drawn, Delivery and Total appear after a region is chosen, the terms line is in the site's body family and sits after the payment area, and the page height doesn't change when the payment form mounts;
- status: thumbnails render at the fixed size, the page's scroll width equals the viewport at 375, and the summary has the three labels and a labelled order number;
- cancelled: an available piece shows "Return to checkout" linking to that piece's checkout, plus "Back to the shop"; a sold piece shows only the second;
- the slot's content left edge equals the site's content measure at 1280;
- the reference no longer lists `complete` or `continueLabel`.