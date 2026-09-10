---
uid: report-e7681edd
id: REPORT-3690
type: report
title: 'Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index
  & Its Generated Map (level=ac)'
created_by: xgd
created_at: '2026-09-10T07:28:36.041917+00:00'
updated_at: '2026-09-10T07:28:36.041917+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-45acba5e
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index & Its Generated Map
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a · Capability: capability-45acba5e (CAP-100) ·
Previous attempts: 0

The capability holds exactly one story — STORY-117 (story-c4f329d3,
`story_kind: feature`, status `completed`) — and 16 acceptance criteria, all
`status: active`. At `ac` level the story body is the working reference; intent
history was loaded to establish which asks are live and was consulted where the
story body needed grounding.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-123 (request-488d874b), reconciled via BUNDLE-19 (bundle-77b28def, `merged_at_commit b18b859d`) | `free_and_reconciled` | created 2026-08-07, completed 2026-08-20 | Stood up the system KB in full: corpus export from `doc` tickets, document + passage indexes, generated awareness map, `system_kb: true` opt-in membership on the document, named exclusions, human-id addressing, deletion-on-withdrawal, incremental export/index, the authored declaration, and the single-embedding-model rule | **YES** — this is the whole of the live intent for this capability |
| REQ-164 (request-909e42f8) — Corpus export correctness: `doc_kind` filter, unrestricted shipped corpus, exhaustive listing | `draft` | 2026-08-31 | Would replace the `system_kb` boolean with `doc_kind: system_kb`, drop the query-time corpus predicate, and page `readDocTickets` exhaustively. Blocked on xgd REQ-827 | **NO** — draft; not yet active intent |
| REQ-158 (request-6893f6ea) — system KB in the Worker | `draft` | — | Bundle-resident index, AI binding, knowledge surface on the builder toolbox | NO |
| REQ-159 (request-119dd4af) — project knowledge base | `draft` | — | Tenant-scoped corpus, incremental index, map triggers | NO |
| REQ-160 (request-bbff35c7) — session seeding / turn reminders | `draft` | — | Two-KB priming, change cursor, delta channel | NO |
| REQ-163 (request-439cd0c8) — ingestion | `draft` | — | Dropped file → indexed material ticket | NO |
| REQ-166 (request-20bd7d63) — capture to ticket | `draft` | — | Bundles become corpus members | NO |
| REQ-18 (request-72e890ab) — crawler + batch coverage engine | `abandoned` | — | Phase 1 corpus + classification (unrelated corpus) | NO |

Cumulative intent for this capability is therefore **REQ-123 alone**. No
reconciled intent retires or modifies any part of it. Neither STORY-117 nor any
of the 16 ACs carries an `updated_by` chain — every element is aligned to the
single originating intent.

## Alignment Ledger

Each AC against STORY-117's body (its working reference at this level), and the
in-scope bullet or Technical Context paragraph it discharges.

