---
uid: report-d1021dfa
id: REPORT-3691
type: report
title: 'Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index
  & Its Generated Map (level=uat)'
created_by: xgd
created_at: '2026-09-10T07:40:16.666433+00:00'
updated_at: '2026-09-10T07:40:16.666433+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-45acba5e
  level: uat
  violations: 4
  warnings: 3
  needs_review_count: 1
---

# Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index & Its Generated Map
# Level: uat

**Result**: FAIL
**Violations**: 4
**Warnings**: 3
**Needs review**: 1

Anchor report: report-e37a6b4a. Capability: capability-45acba5e (CAP-100).
Matrix under this capability: one story (STORY-117 / story-c4f329d3, `story_kind: feature`,
status `completed`) with 16 active ACs, AC-1291 … AC-1306.

Evidence file: `tests/reconciliation-system-knowledge-base.test.ts` (16 tests, one per AC —
naming and count coverage are complete). Second, overlapping file:
`tests/test_UAT_FC_REQ-123_system_kb.test.ts` (15 tests).

**Both files were executed, not read only.** On this branch
(`regression-800a17f7`, HEAD `80d0ac95f9`):

```
tests/reconciliation-system-knowledge-base.test.ts   5 failed | 6 passed | 5 skipped (16)
tests/test_UAT_FC_REQ-123_system_kb.test.ts          15 skipped (15), 2 suites failed in beforeAll
```

So 10 of the 16 AC-traceable UATs do not currently execute to a verdict, and one of
the 6 that pass does so vacuously (finding 4). That is what drives the FAIL.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-123 | request-488d874b | free_and_reconciled | 2026-08 | Stand up the system KB: corpus, doc + chunk index, generated awareness map, opt-in membership via `fields.system_kb: true` | YES |
| BUNDLE-19 | bundle-77b28def | free_and_reconciled | 2026-08-18 → merged `b18b859d74` | The bundle STORY-117 carries as `intent_uid`; carries REQ-123's KB work into main | YES |
| REQ-122 | request-58b6a329 | free_and_reconciled | 2026-08 | Builder chat panel — the consumer of this artefact; its own capability | YES (adjacent) |
| lagrange-framework REQ-109 | (external repo) | landed upstream (`ecf0585a9af`); followed here by `393a447a85` | 2026-08-30 | Renames the KB declaration field `prompt` → `description` | YES |
| REQ-164 | request-909e42f8 | **draft** | 2026-08-31 | Membership becomes `doc_kind: system_kb` (DOC-39 §3.3), shipped KB declares `corpus: {}`, `readDocTickets` passes `--no-limit`. Blocked on xgd REQ-827 | **NO** (draft) |
| REQ-158 | request-6893f6ea | draft | — | System KB in the Worker (bundle-resident index) | NO (draft) |

Walked chronologically, the **current cumulative intent** for this capability is
REQ-123 as landed by BUNDLE-19, with one upstream vocabulary change (REQ-109:
`prompt` → `description`). REQ-164 is `draft` and blocked, so by the status table its
`doc_kind` membership rule is **not** part of cumulative intent — see finding 5, where
the world has nonetheless moved ahead of it.

## Alignment Ledger

