---
uid: report-a89599db
id: REPORT-3959
type: report
title: 'Reconciliation Review: commits (BUNDLE-26)'
created_by: xgd
created_at: '2026-09-11T07:58:40.859824+00:00'
updated_at: '2026-09-11T07:58:40.859824+00:00'
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

**What failed**: Step 5b (evidence sufficiency), on **execution only**. Steps 4
(intent fidelity and coverage) and 6 (plan-item accounting) pass, independently
re-verified this cycle. Evidence *naming* and evidence *design* both pass.
**The stories, the acceptance criteria and the UATs are correct and must not be
rewritten.** This is the fourth consecutive cycle in which that is the load-bearing
instruction.

---

## What changed since report-532185ab

One thing, and it is a genuine improvement. `fix_reconciliation_review`
(report-08b56a7e, comment-6025f713) migrated
`tools/generate/src/cli/ai/host-core.ts` off the retired upstream `Role`
`{system, source, reminder}` surface onto the provider model. Independently
re-verified this cycle:

- The edit is **committed** (`59fbb3bfb3`), not a dirty tree; `git status` is clean.
- `tests/reconciliation-assistant-conversation-knowledge.test.ts` now runs 4 tests
  with **3 failures**, down from 4. The one that moved is **AC-1320 — the only
  in-scope criterion in that file — and it now passes.**
- The three that still fail (AC-1317, AC-1318, AC-1319) are **not in this bundle's
  AC set** (confirmed by set membership: story-a58a0974's four criteria are
  AC-1320, AC-1651, AC-1652, AC-1653). They remain `@lagrangefoundry/*` shared-store
  drift predating the bundle, and AC-1318's widened knowledge grant still deserves a
  deliberate decision on a framework-migration ticket rather than a widened assertion.

Consequence: **in-scope runtime failures went from 1 to 0.** Observed passing
criteria went 25 → 26. Nothing else moved.

## Behavior Inventory

The plan's inventory (report-2746490a — 64 behaviours across 12 feature groups)
was re-checked against `HEAD`. Spot-checks performed independently this cycle:

- **REQ-164** — `kb.ts:245-257` declares `DOC_KIND_FIELD`/`MEMBER_KIND` once and
  `inSystemKb` tests the exact string; the shipped declaration is `corpus: {}`
  (586); the listing passes `--no-limit` (194) **and** refuses a truncated envelope
  by name (208); the empty-corpus refusal names the kind, not a flag (917-919).
  `INCLUDE_FIELD`/`optedIn` are absent.
- **REQ-163 fetch guard** — `tests/reconciliation-guarded-fetch.workers.test.ts:287`
  asserts the load-bearing redirect case against a `reached` ledger, and asserts the
  relative-`location` resolution as well.
- **REQ-167** — `apps/control-app/src/index.ts` / `access.ts` carry the verdict shape;
  `identity.ts` carries provisioning and admission.
- **REQ-161 blob addressing** — AC-1488 (acceptance_criterion-2eedb758) now reads
  "One record, one stored object — no dedup within an account", and keeps the
  cross-account isolation half; AC-1739 (acceptance_criterion-85b5e592) carries the
  new sibling-safety claim. The supersession landed exactly as plan item 14 states.

No behaviour the stories document was found missing from `HEAD`.

## Coverage Map (Step 4 — PASSES)

Re-performed against the seven intent bodies carried in `bundle-87be4669` (the
bundle carries no comments) and against the branch's code. Condensed by plan item;
the previous cycle's 64-row map stands unchanged.

