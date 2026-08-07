---
uid: acceptance_criterion-6f87920c
id: AC-959
type: acceptance_criterion
title: Workspace opens as a single tab hosting the display panel, addressed by a stable
  id
created_by: xgd
created_at: '2026-08-07T01:43:46.576788+00:00'
updated_at: '2026-08-07T01:58:21.275679+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Opening the workspace presents exactly one tab. That tab is addressed by a
stable identifier (`site`) that never changes when its visible name does, and
the display panel — the pane showing the site — is hosted inside that tab's
content area rather than beside or outside the tab chrome.

## Verification

Mount the workspace and observe the chrome: exactly one tab is present, its
stable id is `site`, and the display panel element (the pane containing the
displayed document) is a descendant of that tab's panel. Assert on the count of
tabs, not merely on the presence of one.