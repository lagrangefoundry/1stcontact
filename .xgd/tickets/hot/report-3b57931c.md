---
uid: report-3b57931c
id: REPORT-12060
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T23:25:11.524368+00:00'
updated_at: '2026-11-09T23:25:11.524368+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-a0b20525
---

I wrote 10 UATs for story story-a0b20525 (plan item 4 of 8), one per acceptance criterion, and all 10 pass. I didn't run lint or a type-check on the new files: eslint isn't installed locally and the sandbox blocks fetching it from npm, and the repo has no root `tsconfig.json`. Vitest compiled and ran both files without errors.

```
UATs generated for story story-a0b20525 (plan item 4 of 8)

Story: story-a0b20525
Test file(s) created:
  - tests/test_reconciliation_library_catalogue.workers.test.ts
  - tests/test_reconciliation_library_catalogue_grant.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_library_catalogue.workers.test.ts"
  - "tests/test_reconciliation_library_catalogue_grant.test.ts"
```

**How the tests drive the code.** The workers file covers AC-2576 to AC-2584. Each test goes through the control app's real route table against real D1 and R2:
- Files are added with `POST /api/material`, the same route a client upload uses.
- A conversation is opened with `POST /api/ai/session`.
- The model calls `list_library`, `get_library_item`, `place_on_site` and `screenshot` during a `POST /api/ai/prompt` turn.

The tests check the tool result the hosted session handed back to the model. For placement they also read back what the site store and the material records hold afterwards. Three things are replaced with test doubles:
- the Anthropic client;
- the image and text describers;
- the browser, only for AC-2581.

**Two places where the test does not go through the route:**
- **AC-2584, "no site store" half.** The hosted app always has a site store, so this part builds the catalogue directly with no site store, the same way the route builds it.
- **AC-2585, the grouping AC.** This is a node test because the local `1c` CLI half needs the CLI's own setup, which can't run in the Workers test environment.
  - The CLI half runs a real consultant turn with that setup and checks that no library tools are offered and `list_assets` still is.
  - The hosted half runs the same host with a stand-in catalogue. The real hosted route offering the three tools is checked in the AC-2576 test instead.

No runtime code, existing tests or tickets were changed, and nothing was committed.