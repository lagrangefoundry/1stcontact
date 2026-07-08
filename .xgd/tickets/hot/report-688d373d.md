---
uid: report-688d373d
id: REPORT-274
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-08T19:09:23.940178+00:00'
updated_at: '2026-07-08T19:09:23.940178+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-0ceaf24d
---

All 9 UATs pass. Test names conform to the `^test_UAT_AC\d+_\w+$` regex, one per AC.

```
UATs generated for story story-0ceaf24d (plan item 1 of 4)

Story: story-0ceaf24d
Test file(s) created:
  - tests/reconciliation-platform-scaffold.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-platform-scaffold.test.ts"
```

**AC → UAT mapping** (all passing against existing scaffold code):

| AC | Test | Boundary asserted |
|----|------|-------------------|
| AC-416 | `test_UAT_AC416_public_site_serves_apex_placeholder` | Boots public-site via `unstable_dev`, `GET /` → 200, `text/plain`, body `Hello from 1stcontact.io` |
| AC-417 | `test_UAT_AC417_control_app_serves_builder_placeholder` | Boots control-app, `GET /` → 200, `text/plain`, body `Hello from app.1stcontact.io` |
| AC-418 | `test_UAT_AC418_public_site_claims_apex_and_wildcard_routes` | Parses `public-site/wrangler.toml`: `1stcontact.io/*` + `*.1stcontact.io/*` on zone `1stcontact.io` |
| AC-419 | `test_UAT_AC419_control_app_claims_reserved_app_route` | `app.1stcontact.io/*` present; strictly more specific (literal host, no `*`) than the public-site wildcard |
| AC-420 | `test_UAT_AC420_deploy_pipeline_ships_both_workers` | `deploy.yml`: push→`xgd-stable`, concurrency group with `cancel-in-progress: false`, both CF secrets in job env, prod deploy of both Workers |
| AC-421 | `test_UAT_AC421_ci_pipeline_validates_pull_requests` | `ci.yml`: `pull_request` trigger, `pnpm -r build`, `pnpm test`, both dry-run deploys |
| AC-422 | `test_UAT_AC422_version_bump_advances_root_manifest` | Runs tool in isolated temp root: patch/`--minor`/`--major` rewrite `package.json` version correctly |
| AC-423 | `test_UAT_AC423_version_bump_check_and_list_paths` | Temp git repo: `--check` exit 0 for the introducing commit, non-zero otherwise; `--list-paths` prints `package.json` |
| AC-424 | `test_UAT_AC424_identifiers_normalized_to_1stcontact` | Worker names `1stcontact-`-prefixed, `sites/1stcontact/` exists, no `first-contact` identifier |

No runtime code changed; no existing tests modified. The version-bump UATs stage isolated copies of the tool under `mkdtemp` roots (relying on the tool's `parents[2]` repo-root resolution) so the real `package.json` is never touched.
