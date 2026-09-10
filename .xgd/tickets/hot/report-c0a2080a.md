---
uid: report-c0a2080a
id: REPORT-3694
type: report
title: 'Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index
  & Its Generated Map (level=uat)'
created_by: xgd
created_at: '2026-09-10T07:58:43.560348+00:00'
updated_at: '2026-09-10T07:58:43.560348+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-45acba5e
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index & Its Generated Map
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-45acba5e (CAP-100).
Attempt 2 of this check. The previous cycle (REPORT-3691 / report-d1021dfa, 4 violations,
3 warnings, 1 needs_review) was answered by two fix calls — report-ec97a368 (commit
`47fe3cc820`) and report-b34ea686 (commit `671a09196f`). **Every finding was re-verified
against the tree as it stands now, not taken from the fix reports.**

Matrix: one story (STORY-117 / story-c4f329d3, `story_kind: feature`, status `completed`)
with 16 active ACs, AC-1291 … AC-1306.

Evidence: `tests/reconciliation-system-knowledge-base.test.ts` — 16 tests, one per AC,
naming coverage complete. It is now the **only** file carrying these UATs (verified by
`grep -ra test_UAT_AC129x|130x` across the tree: the sole hit outside `.xgd/tickets/` is
this file).

**Executed, not read only.** On this branch (`regression-800a17f7`, HEAD `669af18198`):

```
npm test -- tests/reconciliation-system-knowledge-base.test.ts
Test Files  1 passed (1)
     Tests  16 passed (16)      # 0 failed, 0 skipped
  Duration  10.86s
```

That is the material change since the last cycle: 16/16 execute to a verdict, where
before 10 of 16 did not and one of the six passers was vacuous.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-123 | request-488d874b | free_and_reconciled | 2026-08-07 | Stand up the system KB: corpus export, document + passage index, generated awareness map, opt-in membership via `fields.system_kb: true` | YES |
| BUNDLE-19 | bundle-77b28def | free_and_reconciled | 2026-08-18 → merged `b18b859d74` | The bundle STORY-117 carries as `intent_uid`; carries REQ-123's KB work into main | YES |
| lagrange-framework REQ-109 | (external repo) | landed upstream; followed here by `393a447a85` | 2026-08-30 | Renames the KB declaration field `prompt` → `description` | YES |
| REQ-164 | request-909e42f8 | **draft** | 2026-08-31 | Membership would become `doc_kind: system_kb` (DOC-39 §3.3); blocked on xgd REQ-827 | **NO** (draft) |
| REQ-158 | request-6893f6ea | **draft** | — | System KB resident in the Worker bundle | **NO** (draft) |

Current cumulative intent is REQ-123 as landed by BUNDLE-19, plus the REQ-109 vocabulary
change. Status re-verified this call: REQ-123 `free_and_reconciled`, REQ-164 and REQ-158
still `draft`.

**Level cascade honoured.** The story-level cycle (report-06fe381c) and the ac-level cycle
(report-e7681edd) both ran before this one and both scored **0 violations, 0 needs_review**.
AC bodies are therefore the working reference here; intent history was consulted only to
confirm the two status facts above.

## Alignment Ledger

