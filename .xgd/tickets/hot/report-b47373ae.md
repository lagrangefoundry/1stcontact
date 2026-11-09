---
uid: report-b47373ae
id: REPORT-11974
type: report
title: 'Report: fix_plan for story-6ccaedd5'
created_by: xgd
created_at: '2026-11-09T18:00:05.602785+00:00'
updated_at: '2026-11-09T18:00:05.602785+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-6ccaedd5
  fix_iteration: 1
  items:
  - index: 0
    tests:
    - test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description
    - test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one
    - test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search
    - test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there
    - test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document
    - test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request
    - test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind
    - test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once
    - test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest
    - test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so
    - test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value
    - test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly
    - test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated
    - test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest
    - test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing
    dependency_tests:
    - test_UAT_AC2534_
    - test_UAT_AC2535_
    - test_UAT_AC2536_
    hypothesis: Three story-6ccaedd5 test files call route(req, env, deps), ticketStoreFor(env)
      and projectKnowledgeFor(env, opts) in their pre-Scope shapes, so deps/opts land
      in the scope slot (undefined businessId, and deps defaulting to {} so the REQ-173
      no-describer refusal returns 503).
    instructions: 'The evidence is broken at the call harness, not in production.
      route, ticketStoreFor and projectKnowledgeFor now take an explicit Scope ({
      businessId }) as their argument after env (router.ts:1372, tickets.ts:698, knowledge.ts:659);
      TENANT_ID on the env no longer chooses the tenant. In tests/reconciliation-material-ingestion.workers.test.ts,
      tests/reconciliation-material-content-type-resolution.workers.test.ts and tests/reconciliation-material-text-comment.workers.test.ts,
      pass each test tenant as a Scope at every call to these three functions, following
      the pattern already passing in tests/reconciliation-ingestion-heic-door.workers.test.ts
      (scopeOf = () => ({ businessId: TENANT }); route(req, env, scopeOf(), deps);
      ticketStoreFor(env, scopeOf())). Keep the per-tenant distinction where tests
      use two accounts (AC-1680 OTHER_TENANT, text-comment tenants). The AC-2098 no-key
      test must still omit the describer seams, so its 503 is the REQ-173 refusal
      and not the harness. Change no assertion and no production file. All 15 tests
      should then pass on real code, which also clears the 11 orphan-AC entries.'
    test_scope: test_UAT_AC1678_ or test_UAT_AC1679_ or test_UAT_AC1680_ or test_UAT_AC1681_
      or test_UAT_AC1682_ or test_UAT_AC1683_ or test_UAT_AC1684_ or test_UAT_AC1685_
      or test_UAT_AC1686_ or test_UAT_AC1687_ or test_UAT_AC1809_ or test_UAT_AC1810_
      or test_UAT_AC2095_ or test_UAT_AC2096_ or test_UAT_AC2098_ or test_UAT_AC2534_
      or test_UAT_AC2535_ or test_UAT_AC2536_
    ladder:
      rung1: The later scoped-read intent (REQ-168, explicit Scope) supersedes the
        env-TENANT_ID call shape these tests were written against.
      rung2: 'Decided here: at reconcile-src-BUNDLE-43, route (router.ts:3605), ticketStoreFor
        (tickets.ts:1095) and projectKnowledgeFor (knowledge.ts:966) all take an explicit
        Scope.'
      rung3: Every assertion stands unchanged; only the test call harness is updated.
  - index: 1
    tests:
    - test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production
    dependency_tests:
    - test_UAT_FC_REQ-219_the_images_binding_is_declared_on_both_sides
    - test_UAT_AC1489_
    - test_UAT_AC1490_
    - test_UAT_AC2534_
    - test_UAT_AC2535_
    - test_UAT_AC2536_
    hypothesis: apps/control-app/wrangler.toml declares [images] (lines 351 and 401)
      and [env.production.images] (lines 472 and 480) twice each, a cherry-pick duplication
      of the REQ-222 block, so smol-toml (and wrangler) refuse the document.
    instructions: wrangler.toml is invalid TOML because the REQ-222 cherry-pick appended
      a second [images] table (line 401) and a second [env.production.images] table
      (line 480) instead of merging them. Delete the second table of each pair. Fold
      the REQ-222 width-ladder rationale (optional binding whose absence means no
      srcset, metered per transform, content-addressed renditions cached under derived/<tenant>/
      outside sites/) into the remaining top-level [images] comment, and add [[REQ-221]]
      and [[REQ-222]] to the citation on the remaining production block, as the reference
      does. Do not change any binding name or any other table. The AC-2537 test must
      then parse the file and find binding IMAGES on both sides.
    test_scope: test_UAT_AC2537_ or test_UAT_FC_REQ-219_the_images_binding_is_declared_on_both_sides
      or test_UAT_AC1489_ or test_UAT_AC1490_ or test_UAT_AC2534_ or test_UAT_AC2535_
      or test_UAT_AC2536_
    ladder:
      rung1: REQ-221 and REQ-222 both require one IMAGES binding declared once at
        top level and once under env.production.
      rung2: 'Decided here: the reference declares [images] once (wrangler.toml:440-441)
        and [env.production.images] once (wrangler.toml:760-761), with the REQ-222
        rationale merged into the single comment.'
      rung3: The test stands; the config file changes.
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state has a single [images] and a single [env.production.images]
        table; the working tree duplicates both, which makes wrangler.toml invalid
        TOML that wrangler would refuse at deploy. The AC-2537 test is correct and
        only the config can satisfy it.
      files:
      - apps/control-app/wrangler.toml
      tip_evidence:
      - file: apps/control-app/wrangler.toml
        lines: 440-441
      - file: apps/control-app/wrangler.toml
        lines: 758-761
      trust_boundary: false