| Element | UAT | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1291 | `test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced` | REQ-123 | test exercises the AC correctly; **skipped** — suite `beforeAll` throws (finding 1) |
| AC-1292 | `test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials` | REQ-123 | aligned, passing (see info finding 9 on the entry point) |
| AC-1293 | `test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact` | REQ-123 | aligned; **fails** at the fully-built tree (finding 1) |
| AC-1294 | `test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing` | REQ-123 | aligned, passing |
| AC-1295 | `test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in` | REQ-123 | **fails** (finding 3); membership rule itself under question (finding 5) |
| AC-1296 | `test_UAT_AC1296_every_excluded_document_is_named_individually` | REQ-123 | aligned, passing; reason text unasserted (finding 6) |
| AC-1297 | `test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document` | REQ-123 | passes **vacuously** on the real-store half (finding 4) |
| AC-1298 | `test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus` | REQ-123 | aligned, passing — both departure paths and the map exemption covered |
| AC-1299 | `test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded` | REQ-123 | aligned; **fails** on the re-embed half (finding 1) |
| AC-1300 | `test_UAT_AC1300_a_build_with_nothing_opted_in_is_refused_and_reaches_no_model` | REQ-123 | aligned, passing |
| AC-1301 | `test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about` | REQ-123 | test exercises the AC correctly; **skipped** (finding 1) |
| AC-1302 | `test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document` | REQ-123 | correct; **skipped** (finding 1) |
| AC-1303 | `test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in` | REQ-123 | correct; **skipped** (finding 1) |
| AC-1304 | `test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report` | REQ-123 | correct; **skipped** (finding 1) |
| AC-1305 | `test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name` | REQ-123, REQ-109 | **fails**: assertion did not follow the `prompt` → `description` rename (finding 2); AC wording also stale (finding 7) |
| AC-1306 | `test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none` | REQ-123 | aligned; **fails** on the map-needs-no-credentials half (finding 1) |
| (whole file) | `tests/test_UAT_FC_REQ-123_system_kb.test.ts` | REQ-123 | same-shape duplicate of 14 of the above scenarios (finding 8) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1291, AC-1293, AC-1299, AC-1301, AC-1302, AC-1303, AC-1304, AC-1306 | code-issue | `tools/generate/src/cli/kb.ts:583-584` calls `lib.search(query, { source: indexSource, … })`. The installed `@lagrangefoundry/knowledge` destructures `indexes` (`src/search.js:243` for `search`, `:331` for `searchChunks`) and resolves it through `indexFor(kb, indexes)` (`src/index_store.js:113-124`). With `indexes` undefined the map step throws `KnowledgeConfigError: knowledge base 'system' reads from source 'shipped', which this host has no index for (available: none)`, so **every `buildKb()` fails** — `1c kb build` is broken on this branch and on `origin/main` (`origin/main:tools/generate/src/cli/kb.ts:584` is identical). 8 ACs lose their evidence: 4 tests fail, 4 are skipped by the `beforeAll` that calls `buildKb`. | Pass `indexes: { [SHIPPED_SOURCE]: indexSource }` at `kb.ts:583-584`; same change at the two UAT call sites `tests/reconciliation-system-knowledge-base.test.ts:336-344` and `:358-366`, and at `tests/test_UAT_FC_REQ-123_system_kb.test.ts:283`. Check `openKnowledgeRuntime` (`kb.ts:725-732`) for the same `source`/`chunkSource` shape. `buildIndex`/`buildChunkIndex` (`kb.ts:688`, `:694`) are unaffected — they still take a bare source. |
| 2 | violation | consistency | AC-1305 | uat-edit | `tests/reconciliation-system-knowledge-base.test.ts:656` asserts `expect(binding.kb.prompt).toBe('Declared prompt, not a hard-coded one.')`, but the declaration written at `:643` says `description: 'Declared description, not a hard-coded one.'`, and the library's `KnowledgeBase` exposes `.description` with no `.prompt` at all (`@lagrangefoundry/knowledge/src/config.js:207-218`, `:441-453`). Commit `393a447a85` ("follow the framework rename of the KB field 'prompt' to 'description'") updated the JSON literal and left the assertion behind. Observed: `AssertionError: expected undefined to be 'Declared prompt, not a hard-coded one.'`. The AC's central claim — that the declared prose is the thing in force — is therefore unproven. | `expect(binding.kb.description).toBe('Declared description, not a hard-coded one.')` |
| 3 | violation | coverage | AC-1295 | uat-edit | The real-store integration half fails at `tests/reconciliation-system-knowledge-base.test.ts:839` (`expect(shouldBeIn.length).toBeGreaterThan(0)` → received 0). All 38 `doc` tickets had `fields.system_kb` cleared on 2026-08-31 (e.g. `d1e500129e`, "field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"). The UAT takes live ticket-store contents as a hard precondition, so its verdict changes with data no branch controls — it is not deterministic evidence. | Keep the six-shape predicate assertions (`:825-831`, correct and passing logic). For the integration half, either seed a controlled store as the file's other suites already do via `withStore`, or assert set-equality against whatever the store holds and demonstrate non-vacuity separately. Resolving finding 5 may change which flag it should assert. |
| 4 | violation | coverage | AC-1297 | uat-edit | The real-store read-back half is **vacuous**, and passes for that reason. With zero opted-in documents, `exported.docs.length` is 0, so `:855` asserts `0 === 0` and the `for (const doc of readBack)` loop at `:856-863` never executes — the human-id shape (`/^[A-Z]+-\d+$/`), the non-empty title/body and the `origin_uid` provenance assertions all run zero times. The AC's central claim ("a document's address in the corpus is its human id … reads back as a document") has no live assertion behind it. The retitle half (`:866-874`) and the structured-field half (`:880-901`) do run and are sound. | Assert `readBack.length > 0` before the loop, and/or drive the read-back half from a controlled `withStore` corpus so it cannot silently degrade to zero documents. |
| 5 | needs_review | consistency | AC-1295, AC-1296 (and STORY-117 body) | — | The matrix and production code both say membership is `fields.system_kb: true` (`kb.ts:186` `INCLUDE_FIELD = 'system_kb'`; `tools/generate/src/cli/index.ts:750` prints `not in the KB (no fields.system_kb): …`), grounded in REQ-123 (`free_and_reconciled`). The ticket store no longer carries that flag on **any** of its 38 `doc` tickets. REQ-164 (`request-909e42f8`) proposes replacing it with `doc_kind: system_kb` per DOC-39 §3.3 — but REQ-164 is `draft` and blocked on xgd REQ-827, so by the status table it does not count toward cumulative intent. Step 2.5 tier-3 implementation check is **inconclusive**: a free-coded implementation of the `doc_kind` rule exists on `origin/reconcile-BUNDLE-23` (`2db8ee6b90`, "fix(kb): corpus export selects by doc_kind, unrestricted, exhaustive") but on neither this branch nor `origin/main`. So the data has moved, one branch's code has moved, the matrix and mainline code have not, and the governing intent is still a draft. Do not guess which side is authoritative. | Escalate to operator: either activate/reconcile REQ-164 (then AC-1295 and AC-1296 need `ac-edit` to a closed-enum `doc_kind` rule, losing the "genuine boolean, not the string 'true', not the number 1" shape assertions, and STORY-117's body needs `story-body-edit`), or restore the boolean on the intended documents. Until then the system KB builds an empty corpus and `1c kb build` refuses with the AC-1300 message. |
| 6 | warning | consistency | AC-1296 | uat-edit | AC-1296 requires that the report "says why they are out — that they carry no opt-in", and that "when nothing was left out, no such line appears at all". The UAT asserts only the `skipped` string array returned by `exportCorpus` (`:511`, `:523`). The reason text lives in the command layer at `tools/generate/src/cli/index.ts:750`, and the line's conditional emission at `:749`; neither is exercised by any test. Note the story body records a deliberate exception — the nothing-opted-in refusal (`kb.ts:678`) reports a *count* — which no test distinguishes from the rule either. | Drive `run(['kb','export'])` through the existing `cli()` helper (already used at `:770`, `:784`) and assert the captured stdout contains the reason phrase and each excluded id, and that no such line appears when `skipped` is empty. |
| 7 | warning | consistency | AC-1305 | ac-edit | AC-1305 calls the declared value "the knowledge base's **prompt**" throughout ("Every declared value — the knowledge base's prompt, its ranking weight, and the predicate…"; "A tuned prompt … survives every rebuild"). Framework REQ-109 renamed the field to `description` precisely because it is not a prompt, and `393a447a85` followed the rename in `kb/knowledge_bases.json` and `kb.ts`. STORY-117's body carries the same stale word ("Prompt, weight and the membership predicate all come from the declaration"). | Replace "prompt" with "description" in AC-1305's Criterion and Verification; same in the STORY-117 "The declaration is the thing in force" bullet. |
| 8 | warning | exclusivity | `tests/test_UAT_FC_REQ-123_system_kb.test.ts` vs `tests/reconciliation-system-knowledge-base.test.ts` | uat-edit (merge/retire) | Two UAT files verify the same scenarios **in the same shape** — same node runner, same `tests/fixtures/kb-stub-model.mjs` stub embedder and describer, same real-`DocDirStore` export suite. Overlapping pairs: found-by-words (`:148` ↔ AC-1301), chunk passage (`:169` ↔ AC-1302), map generated (`:192` ↔ AC-1303), map is a report (`:203`) and map out of corpus (`:216`) ↔ AC-1304, unchanged corpus not re-embedded (`:228`) and unchanged file stamp (`:381`) ↔ AC-1299, status (`:237` ↔ AC-1293), explicit-true-only (`:395`) and export-agrees-with-store (`:414`) ↔ AC-1295, ticket-gone-removed (`:387`) and opt-out-removes (`:429`) ↔ AC-1298, declaration-in-force (`:450` ↔ AC-1305), structured-field-dropped (`:484` ↔ AC-1297), export-reads-back (`:357` ↔ AC-1297). This is not unit-vs-integration diversity; it is the same assertion twice. The duplicate is also 15/15 skipped, from the same two root causes as findings 1 and 3. | Retire `test_UAT_FC_REQ-123_system_kb.test.ts` in favour of the AC-traceable file, folding in anything it covers that the AC file does not — or, if it is kept, state in its header which ACs it is *not* the evidence for. Note `2db8ee6b90` on `origin/reconcile-BUNDLE-23` adds a **third** overlapping file, `tests/test_UAT_FC_REQ-164_corpus_export.test.ts` (451 lines); resolve the duplication before that lands. |
| 9 | info | consistency | AC-1292 | — | The AC describes "asking for the corpus alone" (the `1c kb export` command form), but the UAT hand-mirrors that form's body — `ensureConfig(root)` then `exportCorpus(root)` at `:476-477` — rather than invoking it. The mirror is faithful to `index.ts:742-743` today, and AC-1293/AC-1294 do drive `run(['kb', …])`, so the command dispatch is not wholly unproven. Recorded so a future divergence between the command and its mirror is not silent. | none |

