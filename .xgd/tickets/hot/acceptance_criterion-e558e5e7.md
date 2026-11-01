---
uid: acceptance_criterion-e558e5e7
id: AC-2177
type: acceptance_criterion
title: The people tab is labelled Contacts and its list is headed Contacts, while
  its persisted identity stays people
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:30.657220+00:00'
updated_at: '2026-11-01T19:00:30.657220+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
The builder's tab strip shows a tab whose visible label is exactly **Contacts**. When opened, it shows a list whose heading is exactly **Contacts**. The words "Users", "People" and "Admin" appear as neither the tab label nor the list heading. The tab's stable identifier stays `people`, so an operator's saved split position and selected row for this tab survive across reloads.

## Verification
Load the builder. Assert the tab label text is "Contacts". Mount the tab and assert the list heading text is "Contacts". Assert the tab identifier is `people`. Select a row, reload, and assert the persisted selection is restored under that identifier.