---

# Fix Plan — Iteration 1

## Hypothesis
Three story-6ccaedd5 test files still call `route(req, env, deps)`, `ticketStoreFor(env)` and `projectKnowledgeFor(env, opts)` in their old, pre-scope shapes. All three functions now take an explicit `Scope` (`{ businessId }`), so the tests fail on the call, not on what they assert. Separately, `apps/control-app/wrangler.toml` declares `[images]` and `[env.production.images]` twice each, an artifact of the cherry-pick. That makes it invalid TOML and fails AC-2537.

## Analysis
No prior fix_plan, batch_fix_assessment or batch_quality_check reports exist for story-6ccaedd5: this is iteration 1.

**Root cause A: stale call signatures (15 of 16 vitest failures and all 11 orphan ACs).**
- These functions all take a `Scope` in the working tree and at `reconcile-src-BUNDLE-43`:
  - `route(request, env, scope: Scope | null, deps, ctx)`: router.ts:1372 here, router.ts:3605 at the reference.
  - `ticketStoreFor(env, scope: Scope, opts)`: tickets.ts:698, ref tickets.ts:1095.
  - `projectKnowledgeFor(env, scope: Scope, opts)`: knowledge.ts:659, ref knowledge.ts:966.
- `TENANT_ID` on the env is no longer how the tenant is chosen.
- Three files still use the old shapes:
  - `tests/reconciliation-material-ingestion.workers.test.ts` (AC-1678..1687)
  - `tests/reconciliation-material-content-type-resolution.workers.test.ts` (AC-1809, AC-1810)
  - `tests/reconciliation-material-text-comment.workers.test.ts` (AC-2095, AC-2096, AC-2098)
- Observed effects:
  - `ticketStoreFor(routerEnv())`: `scope` is undefined, so it throws `Cannot read properties of undefined (reading 'businessId')` at tickets.ts:703 (AC-1684, AC-2098).
  - `projectKnowledgeFor(env, {embedder, defer})`: the opts object lands in the scope slot, so `businessId` is undefined and D1 fails with `D1_TYPE_ERROR ... 'undefined'` in `getTenant` (AC-1686, AC-2096).
  - `route(req, env, deps)`: deps lands in the scope slot and real deps default to `{}`. With no `describeText` seam, the REQ-173 refusal answers 503 (AC-1687, AC-2095, and every upload asserting 200). AC-1685's `expected [] to deeply equal ['undefined']` is the same 503, seen through an unset uid.
