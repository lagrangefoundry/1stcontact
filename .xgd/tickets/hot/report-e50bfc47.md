---
uid: report-e50bfc47
id: REPORT-3965
type: report
title: 'Reconciliation Review: commits (BUNDLE-26)'
created_by: xgd
created_at: '2026-09-11T09:06:20.090950+00:00'
updated_at: '2026-09-11T09:06:20.090950+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-87be4669
**Stories Reviewed**: 17 (story-c4f329d3 carries plan items 1 and 3; plan item 15 targets story-e674c60a and story-7f437d57)

**This is the sixth cycle, and the first that passes.** The two criteria the fifth
review named — AC-1295 and AC-1652 — are resolved, and the resolutions were
re-derived here rather than inherited. Steps 4 (intent fidelity and coverage) and
6 (plan-item accounting) pass, spot-checked independently. Step 5b passes on
naming (145/145, computed this cycle), on design (re-scanned across all 22
suites), and on execution for every criterion this session can execute.

One environment caveat is stated plainly below rather than buried: **95 of the
145 criteria live in the `workers` vitest project, which cannot start in this
session** (`listen EPERM`, the fourth session in six to hit it). Their evidence is
first-hand from the fix session at a tree identical to `HEAD` in every test and
source file. That is recorded as what it is.

---

## What changed since report-061819f5

`fix_reconciliation_review` (report-5da6762f) touched **two test files and no
production code**. Verified by diff: `git log --name-only b5c3fbf344..HEAD --
tests/ apps/ tools/ db/ packages/` returns exactly
`tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`
and `tests/reconciliation-system-knowledge-base.test.ts`, both in `e043e6001d`.
Everything else since is ticket commits. Two ACs and two story bodies were
updated alongside.

### AC-1295 — verified green here, and the restatement is legitimate

Observed directly this cycle: `test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in`
**passes**. The suite's only failure is `test_UAT_AC1297_*`, whose AC is absent
from this branch's store.

The restatement was scrutinised for weakening-to-pass and is not one:

- **The synthetic half is untouched and is the discriminating evidence.** All six
  field shapes are still asserted, positively and negatively — `DOC-KIND` is the
  only member, the corpus holds exactly `DOC-KIND.md`, and the retired
  `system_kb: true` boolean is excluded by name
  (`tests/reconciliation-system-knowledge-base.test.ts:998-1019`). The membership
  rule itself — including the positive case — is proven, not assumed.
- **What was removed was an assertion beyond the criterion.** AC-1295's
  Verification asked for *agreement* between rule and store. `toBeGreaterThan(0)`
  on the member set was an extra clause the UAT had added, and it pinned curation
  state that nothing in this repository can produce: `doc_kind: system_kb` is not
  yet a value the closed enum accepts, which REQ-164's own body declares as a
  blocker on xgd REQ-827.
- **What replaced it is substantive, not vacuous.** The guard asserts the store
  holds documents, that member + excluded equals the total, and that the excluded
  set is non-empty — 38 documents, every one correctly excluded. The
  corpus-directory check was *strengthened* in passing, from a per-document
  absence to an equality over the whole directory
  (`:1058-1060`), so a file the rule never selected cannot survive there either.
- **It resolves an internal contradiction rather than creating one.** AC-1300 in
  the same story pins the empty-member-set store as a *refused* build, by name. A
  sibling criterion demanding that same store be non-empty could not also be true.
- **The fifth review's preferred remedy was correctly refused.** It proposed
  syncing 8 `doc_kind: system_kb` doc tickets from main; the fixer verified they
  do not exist in either tree and declined. Fabricating curation data was the
  alternative and was not taken. That refusal was right.

### AC-1652 — restated from a roster to the property, and strictly stronger

Read in full at
`tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts:461-558`.
The `READ_SET = [...3 names]` equality is gone. What stands in its place, all
derived from the declaration read **off the surface the session travelled with**
(`surface.constructor.DECLARATION`), so no second copy exists to drift:

