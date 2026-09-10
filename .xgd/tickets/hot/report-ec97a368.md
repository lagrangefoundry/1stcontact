---
uid: report-ec97a368
id: REPORT-3692
type: report
title: 'Fix System Knowledge Base: The Corpus, Its Index & Its Generated Map (uat)
  — attempt 1'
created_by: xgd
created_at: '2026-09-10T07:47:51.247528+00:00'
updated_at: '2026-09-10T07:47:51.247528+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-45acba5e
  level: uat
  fixes_applied: 9
  progress_made: true
  needs_more_work: true
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — System Knowledge Base: The Corpus, Its Index & Its Generated Map (uat)

**Attempt**: 1
**Fixes applied this call**: 9
**Violations remaining**: 0 (all 4 addressed; 2 warnings + 1 needs_review remain)
**Needs more work**: true

All four violations (findings 1–4) are resolved and verified by execution.
`tests/reconciliation-system-knowledge-base.test.ts` — the AC-traceable evidence
file, one test per AC — now runs **16 passed, 0 failed, 0 skipped**, where the
assessor measured 5 failed / 6 passed / 5 skipped with one of the passes vacuous.

```
tests/reconciliation-system-knowledge-base.test.ts   16 passed (16)
tests/test_UAT_FC_REQ-123_system_kb.test.ts           7 passed | 8 skipped (15)
```

