---
uid: report-8ca84ea7
id: REPORT-7814
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T19:18:49.609030+00:00'
updated_at: '2026-11-01T19:18:49.609030+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-0034d937
  parent_report_uid: report-50ca6239
  batch_index: '0'
---

I fixed the failing test `test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people` and narrowed AC-2177 to match what the code does. All 9 tests in `tests/test_reconciliation_contacts_tab.test.ts` now pass. I didn't touch any production code.

**Why it failed:** the test expected the selected contact to be re-selected after a reload, and the code doesn't do that. To find out what the code does, I temporarily added logging to the test and removed it afterwards. Selecting a contact saves the selection under the key `1c-builder:people:list:tabs`, as `{"open":["usr_named"],"active":"usr_named"}`. On reload that saved record is never read back, so no row is selected. The panel uses the shared list-detail component in `no-tab` mode, and that component only re-applies saved selection in `tab` mode. Its source is in the main checkout's `node_modules`, outside this worktree: I could see the restore branch is gated on `mode === 'tab'`, but my permissions were cut off before I could read the code that does the restoring. The story itself only claims that the `people` id namespaces the saved selection, not that it is restored, so the code matches the story.

**What the test now checks:**
- The tab label is "Contacts", the list heading is "Contacts", and "Users", "People" and "Admin" appear in neither.
- The tab id is `people`, and the panel mounts under it before and after a reload.
- `STORAGE_KEYS.people` is `people:list`.
- Selecting a contact writes exactly one record, under a key ending `:people:list:tabs`, naming that contact.
- No storage key mentions "contacts".
- After a reload the same record is still there, unchanged.

The test fails if the id is renamed, the selection stops being saved, or the storage keys move to the visible label.

**AC-2177 change:** it now claims the namespacing and that the saved record survives a reload, not that the selection is restored. It includes a reconciliation note explaining the `no-tab` limitation. The story needed no change.

**Not checked:** lint didn't run. `npx eslint` tried to download eslint and the sandbox blocked the registry.

If you want a reload to re-select the contact, that's a change to production code for a later ticket.

```yaml
## Assessment
blocked_by: null
```
