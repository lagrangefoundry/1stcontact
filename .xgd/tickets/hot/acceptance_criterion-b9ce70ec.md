---
uid: acceptance_criterion-b9ce70ec
id: AC-2146
type: acceptance_criterion
title: With no selectable business the switcher is disabled with every business marked,
  tabs and panels are inert, the account stays reachable, a banner names the state,
  and no site list is requested
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:07.524667+00:00'
updated_at: '2026-11-01T10:49:07.524667+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

When the account holds businesses but none of them is selectable (every grant
has lapsed), the workspace still loads as a signed-in session:

- the switcher renders, lists every business with its lapse marking, shows the
  first business's name rather than a blank, and is itself disabled;
- no business is in scope, so no request carries a business, and no site list is
  requested from the origin at all — the pane is given the empty list;
- the tab strip and the tab panels are inert, while the shell's header is not:
  the switcher, the avatar and the shell's own controls stay usable, and the
  avatar still opens the account surface;
- a single banner, announced as an alert, sits in the content area above the
  panels and outside the inert region, naming the state and pointing at the
  account — so its text can be selected and copied.

If the deployment is also unconfigured, that wider block applies instead and no
second banner is added.

## Verification

Mount with only lapsed businesses and assert the switcher is present, lists all
of them marked, and is disabled; that no business is in scope; that the tab
strip and panels carry the inert state while the header does not; that the
avatar is outside every inert region and opens the account surface; and that the
banner is an alert in the content area, outside the inert region, with the
expected message. Record the origin requests and assert none is a site listing
— then mount with a selectable business and assert the same default does request
one, so the assertion is about scope and not a path that never runs.
