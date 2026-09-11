---
uid: report-532185ab
id: REPORT-3956
type: report
title: 'Reconciliation Review: commits (BUNDLE-26)'
created_by: xgd
created_at: '2026-09-11T07:34:33.455116+00:00'
updated_at: '2026-09-11T07:34:33.455116+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-87be4669
**Stories Reviewed**: 17 (story-c4f329d3 carries plan items 1 and 3; plan item 15 targets story-e674c60a and story-7f437d57)

**What failed**: Step 5b (evidence sufficiency) only — and for a *different* reason
than last cycle. Steps 4 (intent fidelity and coverage) and 6 (plan-item
accounting) pass again, re-verified this cycle against code that is now actually
present on the branch. **The stories, the acceptance criteria and the UAT designs
are correct and must not be rewritten.**

---

## What changed since report-ed7fd573

The previous review's cause is **fixed**. `fix_reconciliation_review`
(report-e1e4306d) landed the bundle's seven behaviour-bearing commits onto
`reconcile-BUNDLE-26`. Independently re-verified this cycle:

- `git merge-base --is-ancestor 58561eb978 HEAD` and `ddf50669af HEAD` both true.
- `git ls-tree -r HEAD` now returns every module the previous review listed as
  absent: `apps/control-app/src/{material,knowledge,describe,fetch-guard,identity,system-knowledge}.ts`,
  `apps/control-app/src/builder/{library,upload}.js`, `db/migrations/0004_identity.sql`,
  `tools/generate/src/cli/kb-model.ts`.
- `tools/generate/src/cli/kb.ts` no longer carries the superseded rule:
  `INCLUDE_FIELD` / `optedIn()` are gone; `DOC_KIND_FIELD = 'doc_kind'` (line 245)
  and `MEMBER_KIND = 'system_kb'` (246) are declared **once**, the shipped
  declaration reads `corpus: {}` (586), the listing passes `--no-limit` and checks
  the returned envelope (194, 208), and `kbBundle()` is exported (1033).
- `apps/control-app/src/builder/config.js:64` — `TABS = [SITE_TAB, LIBRARY_TAB]`.
  The previous review's **vacuity caveat on AC-959 / AC-976 / AC-1064 is now
  cleared**: the builder has a second declared tab, so the restated criteria are
  distinguished from the literal `1` they replaced. All three pass.
- `guardAccess` returns `AccessOutcome` (access.ts:351, 368) — a verdict union,
  not a boolean — grounding story-182e8cb9's AC-1761.

Consequence: three previously-dead suites now collect and pass
(`reconciliation-library-tab`, `reconciliation-upload-overlay`,
`reconciliation-system-knowledge-base-packed`), and observed AC evidence rose
from **19 to 25** in-scope criteria.

## Behavior Inventory

