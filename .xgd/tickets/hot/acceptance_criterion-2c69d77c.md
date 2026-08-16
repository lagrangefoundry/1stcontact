---
uid: acceptance_criterion-2c69d77c
id: AC-1113
type: acceptance_criterion
title: A tile is labelled with the image's file name alone; the full handle it commits
  survives only as its tooltip
created_by: xgd
created_at: '2026-08-12T16:23:35.939354+00:00'
updated_at: '2026-08-16T04:19:32.518479+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A tile is labelled with the image's **file name alone** and never any part of its
address. The name is what the handle ends in, with any query or fragment dropped
— a cache-busting suffix is not part of what an image is called. No directory
appears anywhere in the grid, on any tile: a handle is an internal address rather
than a property of the picture, and it stops meaning anything at all once assets
are held in a store rather than a filesystem.

The **value is unchanged by this**. A tile commits the full handle — the same
vocabulary the write path validates membership against and the same value the
region held before — and only the label is the file name. Stripping the path is a
display projection, so nothing about which values a region will accept changes.

The full handle survives as the tile's **tooltip, and nowhere else**. Because the
site's asset listing walks sub-directories, two images can share a file name;
hovering settles which is which, so a collision is resolvable without putting a
path back on screen for every tile that never needed one. Duplicate names are
tolerated this way rather than disambiguated in the label.

A handle that ends in a separator and so names no file falls back to the handle
itself as its label: showing that beats showing nothing.

## Verification

Seed a site whose images include two files that share a name in different
sub-directories and one handle carrying a query string. Open the picker and
assert each tile's visible text is the bare file name — no separator in it, the
query stripped — and that no directory appears anywhere in the grid's text.
Assert each tile's tooltip is the full handle it stands for. Assert the value
each option commits is the full handle, not the label. Then choose the tile whose
name is shared with another image, confirm, and assert the handle written to the
draft is the full handle of the tile chosen.