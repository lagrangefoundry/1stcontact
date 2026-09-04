---
uid: acceptance_criterion-40a51203
id: AC-1064
type: acceptance_criterion
title: Changing the site changes the conversation with it, and the workspace offers
  exactly one place to choose a site
created_by: xgd
created_at: '2026-08-10T08:46:35.674292+00:00'
updated_at: '2026-09-04T05:30:51.927439+00:00'
completed_at: null
last_field_updated: body
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
Exactly one control in the whole workspace offers the store's sites to choose from —
however many other dropdowns the workspace has for other purposes, none of them offers
a site — and that control is the toolbar's. The pane presents no site control of its
own and exposes no way to set or read a site. Returning to the first site shows that
site's conversation again, with no message from the other site present in either.

## Verification

With two sites in the store, each holding a distinguishable conversation, switch the
workspace from one to the other. Confirm the pane now shows the second site's turns and
none of the first's, and that the display panel reports the same site. Switch back and
confirm the first site's turns return, still unmixed in both directions. Then confirm
the workspace offers exactly one site-selection control, scoped to the whole workspace
rather than to the split, since the toolbar is the split's sibling and a narrower scope
would pass while a second selector sat beside the one it found. Establish it by what
each control **offers** rather than by counting dropdowns: examine every dropdown in
the workspace, keep those offering any of the store's site slugs as an option, and
assert there is exactly one and that it is the toolbar's. A count of all dropdowns is
not the criterion — other surfaces in the workspace carry dropdowns for their own
filters, and a second *site* selector is what must fail. Additionally confirm the
assistant pane holds no dropdown at all and offers no operation to set or read a site,
so the guarantee does not rest on a chrome query alone.