The plan's inventory (report-2746490a, 64 behaviours across 12 feature groups) was
re-checked against the branch rather than against the commits, because for the
first time the branch carries the code. Spot-checks performed this cycle
(REQ-164 membership rule and unrestricted corpus, the exhaustive listing and its
envelope refusal, `kbBundle`/`writeKbModule` emission, the Worker-safe runtime's
exports, the fetch guard's redirect/private-host surface, `provisionInvite`/`admit`,
the tenant-bound blob handle, the gate's verdict shape, the two declared tabs)
all resolve to real code matching the stories' claims. No behaviour the stories
document was found missing from `HEAD`.

## Coverage Map

Step 4 was re-performed against the seven intent bodies in `bundle-87be4669`
(the bundle carries no comments) and against the branch's code. It **passes**.
The previous review's 64-row map stands; it is not reproduced in full here
because nothing in it changed. Condensed by plan item, with this cycle's grounding:

| # | Behavior group | Coverage | Story | Grounding verified this cycle |
|---|----------------|----------|-------|-------------------------------|
| 1 | Corpus selection: kind not flag, unrestricted corpus, exhaustive listing, visible shortfall | Covered | story-c4f329d3 | kb.ts:194,208,245,257,586,917 |
| 2 | Projected reference: three REF-* projections, two namespaces, one sweep each | Covered | story-5836022a | kb-projection.ts present; suite green last cycle |
| 3 | KB bundle emission, unconditional, loud when empty | Covered | story-c4f329d3 | `kbBundle` kb.ts:1033, `writeKbModule` assets.ts |
| 4 | System KB in the deployed conversation; two ways to degrade | Covered | story-a58a0974 | system-knowledge.ts:87,107,131,164,189 |
| 5 | Project KB corpus and index, tenancy bound once, R2 residency | Covered | story-5281f009 | knowledge.ts present |
| 6 | Project KB triggers and the character-budget landscape floor | Covered | story-ea7b4646 | knowledge.ts present |
| 7 | Ingestion: blob then record, ceiling, index seam called once | Covered | story-6ccaedd5 | material.ts present |
| 8 | Description: four sub-pipelines, six honest outcomes, never throws | Covered | story-4cabde9a | describe.ts present |
| 9 | Guarded fetch: scheme, private hosts, every redirect hop, size, untrusted | Covered | story-77f8fc9e | fetch-guard.ts:51,71,102,149,239 |
| 10 | Promotion gate: republishable only, bytes copied, free name reported | Covered | story-aacb7060 | material.ts `promoteToSiteAsset` |
| 11 | Library tab and its four read/write routes | Covered | story-1500b111 | builder/library.js, config.js:64,71 |
| 12 | Drop-to-upload overlay: roles not file types, nothing created by default | Covered | story-325da65f | builder/upload.js, config.js drop areas |
| 13 | Material field vocabulary: role, description_status, description_model, filename | Covered | story-e07c589b | declared TypePack |
| 14 | Blob addressed by the attachment record's uid; sha256 is integrity | Covered | story-a7a12d81 | tickets.ts tenant-bound blob handle (427-436) |
| 15 | One panel per declared tab, first opens; exactly one control offers a site | Covered | story-e674c60a, story-7f437d57 | config.js:64 — two declared tabs |
| 16 | Identity: invite provisions, login binds, expiry expires | Covered | story-7b1025b8 | identity.ts:43,106,121,135,172,191,282; 0004_identity.sql |
| 17 | The gate reports a verified identity, not a yes/no | Covered | story-182e8cb9 | access.ts:351,368 `AccessOutcome` |

**No uncovered behaviour, no partial coverage, and no absorbed divergence.** All
17 stories carry a `## Reconciliation Decisions` section (verified by grep on
every story file), so every intent-silent formalization and every supersession
the intents name is recorded as a dated decision rather than left unattributed.

## Ungrounded Stories

None. Unlike last cycle, this is now true in the plain sense as well as the
intended one: the behaviour the stories describe is present in `HEAD`.

## Evidence Sufficiency (Step 5b) — THIS IS THE FAILURE

145 acceptance criteria are `status: active` in the hot store. **All 145 carry a
named `test_UAT_AC{N}_*` UAT** (set difference against every AC-named test in
`tests/` is empty). Naming coverage is complete.

**Evidence design is sound.** Scanned all eleven bundle `*.workers.test.ts`
suites plus the node suites for the Step 5b anti-patterns: **no `vi.mock` of
repository-owned code, no source-text inspection, no entry-point bypass.** The
only doubles are `vi.spyOn(console, 'warn')` in two suites, which is the
assertion (the "unwired indexer is loud" and "the distinction is logged"
criteria), not a mock of internal behaviour. Suites enter through `route()`,
`mountBuilder()`, `openSession`/`streamPrompt` or the CLI commands against real
stores.

**Passing coverage is not complete, and cannot be established here.**

Suites executed this session (`npm test`, node project, 12 suites):
`Test Files 5 failed | 7 passed (12)` · `Tests 4 failed | 42 passed (46)`.

| In-scope ACs | Count | State |
|---|---|---|
| Observed passing | **25** | AC-959, 976, 1064, 1647–1649, 1654, 1658, 1659, 1714–1718, 1725–1735 |
| Blocked: uninstalled dependencies | 24 | AC-1291, 1293, 1295, 1296, 1300, 1375, 1376, 1380, 1632–1646, 1761 |
| Blocked: workerd cannot bind a socket | 95 | the eleven `*.workers.test.ts` suites (103 AC-named tests) |
| **Failing at runtime** | **1** | **AC-1320** |
| Total | 145 | |

### Cause 1 — four node suites no longer collect (24 ACs)

`reconciliation-projected-reference`, `reconciliation-system-knowledge-base`,
`reconciliation-builder-private-access-gate` and
`reconciliation-builder-private-access-verdict` all die at import with:

```
Error: Cannot find package '@anthropic-ai/sdk' imported from
  apps/control-app/src/describe.ts
 ❯ apps/control-app/src/describe.ts:31:1
 ❯ apps/control-app/src/router.ts:32:1
```

These four suites reach `router.ts` through `tools/generate/src/cli` (the CLI
index), and REQ-163's `describe.ts` added two runtime dependencies to that graph.
**This is an install-state fault, not a code fault**: `@anthropic-ai/sdk@^0.122.0`
and `unpdf@^1.8.1` are declared in `apps/control-app/package.json` **and are
present in `pnpm-lock.yaml`** (lines 41, 47, 127, 2106, 2342, 4515). This
worktree's `node_modules` predates the cherry-picks and was never refreshed.
`pnpm install` here aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`, and
forcing it would purge `node_modules` with no network to restore it, so it was
not attempted. Note the regression direction: `reconciliation-projected-reference`
passed 13/13 last cycle and collects zero tests now.

### Cause 2 — the workerd suites still cannot execute (95 ACs)

`Error: listen EPERM: operation not permitted 127.0.0.1`, from miniflare. Same
sandbox limit the previous review recorded; landing code does not lift it. This
is **not held against the matrix** — but it does mean no statement about those
95 criteria is possible from this session.

### Cause 3 — AC-1320 fails at runtime, from upstream shared-store drift

`reconciliation-assistant-conversation-knowledge.test.ts` fails 4 of 4. One of
those, **AC-1320, is in scope** (plan item 4 modifies it). The four failures:

| Test | Failure | Cause |
|---|---|---|
| AC-1317 | `KnowledgeSearch` returns `corpus_unreadable` instead of naming `DOC-A` | upstream |
| AC-1318 | grant offers 5 knowledge tools, criterion asserts exactly 3 — `KnowledgeChanges` and `KnowledgeOutline` have appeared | upstream |
| AC-1319 | `KnowledgeDocs.open` is `undefined` | upstream |
| **AC-1320** | `TypeError: Cannot add property reminder, object is not extensible` at `host-core.ts:616` | upstream |

All four are **`@lagrangefoundry/*` shared-store drift, not this bundle**:

- The test file's last commit is `393a447a85` (2026-08-30) — it predates the
  bundle and no bundle commit touches it.
- `host-core.ts:616` does `role.reminder = …` on a `new lib.Role({…})`
  (host-core.ts:422) — an *upstream* object that is now non-extensible. The
  bundle's only change to `host-core.ts` is `git diff 1bc13abacf..HEAD` = **20
  purely additive lines** declaring `CARETAKER_PURPOSE`; it cannot cause this.
- AC-1318's failure is its own tripwire firing exactly as its comment says it
  should: *"an operation added upstream cannot enter the grant unnoticed just
  because nobody thought to name it here."* Two read operations entered the
  `ReadKnowledge` group upstream and therefore entered the assistant's grant with
  no commit in this repo. **That is a genuine finding about the grant's surface
  and deserves a decision, not a widened assertion.** (AC-1317/1318/1319 are not
  in this bundle's AC set; AC-1320 is.)

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. System KB corpus selection | story-c4f329d3 | ✓ |
| 2. Projected reference | story-5836022a | ✓ |
| 3. KB bundle emission | story-c4f329d3 | ✓ |
| 4. System KB in the deployed conversation | story-a58a0974 | ✓ |
| 5. Project KB corpus & index | story-5281f009 | ✓ |
| 6. Project KB triggers & landscape | story-ea7b4646 | ✓ |
| 7. Material ingestion pipeline | story-6ccaedd5 | ✓ |
| 8. Material description | story-4cabde9a | ✓ |
| 9. Guarded fetch | story-77f8fc9e | ✓ |
| 10. Site-asset promotion gate | story-aacb7060 | ✓ |
| 11. The Library tab | story-1500b111 | ✓ |
| 12. The drop-to-upload overlay | story-325da65f | ✓ |
| 13. Material field vocabulary | story-e07c589b | ✓ |
| 14. Blob addressing | story-a7a12d81 | ✓ |
| 15. Workspace criteria vs the declaration | story-e674c60a, story-7f437d57 | ✓ (both) |
| 16. Identity: invite and admission | story-7b1025b8 | ✓ |
| 17. The Access gate's verdict | story-182e8cb9 | ✓ |

**17 of 17 produced output. Nothing was dropped.** All 17 story files are present
in the hot store and none has been edited since the previous review
(`updated_at` on every one predates 2026-09-11T07:13Z).

## Judgment Calls

- **Do not edit the stories, the ACs or the UATs.** For the third consecutive
  cycle this is the load-bearing instruction. Steps 4 and 6 pass; the evidence
  *design* passes; what is missing is evidence *execution*. A fix cycle that
  manufactures matrix edits would destroy correct output. Two prior cycles
  correctly declined to.
- **AC-959 / AC-976 / AC-1064 are no longer vacuous.** The previous review
  flagged that they passed only because `TABS` had one entry. It now has two, and
  they still pass — the restatement is genuinely distinguished from the literal it
  replaced. This is the one Step 5b result that strictly improved on its own merits.
- **The workerd EPERM is not held against the matrix.** It is a sandbox limit,
  recorded so the 95 criteria are visibly unproven rather than silently assumed.
- **The missing `node_modules` entries are not a code defect.** Both packages are
  in `package.json` and in `pnpm-lock.yaml`; a normal install resolves them. But
  they *are* a gate failure: 24 criteria that were executable last cycle are not
  executable now, and the review cannot call that proven.
- **The four upstream-drift failures are not scope creep to fix.** This bundle
  has precedent for exactly this (report-2746490a's own observations record two
  UATs repaired after the upstream `prompt` → `description` rename, "out of scope
  for its intent by the author's own admission, but a red suite is not evidence").
  AC-1318's widened grant should be decided, not assumed benign.
- **`Scoped quality: pass (0 tests, 0 failed)`** — report-906ccb9e reads this way
  again. Three consecutive zero-test passes are how an unevidenced matrix reached
  review three times. This must be treated as a gate failure by the outer workflow.

## Verdict

**FAIL** — on evidence sufficiency (Step 5b) alone.

Steps 4 and 6 pass without reservation and were re-verified against code that is
now on the branch: the stories faithfully represent the operator's stated intent
across all seven intents, every declared behaviour is covered, every supersession
and intent-silent formalization is a dated decision under
`## Reconciliation Decisions`, no story is ungrounded, and all 17 plan items
produced output.

25 of 145 active acceptance criteria have an observed passing UAT. The remaining
120 break down as: 95 unrunnable (workerd socket EPERM), 24 unrunnable (two
declared dependencies absent from this worktree's `node_modules`), and 1
(AC-1320) failing on `@lagrangefoundry` shared-store drift that predates this
bundle.

**`fix_reconciliation_review` must not edit the matrix.** The required actions,
in order:

1. **Refresh the worktree's dependencies** so `@anthropic-ai/sdk` and `unpdf`
   resolve. Both are already in `package.json` and `pnpm-lock.yaml`; only the
   install is stale. Must be done where `pnpm install` has a TTY and network.
   This alone restores 24 criteria to executable, including all of plan item 2's
   and most of plan items 1 and 3's.
2. **Repair the upstream drift in
   `tests/reconciliation-assistant-conversation-knowledge.test.ts`'s subject
   code** — `role.reminder = …` (`host-core.ts:616`) against a non-extensible
   upstream `Role`, and the moved `KnowledgeDocs.open`. Then decide AC-1318
   deliberately: upstream added `KnowledgeChanges` and `KnowledgeOutline` to the
   `ReadKnowledge` group, so the assistant's grant widened with no commit here.
   Widening the assertion to match is the wrong repair unless the widening is
   intended.
3. **Execute the eleven `*.workers.test.ts` suites in an environment that can
   bind a socket** (103 AC-named tests, 95 in-scope criteria). No verdict on
   those criteria is possible until then.
4. **Treat `Scoped quality: pass (0 tests, 0 failed)` as a gate failure.** If the
   next run reports zero tests again, the suite did not execute and no evidence
   claim should be made from it in either direction.
