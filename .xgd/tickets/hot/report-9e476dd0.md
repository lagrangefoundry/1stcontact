---
uid: report-9e476dd0
id: REPORT-11219
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T01:46:18.706153+00:00'
updated_at: '2026-11-08T01:46:18.706153+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-120
---

UATs generated for story STORY-120 (plan item 1 of 7)

All three new criteria for story STORY-120 now have a UAT, and all three pass against the existing code. No runtime code or existing test files were changed.

Story: STORY-120
Test file(s) created:
  - `tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts`

Tests written: 3
Tests passed: 3
Tests failed: 0

Each test runs a real signed token through the Worker's own `fetch`, against real D1. Only the gateway's signing-key endpoint is stubbed. Refusals send the same message for every reason, so each test reads the reason from the line the app logs when it refuses admission.

- **`test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person`**
  - A mapped token gets exactly the same `/api/businesses` response as the person signing in with their own address, and that person's last-seen time is recorded.
  - Upper-case or padded mapping entries resolve to the same person.
  - A lapsed grant and unaccepted terms produce the same result for the token as for the person.
  - Clearing the mapping refuses the token as having no email.
  - Mapping to an address nobody holds is refused as an unknown person, and no user or address row is created.
- **`test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected`**
  - A token missing from a non-empty mapping, an empty mapping, or no mapping at all is refused as having no email.
  - A person's own email always wins over a mapping that names someone else. If that person has no account, they are refused under their own address rather than admitted as the mapped person.
- **`test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request`**
  - It reads the committed `wrangler.toml`: the setting is declared empty by default, declared in every named environment, and each production entry is a `name=address` pair.
  - Naming a mapped token or a person's address in headers, the query string, a cookie or a JSON body does not change who the token acts as; an unmapped token is still refused as having no email.

Two things about the run:
- The first run failed because a gitignored build file (`apps/control-app/src/generated/ticketing.ts`) was missing from this worktree. Running `./bin/1c assets` regenerated it, after which both the new file and the existing BUG-59 FC suite passed (10/10).
- I couldn't run lint: eslint isn't installed locally and the sandbox blocked downloading it from the npm registry. Lint for this file is unchecked.

test_files_created:
  - "tests/test_reconciliation_access_gate_service_token_identity.workers.test.ts"