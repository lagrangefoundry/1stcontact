---
uid: acceptance_criterion-35ba3df8
id: AC-2498
type: acceptance_criterion
title: 'Switching site, or following a link to another page, drops the carried state:
  no panel open and at the top'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:11:00.037959+00:00'
updated_at: '2026-11-09T00:11:00.037959+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Switching site, or following a link to another page, drops the carried state
([[REQ-215]] acceptance 11).

The carry answers "the same page in the same state" and nothing wider.

- **Changing site** (by a business switch or any other route that changes the
  displayed site) opens the new site's channel at its root, at the top, with no
  panel open. Another site's page is not this page in another state.
- **Following a link to another page**, including a link out of an open panel,
  arrives at that page with no panel over it and at the top. Re-opening the
  panel there would be the carry acting on a page it was never about.
- **A channel switch and the reload after a save** keep the path, and so keep
  the state. Those are the two cases it exists for.

## Verification

With a panel open and the page scrolled, choose a different site and assert the
pane shows that site's channel root, scrolled to the top, with no panel open.
Return to the first site and assert nothing from before is restored.

Separately, on a page with a panel open in View, follow a link inside the panel
to another page of the same site. Assert the arriving page has no panel open
and is at the top. Switch to Edit and assert Edit also shows that new page
with no panel open.
