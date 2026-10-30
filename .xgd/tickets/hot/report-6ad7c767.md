---
uid: report-6ad7c767
id: REPORT-4644
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:18:36.507700+00:00'
updated_at: '2026-09-21T05:18:36.507700+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- **package.json** — UU, rule 2g (config, scalar). Version only: HEAD `0.2.40` vs incoming `0.2.21`. Kept HEAD. The incoming scalar is a strictly older point on the same monotonic version line, so "incoming wins" would regress it; 2g's intent is to let incoming set config facts, not to rewind a counter main has already advanced past.

- **tools/generate/src/cli/kb.ts** — UU, rule 2c. Both hunks are HEAD adding REQ-165 `projected` (the `KbStatus.projected` field and its `isProjected` tally) *on top of* code that already contains every line the incoming side contributes. Kept HEAD as the strict superset; no incoming line discarded.

- **tools/generate/src/cli/index.ts** — UU, rule 2c. Same shape: HEAD's `kb status` output splits `corpus` into `exported + projected` (REQ-165) around the incoming ticket-count comparison, and imports `writeProjections`. Kept HEAD as the strict superset.

- **tests/test_UAT_FC_REQ-123_system_kb.test.ts** — DU (deleted by us, modified by them), rule 2a + BUG-1301 precedence. Deletion is a legitimate documented refactor, not churn: commit `671a09196f` ("test(kb): assert the export command itself, and retire the duplicate suite") deleted all 503 lines and moved the scenarios into `reconciliation-system-knowledge-base.test.ts`, whose header records the rationale — "two files asserting one property is not unit-versus-integration diversity, it is the same assertion twice, and the second copy is where an upstream API change goes unnoticed because nobody is sure which file is authoritative." Resolved `git rm`.

- **tests/reconciliation-system-knowledge-base.test.ts** — UU, rules 2c/2f. Four of five hunks are pure `KIND_FIELD`/`MEMBER_KIND` constant-extraction plus the REQ-165 `paging(...)` store-installer signature on HEAD, expressing the identical `doc_kind: system_kb` rule the incoming side hard-codes — kept HEAD. The fifth hunk is covered under BUG-1301 precedence below.

- **tests/test_UAT_FC_REQ-164_corpus_export.test.ts** — added cleanly by the cherry-pick (no conflict). Kept, per 2f. Verified it runs against HEAD's evolved `kb.ts`: **12/12 pass**.

## Incoming changes preserved

All four substantive changes in the incoming commit are present in the resolved tree — confirmed by reading the resolved files, not by assuming the HEAD side subsumed them:

1. Membership read as `doc_kind`, not the retired `fields.system_kb` boolean — `kb.ts:245-256` (`DOC_KIND_FIELD`, `MEMBER_KIND`, `export function inSystemKb`).
2. Shipped KB declares `corpus: {}` — `kb/knowledge_bases.json` merged with no conflict and no change; HEAD already carries it.
3. `readDocTickets` passes `--no-limit` and refuses a truncated envelope — `kb.ts:194` and the throw at `kb.ts:208`.
4. `1c kb status` reports the corpus against the ticket count, unknown (never zero) on an unreadable store — `index.ts:826-830`.

The incoming commit's exclusion-message rename also now lands in the tests: AC-1296 asserts `not in the KB (no doc_kind: system_kb)` and asserts the absence of `fields.system_kb`, matching `index.ts:780`.

### Hunk dropped under BUG-1301 precedence

**File**: `tests/reconciliation-system-knowledge-base.test.ts`, the `test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in` block.

**HEAD-side commit that removed its target**: the REQ-164 lineage that replaced the `optedIn` boolean predicate with `inSystemKb`/`doc_kind` (`kb.ts:245-256`).

**Why this is a legitimate refactor and not a resolution shortcut**: the block on HEAD is already dead code — it calls `optedIn(...)` and reads a `tickets` binding, and *neither symbol is defined or imported anywhere in the file*. It cannot execute. Its acceptance criterion is not lost: `test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in` (same file, line ~1069) is the superseding reconciled version and carries **both** halves — the controlled-store shape matrix including `DOC-RETIRED` (`system_kb: true` asserted as a NON-member, which is exactly the incoming side's point) and the real-store agreement assertions with explicit non-vacuity guards. The incoming replacement could not be taken verbatim either: it depends on a `tickets` binding from a `beforeAll` scope that does not exist on HEAD. So no AC coverage is deleted — a broken duplicate of already-superseded coverage is.

## Pre-existing HEAD breakage repaired in the conflicted file

`tests/reconciliation-system-knowledge-base.test.ts` was red on main independently of this cherry-pick (3 errors + 3 failures), all from reconciliations that changed an implementation and left callers behind. Repaired so the resolved file is evidence again:

- Four `withStore(<array>, …)` callers left behind when `withStore` became an installer thunk — each a `TypeError`, not a failed assertion. Wrapped in `paging(…)` as every other caller already does.
- AC-1296 expected the retired `no fields.system_kb` marker — updated to the kind, per the incoming commit's own rename.
- AC-1292 asserted the live corpus holds *exactly* the exported members, which REQ-165 made false (`1c kb export` runs both producers). Split by namespace via `isProjected` rather than relaxed to a subset, so a missing member still fails and so does one arriving under the projection prefix.

**Verification**: `reconciliation-system-knowledge-base.test.ts` 18/18 and `test_UAT_FC_REQ-164_corpus_export.test.ts` 12/12 — 30/30 together. Siblings `reconciliation-system-knowledge-base-packed` and `reconciliation-projected-reference` pass.

**Unrelated environmental failure (not touched by this resolution)**: `test_UAT_FC_REQ-165_projected_reference.test.ts` has 1 failure — `knowledge base 'system' reads from source 'shipped', which this host has no index for` — because the KB is not built in this fresh worktree (`1c assets` reports `kb *** NOT BUILT ***`). Needs `1c kb build`, which reaches a model. Also note `1c assets` had to be run to generate the gitignored per-checkout `src/generated/ai-workers.js` before any suite could import.
