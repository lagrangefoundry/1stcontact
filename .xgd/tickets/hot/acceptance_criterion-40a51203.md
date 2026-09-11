---
uid: acceptance_criterion-40a51203
id: AC-1064
type: acceptance_criterion
title: Changing the site changes the conversation with it, and exactly one control
  in the workspace offers a site
created_by: xgd
created_at: '2026-08-10T08:46:35.674292+00:00'
updated_at: '2026-09-10T22:44:50.034328+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Choosing a different site in the workspace swaps the pane to that site's conversation
and replays its turns, in the same action that changes what the display panel shows.
The conversation displayed always corresponds to the site the display panel reports.
Returning to the first site shows that site's conversation again, with no message from
the other site present in either.

The pane presents no site control of its own, and across the whole workspace **exactly
one control offers a site to choose** — the toolbar's. The claim is about what a
control offers, not about how many dropdowns the workspace happens to contain: the
chrome may carry other dropdowns for unrelated purposes, such as narrowing a list, and
those are not site controls. What must hold is that no second control anywhere can
change the site out from under the conversation.

## Verification

With two sites in the store, each holding a distinguishable conversation, switch the
workspace from one to the other. Confirm the pane now shows the second site's turns and
none of the first's, and that the display panel reports the same site. Switch back and
confirm the first site's turns return, still unmixed.

Then examine every dropdown the mounted workspace contains and keep those that offer
one of the store's sites as a choice. Exactly one survives, it is the toolbar's site
selector, and the assistant pane contains no dropdown at all and exposes no
site-reading or site-setting surface of its own. Filter dropdowns elsewhere in the
chrome, offering roles or kinds rather than sites, must not make this criterion fail —
and a second control that did offer a site must.