| Element | Intents aligned to | Story-body clause discharged | Outcome |
|---|---|---|---|
| AC-1291 (acceptance_criterion-2a7a9d2b) — whole pipeline in order, reports what it produced | REQ-123 | "Building it" §1, + "the whole pipeline is one command and the order is fixed" | aligned |
| AC-1292 (acceptance_criterion-4d4ee569) — corpus alone, no model, no credentials, coherent tree | REQ-123 | "Building it" §2 ("still leaves a coherent tree, because it writes the declaration too") | aligned |
| AC-1293 (acceptance_criterion-9926d333) — status report; bare command answers rather than acts | REQ-123 | "Building it" §3 ("A third reports what is currently built") | aligned (bare-command form is a refinement the story does not name; consistent, not contradictory) |
| AC-1294 (acceptance_criterion-35ddcab3) — unrecognised form refused, usage, failing exit, builds nothing | REQ-123 | "Building it" §4 | aligned |
| AC-1295 (acceptance_criterion-3ae69518) — opt-in only, genuine boolean only, six shapes | REQ-123 | "Membership, opt-in, per document, on the document" (+ REQ-123 decision 2) | aligned; see warning 1 on its Verification half |
| AC-1296 (acceptance_criterion-9030cb80) — exclusions named individually, never counted, never silent | REQ-123 | "Named exclusions" | aligned |
| AC-1297 (acceptance_criterion-6ebb875b) — human-id address, round-trips as a document, structured fields dropped | REQ-123 | "Identity that survives a retitle" + Technical Context "Structured fields are dropped rather than coerced" | aligned; see warning 1 on its Verification half |
| AC-1298 (acceptance_criterion-40c77d21) — withdrawal is deletion, both routes, map never swept | REQ-123 | "Withdrawal is deletion" (+ "The map is generated, always") | aligned |
| AC-1299 (acceptance_criterion-c8ca5afa) — unchanged document not rewritten, unchanged corpus not re-embedded | REQ-123 | "Rebuilds are incremental and honest about it" + Technical Context "The document store ignores frontmatter timestamps" | aligned |
| AC-1300 (acceptance_criterion-54bad87d) — nothing opted in → refused naming the mechanism, before any model | REQ-123 | Technical Context "One place the 'name it, never count it' rule is not followed" | aligned |
| AC-1301 (acceptance_criterion-d88c844a) — found by describing it, without id/filename/title | REQ-123 | Capability §"Two indexes"; story's "index" row ("a vector index over whole documents") | aligned |
| AC-1302 (acceptance_criterion-3db47b92) — passage search returns a section and names its parent | REQ-123 | "a whole design document is far too coarse a unit to hand back as an answer" | aligned |
| AC-1303 (acceptance_criterion-33f29429) — map generated from its corpus, corpus's own vocabulary, doorless territory named | REQ-123 | "The map is generated, always" (clustering, reader's-own-search validation, doorless naming) | aligned |
| AC-1304 (acceptance_criterion-dead3c88) — map kept out of the corpus, retrievable as the awareness report | REQ-123 | "The map is kept out of the corpus it describes, or every rebuild would cluster the previous build's map" | aligned (the "no second, file-shaped path" clause is a refinement beyond the story's letter; consistent with it) |
| AC-1305 (acceptance_criterion-038a6f21) — declaration in force, never overwritten, missing one refused by name | REQ-123 | "The declaration is the thing in force" + Technical Context "the declaration is authored" | aligned |
| AC-1306 (acceptance_criterion-c3bc84cf) — indexing refused without embedding credentials; the map's prose needs none | REQ-123 | Technical Context "The describing model needs no credentials; the embedding model does" (+ REQ-123 decisions 4 and 5) | aligned |

### Coverage: every in-scope clause of STORY-117 is discharged

- Building it (4 forms) → AC-1291 / AC-1292 / AC-1293 / AC-1294
- Membership, opt-in, on the document → AC-1295
- Named exclusions → AC-1296
- Identity that survives a retitle → AC-1297
- Withdrawal is deletion → AC-1298
- Rebuilds are incremental → AC-1299
- The map is generated, always → AC-1303 + AC-1304
- The declaration is the thing in force → AC-1305
- One embedding model on both sides → covered by consequence; see info finding 2

Every clause the story places **out of scope** is correctly absent from the AC
set: no AC touches the chat session's knowledge surface or its priming, corpus
curation, tenant knowledge bases, the D1 ticket store, or corpus residency for a
deployed Worker. The degradation behaviour (`openKnowledgeRuntime` returning
`null` on an unbuilt KB, `tools/generate/src/cli/kb.ts:717`) is likewise
correctly *not* an AC here — the story assigns it to the assistant's own story.

### Exclusivity: no two ACs describe the same criterion

The three membership-adjacent ACs are distinct properties, not restatements:
AC-1295 is the *decision* rule, AC-1296 is the *reporting* of what the decision
excluded, AC-1300 is the *refusal* when the decision excludes everything. The
implementation mirrors that separation as three separate code paths
(`optedIn` at `tools/generate/src/cli/kb.ts:198`, the `skipped` line at
`tools/generate/src/cli/index.ts:748`, the throw at
`tools/generate/src/cli/kb.ts:672`).

Likewise AC-1296 (skipped *tickets*, named) and AC-1298 (removed *files*, named)
report on disjoint sets and are two console lines, not one. AC-1301 and AC-1302
address the two different indexes. AC-1303 (how the map is made) and AC-1304
(where it lives and how it is fetched) are orthogonal. AC-1292 asserts the
corpus-only form *succeeds* without credentials; AC-1306 asserts the full build
*fails* without them — complementary halves of the same asymmetry, not
duplicates.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1295 (acceptance_criterion-3ae69518), AC-1297 (acceptance_criterion-6ebb875b) | ac-edit | Both ACs' **Verification** sections prescribe asserting against **"the real document store"**. That premise no longer holds: of the 38 `doc` tickets, **zero** now carry `fields.system_kb: true` (verified through the export's own code path — `xgd ticket list --type doc --view --json`, the exact call `readDocTickets` makes at `tools/generate/src/cli/kb.ts:158`; every ticket now carries `doc_kind` instead). The flags were cleared ahead of REQ-164 (request-909e42f8), which is still `draft` and therefore does **not** count toward cumulative intent — so the ACs' *criteria* remain correct for REQ-123, but their prescribed verification method is no longer executable. Concretely, `tests/test_UAT_FC_REQ-123_system_kb.test.ts:357` asserts `expect(first.docs.length).toBeGreaterThan(0)` against the live store, and the enclosing `beforeAll` (`tests/test_UAT_FC_REQ-123_system_kb.test.ts:339-343`) selects `sampled` from a now-empty corpus directory and `statSync`s it | In each AC's Verification, replace "the real document store" with a fixture store holding a known mixture of opted-in and opted-out documents (the phrasing AC-1296 already uses: "a store holding a mixture of opted-in and opted-out documents"). Leave both **Criterion** sections untouched — they are correct |
| 2 | info | coverage | STORY-117 in-scope clause "One embedding model on both sides" | — | No AC states this property directly. It is covered by consequence: AC-1301 and AC-1302 are end-to-end searches over a built index, which can only pass if build-time and query-time vectors are comparable, and AC-1306 carries the operator-visible half ("deliberately no local stand-in"). The story itself frames it as holding "by construction rather than by argument" — an architectural invariant rather than a behaviour with its own acceptance surface. Implementation confirms the single seam: `resolveEmbedder()` (`tools/generate/src/cli/kb.ts:473`) is the sole embedder source for both `buildKb` and `openKnowledgeRuntime` | none — recorded so a future check does not read this as a fresh gap |
| 3 | info | consistency | AC-1293 (acceptance_criterion-9926d333), AC-1304 (acceptance_criterion-dead3c88) | — | Each carries a clause beyond the story body's letter — AC-1293's "the bare command answers rather than acts", AC-1304's "no second, file-shaped path that only a shipped knowledge base would use". Both are refinements consistent with the story rather than unsupported claims, and both are implemented as written (`const sub = rest[0] ?? 'status'` at `tools/generate/src/cli/index.ts:736`; the map written as an ordinary awareness-report ticket via `awarenessDocument` at `tools/generate/src/cli/kb.ts:643`) | none |
| 4 | info | consistency | CAP-100 body vs STORY-117 body | — | The capability body asserts runtime properties — "Read-only… Nothing at runtime can write to it… it takes the scope parameters like every other knowledge call, and does not vary by them" — that STORY-117 explicitly places **out of scope** ("Tenant knowledge bases, and the ticket store on D1"). No AC covers them, which is correct for this level. Noted only so it is not mistaken for an AC coverage gap; if it is drift at all it is story-level, and the story-level cycle ran first | none |

