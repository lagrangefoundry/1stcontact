---
uid: acceptance_criterion-f336d8a0
id: AC-921
type: acceptance_criterion
title: A page is only ever served at its slash-free URL, so its document-relative
  asset references resolve against the snapshot root
created_by: xgd
created_at: '2026-08-06T19:03:19.148429+00:00'
updated_at: '2026-08-09T13:50:14.852644+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

On the deployed site a directory-shaped URL — one ending in a separator — is
never eligible for the mapping, so a page has exactly one clean URL and it is the
slash-free one. Requesting the slash-terminated form of a page returns not-found
rather than a second address for the same page. The URL that does serve the page
resolves that page's document-relative asset references against the snapshot
root, so the page loads with its stylesheet and images intact.

## Verification

Deploy a rendered site and request the slash-terminated form of a page's clean
URL; assert not-found. Request the slash-free form; assert success, and that
resolving one of the page's document-relative asset references against the
served URL yields the asset's address directly under the snapshot root — not one
level deeper.