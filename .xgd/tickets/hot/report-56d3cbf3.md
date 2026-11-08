---
uid: report-56d3cbf3
id: REPORT-11232
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T02:13:39.853862+00:00'
updated_at: '2026-11-08T02:13:39.853862+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-170
  parent_report_uid: report-c1b20b12
  batch_index: '0'
---

I fixed the failing AC2317 test; it passes now. Only the test changed; production code wasn't touched.

**Why it failed:** the test expected `bin/access-sim --print-env` to print two lines. Since BUG-59 the script prints three: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and a new `SERVICE_TOKEN_IDENTITIES="<client-id without .access>=<service email>"` line. AC-2317 already says "exactly three lines", so the test was the stale piece. The AC and the story didn't need changing.

**What I changed** in `tests/reconciliation-dev-seed-access-sim.test.ts`:
- **Renamed the test** to `test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping`, since "two settings" was no longer true. It keeps the `test_UAT_AC2317_` prefix. A test in `tests/reconciliation-access-sim-edge.test.ts` already uses this same name; vitest is fine with that because they're in different files.
- **Default run:** it now passes `--service-email` and checks the exact three-line output, including `local-dev=ops@example.test`.
- **Custom run:** it now passes `--port`, `--aud`, `--client-id bot.access` and `--service-email`. It checks all three values, including that `.access` is removed from the client id. It also still checks that no server is left running.
- **`baseEnv()`:** it now also removes `SIM_CLIENT_ID`, `SIM_CLIENT_SECRET` and `SIM_SERVICE_EMAIL`, so environment variables from the machine running the tests can't change the output. Passing `--service-email` does the same job for the `PLATFORM_ADMINS` setting in your checkout.

**Checks run:**
- This test passes (1 passed, 12 skipped by the name filter).
- The other AC2317 test, in `tests/reconciliation-access-sim-edge.test.ts`, also still passes.
- I couldn't run lint: the project doesn't have eslint installed and the sandbox blocks fetching it from the npm registry.

```yaml
## Assessment
status: fixed
failures:
  - test: test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings
    renamed_to: test_UAT_AC2317_print_env_emits_exactly_the_access_settings_and_the_identity_mapping
    cause: "Test expected the two-line --print-env output; bin/access-sim prints a third SERVICE_TOKEN_IDENTITIES line (BUG-59), which AC-2317 already specifies"
    fix: "Asserted the exact three-line output for the default and custom runs (--port/--aud/--client-id/--service-email); passed --service-email and removed SIM_CLIENT_ID/SIM_CLIENT_SECRET/SIM_SERVICE_EMAIL in baseEnv so the output doesn't depend on the machine"
    upstream_changes: none (AC-2317 and story-5b5be809 already correct)
    verified: "vitest -t AC2317: 1 passed; the AC2317 test in tests/reconciliation-access-sim-edge.test.ts also passes"
    not_run: "lint: eslint not installed; sandbox blocks registry.npmjs.org"
```