| Element | UAT | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1291 | `test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced` | REQ-123 | aligned, **passing**. All six reported figures asserted against the tree: corpus files, both index dirs, map file, `documents`/`embedded`/`chunks`, `territories` = `## ` headings the map names, `accessPoints` = bolded entries, `describer` |
| AC-1292 | `test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials` | REQ-123 | aligned, **passing**. Now drives the command form (`1c kb export`) with all five credentials stripped, alongside the scratch-root mirror — the AC says "run the corpus-only form" and the form is now what runs |
| AC-1293 | `test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact` | REQ-123 | aligned, **passing** over all three trees (nothing built / corpus only / fully built) plus the bare command. The map-not-counted clause is asserted explicitly (`:842-848`) |
| AC-1294 | `test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing` | REQ-123 | aligned, **passing**. Exit 1, offending word + usage on stderr, empty stdout, tree unchanged by name *and* by mtime |
| AC-1295 | `test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in` | REQ-123 | aligned, **passing, no longer data-dependent**. Six-shape predicate assertions, then a **seeded** five-document export (one per near-miss shape) carrying the AC's weight, then real-store *agreement* — a property the AC now explicitly states "holds at any corpus size, zero included" |
| AC-1296 | `test_UAT_AC1296_every_excluded_document_is_named_individually` | REQ-123 | aligned, **passing**. The command layer is now driven: reason phrase `not in the KB (no fields.system_kb):`, each excluded id named individually, no bare count, and the line **absent entirely** when nothing was excluded |
| AC-1297 | `test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document` | REQ-123 | aligned, **passing, no longer vacuous**. Read-back shape assertions run over a seeded two-document corpus (`:974-995`) that cannot degrade to zero; real store asserted for count round-trip; retitle-keeps-address and structured-field-dropped both exercised |
| AC-1298 | `test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus` | REQ-123 | aligned, **passing**. Both departure paths (ticket gone, opted back out), both reported as removals, and the generated map left in place across both sweeps |
| AC-1299 | `test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded` | REQ-123 | aligned, **passing**. Backdated mtime proves "unchanged" rather than coinciding with it; second build reports same `documents`, `embedded: 0` |
| AC-1300 | `test_UAT_AC1300_a_build_with_nothing_opted_in_is_refused_and_reaches_no_model` | REQ-123 | aligned, **passing**. Refusal names the flag and the doc type, is asserted *not* to say "no documents", and is proven to precede the model by running with no embedder configured at all |
| AC-1301 | `test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about` | REQ-123 | aligned, **passing**. Query words asserted absent from every title/id first, then top hit is DOC-A. Real cosine search over a real index |
| AC-1302 | `test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document` | REQ-123 | aligned, **passing**. Hit is DOC-C, the passage is the `Swatches` section, and its span is strictly shorter than the document |
| AC-1303 | `test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in` | REQ-123 | aligned, **passing**. ≥2 territories, corpus vocabulary in the prose, and a deliberately doorless second corpus whose territory label is asserted to appear in `result.doorless` |
| AC-1304 | `test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report` | REQ-123 | aligned, **passing**. `resolveCorpus` returns exactly the exported ids with no awareness entry; `findAwarenessReport` finds it with `kind: 'awareness_report'` and `kb: system` |
| AC-1305 | `test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name` | REQ-123, REQ-109 | aligned, **passing**. `binding.kb.description` (`:744`) now follows the `prompt` → `description` rename; weight 2.5 and the `fields.system_kb` predicate term both bind; declaration byte-identical after a build; wrong-name declaration refused naming both sides |
| AC-1306 | `test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none` | REQ-123 | aligned, **passing**. Refusal names both credentials and the index; `resolveDescriber()` is exercised with **both** `ANTHROPIC_API_KEY` and the `LAGRANGE_KM_DESCRIBER` seam removed, so the no-credentials claim is proven against the real default backend (`ai-knowledge/describe`, `kb.ts:504-511`) rather than the stub; `KB_USAGE` states both facts |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1291 … AC-1306 | — | All 16 previous-cycle problems are closed and independently re-verified. Finding 1 (the `indexes`-by-source-name API break) is fixed at `tools/generate/src/cli/kb.ts:588` and `:734-735`, and every UAT call site now passes `indexes: { [SHIPPED_SOURCE]: … }`. Finding 2 fixed at `:744`. Findings 3 and 4 fixed by seeding (`:933-948`, `:974-995`). Finding 6 fixed at `:594-612`. Finding 8 fixed: `tests/test_UAT_FC_REQ-123_system_kb.test.ts` deleted in `671a09196f`, with no dangling references outside `.xgd/`. Finding 7 fixed: AC-1305 and the STORY-117 declaration bullet both now say "description" | none |
| 2 | info | consistency | AC-1295, AC-1296, STORY-117 (previous cycle's finding 5) | — | **Resolved, not re-escalated.** The prior cycle raised the `fields.system_kb` → `doc_kind` membership question as `needs_review`. Re-verified this call: REQ-164 (request-909e42f8) is still `draft` and therefore does not count toward cumulative intent, while REQ-123 (`free_and_reconciled`) mandates exactly the boolean the matrix and `kb.ts:186` (`INCLUDE_FIELD = 'system_kb'`) describe. The story-level cycle (report-06fe381c) adjudicated this explicitly — "not story-level drift and was not scored as one … the data state is corpus-content in flight, not a matrix claim" — and passed with 0 violations. Per the level cascade, that determination stands here. The **uat-level** consequence it carried — that AC-1295's and AC-1297's real-store halves were failing or vacuous against a store with 0 of 38 documents opted in — is separately closed by seeding, so no test verdict now turns on data no branch controls. Store state re-confirmed this call: 0 of 38 `doc` tickets carry `system_kb: true` | none at this level; the mechanism question belongs to REQ-164's own reconciliation |
| 3 | info | exclusivity | AC-1291 (`:349`) and AC-1303 (`:420`) | — | Both assert `built.accessPoints === (map.match(/\*\*[^*]+\*\*/g) ?? []).length`, over the same shared build. Not scored as a duplicate: each AC's own Verification independently calls for it — AC-1291's "assert every reported figure against the tree it left behind", AC-1303's "the reported number of validated ways in is consistent with what the map records" — and the two tests prove different properties around it | none |
| 4 | info | consistency | Evidence validity — the three doubles | — | Checked against the no-internal-mocking rule and it holds. Exactly three seams are stood in for, all genuinely external: the embedding model and the describing model (both through `LAGRANGE_KM_EMBEDDER` / `LAGRANGE_KM_DESCRIBER`, the env vars production already reads — no test-only branch in the production path), and the `xgd` CLI the export shells out to, replaced on `PATH` by a shim. The real `DocDirStore`, the real index and chunk builds, the real cosine search and ranker, the real clustering and the real access-point validation all run. The stub embedder (`tests/fixtures/kb-stub-model.mjs`) is a normalised FNV-1a bag-of-words hasher, so similarity tracks word overlap and the AC-1301/1302 ranking assertions are meaningful rather than rigged | none |

## Notes for the Editor

- **Nothing to repair at this level.** This is a clean PASS on re-check: 0 violations,
  0 warnings, 0 needs_review, and 16/16 UATs executing to a verdict.

- **One test-hygiene risk worth knowing, deliberately not scored as a finding.** The
  `withRepoCorpus` helper (`:162-173`) renames the repository's own `kb/corpus` tree aside
  and restores it in a `finally`, because `1c kb export` resolves a repo-anchored root by
  design and cannot be pointed at a scratch directory. If a run is killed between the
  rename and the `finally`, a developer's built corpus is left at `kb/corpus.saved-by-test`.
  Impact is low — the corpus is a derived release artefact, reproducible by rebuild, and not
  in version control — and the alternative (not driving the command an AC names) is worse.
  Recorded so the next reader recognises a stray `.saved-by-test` directory rather than
  investigating it.

- **This capability's matrix remains single-intent and therefore brittle.** Everything in
  STORY-117 answers to REQ-123 alone, and two drafts (REQ-158, REQ-164) target it. REQ-164
  in particular would, on reconciling, force `ac-edit`s on AC-1295 and AC-1296 that *delete*
  the "genuine boolean, not the string `'true'`, not the number `1`" shape assertions — the
  most distinctive evidence this capability currently has. Worth planning for rather than
  discovering during that reconciliation.

- **Adjacent failures are not this capability's.** The fix cycle recorded 6 failures in the
  session-knowledge suites (AC-1317 … AC-1320, CAP-90) from upstream drift in
  `@lagrangefoundry/ai-knowledge`. Out of scope here; flagged so they are not read as
  fallout from this work.
