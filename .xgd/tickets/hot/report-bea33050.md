---
uid: report-bea33050
id: REPORT-3695
type: report
title: 'UAT Coverage: System Knowledge Base: The Corpus, Its Index & Its Generated
  Map'
created_by: xgd
created_at: '2026-09-10T08:05:53.626750+00:00'
updated_at: '2026-09-10T08:05:53.626750+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-45acba5e
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: System Knowledge Base: The Corpus, Its Index & Its Generated Map

**Result**: PASS
**AC verdicts**: 16 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability holds one story (STORY-117), whose `intent_uid` is BUNDLE-19
(`bundle-77b28def`, `free_and_reconciled`, merged at `b18b859d`). Of the nine
source tickets in that bundle, exactly one is this capability's: **REQ-123**.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-123 (`request-488d874b`) | free_and_reconciled | created 2026-08-07, completed 2026-08-20 | Stand up the system KB: corpus export from `doc` tickets, document + chunk index, generated awareness map, one `1c kb build` command. Decisions 2–5, 7 fix opt-in membership (`fields.system_kb`, boolean, inclusion-not-exclusion), the generated map, one embedding model on both sides, a credential-free describer, and the KB sitting above tenancy. | YES |
| REQ-158 (`request-6893f6ea`) | draft | — | System KB in the Worker: bundle-resident index, AI binding | NO (not yet active) |
| REQ-159 (`request-119dd4af`) | draft | — | Project (tenant-scoped) knowledge base | NO (not yet active) |
| REQ-160 (`request-bbff35c7`) | draft | — | Session seeding / two-KB priming | NO (not yet active) |
| REQ-163 (`request-439cd0c8`) | draft | — | Ingestion of dropped files as material tickets | NO (not yet active) |
| REQ-164 (`request-909e42f8`) | draft | — | Corpus export correctness: `doc_kind` filter, unrestricted shipped corpus, exhaustive listing | NO (not yet active) |
| REQ-166 (`request-20bd7d63`) | draft | — | Capture to ticket: bundles become corpus members | NO (not yet active) |

