---
uid: acceptance_criterion-6f87920c
id: AC-959
type: acceptance_criterion
title: Workspace renders one panel per declared tab, opens the first, and addresses
  tabs by stable id
created_by: xgd
created_at: '2026-08-07T01:43:46.576788+00:00'
updated_at: '2026-09-10T11:07:04.009315+00:00'
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

Opening the workspace presents exactly one panel per declared tab, and no panel
that no tab declared. The count is stated against the declaration rather than
against a fixed number: an undeclared panel appearing is the failure this guards,
and a declaration that grows must not need this criterion rewritten.

Each tab is addressed by a stable identifier that never changes when its visible
name does; the tab hosting the display panel is addressed `site`. The **first**
declared tab is the one the workspace opens on — the active tab after mounting is
the first entry of the declaration, not merely whichever tab happens to be
present.

The display panel — the pane showing the site — is hosted inside that tab's
content area rather than beside or outside the tab chrome.

## Verification

Mount the workspace and observe the chrome: the number of mounted panels equals
the number of declared tabs, so a panel with no declaration behind it fails.
Assert the site tab's stable id is `site`, that it is the first entry of the
declaration, and that the workspace's active tab after mounting is that first
tab's id. Assert the display panel element is a descendant of that tab's panel.
Assert on counts derived from the declaration, never on a literal one.
