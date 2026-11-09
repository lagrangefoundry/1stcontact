---
uid: acceptance_criterion-31fbf720
id: AC-2522
type: acceptance_criterion
title: A change of site or an explicit refresh invalidates every channel, so none
  ever reveals the previous site's page
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:40.568853+00:00'
updated_at: '2026-11-09T03:11:40.568853+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A change of site, or an explicit refresh of the pane such as a business switch,
invalidates every channel ([[BUG-79]]). Another site's page, or the same slug
under another business, is not the page any frame is holding. So the shown frame
re-renders at once for the new site, and each idle frame re-renders before it is
shown again. Once the shown frame has loaded, an idle frame now pointing at a
different address is primed behind it in the usual way. No channel ever reveals
the previous site's document.

## Verification

Mount the real builder composition over two sites with both channels loaded.
Change site and assert the shown frame navigates to the new site's channel.
Switch mode and assert the revealed channel holds the new site's page, never the
old one's. Repeat with an explicit refresh and an unchanged slug, and assert
every channel is re-fetched before it is shown.

Reference UAT: `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`
(a_change_of_site_invalidates_every_channel).
