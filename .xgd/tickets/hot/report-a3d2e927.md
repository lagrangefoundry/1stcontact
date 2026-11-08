---
uid: report-a3d2e927
id: REPORT-11228
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T02:08:49.954145+00:00'
updated_at: '2026-11-08T02:08:49.954145+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-170
---

```
UATs generated for story STORY-170 (plan item 2 of 7)

Story: STORY-170
Test file(s) created:
  - tests/reconciliation-access-sim-edge.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconciliation-access-sim-edge.test.ts"
```

The 5 new tests passed in vitest (node config). The tests start a real `bin/access-sim` process in front of a stand-in builder that records every request. Tokens are checked with the product's own `verifyAccessJwt`.

- **AC-2317 (updated):** `--print-env` prints exactly three lines, including `SERVICE_TOKEN_IDENTITIES`. Defaults and the `--port`, `--aud`, `--client-id` and `--service-email` overrides are covered, and no listener is left running. A further check confirms the address falls back to the first `PLATFORM_ADMINS` entry, with `.dev.vars` read ahead of `wrangler.toml`. That check runs on a copy of the script in a temporary repo, so the real `.dev.vars` is never touched.
- **AC-2318 (updated):** a person token has the right email and a 30-day lifetime, and `/mint` without `email` answers 400. The exchanged service token has `common_name`, no `email`, and is reported as `service-token:<name>`.
- **AC-2361 (new):**
  - A matching pair is exchanged for an assertion, and both client headers are removed before forwarding.
  - Method, path, query string and body arrive unchanged; the builder's status, body and both `Set-Cookie` headers come back, and its redirects are not followed.
  - `--print-token` output is checked with its defaults and with overrides, and the default pair works.
  - A right pair with nobody to act as gets 403 naming both remedies.
  - A builder that does not answer gets 502 naming it.
- **AC-2362 (new):** a wrong pair gets 403 pointing at `--print-token`. Either half of a pair alone is treated as no credential (302 to `/login`), and so is no credential. A `CF_Authorization` cookie, with or without half a pair, is forwarded byte-for-byte with no assertion added. The simulator's four own paths never reach the builder.
- **AC-2363 (new):** logout answers 302 with `CF_Authorization=; Path=/; Max-Age=0`. It honours `returnTo` only on the builder's origin; an absent, foreign or non-URL value, or one pointing at the simulator itself, falls back to the builder. It is never forwarded.

⚠️ **One older test is now stale:** `test_UAT_AC2317_print_env_emits_exactly_the_two_access_settings` in `tests/reconciliation-dev-seed-access-sim.test.ts` fails. It still expects the old two-line `--print-env` output, while AC-2317 and the code now print three lines. The test is wrong, not the code. I was only allowed to create new files, so I left it alone. The downstream fix-it step should delete it or rewrite it to match the new one. Until then AC-2317 and AC-2318 each have two tests, one per file.

- **Lint not run:** I couldn't run eslint on the new file because that command was blocked in this session.
- **Bundle tests left in place:** the bundle's `test_UAT_FC_BUG-59_*` and `test_UAT_FC_REQ-204_access_sim_logout` tests cover the same behaviour. They are untouched, for the reconciliation orphan check to rename or delete.