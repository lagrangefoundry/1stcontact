---
uid: report-931eefbc
id: REPORT-11480
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T14:47:55.819772+00:00'
updated_at: '2026-11-08T14:47:55.819772+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-99
  parent_report_uid: report-e9e26bdb
  batch_index: '0'
---

Nine of the ten failures are fixed and pass. The tenth, the typography test for AC2232, can't be fixed without changing frozen CSS, so I'm reporting it as blocked.

All nine were stale tests: the code had moved on and the tests still described the old shapes.

| Test | What changed in the code | Test fix |
|---|---|---|
| AC1402 | `site_assets` is keyed by `site_id` (baseline schema) | The test now finds the asset row by joining through `sites` instead of querying `tenant_id`/`slug` columns that no longer exist. |
| AC2144 | `provisionBusiness` takes `accountId`; the payload's signed-in half is `person` (REQ-194) | The test uses the account id from the invited user, asserts `person` and that no `account` field exists, and asserts `person` is null on the dev-open path. I also updated the text of AC-2144 to say `person`. |
| AC960 | Two other stories' tests wrote the `@lagrangefoundry` scope literally | `test_UAT_FC_BUG-42_markdown_rendering` and `reconciliation-library-role-correction` now build the import from `WEBUI_SCOPE`; a comment in the REQ-199 test is reworded. Both edited suites still pass and aren't skipped. |
| AC2143, AC2146 | The builder option `account` was renamed `person` | Mounts pass `person: PERSON`. |
| AC2230 | Invite now opens a mail composer, and only over a selection | The dialog holding half-typed text is now "Add a contact" (`.builder-people__add`), typing into its email box. Also: `person` rename, and fixture names use `name: { displayName }` (REQ-193). |
| AC2231 | Same rename | Expected payload is `{ person: null, businesses: [] }`. |
| AC2232 (sizing file) | Contacts has three dialogs now | Covers Add ("Add"), the Invite composer opened after ticking a contact ("Send 1"), and Provision. The fake people transport gained `add` and `inviteDraft`. Six dialog buttons are checked. |
| AC977 | New route `/api/material/changes` | Added a probe for its refusal (`?since=not-a-cursor`), which is answered before any store is opened. |

Results: all 44 tests in the touched node files pass except AC2232 (typography) and AC965. All 18 in the touched workers files pass. AC965 isn't in this batch: it times out because wrangler tries to reach `api.cloudflare.com` and the sandbox blocks it. My only change in that file was adding the AC977 probe.

**The blocked test (AC2232, typography).** The code doesn't do what AC-2232 requires. The AC says every Contacts dialog input takes its size from `--builder-control-font-size`, and that no control writes the size as a literal. In `apps/control-app/src/builder/builder.css` (lines 2041–2053), the rule for the composer's Subject, To-List and Body fields ends with `font: inherit; font-size: 13px;`. The add-contact input next to them correctly uses `var(--builder-control-font-size)` (line 1951). Changing the test or the AC would hide exactly the defect the AC exists to catch, so the fix belongs in the CSS, which is frozen in this pass.

```yaml
## Assessment
status: partial
fixed:
  - test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store
  - test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call
  - test_UAT_AC960_component_scope_is_written_in_exactly_one_place
  - test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped
  - test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list
  - test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session
  - test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended
  - test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last
  - test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable
upstream_changes:
  - AC-2144: signed-in half reported as `person` (REQ-194), no `account` field; person null on dev-open path
blocked_by:
  rule: code_frozen
  evidence: "test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry fails with 'sized, but not by the control token: builder-people__subject/tolist/body → 13px'. apps/control-app/src/builder/builder.css:2041-2053 declares `.builder-people__subject, .builder-people__tolist, .builder-people__body { … font: inherit; font-size: 13px; }`, a literal, while AC-2232 requires every Contacts dialog input to take the single --builder-control-font-size token and forbids restating the size as a literal. The sibling .builder-people__add-email rule (line 1951) correctly uses var(--builder-control-font-size)."
  proposed_change: "apps/control-app/src/builder/builder.css line 2053: replace `font-size: 13px;` with `font-size: var(--builder-control-font-size);` in the `.builder-people__subject, .builder-people__tolist, .builder-people__body` rule. No test or AC change needed."
```