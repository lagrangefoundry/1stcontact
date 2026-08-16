---
uid: report-a6a4e1e2
id: REPORT-2086
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=uat)'
created_by: xgd
created_at: '2026-08-16T07:17:10.382484+00:00'
updated_at: '2026-08-16T07:17:10.382484+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Both intent bundles that touched this capability are fully reconciled. Chronological ledger:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | R2 artifact store — the content-addressed deploy layout and deploy index; originates STORY-94 | YES |
| REQ-111 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | public-site Worker — the visitor half of delivery; originates STORY-95 | YES |
| REQ-113 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | `1c serve` / Worker extensionless→`.html` agreement; originates STORY-96 | YES |
| REQ-109 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | Document-relative asset emission. Owned by STORY-83 in another capability; a **precondition** this capability's serving ACs rest on (AC-904, AC-921) | YES (as dependency) |
| BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | `relativizeUrl` fragment case. STORY-83's surface, not this capability's | YES (not in scope here) |
| REQ-108 (BUNDLE-13) | free_and_reconciled | 2026-08-06 (`1ee6aaf2d2`) | L1 substrate work; does not touch delivery | YES (not in scope here) |
| BUG-31 (BUNDLE-14) | free_and_reconciled | 2026-08-06 (`cd8f98c89e`) | Store-tree (root) scoping of every R2 key + `SERVABLE_ROOT` fixed in the server. **Added AC-924/925/926 to STORY-94 and AC-927 to STORY-95**; resolution chosen was *namespace*, not refuse | YES |
| REQ-114 (BUNDLE-14) | free_and_reconciled | 2026-08-06 (`cd8f98c89e`) | L1 palette colour model; different capability | YES (not in scope here) |
| REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-08-06 (`cd8f98c89e`) | Edit render channel; different capability | YES (not in scope here) |

No abandoned/deprecated/draft intent touches this capability, so nothing in the
tree is expected to have been retired. No imminent (`ready_to_reconcile` /
`bundled`) intent is pending against it either.

## Alignment Ledger

Level is `uat`, so AC bodies are the working reference. Every one of the 36 active
ACs was read in full and matched against the test that claims it. Tests live in
four files, all driving real entry points.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-94 / AC-892 … AC-901 (10 ACs) | REQ-110 | aligned — each AC has one substantive UAT in `tests/reconciliation-deploy-snapshot.test.ts`, driven through the real `cmdDeploy` |
| STORY-94 / AC-924, AC-925, AC-926 | BUG-31 | aligned — root-scoping, no-URL-and-why, and per-tree index each have their own UAT in the same file |
| STORY-95 / AC-902 … AC-914 (13 ACs) | REQ-111 | aligned — each AC has one substantive UAT in `tests/reconciliation-serve-deployed-snapshot.test.ts`, observed at the HTTP boundary through the Worker's real `fetch` |
| STORY-95 / AC-927 | BUG-31 | aligned — carried alone in `tests/reconciliation-servable-root-confinement.test.ts`, exactly as that file's header states |
| STORY-96 / AC-915 … AC-923 (9 ACs) | REQ-113 (+ REQ-109 as precondition) | aligned — each AC has one substantive UAT in `tests/reconciliation-clean-page-urls.test.ts`, covering both environments (real loopback preview server + Worker `fetch`) |

### Consistency

Every test exercises the criterion its AC states, and follows that AC's own
`## Verification` recipe step for step. Spot-checks where drift would be easiest:

- **AC-893** asks for "run two returns the same id and URL, uploads nothing,
  leaves the stored object count unchanged; run three returns a different id; the
  run-one entry page still carries the old string". The test asserts each clause,
  including the object-count invariance.
- **AC-906** asks for a *within-channel* byte-comparison of whole responses and
  that the only differing header across channels is AC-910's no-index directive.
  The test does exactly that (`Object.keys(draft).filter(...)` → `['x-robots-tag']`),
  which is a notably faithful reading of a subtle criterion.
- **AC-917** asks specifically that a bare directory returns the *directory's*
  index, not the same-named page file. The test seeds that exact collision
  (`guides.html` + `guides/index.html`) and asserts the index content wins.
- **AC-926** asks for byte-identity of the untouched tree's index. The test
  captures the raw index bytes before and compares them after.

### Coverage

All 36 active ACs have at least one substantive UAT. None is a structural or AST
check. Evidence validity holds throughout: the only fakes are `MemoryR2Client`
(the upload boundary) and `FakeBucket` (the R2 binding) — both genuine external
system boundaries. Every layer above them is real: the route grammar, the deploy
index, the header policy, the edge cache, the CLI commands, and the local preview
server (driven over its real loopback address, and over a raw socket where a
traversing request must survive client-side normalisation). No internal component
is mocked anywhere in the four files.