Nothing in the ledger retires any behavior this capability describes. REQ-123 is
the whole of the current cumulative intent, and it is reconciled. The six draft
requests all *extend* the capability (a Worker-resident index, tenant KBs, an
export filter) and none of them contradicts a shipped behavior, so no AC is
stale and none is forward-dated.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-117 | REQ-123 | aligned | Every in-scope bullet in the story body maps to a REQ-123 decision or "What was built" row. The three Technical Context divergences (JSON not YAML declaration; `landscape: authored` on disk; export composing the library's exports because the packed artifact has no `bin`) are all recorded verbatim in REQ-123 itself, so they are intent-supported rather than drift. The story's out-of-scope list (session priming, degradation with nothing built, tenant KBs, corpus residency for a deployed Worker) matches REQ-123's own Scope / Deferred sections exactly. |

**Coverage of the story body, bullet by bullet** — every in-scope behavioral
claim has an AC, and each AC has a live test:

| Story-body claim | AC | Test |
|---|---|---|
| One command runs the whole pipeline and reports what it produced | AC-1291 | `test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced` |
| A corpus-only form, no model, no credentials, coherent tree | AC-1292 | `test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials` |
| A form that reports what is currently built | AC-1293 | `test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact` |
| An unrecognised form is refused with usage and a failing exit | AC-1294 | `test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing` |
| Membership opt-in, per document, genuine boolean | AC-1295 | `test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in` |
| Named exclusions, never a bare count | AC-1296 | `test_UAT_AC1296_every_excluded_document_is_named_individually` |
| Identity that survives a retitle; structured fields dropped | AC-1297 | `test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document` |
| Withdrawal is deletion | AC-1298 | `test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus` |
| Rebuilds incremental and honest about it | AC-1299 | `test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded` |
| Nothing opted in is refused, naming the mechanism (Technical Context) | AC-1300 | `test_UAT_AC1300_a_build_with_nothing_opted_in_is_refused_and_reaches_no_model` |
| A document is found by describing what it is about | AC-1301 | `test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about` |
| Passage search returns a section and cites its document | AC-1302 | `test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document` |
| The map is generated, always; a doorless territory is named | AC-1303 | `test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in` |
| The map is kept out of the corpus it describes | AC-1304 | `test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report` |
| The declaration is the thing in force | AC-1305 | `test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name` |
| One embedding model on both sides (build half + no local stand-in) | AC-1306 | `test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none` |

**The query half of "one embedding model on both sides"** is the one claim whose
evidence lives outside this capability, and legitimately so: `openKnowledgeRuntime`
resolves through the same `resolveEmbedder` seam the build uses
(`tools/generate/src/cli/kb.ts:687` and `:736`), and it is exercised by the
assistant capability's own suite
(`tests/reconciliation-assistant-conversation-knowledge.test.ts:226-228`, which
builds with `LAGRANGE_KM_EMBEDDER` set and then searches through the runtime).
The story explicitly assigns the session's knowledge surface to that capability,
so this is an AC-elsewhere case, not a gap.

## Evidence Validity

All sixteen UATs live in `tests/reconciliation-system-knowledge-base.test.ts`
(1048 lines) and were **run for this assessment**: `npm test --
tests/reconciliation-system-knowledge-base.test.ts` → **16 passed / 16**, 8.5s.

The mocking posture satisfies the thin-mock rule. Exactly three things are stood
in for, each at a seam production already ships:

- the **embedding model**, via `LAGRANGE_KM_EMBEDDER` — the same env var
  `resolveEmbedder` reads in production, so no test-only branch exists in the
  build path. The stand-in (`tests/fixtures/kb-stub-model.mjs`) is a
  384-dimension FNV-1a bag-of-words hasher, L2-normalised, so cosine similarity
  tracks word overlap and ranking assertions are checkable rather than arbitrary.
- the **describing model**, via `LAGRANGE_KM_DESCRIBER`, same shape. It echoes a
  slice of its prompt, which is what lets AC-1303 assert the map carries the
  corpus's vocabulary rather than constants.
- the **ticket store**, replaced as a subprocess by putting a shim `xgd` on
  `PATH`. This is a separate product invoked over a process boundary, not an
  internal module — the export's own JSON parsing, opt-in filter, rendering,
  incremental write and sweep all still run for real.

Everything else is real: the real `DocDirStore`, the real `buildIndex` /
`buildChunkIndex`, the real cosine search and ranker, the real clustering, the
real access-point validation, `buildKb` itself as the entry point, and — for
AC-1292/1293/1294/1296 — the actual `1c` CLI dispatch through `run(argv)` with
both output streams captured separately. AC-1295 and AC-1297 additionally export
the **real** document store and assert agreement against it.

Two design choices in the suite are worth crediting because they close the
failure modes this assessment usually finds:

- Every real-store assertion is paired with a **seeded** one. The file's own
  comment records why: the real store has been all-opted-in (and once
  all-opted-*out*), which turns a loop over the corpus into a green report over
  an empty set. The seeded halves cannot degrade; the real-store half asserts
  only *agreement* between the rule and the export, which holds at any corpus
  size including zero.
- `test_UAT_FC_REQ-123_system_kb.test.ts` was absorbed into this file rather
  than kept alongside it, so there is one authoritative assertion per property
  instead of two copies drifting apart.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1300 | uat-edit | `tests/reconciliation-system-knowledge-base.test.ts:711` asserts the refusal names the document kind with `expect(message).toContain('doc')`, which the same message satisfies via the word "documents" further along it. The implementation does name the kind ("No doc ticket has opted into the system KB…", `tools/generate/src/cli/kb.ts:679`), but an implementation that dropped it and said only "Nothing has opted in: set fields.system_kb=true on the documents…" would still pass all four assertions. | Tighten to `expect(message).toContain('doc ticket')` (or `toMatch(/No doc ticket/)`), so the assertion distinguishes the ticket type from the plural noun. |
| 2 | warning | uat | AC-1303 | uat-add | The AC's criterion requires that ways in are "validated by *the same search a reader uses*, over the same index and the same ranking". `buildMap`'s `find` does exactly that (`tools/generate/src/cli/kb.ts:582-597` — `lib.search` with the same `indexSource`, `kb`, `embedder` and `sources`), but no assertion observes it: the test only checks that the reported access-point count equals the bolded spans in the map, which would still hold if `find` were swapped for `searchChunks` or a bare cosine. | Add one assertion to the existing test: take an access-point phrase the map records for a known territory, replay it through `lib.search` with the same binding used in AC-1301, and assert the territory's document is among the hits. |
| 3 | warning | uat | AC-1294 | uat-edit | "Nothing on disk is touched" is checked by snapshotting `readdirSync(kbRoot())` and the mtimes of that one level (`tests/reconciliation-system-knowledge-base.test.ts:869-881`). A write *inside* `kb/system/` changes neither the parent listing nor its mtime, so the check is shallower than the claim. | Walk the tree recursively (names + mtimes under `kbRoot()`) before and after, so a stray write into the corpus directory is visible to the assertion. |

None of the three changes an AC verdict: each test invokes the real entry point
and would fail against a genuinely wrong implementation of its AC's main claim.
They are assertion-tightening, not missing evidence, so they are warnings and do
not affect pass/fail.

## Notes for the Editor

**Do not "fix" the declaration predicate as a duplication.** AC-1305 says every
declared value "is what the build and the reader use", while `exportCorpus`
filters on the constant `INCLUDE_FIELD` (`tools/generate/src/cli/kb.ts:198, 306`)
rather than on the declaration's `corpus` predicate. This reads like a
divergence and is not one: `ensureConfig`'s own comment records the two-gate
design deliberately — the export decides which *files exist*, the declared
predicate decides which files *belong to the KB* when the index and the reader
resolve the corpus, so a stray file arriving by another route is not silently
absorbed. Both gates name the same field, so they agree. This is recorded here
because it is the kind of thing a later pass re-derives as a bug.

**The same "name it, never count it" exception applies twice.** The story's
Technical Context flags that the nothing-opted-in refusal reports a *count* of
skipped documents (`(N did not)`) while AC-1296 requires exclusions be named
individually everywhere else. Both halves are shipped as designed and both are
tested. If a future pass touches either message, they must move together.

**The three suggested edits are all in one file and one sitting** —
`tests/reconciliation-system-knowledge-base.test.ts`, lines 711, 869-881, and
inside the AC-1303 test. None of them requires new fixtures: the stub embedder,
the seeded corpus and the `withRoot`/`withStore` helpers already in the file
carry all three.