| # | Behavior group | Coverage | Story | Grounding verified this cycle |
|---|----------------|----------|-------|-------------------------------|
| 1 | Corpus selection: kind not flag, unrestricted corpus, exhaustive listing, visible shortfall | Covered | story-c4f329d3 | kb.ts:194,208,245,257,586,917 |
| 2 | Projected reference: three REF-* projections, two namespaces, one sweep each | Covered | story-5836022a | kb-projection.ts; suite present, blocked (see below) |
| 3 | KB bundle emission, unconditional, loud when empty | Covered | story-c4f329d3 | `kbBundle` kb.ts:1033; `writeKbModule` assets.ts |
| 4 | System KB in the deployed conversation; two ways to degrade | Covered | story-a58a0974 | system-knowledge.ts; AC-1320 now passing |
| 5 | Project KB corpus and index, tenancy bound once, R2 residency | Covered | story-5281f009 | knowledge.ts; 3 node ACs passing |
| 6 | Project KB triggers and the character-budget landscape floor | Covered | story-ea7b4646 | knowledge.ts; story records the describer limit at lines 113-118 |
| 7 | Ingestion: blob then record, ceiling, index seam called once | Covered | story-6ccaedd5 | material.ts |
| 8 | Description: four sub-pipelines, six honest outcomes, never throws | Covered | story-4cabde9a | describe.ts |
| 9 | Guarded fetch: scheme, private hosts, every redirect hop, size, untrusted | Covered | story-77f8fc9e | fetch-guard.ts; story records the DNS limit at lines 84-88, 128 |
| 10 | Promotion gate: republishable only, bytes copied, free name reported | Covered | story-aacb7060 | material.ts `promoteToSiteAsset` |
| 11 | Library tab and its four read/write routes | Covered | story-1500b111 | builder/library.js; 5 node ACs passing |
| 12 | Drop-to-upload overlay: roles not file types, nothing created by default | Covered | story-325da65f | builder/upload.js; 11 node ACs passing |
| 13 | Material field vocabulary: role, description_status, description_model, filename | Covered | story-e07c589b | declared TypePack |
| 14 | Blob addressed by the attachment record's uid; sha256 is integrity | Covered | story-a7a12d81 | AC-1488 restated; AC-1739 added |
| 15 | One panel per declared tab, first opens; exactly one control offers a site | Covered | story-e674c60a, story-7f437d57 | AC-959/976/1064 all passing against two declared tabs |
| 16 | Identity: invite provisions, login binds, expiry expires | Covered | story-7b1025b8 | identity.ts; 0004_identity.sql |
| 17 | The gate reports a verified identity, not a yes/no | Covered | story-182e8cb9 | access.ts `AccessOutcome`; the automation boundary is stated, not widened |

**No uncovered behaviour, no partial coverage, no invented behaviour, and no
absorbed divergence.** All 17 stories carry a `## Reconciliation Decisions`
section (verified by direct read of every story file this cycle), so every
supersession the intents name and every intent-silent formalization is a dated
decision rather than an unattributed claim. Two intent-declared **known limits**
are recorded rather than papered over — REQ-163's DNS-resolution gap
(story-77f8fc9e:84-88) and REQ-159's Worker-side describer gap
(story-ea7b4646:113-118) — which is exactly what the plan's "uncertainty worth
recording" asked for.

## Ungrounded Stories

None.

## Evidence Sufficiency (Step 5b) — THIS IS THE FAILURE

**145 acceptance criteria** are `status: active` across the 17 stories.

**Naming coverage: complete.** Every one of the 145 carries a named
`test_UAT_AC{N}_*` UAT, across 22 suites (11 node, 11 workerd). Set difference
against every AC-named test under `tests/` is empty.

**Design: passes.** All 22 suites re-scanned for the Step 5b anti-patterns:

- **No `vi.mock`/`vi.doMock` of repository-owned code** anywhere in the 22 suites.
- **No source-text inspection for any in-scope criterion.** The `readFileSync`
  calls in `reconciliation-projected-reference` and
  `reconciliation-system-knowledge-base` read *artifacts the command under test
  wrote* (the corpus directory, the scaffolded config) — that is the observable,
  not the implementation's text. The three file-inspection tests in
  `reconciliation-builder-private-access-gate` (wrangler.toml, ACCESS.md) belong to
  AC-1382/1383/1384, **which are not in this bundle's AC set**.
