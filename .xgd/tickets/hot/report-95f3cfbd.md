---
uid: report-95f3cfbd
id: REPORT-11600
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T22:42:42.505721+00:00'
updated_at: '2026-11-08T22:42:42.505721+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-7367338f
  batch_index: '0'
---

I ran the three tests in scope at HEAD and all three pass, so I made no edits.

- **Result:** `npx vitest run tests/reconciliation-assistant-looking-surface.test.ts -t "test_UAT_AC202[678]_"` reported 3 passed. The other 14 tests in the file were filtered out by the `-t` pattern.
- **The failing test, AC2026** (`tests/reconciliation-assistant-looking-surface.test.ts:455`), now passes. It checks the picture parameter on `screenshot.of`, `compare.a`, `compare.b` and `check_fidelity.actual`:
  - the nine keys are exactly `after`, `bundle`, `image`, `kind`, `original`, `page`, `revision`, `url`, `viewport`;
  - `kind` offers the six kinds `reference`, `draft`, `edit`, `revision`, `url`, `image`;
  - `viewport` offers `mobile`, `tablet`, `desktop`;
  - `after` is an array described as draft-only, `revision` is an integer, `required` is `['kind']`, and extra keys are disallowed;
  - no operation declares its own ref/source/size-style parameter;
  - an unknown key, an out-of-range `kind` and an out-of-range `viewport` are each refused before any browser is launched (`browser.launches()` is 0).

  That matches the AC as corrected for REQ-218, so the acceptance criterion and story need no change. Since the test passes, it should also clear the AC-2026 orphan entry.
- **AC2027 and AC2028** also pass.
- **Log noise:** the run printed `EPERM` errors from wrangler, which the sandbox blocked from writing its debug log under `~/Library/Preferences/.wrangler/logs`. That is a sandbox write restriction and doesn't affect the results.

```yaml
## Assessment
status: passing
tests:
  test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape: pass
  test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults: pass
  test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found: pass
edits: none
upstream_changes: none
```