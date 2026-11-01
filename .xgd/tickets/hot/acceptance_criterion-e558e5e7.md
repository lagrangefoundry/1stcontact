---
uid: acceptance_criterion-e558e5e7
id: AC-2177
type: acceptance_criterion
title: The people tab is labelled Contacts and its list is headed Contacts, while
  its persisted identity stays people
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:30.657220+00:00'
updated_at: '2026-11-01T19:18:29.123747+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
The builder's tab strip shows a tab whose visible label is exactly **Contacts**. When opened, it shows a list whose heading is exactly **Contacts**. The words "Users", "People" and "Admin" appear as neither the tab label nor the list heading. The tab's stable identifier stays `people`. The builder mounts the panel against that identifier, and the tab's persisted state is namespaced by it: selecting a contact records the selection under the `people:list` storage key, never under a key named for the visible label. That record is still intact under the same key after a reload.

(Reconciliation note, 2026-11-01: the code records the selection but does not re-select the row when the panel remounts after a reload. The list-detail component reapplies persisted selection only in tab mode, and the Contacts panel uses no-tab mode. This AC therefore claims the namespacing, which is what the story states, and not restoration.)

## Verification
Load the builder. Assert the tab label text is "Contacts". Mount the tab and assert the list heading text is "Contacts". Assert the tab identifier is `people` and the panel mounts under `getPanel('people')`. Select a row and assert storage holds exactly one selection record, keyed `…:people:list:tabs`, naming that contact, and that no storage key mentions "contacts". Reload and assert the panel mounts under `people` again and the same record is still present, unchanged.