### Exclusivity

No two tests verify the same scenario in the same shape. The three places where
scope could plausibly overlap are each explicitly partitioned by the AC bodies
themselves, and the tests honour the partition:

- **AC-905 vs AC-927** — AC-905's body states the tree gate "is AC-927's criterion
  and is proven there", and confines itself to *within* the servable tree. The
  AC-905 test uses orphan/unlink cases inside `sites/`; the AC-927 test uses a
  sandbox-only deployment. Disjoint.
- **AC-907 vs AC-923** — AC-907 covers malformed/traversal input generally;
  AC-923 covers the narrower claim that such a URL never reaches the clean-URL
  mapping, and its cases are deliberately shaped with an extensionless last
  segment (so they *would* be eligible if well-formed), additionally asserting
  `htmlFallback` is undefined. Different claims, different fixtures.
- **AC-892 vs AC-925** — see finding #1 below; not a duplicate.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | exclusivity | AC-892 / `test_UAT_AC892_draft_deploy_ships_complete_artifact_to_content_addressed_preview` | — | AC-892's body says what a non-servable-tree deploy returns "is AC-925's criterion and is not restated here", yet the test closes its scratch-tree block with `expect(scratch.url).toBeNull()`. Not a duplicate: the block's subject is AC-892's own criterion (shipping and indexing are tree-agnostic — same halves, same content addressing, same preview entry), and the single null-URL line is a boundary marker rather than a re-test of AC-925, whose UAT additionally covers explicit-absence-vs-empty-string, the report's terminal line, and the CLI help text. Note also that AC-896's body takes the opposite tack for the same shape ("The non-servable tree behaves as AC-925 states, on this channel as on the draft one"), which actively warrants its equivalent assertion | none |
| 2 | info | consistency | AC-914 / `test_UAT_AC914_deploy_colliding_with_the_reserved_preview_segment_is_refused` | — | The refusal is asserted at `assertNoReservedSegment`'s own entry point rather than through a deploy attempt. This is prescribed, not evaded: AC-914's body explains that flat-by-construction rendering (REQ-109) makes the collision unreachable through the deploy command today, and its Verification section asks for exactly this shape. The test also pins that reason end-to-end with a real deploy of a nested slug that is refused and writes nothing, and carries a comment naming the assertion that will fail the day rendered output gains nesting | none |
| 3 | info | consistency | AC-907, AC-923 | — | Both supplement HTTP-boundary assertions with direct `parseRoute` assertions for dot-shaped and empty components. Prescribed by the AC bodies: WHATWG URL parsing collapses those spellings before dispatch, so the grammar's rejection cannot be observed through `fetch` alone. Both tests still drive the collapsed forms through the real entry point and assert no snapshot read occurred | none |

## Notes for the Editor

**Nothing to repair.** Zero violations, zero warnings, zero needs-review. All
three info findings are recorded as ledger entries explaining why an
apparent overlap or apparent non-end-to-end assertion is in fact correct and
AC-prescribed — they exist so a future check does not re-litigate them as drift.

Two cross-cutting observations worth carrying forward:

1. **The AC bodies in this capability carry explicit scope-partition sentences**
   ("is AC-925's criterion and is not restated here", "is AC-927's assertion and
   is not repeated here"). This is unusually disciplined and is the main reason
   exclusivity is clean across 36 ACs on a capability with two halves that touch
   the same storage layout. Preserve those sentences under any future edit — they
   are load-bearing for this check.

2. **BUG-31's four ACs (924–927) are cleanly separated from the ACs they
   retrofitted.** Root-scoping was added as new criteria rather than by mutating
   REQ-110/REQ-111's originals, so the pre-BUG-31 ACs still read correctly and no
   story body describes a flattened key layout. No residual references to the
   pre-namespace layout appear anywhere in the tree.

**Scope caveat, stated plainly:** this check is read-only alignment, and I
verified UAT substantiveness by reading all four test files in full rather than by
executing them. Test execution was not possible in this session — `npx vitest run`
and `npm test` were both denied by the session's Bash permission mode (`xgd
ticket`, `grep` and `Read` were permitted). Execution status is a separate gate
and is already recorded independently as `uat_coverage: pass` on all 36 ACs, all
three stories and the capability. If the regression run wants execution evidence
from this step specifically, the four files are:
`tests/reconciliation-deploy-snapshot.test.ts`,
`tests/reconciliation-serve-deployed-snapshot.test.ts`,
`tests/reconciliation-servable-root-confinement.test.ts`,
`tests/reconciliation-clean-page-urls.test.ts`.
