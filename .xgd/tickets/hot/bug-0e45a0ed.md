---
uid: bug-0e45a0ed
id: BUG-362
type: bug
title: Draft preview does not refresh after a builder change to a component slot (catalog
  product-page) until a manual reload
created_by: xgd
created_at: '2026-11-05T22:00:44.114346+00:00'
updated_at: '2026-11-05T23:12:47.839559+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  parent_uid: epic-95bc3b15
  chat_comment: comment-8918c8b0
  commits:
  - working_sha: 2e81f4e02bf59ac572ac77c48d76ec5dbf7d9325
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.790
  story_points: 1
---

**What happened:** A builder added `space: "xl"` to the root container of a `catalog` (mode product) component's `product-page` slot on the product template page (change recorded, read back correctly). The client was already viewing that page in the draft preview (View, 1280px). The preview kept showing the old layout (no gap between the photo column and details column) until the client manually reloaded the browser tab. After reload, the change was visible.

**Expected:** The preview re-renders when the draft changes, as it does for ordinary page edits, so the client sees the change without reloading.

**Repro:**
1. Open a page whose content is inside a component slot (catalog product template) in View.
2. Change a field inside the slot (e.g. `space` on the slot root) via set_l1 with module/slot.
3. Observe the preview does not update; reload the tab and it does.

**Impact:** The client is told a fix has landed and sees nothing change, which reads as the fix failing. Possibly specific to edits scoped by module/slot, or to the product template preview.

## Root cause

The module/slot scoping was not the cause. The draft feed reports the write correctly, naming the product template page by id (`l1.set`, `page: <template id>`). The preview then asks whether the change touches the page on screen (`touchesShown` in `apps/control-app/src/builder/app.js`, BUG-248). A product page the client views is a generated page at `shop/<item-slug>`, drawn from the template by the renderer (REQ-633). It is not a row in the site's page listing. `touchesShown` compared the written page ids only with the shown slug (`shop/<item-slug>`) and with a listing row it could not find, so it answered "not this page" and skipped the refresh.

The BUG-248 contract already says that "a page the listing cannot yet place is answered as touching it". The code did not implement that half.

## Fix

In `touchesShown`, when the listing has rows but none of them is the page on screen, the preview treats the change as touching that page and refreshes. That covers a generated product page and a page renamed or deleted since the listing was taken. A change to another listed page still leaves a listed page alone, as before. A generated product page refreshes on any page write. That costs at most one refresh per interval (BUG-248 throttle) and cannot miss a change to its template.

## Test plan

`tests/test_UAT_FC_BUG-362_generated_page_refreshes.test.ts` (jsdom, mounted like the BUG-248 suite):
- the client is viewing `shop/<item>` (not in the listing). A draft change naming only the product template page refreshes the preview.
- the client is viewing a listed page. A change naming only another page still does not refresh it (regression guard for BUG-248).

Regression scope: `tests/test_UAT_FC_BUG-248_preview_refresh.test.ts`, `tests/test_UAT_FC_BUG-192_preview_follows_the_draft.test.ts`.