---
uid: acceptance_criterion-48840336
id: AC-2493
type: acceptance_criterion
title: Applying a state to a draft document activates the page's own openers and Close
  controls, so focus, scroll lock and aria-expanded are true afterwards
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:48:26.447675+00:00'
updated_at: '2026-11-08T23:48:26.447675+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Applying a state to a draft document *drives* the page's own controls, the way a visitor would. The scroll offset is applied first, then for each panel whose open/shut state differs from the one wanted:
- **To open:** a named panel that is shut is opened by activating the page's own control that opens it.
- **To close:** a panel that is open but not named is closed by activating its own Close control. If it has none, the page clicks its scrim. A panel that has opted out of scrim dismissal declines that click exactly as it declines a reader's, and stays open.

Because the page's script performs every transition, afterwards:
- focus is inside the most recently opened panel;
- the page's scroll lock is on while any panel is open;
- each opener's `aria-expanded` matches its panel.

A panel that is already in the wanted state is left alone. A named panel with no opener on the page is not forced open, because a reader could not have opened it either. Controls are matched by comparing their target attribute to the id, never by building a selector from the id.

## Verification
In a DOM environment with the dialog script running, load a draft render with a panel that has a Close and a panel that has none. Apply a state naming the first panel and assert that it is open, focus is inside it, the scroll lock is on, and its opener reports `aria-expanded="true"`. Apply the empty state and assert that the panel is shut, the lock is lifted, focus is back on the opener, and `aria-expanded="false"`. Repeat with the Close-less panel and assert it closes through the scrim. With `dismissOnBackdrop: false`, assert that it stays open.