## Notes for the Editor

**Two root causes account for 9 of the 10 non-executing UATs.** Fix finding 1 and 8
tests come back; fix finding 3/5 and the real-store suite becomes substantive again.
Nothing else in this file needs restructuring — the tests themselves are well-targeted
at their ACs, and where they run they assert the AC's actual claim rather than a
structural proxy.

**Finding 1 is a production defect, not a test defect.** `1c kb build` throws on
`origin/main` today for the same reason the tests do. The seam is an upstream API
change in `@lagrangefoundry/knowledge` — `search()`/`searchChunks()` moved from a
single `source` to an `indexes` map keyed by KB source — that this repository has not
followed anywhere. It is the same class of breakage as the `prompt` → `description`
rename that produced finding 2: the shared JS artifact store at
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry` is updated by an
operator-run install, independently of this repository's commits, so a fix landed in
the framework arrives here as a silently red suite. Worth a repository-wide sweep for
other callers of the changed functions — the only ones today are `kb.ts:583` and the
three test call sites, but nothing prevents more.

**Findings 3, 4 and 5 are one situation seen three ways.** The ticket-store data for
this capability was migrated ahead of the intent that governs it: `fields.system_kb`
was cleared from all 38 documents on 2026-08-31, while REQ-164 — the ticket that says
what should replace it — is still `draft` and blocked on xgd REQ-827. The consequence
is that the system knowledge base currently has an **empty corpus**: `1c kb build`
refuses with the AC-1300 message, one UAT fails loudly (AC-1295), and one passes while
asserting nothing (AC-1297). The AC-1297 vacuity is the more dangerous of the two,
because it is the shape of failure that survives a green suite. Whichever way the
operator resolves REQ-164, the UATs should not be able to reach zero documents
silently again.

**Branch context, so downstream work is not duplicated.** This is
`regression-800a17f7`. `origin/reconcile-BUNDLE-23` carries `2db8ee6b90`, which already
implements the `doc_kind` membership rule and, by its own commit message, "repairs two
UATs left red by the upstream `prompt` -> `description` rename" — i.e. it likely
already contains the fix for finding 2. It does **not** fix finding 1: its
`kb.ts:826` still passes `source: indexSource`.
