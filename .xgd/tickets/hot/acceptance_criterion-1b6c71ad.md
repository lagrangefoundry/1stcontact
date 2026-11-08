---
uid: acceptance_criterion-1b6c71ad
id: AC-2462
type: acceptance_criterion
title: Switching business shows the newly selected business's conversation even when
  both businesses' sites share a slug, and an unsent draft stays with the business
  it was typed under
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T14:16:52.009655+00:00'
updated_at: '2026-11-08T14:16:52.009655+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

A conversation belongs to a site within a business. With two businesses whose sites
share a slug, switching the workspace from one business to the other swaps the pane to
the newly selected business's conversation and replays its turns. No turn from the
business being left remains in the pane, even though the site's name is the same.

The composer's unsent draft stays with the business it was typed under: after the
switch, the new business's composer does not hold the text typed under the old one.

Changing site within a single business still swaps the conversation as before.

## Verification

Set up two businesses, each with a site of the same slug, and give each a
distinguishable conversation. With the first business selected, type a distinctive
message into the composer without sending it. Switch to the second business with the
workspace's business switcher. Confirm the pane shows the second business's turns and
none of the first's, and that the composer does not contain the text typed under the
first business. Then, within one business, switch between two sites and confirm the
pane still swaps to the chosen site's conversation.
