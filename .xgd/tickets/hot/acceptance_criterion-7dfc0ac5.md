---
uid: acceptance_criterion-7dfc0ac5
id: AC-1068
type: acceptance_criterion
title: An assistant that cannot run right now is explained in the pane, with the site's
  history still shown
created_by: xgd
created_at: '2026-08-10T08:47:25.559727+00:00'
updated_at: '2026-08-16T04:42:09.896962+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When the conversation reports that a turn cannot be run — a missing prerequisite, for
instance — the pane still mounts, still shows every turn that conversation already
holds, and states the reason in the conversation itself, naming the specific thing that
is missing rather than a generic failure. The history is not cleared, hidden, or
replaced by the notice.

## Verification

Show a site whose conversation reports it is not ready, with a stated reason and at
least one earlier turn. Confirm the earlier turn is displayed, that a further message in
the pane carries the stated reason, and that the reason names the specific missing
prerequisite.