The second file is the same-shape duplicate of finding 8; its three call sites
were fixed (it was 15/15 skipped), and its remaining 8 skips are the live-store
dependency that finding 8's retire/merge decision will settle next iteration.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | `tools/generate/src/cli/kb.ts:583` | `source: indexSource` → `indexes: { [SHIPPED_SOURCE]: indexSource }`. Unblocks `buildKb()` and therefore AC-1291, AC-1293, AC-1299, AC-1301, AC-1302, AC-1303, AC-1304, AC-1306 (finding 1) |
| 2 | code-issue | `tools/generate/src/cli/kb.ts:728-731` | `source`/`chunkSource` → `indexes`/`chunkIndexes`, same keying. The assessor asked this be checked; it had the same defect, silently — `KnowledgeRuntime.open` destructures `indexes` and ignores unknown keys, so the chat session's runtime was opening with no index at all rather than throwing |
| 3 | uat-edit | AC-1301 UAT (`:337`) | `indexes: { [SHIPPED_SOURCE]: … }`; imports `SHIPPED_SOURCE` from `kb.ts` rather than restating `'shipped'` |
| 4 | uat-edit | AC-1302 UAT (`:359`) | same, for `searchChunks` |
| 5 | uat-edit | AC-1305 UAT (`:656`) | `binding.kb.prompt` → `binding.kb.description`, following framework REQ-109 as `393a447a85` did for the JSON literal. The AC's central claim — the declared prose is the thing in force — is now actually proven (finding 2) |
| 6 | uat-edit | AC-1295 UAT | Integration half moved onto a **seeded** store: one document per near-miss shape (`true`, `'true'`, `1`, `false`, no fields) through the real `exportCorpus`, asserting exactly `DOC-IN` exported, the other four named as skipped, one file on disk. The real store is kept but asserted for **agreement** only — the `expect(shouldBeIn.length).toBeGreaterThan(0)` hard precondition on data no branch controls is gone (finding 3) |
| 7 | uat-edit | AC-1297 UAT | Read-back shape assertions (human-id shape, non-empty title/body, `origin_uid` provenance) now run over a seeded two-document corpus with `expect(seededBack.length).toBe(2)` before the loop, so they cannot silently degrade to zero iterations. The same assertions still run over the real corpus, plus the count round-trip (finding 4) |
| 8 | ac-edit | AC-1305 | Criterion and Verification: "prompt" → "description" throughout, per framework REQ-109 (finding 7) |
| 9 | story-body-edit | STORY-117 | "The declaration is the thing in force" bullet: "Prompt, weight and the membership predicate" → "Description, weight and the membership predicate" (finding 7, paired with #8) |
| 10 | ac-edit | AC-1295, AC-1297 | Verification sections rewritten to prescribe the seeded mixture rather than "the real document store", recording *why* (a verdict must not turn on data no branch controls; a loop over an empty corpus asserts nothing while reporting green). This also discharges the `ac-edit` finding raised at AC level in report-e7681edd |

Counted as 9 mutations: 2 production edits, 5 test edits, 3 ticket edits (AC-1295,
AC-1297 counted once as a paired edit with AC-1305 and STORY-117).

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/kb.ts` | 583-588 | Assessor categorized finding 1 `code-issue` and I reached the same conclusion independently: `search()` destructures `{ indexes, … }` (`@lagrangefoundry/knowledge/src/search.js:243`) and resolves via `indexFor(kb, indexes)` (`index_store.js:113-124`), which throws `KnowledgeConfigError` when the map has no entry for the KB's declared source. `SHIPPED_SOURCE` is the name `bindKb` already keys `sources` by (`kb.ts:453`) and the name the declaration carries (`kb.ts:377`), so the map key is not a choice. Verified: the 4 failing ACs now pass and the 4 skipped ones now execute |
| `tools/generate/src/cli/kb.ts` | 725-733 | `KnowledgeRuntime.open({ indexes, ...rest })` (`@lagrangefoundry/ai-knowledge/src/toolbox.js:257`) and the constructor's `indexes = null, chunkIndexes = null` (`:269-286`) — `source`/`chunkSource` were being dropped on the floor, so the session's runtime held no index. Independently corroborated: with kb.ts reverted, `test_UAT_FC_REQ-123_a_search_runs_through_the_toolbox_and_returns_a_hit` fails; with the fix it passes |

**Regression check.** I baselined the two adjacent suites that consume
`openKnowledgeRuntime` by reverting kb.ts and re-running: `test_UAT_FC_REQ-123_session_knowledge.test.ts`
+ `reconciliation-assistant-conversation-knowledge.test.ts` were **7 failed / 3 passed**
before my change and **6 failed / 4 passed** after. Strictly better; nothing regressed.
Those 6 are pre-existing upstream drift in an adjacent capability (the assistant's
session-knowledge surface, AC-1317…AC-1320), not this one — two distinct causes,
both the same class as finding 2: the grant's tool set gained `KnowledgeChanges` and
`KnowledgeOutline` upstream, and `KnowledgeDocs` is no longer exported. Out of scope
here; worth an assessor note for that capability.

## Remaining Work (next iteration)

| Finding | Severity | Plan |
|---|---|---|
| 6 | warning | AC-1296's "says why they are out" reason text (`tools/generate/src/cli/index.ts:749-750`) is unasserted — no test drives the command layer for it. Plan: drive `cli(['kb','export'])` and assert the captured stdout carries the reason phrase and each excluded id, and that the line is absent when nothing was skipped |
| 8 | warning | Retire `tests/test_UAT_FC_REQ-123_system_kb.test.ts`. I audited the overlap this call: all 15 of its scenarios map onto AC-traceable tests in the evidence file, exactly as the assessor tabulated, so no coverage is lost. I did not delete it this call — it is the one irreversible action in the set and I would rather land it as its own reviewable change than fold it into a batch. Its 8 remaining skips are the same empty-live-store cause; retiring it removes them, and the alternative (adding a second copy of the stub-store harness to it) would deepen the duplication the finding is about |

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-1295, AC-1296, STORY-117 (finding 5) | The matrix and mainline code say membership is `fields.system_kb: true` (REQ-123, `free_and_reconciled`), but all 38 `doc` tickets had that flag cleared on 2026-08-31 ahead of REQ-164, which is still `draft` and blocked on xgd REQ-827 — so by the status table its `doc_kind` rule does not count toward cumulative intent. A free-coded implementation exists on `origin/reconcile-BUNDLE-23` (`2db8ee6b90`) but on neither this branch nor `origin/main` | Either activate/reconcile REQ-164 — then AC-1295 and AC-1296 need an `ac-edit` to a closed-enum `doc_kind` rule (losing the genuine-boolean shape assertions) and STORY-117 needs a `story-body-edit` — or restore the boolean on the intended documents. I did **not** guess. My edits are deliberately neutral on it: the seeded corpus asserts the rule REQ-123 governs, and the real-store half now asserts agreement, which holds under either rule and at zero documents. The system KB still builds an **empty corpus** on this branch, and `1c kb build` still refuses with the AC-1300 message — that is unchanged and is the operator's to settle |

## Note for the operator

Finding 1 was a live production defect, not a test artefact: `1c kb build` threw on
`origin/main` for the same reason. The seam is the shared JS artifact store at
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry`, updated by an
operator-run install independently of this repository's commits — so an upstream API
change arrives here as a silently red suite. I swept the repository for other callers
of the changed functions: `kb.ts:583`, `kb.ts:725`, and three test call sites were all
of them, and all five are now fixed.
