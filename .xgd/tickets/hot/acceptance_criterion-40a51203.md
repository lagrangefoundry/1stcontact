---
uid: acceptance_criterion-40a51203
id: AC-1064
type: acceptance_criterion
title: Changing the site changes the conversation with it, and the workspace offers
  exactly one place to choose a site
created_by: xgd
created_at: '2026-08-10T08:46:35.674292+00:00'
updated_at: '2026-08-10T08:46:35.674292+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

Choosing a different site in the workspace swaps the pane to that site's conversation
and replays its turns, in the same action that changes what the display panel shows.
The conversation displayed always corresponds to the site the display panel reports.
The pane presents no site control of its own: the workspace has exactly one place a
site is chosen. Returning to the first site shows that site's conversation again, with
no message from the other site present in either.

## Verification

With two sites in the store, each holding a distinguishable conversation, switch the
workspace from one to the other. Confirm the pane now shows the second site's turns and
none of the first's, and that the display panel reports the same site. Switch back and
confirm the first site's turns return, still unmixed. Confirm the only site-selection
control in the workspace is the toolbar's.