- The sibling file `tests/reconciliation-ingestion-heic-door.workers.test.ts` already uses the current shape: `scopeOf = () => ({ businessId: TENANT })`, passed to `route(req, env, scope, deps)` and `ticketStoreFor(env, scope)`. Its 4 tests pass, which shows the production path works.
- The 11 orphan ACs are these same AC-1678..1687 and AC-1809 tests. They will clear when the tests pass.

**Root cause B: duplicate TOML tables (AC-2537).**
- The working-tree `apps/control-app/wrangler.toml` has:
  - `[images]` at lines 351 and 401
  - `[env.production.images]` at lines 472 and 480
- The second of each is the REQ-222 block, appended when the bundle was cherry-picked instead of being merged.
- At the reference, each table appears once (wrangler.toml:440 and :760). The REQ-222 rationale is folded into the single `[images]` comment (ref lines 424-432), and the production comment cites REQ-219, REQ-221 and REQ-222 (ref lines 758-759).
- The test parses the file with smol-toml, which rejects a table declared twice, exactly as wrangler would at deploy time. The test is right; the config is broken.

**Conflicts:** none. The two causes touch disjoint files: test harness files vs one config file.

**Isolation:** not applicable. The failures are deterministic signature and parse errors.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-ingestion-images-binding.test.ts::test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production` — weak-observation — the last three assertions regex-match router.ts/heic.ts source text, so they prove spelling, not wiring. Prefer the behavioural check already in the HEIC door test, which builds the converter from `env.IMAGES`.
- `tests/reconciliation-material-ingestion.workers.test.ts::test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there` — over-mocked — it builds the "interrupted" state by hand through the store and never drives the route's own attach ordering, so a route that wrote the record before the bytes would still pass.
- `tests/reconciliation-material-ingestion.workers.test.ts::test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind` — weak-observation — the empty-file case asserts only `status !== 200`. Pin the specific status, as the ceiling case pins 413.

## Batches
- **Batch 0 (test harness, 15 tests):** the three test files with stale call shapes. These are test-only edits, which the reconcile mode allows; no production file changes. They share one root cause and one pattern, so they go in one batch.
- **Batch 1 (config, 1 test):** AC-2537. This is the only production-side file in play (`apps/control-app/wrangler.toml`), and it does not overlap batch 0's files. It is split out so its `code_frozen` override is scoped to that one file.

## Mode overrides (REQ-892)
- Batch 1 — `code_frozen` — files: `apps/control-app/wrangler.toml` — rung 2: the reference state declares `[images]` once (wrangler.toml:440-441) and `[env.production.images]` once (wrangler.toml:760-761). The working tree's second copy of each table is a cherry-pick duplication that makes the file invalid TOML, and wrangler would refuse it at deploy. The fix:
  - Delete the duplicate tables.
  - Fold the REQ-222 rationale into the remaining `[images]` comment, and the REQ-222 citation into the production comment.
  - Change no binding name.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 2:**
  - Rung 1: the later scoped-read intent (REQ-168, which made the Scope explicit) supersedes the env-`TENANT_ID` shape the tests were written against.
  - Rung 2: the reference shows `route`, `ticketStoreFor` and `projectKnowledgeFor` all taking an explicit `Scope` (router.ts:3605, tickets.ts:1095, knowledge.ts:966).
  - Rung 3: every assertion stands unchanged; only how each test calls these functions is updated.
- **Batch 1, decided at rung 2:**
  - Rung 1: REQ-221 and REQ-222 both require a single IMAGES binding on both sides.
  - Rung 2: the reference declares each table exactly once (wrangler.toml:440, :760).
  - Rung 3: the test stands; the config changes.
