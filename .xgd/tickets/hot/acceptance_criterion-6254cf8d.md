---
uid: acceptance_criterion-6254cf8d
id: AC-2143
type: acceptance_criterion
title: The shell header carries the business switcher and the account avatar; no toolbar
  offers a site selector and every tab is business-scoped
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:02.972815+00:00'
updated_at: '2026-11-01T10:49:02.972815+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The shell's header carries the business switcher at its leading edge and the
account behind an avatar among its trailing controls. Both are outside every
tab panel, so the switcher is visible from every tab and applies to all of them;
no tab's toolbar offers a site selector, and the tab strip contains no account
tab — every tab in it is scoped to the selected business, with no exception.

The switcher lists the account's businesses by name. With several it is a live
choice; with exactly one it shows that business's name and no control, so the
common case does not look like an unmade choice; with none it renders nothing.
A business the account cannot currently operate is listed, marked with a short
"access ended" suffix, and cannot be chosen.

The avatar shows the initial of the signed-in person's name (or email when no
name is set) and opens the account surface, which states who is signed in and
which businesses that identity reaches — and offers no plan, billing, invoice or
add-a-business capability.

## Verification

Mount the workspace with several businesses and assert the switcher is inside
the shell's header and outside every tab panel, and that no render channel
declares a site-selector control. Assert no declared tab is the account, that
clicking the avatar opens the account surface, and that the surface lists the
session's identity and businesses only. Mount with one business and assert the
name is shown with no select control. Mount with one lapsed business among
several and assert it is listed, suffixed, and its option is disabled.
