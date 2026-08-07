---
uid: acceptance_criterion-92c52943
id: AC-967
type: acceptance_criterion
title: The site selector lists exactly the sites the store holds, and choosing one
  changes the displayed site
created_by: xgd
created_at: '2026-08-07T01:44:23.282193+00:00'
updated_at: '2026-08-07T21:25:38.679656+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The site selector's options are exactly the sites present in the site store —
neither a hardcoded list nor a subset — and each option is identified by that
site's slug. Choosing a different option changes the document the pane displays
to that site's rendering in the current mode.

## Verification

With a known set of sites in the store, mount the workspace and assert the
selector's option values equal that set. Choose a second site and assert the
displayed document's URL changes to the newly chosen site while the mode is
unchanged, and that the pane is displaying that site's rendered page.