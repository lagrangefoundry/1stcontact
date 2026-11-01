---
uid: report-770cb704
id: REPORT-7810
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T19:11:54.770422+00:00'
updated_at: '2026-11-01T19:11:54.770422+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-0034d937
---

I wrote 12 UATs for story-0034d937, but **none of them have been run**. Bash is denied in this session, so I couldn't run vitest, eslint or tsc. One test, AC2177, is very likely to fail because the code doesn't do what that AC asks.

```
UATs generated for story story-0034d937 (plan item 3 of 8)

Story: story-0034d937
Test file(s) created:
  - tests/test_reconciliation_contacts_tab.test.ts          (jsdom: panel, plus the full builder where needed)
  - tests/test_reconciliation_contacts_tab.workers.test.ts  (workerd: worker fetch + real D1 + real Access JWT)

Tests written: 12
Tests passed: unknown (not run; Bash denied in this session)
Tests failed: unknown (not run); AC2177 expected to fail

test_files_created:
  - "tests/test_reconciliation_contacts_tab.test.ts"
  - "tests/test_reconciliation_contacts_tab.workers.test.ts"
```

**AC → test:**

| AC | Test | File |
|---|---|---|
| AC-2177 | `test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people` | jsdom |
| AC-2178 | `test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first` | workers |
| AC-2179 | `test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet` | jsdom |
| AC-2180 | `test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business` | jsdom |
| AC-2181 | `test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist` | workers |
| AC-2182 | `test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections` | jsdom |
| AC-2183 | `test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps` | jsdom |
| AC-2184 | `test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell` | jsdom |
| AC-2185 | `test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id` | workers |
| AC-2185 | `test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business` | jsdom |
| AC-2186 | `test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics` | jsdom |
| AC-2187 | `test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value` | jsdom |

AC-2185 has two tests, which breaks the one-test-per-AC rule. Its first half needs D1, which only exists in workerd; its second half needs a DOM, which only exists in jsdom. Both names pass the `test_UAT_AC\d+_\w+` pattern.

**⚠️ Expected failure: AC2177, the code doesn't match the AC.** The AC says the selected row survives a reload under the `people` id. The code doesn't do this:
- `webui-list-detail` keeps the selection in memory only.
- In `no-tab` mode it writes no selection to storage.
- `people.js` doesn't persist it either.

The test asserts what the AC says (select a row, remount the builder with the same storage, expect the row still selected), so it should fail on that last assertion. I haven't weakened it. The label, heading and `people` id assertions earlier in the same test should pass.

**Other risks, since nothing was run:**
- **The jsdom suites skip if the shared `webui-*` components aren't installed.** One of my file searches suggested they may be missing from this worktree. If so, those tests report as skipped, not passed.
- **AC2186 may fail because of jsdom, not the code.** It relies on jsdom's style engine. If jsdom drops `border-bottom: 1px solid var(--shell-border)` or the `var(...)` colour values, the test fails falsely. I already read `gap` from the CSS rule text, because jsdom doesn't model it.
- **AC2178 and AC2185 make timing and data assumptions:**
  - AC2178 puts a 5 ms wait between seeds so `created_at` values don't tie.
  - AC2185 deletes a `tenants` row to make a dangling grant. No foreign key covers `entitlements`, so this should be safe.

No runtime code or existing tests were changed. To check the work, run `npx vitest run tests/test_reconciliation_contacts_tab.test.ts` and the workers config on `tests/test_reconciliation_contacts_tab.workers.test.ts`.
