---
uid: acceptance_criterion-f713cba6
id: AC-1322
type: acceptance_criterion
title: Assets cross as bytes and pages as keys — nothing crosses as a location
created_by: xgd
created_at: '2026-08-20T05:10:18.506012+00:00'
updated_at: '2026-08-20T05:24:47.254459+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

Nothing crosses the storage boundary as a location.

- An asset is read as bytes and written as bytes, in both directions. No question about an
  asset answers with a filesystem path, and no command hands storage a path to copy from.
- A page is identified by its store name (for example `home.json`) — a key, never carrying a
  directory component, and the sort order of those names is the order pages load in.
- Adding an asset the operator already has is expressed as bytes plus the name to store it
  under; the file on the operator's own machine is opened by the command that has a filesystem,
  not by storage.

## Verification

Add an asset through the editing surface and assert the stored asset reads back byte-identical.
Assert that every value returned by an asset-shaped question is a byte sequence, and that no
returned value is a string resolving to a location on disk. Assert a page's returned name has no
directory separator in it, and that reading a site's pages returns them in the sort order of
those names. Drive the same asset add against a store with no filesystem behind it and assert it
succeeds — which it could not if a path were being handed across.