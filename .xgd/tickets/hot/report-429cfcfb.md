---
uid: report-429cfcfb
id: REPORT-2893
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-31T09:40:49.885999+00:00'
updated_at: '2026-08-31T09:40:49.885999+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-182e8cb9
---

Only the new test file is untracked; no runtime code, no existing test, and no ticket was modified.

```
UATs generated for story story-182e8cb9 (plan item 1 of 11)

Story: story-182e8cb9
Test file(s) created:
  - tests/reconciliation-builder-private-access-gate.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-builder-private-access-gate.test.ts"
```

**AC → test mapping (1:1, all 10 ACs covered):**

| AC | Test | Boundary |
|---|---|---|
| AC-1375 | `test_UAT_AC1375_a_granted_identity_receives_the_response_of_the_surface_behind_the_gate` | `worker.fetch` — asserts 200 + the surface's `text/html` body, explicitly *not* the gate's plain-text refusal shape |
| AC-1376 | `test_UAT_AC1376_the_identity_is_accepted_from_the_header_the_cookie_or_a_service_identity` | header / cookie-among-others / `common_name` service identity all admitted; header precedence proved *at the boundary* (good header + bad cookie → 200; bad header + good cookie → 401) |
| AC-1377 | `test_UAT_AC1377_an_unverifiable_caller_is_refused_and_reaches_nothing_behind_the_gate` | all 8 refusal cases × 2 paths (store route + asset fall-through), each 401 with its own reason and zero tripwire hits |
| AC-1378 | `test_UAT_AC1378_an_incompletely_configured_gate_refuses_everything_naming_the_missing_setting` | 503 (asserted ≠ 401), names the missing setting(s), nothing consulted |
| AC-1379 | `test_UAT_AC1379_unobtainable_signing_keys_deny_rather_than_admit` | JWKS 500 *and* empty key set → 401 "signing keys could not be fetched" |
| AC-1380 | `test_UAT_AC1380_a_newly_published_signing_key_is_honoured_without_a_restart` | warm the cache, publish a new key, admit a token signed by it on the same running gate; asserts the key set was re-read |
| AC-1381 | `test_UAT_AC1381_refusals_are_neither_stored_by_an_intermediary_nor_indexed_by_a_crawler` | both refusal kinds carry `no-store` + `noindex` |
| AC-1382 | `test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front` | `wrangler.toml`: every `workers_dev` is `false`, exactly two declarations, route still declared |
| AC-1383 | `test_UAT_AC1383_the_gates_configuration_is_declared_for_every_environment_it_deploys_to` | both settings in top-level *and* `[env.production.vars]` via `readWranglerConfig` |
| AC-1384 | `test_UAT_AC1384_the_granted_identities_and_both_controls_are_recorded_in_the_repository` | `ACCESS.md` parsed as tables — settings with provenance, both controls with what each protects against, ≥1 identity each with a reason, service-identity secret handling, customer-login pointer, no credential |

**Two things worth flagging:**

1. **A missing build artifact blocked the suite, not just my file.** `apps/control-app/src/index` imports `router.ts` → `ai.ts` → `./generated/ai-workers.js`, which is gitignored and produced by `1c assets`. Before I ran `./bin/1c assets`, the *existing* `tests/test_UAT_FC_REQ-147_access_gate.test.ts` failed to import with `Cannot find module './generated/ai-workers.js'` — i.e. this is a pre-existing worktree-setup gap, not something my tests introduced. After the build both files pass (28 tests green alongside `naming.test.ts`).

2. **Bindings are tripwires, not stubs.** `DB`/`SITES` are getters that record being read (which *is* "the store was opened", since `storeFor` reads both eagerly) and `ASSETS` records the fall-through. AC-1377 and AC-1378 assert those records are empty on refusal — and the same test then drives an *admitted* caller down both paths and asserts the records are non-empty, so an empty record can't silently mean "the tripwire was never armed."

Per the story's Technical Context I did **not** write a UAT for the live-origin smoke assertions (owned by CAP-102) or for "an authenticated-but-ungranted identity is refused" — AC-1384 states that exclusion explicitly and my test asserts `ACCESS.md` records it, which is the only evidence this repository can hold for it.
