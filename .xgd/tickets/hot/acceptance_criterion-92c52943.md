---
uid: acceptance_criterion-92c52943
id: AC-967
type: acceptance_criterion
title: The displayed site is one the store holds for the selected business, and changing
  business changes it
created_by: xgd
created_at: '2026-08-07T01:44:23.282193+00:00'
updated_at: '2026-11-01T10:48:26.517977+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Which site the pane displays is decided by the business selected in the shell's
chrome, not by a selector in any tab. The candidate sites are exactly the sites
the store holds for that business — neither a hardcoded list nor another
business's — read from the business-scoped site listing after each selection,
and identified by slug. Selecting a business displays that business's site in
the current mode.

When the business changes, a site the operator was already looking at is kept
if the newly selected business also holds a site with that slug; otherwise the
first site the business holds is displayed. Slugs are unique per business, not
globally, so the same slug under two businesses is two different sites and the
displayed document's address distinguishes them. A site listing that fails to
answer leaves the pane showing what it had rather than an empty pane.

## Verification

With known sets of sites stored under two businesses, mount the workspace and
assert the displayed site is one of the selected business's sites. Switch to the
second business and assert the displayed document's URL is the second business's
site rendering, carries that business, and the mode is unchanged. Repeat with a
slug both businesses share and assert the slug is kept while the document
address changes to the second business. Make the listing fail and assert the
pane still shows the previous site.
