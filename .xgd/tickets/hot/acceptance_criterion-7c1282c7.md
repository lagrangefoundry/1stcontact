---
uid: acceptance_criterion-7c1282c7
id: AC-2070
type: acceptance_criterion
title: Describing a page carries the page's document-level keys alongside its element
  map
created_by: xgd
created_at: '2026-11-01T01:10:51.186624+00:00'
updated_at: '2026-11-01T01:10:51.186624+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

The page description an assistant asks for first — the one that returns the page's
metadata and the map of its elements — also carries the page's document-level keys
(background, text colour, widths, column, font table) exactly as stored, as a page-level
member separate from the element map. A page's background is therefore discoverable
without a second call, and a value set through the page-style write is visible in the
next page description. The element map entries themselves remain free of styling.

## Verification

Set a page's background through the page-style write, then describe the page: assert the
description carries the background exactly as set, alongside the page's metadata and
element map, and that the element map entries carry no styling properties.