- **The only doubles are `vi.spyOn(console, …)`** in the identity and ingestion
  suites, where the log *is* the criterion ("the distinction is logged", "an
  unwired indexer is loud"), plus `vi.spyOn(crypto.subtle, 'verify')` in the verdict
  suite, which is the "the token is not verified twice" assertion itself.
- **Entry points are real**: `worker.fetch`, `route()`, `mountBuilder()`, the CLI
  commands, against real D1/R2 bindings and real stores.
- **Assertions discriminate.** Sampled the hardest cases: AC-1702 proves the
  refused redirect hop was *never reached* via a `reached` ledger rather than
  inferring it from the return value, and covers relative `location` resolution;
  AC-1376 pairs each "not refused" with a positive discriminator (a stale-audience
  token is still 401; header-wins and header-loses are both asserted). A broken
  implementation satisfying the same surface contract would not pass these.

**Execution: incomplete, and not establishable from this sandbox.**

| In-scope ACs | Count | State |
|---|---|---|
| **Observed passing** | **26** | AC-959, 976, 1064, 1320, 1647–1649, 1654, 1658, 1659, 1714–1718, 1725–1735 |
| Blocked — two declared dependencies absent from `node_modules` | 24 | AC-1291, 1293, 1295, 1296, 1300, 1632, 1633 (7); AC-1634–1646 (13); AC-1375, 1376, 1380 (3); AC-1761 (1) |
| Blocked — workerd cannot bind a socket | 95 | the eleven `*.workers.test.ts` suites |
| **Failing at runtime** | **0** | — |
| Total | 145 | |

### Cause 1 — four node suites still do not collect (24 ACs)

`reconciliation-projected-reference`, `reconciliation-system-knowledge-base`,
`reconciliation-builder-private-access-gate` and
`reconciliation-builder-private-access-verdict` all die at import with:

```
Error: Cannot find package '@anthropic-ai/sdk' imported from
  apps/control-app/src/describe.ts
 ❯ apps/control-app/src/describe.ts:31:1
 ❯ apps/control-app/src/router.ts:32:1
```

**This is install state, not a code fault.** `@anthropic-ai/sdk@^0.122.0` and
`unpdf@^1.8.1` are declared in `apps/control-app/package.json:16,18` and present in
`pnpm-lock.yaml` (41, 47, 127, 2106, 2342, 4515). `apps/control-app/node_modules`
holds only `@cloudflare`, `typescript` and `wrangler` — it predates the
cherry-picks and was never refreshed.

**New this cycle, and it narrows the remedy:** the previous fixer reported that an
offline install would resolve this. I could not confirm that. `pnpm store path`
resolves to a **worktree-local** store (`.pnpm-store/v11`), and neither that index
nor the user-level `~/Library/pnpm/store/v11` index contains either package name.
So `pnpm install --offline` is not demonstrably available here: the install needs
**network as well as a TTY**.

### Cause 2 — the workerd suites still cannot execute (95 ACs)

`Error: listen EPERM: operation not permitted 127.0.0.1`, from miniflare, confirmed
again this cycle against `reconciliation-material-ingestion.workers.test.ts`. A
sandbox limit; **not held against the matrix** — but it means no evidence statement
about those 95 criteria is possible from this session, and those 95 include the
three boundaries in this bundle that most deserve proof: the SSRF/redirect guard
(AC-1700–1708), identity admission and expiry (AC-1740–1760), and the
republishable-rights promotion gate (AC-1709–1713).

## Plan Item Accounting (Step 6 — PASSES)

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

**17 of 17 produced output. Nothing was dropped.** No story file has been edited
since the previous review — the latest `updated_at` across all 17 is
`2026-09-11T06:51:37Z`, and the previous review was filed at `07:34Z`. The fix
cycle correctly touched code only.

## Judgment Calls

- **Do not edit the stories, the ACs or the UATs.** Fourth cycle, same
  instruction. Steps 4 and 6 pass; evidence naming and design pass; what is absent
  is evidence *execution*. A fix cycle that manufactures matrix edits would destroy
  correct output. Three prior cycles correctly declined to.
- **The AC-1320 repair was the right fix and it worked.** It was the only in-scope
  criterion that was *failing* rather than *unrunnable*, and it is now green. That
  is real, durable progress and should not be re-litigated.
- **AC-1317/1318/1319 are out of scope and must stay out.** They are red, they are
  upstream drift, and repairing them requires rewriting story-a58a0974 and AC-1319
  against a knowledge model upstream has retired — which this bundle did not
  authorise. They belong on a framework-migration ticket, with AC-1318's widened
  grant decided deliberately.
- **Neither blocker is a defect in this bundle.** The workerd EPERM is the sandbox.
  The missing packages are declared and locked; only the install is stale. Both are
  recorded so the 119 criteria are *visibly unproven* rather than silently assumed.
- **Unproven is not provable-by-inspection.** Evidence design is sound and I say so
  without reservation — but "these suites would pass if they ran" is a prediction,
  not evidence, and this bundle ships an SSRF guard, an admission path and a rights
  gate whose entire proof lives in the 95 unexecuted criteria. Certifying them on
  design alone is the one shortcut this review must not take.
- **`Scoped quality: pass (0 tests, 0 failed)`** — report-312452e4 reads this way
  for the fourth time (`"suites": {}`). Four consecutive zero-test passes are how an
  unevidenced matrix reached review four times. The outer workflow must treat a
  zero-test quality report as a gate failure, not a pass.
- **This loop cannot converge inside the sandbox, and that is the finding.**
  `fix_reconciliation_review` is forbidden to edit the matrix and has now
  demonstrated across three cycles that it cannot lift a socket restriction, a
  missing TTY, or an absent network. Re-entering it will not change the count. The
  remaining work is an **operator/environment action**, and this FAIL should be read
  as routing there rather than as another lap.

## Verdict

**FAIL** — on evidence sufficiency (Step 5b), execution only.

Steps 4 and 6 pass without reservation and were independently re-verified against
the branch: the stories faithfully represent the operator's stated intent across all
seven intents, every declared behaviour is covered, both declared known-limits are
recorded rather than papered over, every supersession and intent-silent
formalization is a dated decision under `## Reconciliation Decisions`, no story is
ungrounded, and all 17 plan items produced output.

Evidence naming is complete (145/145) and evidence design passes every Step 5b
anti-pattern check. **Zero in-scope criteria fail at runtime** — an improvement on
the previous cycle. But only **26 of 145** have an observed passing UAT; 119 are
unrunnable here: 95 on the workerd socket EPERM and 24 on two declared, locked
dependencies absent from this worktree's `node_modules`.

**`fix_reconciliation_review` must not edit the matrix.** The required actions, in
order, none of which is a matrix edit:

1. **Refresh the worktree's dependencies** so `@anthropic-ai/sdk` and `unpdf`
   resolve. Both are already in `apps/control-app/package.json` and
   `pnpm-lock.yaml`; only the install is stale. Requires a TTY **and network** —
   neither reachable pnpm store index holds either package, so `--offline` will not
   serve. This alone restores 24 criteria to executable, including all 13 of plan
   item 2's and 7 of plan items 1 and 3's.
2. **Execute the eleven `*.workers.test.ts` suites where a socket can be bound**
   (95 in-scope criteria). No verdict on those criteria is possible until then, and
   they carry this bundle's three security-bearing boundaries.
3. **Treat `Scoped quality: pass (0 tests, 0 failed)` as a gate failure.** If the
   next run reports zero tests again, the suite did not execute and no evidence
   claim should be made from it in either direction.
4. **File the upstream `@lagrangefoundry/*` drift separately** — AC-1317/1318/1319,
   including the deliberate decision on AC-1318's widened knowledge grant. Out of
   scope for this bundle; must not be repaired by widening an assertion.

If the next cycle runs in the same sandbox, the count will be the same. **Escalate
to the operator rather than spending another fix cycle.**