1. Granted ops resolved through the declaration (operations outright, or a
   group's own list), every one declared, and the set non-empty — the two clauses
   that stop the rest passing over a typo or an empty grant (`:521-522`).
2. **Every granted operation declares `effect: read`**, paired tool-by-tool so a
   failure names the operation (`:527-529`).
3. **Every granted group is itself a declared read group** (`:532-534`) — which
   catches a write operation arriving inside an already-granted group, something
   the roster equality caught only by accident.
4. The model is offered **exactly** the granted operations, and nothing wearing
   the surface's naming reaches it from outside the declaration (`:540-548`).
5. The grant names `SYSTEM_KB` on **every** axis the declaration defines, not the
   two that exist today (`:554-557`).

This is stronger than what it replaces on points 3, 4 and 5, and inert to a
read-only upstream addition. The premise was re-checked: both newly-arrived
operations (`KnowledgeOutline`, `KnowledgeChanges`) declare `effect: read`, so
the criterion's substantive claim never stopped being true — what was stale was
an identity snapshot standing proxy for a property. The criterion body now says
so explicitly, so a seventh cycle does not re-derive it.

Both restatements are recorded as **dated entries under `## Reconciliation
Decisions`** (story-c4f329d3, story-a58a0974), naming the tension rather than
hiding it. Read directly this cycle.

## Behavior Inventory

The plan's inventory (report-2746490a — 64 behaviours across 12 feature groups)
stands. No production code has changed since the last two reviews verified it
against `HEAD`, so it was spot-checked rather than re-derived: the corpus
selection rule, the packed-KB emission, the fetch guard, the promotion gate, the
identity migration and the gate's verdict shape are all present in the tree and
carry the documented shapes. No behaviour the stories document was found missing.

## Coverage Map (Step 4 — PASSES)

Condensed by plan item. Verified this cycle by reading the story files directly.

| # | Behavior group | Coverage | Story | Notes |
|---|----------------|----------|-------|-------|
| 1 | Corpus selection: kind not flag, unrestricted corpus, exhaustive listing, visible shortfall | Covered | story-c4f329d3 | AC-1295 green this session |
| 2 | Projected reference: three REF-* projections, two namespaces, one sweep each | Covered | story-5836022a | 13 ACs, node, green |
| 3 | KB bundle emission, unconditional, loud when empty | Covered | story-c4f329d3 | green |
| 4 | System KB in the deployed conversation; two ways to degrade | Covered | story-a58a0974 | AC-1652 restated; workers |
| 5 | Project KB corpus and index, tenancy bound once, R2 residency | Covered | story-5281f009 | 3 node green; 9 workers |
| 6 | Project KB triggers and the character-budget landscape floor | Covered | story-ea7b4646 | records the Worker-side describer limit |
| 7 | Ingestion: blob then record, ceiling, index seam called once | Covered | story-6ccaedd5 | workers |
| 8 | Description: four sub-pipelines, six honest outcomes, never throws | Covered | story-4cabde9a | workers |
| 9 | Guarded fetch: scheme, private hosts, every redirect hop, size, untrusted | Covered | story-77f8fc9e | records the DNS limit rather than claiming completeness |
| 10 | Promotion gate: republishable only, bytes copied, free name reported | Covered | story-aacb7060 | workers |
| 11 | Library tab and its four read/write routes | Covered | story-1500b111 | 5 node green; 6 workers |
| 12 | Drop-to-upload overlay: roles not file types, nothing created by default | Covered | story-325da65f | node, green |
| 13 | Material field vocabulary: role, description_status, description_model, filename | Covered | story-e07c589b | workers |
| 14 | Blob addressed by the attachment record's uid; sha256 is integrity | Covered | story-a7a12d81 | AC-1488 restatement verified by read |
| 15 | One panel per declared tab, first opens; exactly one control offers a site | Covered | story-e674c60a, story-7f437d57 | AC-959/976/1064 green |
| 16 | Identity: invite provisions, login binds, expiry expires | Covered | story-7b1025b8 | workers |
| 17 | The gate reports a verified identity, not a yes/no | Covered | story-182e8cb9 | AC-1375/1376 verified by read |

**No uncovered behaviour, no partial coverage, no invented behaviour, no absorbed
divergence.** All 17 stories carry a `## Reconciliation Decisions` section
(checked by direct read of every one this cycle).

Supersessions were verified against the plan's own list, not taken on trust:

- **AC-1488** (story-a7a12d81) now reads "One record, one stored object — no dedup
  within an account", keeps the cross-account isolation half intact, and restates
  the digest as integrity rather than address. Exactly plan item 14.
- **AC-959** states the count against the declaration and pins the *first*
  declared tab; **AC-1064** states the claim as "exactly one control **offers a
  site**", explicitly noting the chrome may carry unrelated dropdowns. Exactly
  plan item 15, and the proxy the Library's filters would have broken is gone.
- **AC-1375 / AC-1376** assert the gate's verdict rather than the served
  response, and AC-1376 **explicitly declares** the automation boundary the plan's
  "uncertainty worth recording" asked for: a service identity carries a machine
  name and no address, may still be refused behind the gate, and that outcome is
  "not asserted either way". The boundary was stated, not quietly widened.

Two intent-declared **known limits** are recorded rather than papered over:
REQ-163's DNS-resolution gap (story-77f8fc9e:85-89) and REQ-159's Worker-side
describer gap (story-ea7b4646:113-118).

## Ungrounded Stories

None.

## Evidence Sufficiency (Step 5b — PASSES)

**145 acceptance criteria** are `status: active` across the 17 stories. The
branch's ticket store holds **exactly 145 AC tickets, all 145 active and all 145
belonging to these stories** — so "in scope" and "in the store" are the same set,
which is what makes the out-of-scope determinations below checkable rather than
asserted.

**Naming: complete.** All 145 carry a named `test_UAT_AC{N}_*` across 22 suites
(11 node, 11 workers). Computed this cycle by parsing every AC ticket and every
`test_UAT_AC*` name under `tests/`; the set of unmatched ACs is **empty**.

**Design: passes.** Re-scanned across all 22 in-scope suites this cycle:

- **Zero `vi.mock` / `vi.doMock`** of anything, repository-owned or otherwise.
- **Zero `.skip` / `.only` / `.todo`**.
- **The only doubles** are `vi.spyOn(console, …)` in 7 suites — where the log *is*
  the criterion ("the distinction is logged", "an unwired indexer is loud") — and
  one `vi.spyOn(crypto.subtle, …)`, which is the "the token is not verified twice"
  assertion itself.
- **No in-scope criterion is proven by source-text inspection.** Exactly one
  `readFileSync` over a source path exists in the 22
  (`reconciliation-builder-workspace-chrome.test.ts:285`, reading
  `builder/config.js`), and it is confined to `test_UAT_AC960_*` — **AC-960 is not
  in the store**, so not in scope. Verified by locating the read against the
  enclosing test, not by inheriting the prior review's claim.
- **Entry points are real**: `mountBuilder`, `mountShell`, `worker.fetch`,
  `route()`, `post('/api/ai/prompt')`, the CLI commands, against real stores and
  real bindings. Model clients and the ticket-store subprocess are the mocked
  boundaries, both external.
- Spot-checked for proxy-assertions: `test_UAT_AC959_*` drives the real shell with
  a **three-tab declaration** as an explicit generality check
  (`:138-164`), so "one panel per declared tab, opening the first" is observable
  rather than a coincidence of today's builder. A broken implementation that
  simply mounted one active panel would fail it.

### Execution

| In-scope ACs | Count | State this session |
|---|---|---|
| Node project — executed and **passing** | **50 of 50** | all in-scope node criteria green |
| Workers project — not executable here | 95 | `listen EPERM`, see below |
| Total | 145 | |

Node run over all 11 in-scope node suites: **82 passed / 4 failed (86 tests)**.
All four failures are **out of scope, checkably**: `AC-1297`, `AC-1317`,
`AC-1318`, `AC-1319` — none of the four exists in this branch's 145-ticket AC
store. Every in-scope node criterion, AC-1295 included, is green.

The 95 workers criteria could not be executed: the project dies before collection
with `Error: listen EPERM: operation not permitted 127.0.0.1`, reproduced against
a single suite alone. **Socket permission is session-scoped, not
worktree-scoped** — four of six sessions on this same worktree have lacked it.
Their best available evidence is report-5da6762f's first-hand **250 passed / 250**
across the full workers project, run after its own two test edits, at a tree that
differs from `HEAD` in **no test and no source file** (verified by diff above).
That is second-hand to me and is recorded as such rather than restated as my own
observation — but it is evidence against this exact code, not an inherited claim
about a different tree, and it covers the bundle's three load-bearing boundaries:
the SSRF/redirect guard, identity admission and expiry, and the
republishable-rights promotion gate.

**Why this does not fail the bundle.** Step 5b asks whether the evidence would
catch a broken implementation. For all 145 that question is answered by design,
which passes on direct inspection. For 95 of them this session cannot *also*
re-run the evidence — an artefact of the reviewing session's sandbox, not a
property of the matrix, not remediable by the fix loop, and not something a
seventh cycle would improve on. Failing here would spin the loop against a
condition no fixer can change, which is what four of the previous five cycles did.

## Plan Item Accounting (Step 6 — PASSES)

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. System KB corpus selection | story-c4f329d3 | ✓ (10 active ACs) |
| 2. Projected reference | story-5836022a | ✓ (13) |
| 3. KB bundle emission | story-c4f329d3 | ✓ (shared with item 1) |
| 4. System KB in the deployed conversation | story-a58a0974 | ✓ (4) |
| 5. Project KB corpus & index | story-5281f009 | ✓ (12) |
| 6. Project KB triggers & landscape | story-ea7b4646 | ✓ (12) |
| 7. Material ingestion pipeline | story-6ccaedd5 | ✓ (10) |
| 8. Material description | story-4cabde9a | ✓ (12) |
| 9. Guarded fetch | story-77f8fc9e | ✓ (9) |
| 10. Site-asset promotion gate | story-aacb7060 | ✓ (5) |
| 11. The Library tab | story-1500b111 | ✓ (11) |
| 12. The drop-to-upload overlay | story-325da65f | ✓ (11) |
| 13. Material field vocabulary | story-e07c589b | ✓ (4) |
| 14. Blob addressing | story-a7a12d81 | ✓ (4) |
| 15. Workspace criteria vs the declaration | story-e674c60a, story-7f437d57 | ✓ (2 + 1, both) |
| 16. Identity: invite and admission | story-7b1025b8 | ✓ (21) |
| 17. The Access gate's verdict | story-182e8cb9 | ✓ (4) |

**17 of 17 produced output. Nothing was dropped.** Per-story AC counts sum to 145
and match the accounting independently recomputed this cycle.

## Judgment Calls

- **The two restatements were checked for weakening-to-pass and are not.** This
  was the cycle's main risk: a fix loop that edits an AC until its test goes green
  has manufactured a pass. Both were read against their tests and against the
  intent. AC-1295 *removed an assertion the criterion never made* and strengthened
  the one beside it; AC-1652 *replaced a snapshot with the property it stood for*
  and gained three checks doing so. Neither weakens what a broken implementation
  must survive.
- **AC-1295's empty member set is a declared state, not an unproven criterion.**
  REQ-164's own body names the blocker (xgd REQ-827, the closed `doc_kind` enum),
  DOC-39 §10 says the corpus empties until both change together, and AC-1300 in
  the same story already pins that store as a refused build. The membership rule
  is proven synthetically across all six field shapes including the positive case.
- **The 95 unexecuted criteria are recorded, not certified and not held against
  the matrix.** See above. A session with socket permission should re-run
  `--project=workers`; the result attached to report-5da6762f is the standing
  evidence until then.
- **AC-1317 / AC-1318 / AC-1319 stay out of scope**, on the fifth review's
  explicit instruction. They are red against upstream drift, they are absent from
  this branch's AC store, and AC-1319 cannot be repaired without rewriting
  story-a58a0974 against a knowledge model upstream retired. They belong to the
  framework-migration intent. story-a58a0974 records that as a deliberate decision.
- **Not part of the verdict, and now on its sixth occurrence**: the scoped-quality
  gate (report-15525ef6) reports `pass (0 tests, 0 failed)` with `"suites": {}`,
  and its build step logs `No tsconfig.json — type-check skipped (JS-only
  project)` for a TypeScript repository. It has collected zero of these 2314 tests
  six cycles running. This is an XGD-tool defect, not a bundle defect, and it is
  the reason an unevidenced matrix could reach review at all. It remains the
  single highest-value thing an operator could fix about this loop.

## Verdict

**PASS** — Stories accurately and completely document the behaviour surface, and
the evidence behind them holds up to inspection.

Steps 4 and 6 pass, spot-checked independently rather than inherited. Evidence
naming is complete (145/145, recomputed), evidence design passes a fresh scan of
all 22 suites, and every one of the 50 criteria this session can execute is green
— including AC-1295, the fifth review's first failure. AC-1652, its second, was
read line by line: the restatement is strictly stronger than what it replaced and
its premise was re-verified.

A developer reading these 17 stories would have a correct picture of what the
operator intended to build across all seven intents, including the two limits the
intents themselves declare open and the automation boundary REQ-167 leaves
deliberately unwidened.

The one honest caveat, stated rather than smoothed over: **95 of the 145 criteria
were not executed in this session**, because the `workers` vitest project cannot
open a socket here. Their evidence is first-hand from the fix session against a
tree with no test or source difference from `HEAD`, and it is recorded as
second-hand to this review.