## Notes for the Editor

**The one thing worth acting on is finding 1, and it is narrower than it looks.**
The matrix is aligned with cumulative intent — REQ-123's asks are fully and
exclusively expressed by the 16 ACs. What has moved underneath is the *data*, not
the intent: the `system_kb` boolean has been cleared from all 38 `doc` tickets in
anticipation of REQ-164, which is still `draft`. Per the status table, a draft
intent does not count, so the correct reading is that the ACs are right and the
store is temporarily ahead of them.

Two consequences an editor and the operator should both know:

1. **`1c kb build` cannot succeed against the live store today.** With zero
   opted-in documents, `buildKb` takes the AC-1300 refusal path
   (`tools/generate/src/cli/kb.ts:670-680`) before reaching any model. That is
   the *specified* behaviour, correctly implemented — it is the store, not the
   code, that has changed. Worth stating plainly because "the KB build is broken"
   is the wrong diagnosis and would send someone into `kb.ts`.

2. **Do not resolve finding 1 by editing the ACs' Criterion text toward
   `doc_kind`.** That would be adopting a `draft` intent into the matrix ahead of
   reconciliation. The membership rule in force is REQ-123's boolean; when REQ-164
   reconciles (it is blocked on xgd REQ-827 adding `system_kb` to the closed
   `doc_kind` enum), AC-1295, AC-1296 and AC-1300 will all need editing together,
   and the story body's "Membership, opt-in, per document, on the document"
   paragraph with them. The fix now is confined to the two Verification
   paragraphs.

**A uat-level observation, recorded here because this cycle surfaced it.** The
tests under `tests/test_UAT_FC_REQ-123_system_kb.test.ts` are named
`test_UAT_FC_REQ-123_*`, not the `test_UAT_AC<number>_*` form the test strategy
mandates, so no AC in this capability has a name-resolvable UAT. That is out of
scope for an `ac`-level check and is not counted in this report's totals, but the
`uat`-level cycle for capability-45acba5e will find zero tests by convention
unless it maps them by content.
