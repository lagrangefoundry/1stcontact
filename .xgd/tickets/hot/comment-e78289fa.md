---
uid: comment-e78289fa
id: COMMENT-2490
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T07:40:31.133984+00:00'
updated_at: '2026-09-10T07:40:31.133984+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d1021dfa
  kind: note
---

**REPORT-3691 (report-d1021dfa) — FAIL**: 4 violations, 3 warnings, 1 needs_review.

All 16 ACs have a correctly-named, correctly-targeted UAT — count coverage is complete. The problem is that most of them don't currently produce a verdict. I ran both suites rather than reading them:

```
tests/reconciliation-system-knowledge-base.test.ts   5 failed | 6 passed | 5 skipped (16)
tests/test_UAT_FC_REQ-123_system_kb.test.ts          15 skipped, 2 suites dead in beforeAll
```

Two root causes:

**1. `search()` API drift — a production defect, not a test defect.** `kb.ts:583-584` passes `source: indexSource`; the installed `@lagrangefoundry/knowledge` destructures `indexes` and resolves it via `indexFor(kb, indexes)`, so every `buildKb()` throws `KnowledgeConfigError: … has no index for (available: none)`. `1c kb build` is broken on `origin/main` too (identical line 584), and `origin/reconcile-BUNDLE-23` doesn't fix it either. Costs the evidence for 8 ACs.

**2. The corpus is empty.** All 38 `doc` tickets had `fields.system_kb` cleared on 2026-08-31, ahead of REQ-164 — which is still `draft` and blocked on xgd REQ-827. AC-1295 fails loudly; AC-1297 **passes vacuously** (`0 === 0`, per-document loop never runs), which is the more dangerous shape.

Separately, AC-1305's UAT asserts `binding.kb.prompt` against a string it never wrote — commit `393a447a85` renamed the declaration literal `prompt`→`description` but left the assertion behind.

The needs_review is deliberate: the matrix and mainline code say `system_kb: true`, the data says otherwise, `origin/reconcile-BUNDLE-23` implements `doc_kind` — and the intent governing the change is still a draft. Step 2.5's implementation check is genuinely inconclusive (split across branches), so I escalated rather than guessed.

Warnings: AC-1296's "says why they are out" reason text (`index.ts:750`) is unasserted; AC-1305's wording still says "prompt"; and `test_UAT_FC_REQ-123_system_kb.test.ts` duplicates 14 scenarios in the same shape — with a third overlapping file (`test_UAT_FC_REQ-164_corpus_export.test.ts`, 451 lines) queued on the reconcile branch.
