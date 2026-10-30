---
uid: report-9462cde7
id: REPORT-6898
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-30T19:40:45.853412+00:00'
updated_at: '2026-10-30T19:40:45.853412+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-00553335
  parent_report_uid: report-64b75e11
  batch_index: '0'
---

AC-2064 and AC-2065 now each have UATs that test them, and all three tests in `tests/req177-discontinue-raw-server.test.ts` pass. I didn't run lint: permission for the eslint command was denied.

The two criteria were orphaned because the REQ-177 tests still carried their temporary free-coding names (`test_UAT_FC_REQ-177_*`), so nothing linked them to the new criteria. I renamed them in place:

| Was | Now |
|---|---|
| `test_UAT_FC_REQ-177_serve_is_no_longer_a_command` | `test_UAT_AC2064_serve_is_refused_as_an_unknown_command` |
| `test_UAT_FC_REQ-177_help_advertises_no_raw_server` | `test_UAT_AC2064_help_offers_only_the_worker_based_builder` |
| `test_UAT_FC_REQ-177_capture_fixture_still_binds_a_loopback_origin` | `test_UAT_AC2065_capture_fixture_serves_rendered_bytes_over_a_loopback_origin` |

I also made the first test stricter. AC-2064 says `Unknown command: serve` is followed by the CLI's usage text, but the test only checked the refusal line and the exit code of 1. It now also checks that the full usage text printed by `1c help` appears after the refusal in stderr. That is what the code does (`tools/generate/src/cli/index.ts:1427`), so it passes, and it would fail if the usage text were dropped. The third test already did what AC-2065 asks: a real HTTP request to the running preview server returns a 200 with the page's bytes.

- **Production code:** not changed.
- **Criteria and story:** they already describe what the code does, so I didn't change either.
- **Skip markers:** none added.

```yaml
## Assessment
status: fixed
failures:
  - id: "AC-2064 (orphaned acceptance criterion)"
    resolution: "Renamed two REQ-177 FC UATs to test_UAT_AC2064_*; strengthened the refusal test to assert the usage text follows 'Unknown command: serve' in stderr."
  - id: "AC-2065 (orphaned acceptance criterion)"
    resolution: "Renamed the capture-fixture UAT to test_UAT_AC2065_*; it already drives startServe over real HTTP and asserts a 200 with the rendered bytes."
files_changed:
  - tests/req177-discontinue-raw-server.test.ts
ac_or_story_updates: none
verification: "npx vitest run tests/req177-discontinue-raw-server.test.ts -> 3 passed"
not_run: "eslint on the changed file (Bash permission denied)"
```
