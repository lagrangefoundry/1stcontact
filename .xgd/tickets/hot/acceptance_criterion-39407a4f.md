---
uid: acceptance_criterion-39407a4f
id: AC-1007
type: acceptance_criterion
title: The edit render names the page it was rendered from, so a region address is
  a complete coordinate
created_by: xgd
created_at: '2026-08-07T02:42:41.948019+00:00'
updated_at: '2026-08-07T02:53:52.179395+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
---

## Criterion

The edit channel's rendered document carries the definition **id** of the page it
was rendered from, on the same element that carries the edit-mode marker. A
region's address locates a node *within* a page; this stamp supplies the other
half, so a client holding one clicked region has everything it needs to name that
node without inferring the page from the URL it happens to be displaying.

The value is the page's definition id, never its slug and never the file name the
page was emitted under. The home page is emitted under an alias file name, so the
file on screen does not name the page, and a client deriving the page from it
would be re-deriving the renderer's home-page rule and free to drift from it.

The attribute that carries the stamp is named by the published stamp vocabulary,
so its *name* is part of the contract a client reads and not an internal detail.
The shipped channels carry no such stamp.

## Verification

Seed a site whose home page's definition id differs from both its slug and the
file name it is emitted under, plus one non-home page. Render the edit channel
and assert that each page's rendered document carries the page stamp under the
published attribute name, on the same element as the edit-mode marker, and that
its value is that page's definition id — not its slug, not the file name. Assert
that naming the stamped id together with a stamped address from the same document
identifies the region the address was derived from. Render the preview and
published channels of the same site and assert neither carries the stamp.