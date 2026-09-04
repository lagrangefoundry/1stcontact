---
uid: acceptance_criterion-6f87920c
id: AC-959
type: acceptance_criterion
title: One panel per declared tab and no undeclared panel, the first declared tab
  opens, and the display panel is hosted inside it
created_by: xgd
created_at: '2026-08-07T01:43:46.576788+00:00'
updated_at: '2026-09-04T05:31:01.660992+00:00'
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

Opening the workspace presents exactly one panel per declared tab and no undeclared
panel beside them. Each tab is addressed by a stable identifier that never changes
when its visible name does; the site tab's is `site`. The first declared tab is the
one that opens, and it is the site tab — so the workspace comes up on the site, not
on whatever surface happens to have been added beside it. The display panel — the
pane showing the site — is hosted inside that tab's content area rather than beside
or outside the tab chrome.

## Verification

Mount the workspace and observe the chrome. Assert the number of mounted tab panels
equals the number of tabs the workspace declares — the count, not merely the presence
of one, since an undeclared panel appearing is the failure this guards, and reading
the count off the declaration rather than off a literal is what keeps that guard
binding as surfaces are added. Assert the site tab's stable id is `site`, that it is
the first declared tab, and that it is the tab the chrome opens on. Assert the display
panel element is a descendant of that tab's panel.