---
uid: report-fb619bd5
id: REPORT-3967
type: report
title: 'Code Review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T09:28:42.782651+00:00'
updated_at: '2026-09-11T09:28:42.782651+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Code Review

**Result**: FAIL

**Anchor**: bundle-87be4669 (BUNDLE-26 — REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158, REQ-167)
**Mode**: commits

## Summary

The implementation itself is of high quality — the SSRF guard, the two-clock knowledge design, the projected reference and the identity migration are carefully reasoned, consistently patterned and unusually well documented, and I found no dead modules, no debug leftovers and no unreached entry points. Two gates nevertheless fail. **The TypeScript build does not compile**: `system-knowledge.ts` (REQ-158) imports two names that REQ-159's generated-shim declaration list omits, and `tsc --noEmit` exits 2 on both project configs. **A UAT for a live acceptance criterion is red**: `test_UAT_AC1297` fails because no doc ticket in this branch's store carries `doc_kind: system_kb`, so the real-store half of the export round-trip has nothing to assert over.

Both were invisible to the quality gate. The most recent scoped quality report (report-15525ef6) records `build: success` with stdout `"No tsconfig.json — type-check skipped (JS-only project)"` and `suites: {}` / 0 tests — it looked only at the repository root, where there is no `tsconfig.json`, and ran no tests at all. The evidence below was produced first-hand in this session.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | N/A (vacuous pass) | No ESLint config exists in the repo (`.eslintrc*` / `eslint.config.*` absent); report-15525ef6 records 0 errors in 0.0001s. Nothing was linted. |
| Build (type-check) | **FAIL** | `node node_modules/typescript/bin/tsc --noEmit -p tools/generate/tsconfig.json` → **exit 2**; `-p apps/control-app/tsconfig.json` → **exit 2**. Two TS2305 errors, both in `apps/control-app/src/system-knowledge.ts`. |
| Tests (node project) | **FAIL** | 4 failures across 2 files (1 in scope, 2 not attributable, detail below). |
| Tests (workers project) | **NOT EXECUTABLE** | miniflare cannot start in this sandbox: `Error: listen EPERM: operation not permitted 127.0.0.1`. 11 of this bundle's evidence suites were not run. |
| Coverage | Not measured | No coverage run in any recent quality report. |

### Node-project run, in scope of this bundle

`vitest run --project node` over `reconciliation-system-knowledge-base`, `-packed`, `reconciliation-projected-reference`, `reconciliation-client-knowledge-base`, `reconciliation-library-tab`, `reconciliation-upload-overlay`, `reconciliation-assistant-conversation-knowledge`:
**7 files, 57 tests — 53 passed, 4 failed.**

A second run over `reconciliation-builder-assistant-pane`, `reconciliation-library-tab`, `reconciliation-upload-overlay`, `naming`, `reconciliation-builder-workspace-origin`: **28 passed, 8 skipped, 1 failed** — the single failure is `reconciliation-builder-workspace-origin` dying on `listen EPERM`, a sandbox artefact, not a code defect.

### Workers project — stated as what it is

The `workers` vitest project aborts before any test runs:

```
Error: listen EPERM: operation not permitted 127.0.0.1
  at Server.setupListenHandle [as _listen2] (node:net:1918:21)
```

So identity/admission, material ingestion / description / types / blob storage, library surface, client KB + clocks, guarded fetch, workspace admission and deployed knowledge — the bulk of this bundle's evidence — carry **no first-hand execution in this review**. This matches the environment caveat report-e50bfc47 records. It is not a finding against the code; it is a limit on what this review can attest.

## External Interface Accessibility

New entry points wired in: **yes**, every one checked.

| Surface | Wired at | Verified |
|---|---|---|
| `writeProjections()` (REQ-165) | `tools/generate/src/cli/index.ts:755, 767` | Called by both `1c kb export` and `1c kb build`, export before the corpus sweep |
| `1c kb status` ticket count | `tools/generate/src/cli/index.ts:800-823` | Ran live — prints the corpus/ticket comparison |
| `CATALOG` / `catalog` / `getModuleMeta` | `packages/framework/src/modules/index.ts:4` | `packages/framework/src/modules/catalog.ts` exists; consumed by `kb-projection.ts:57` |
| Material routes (REQ-163/161) | `apps/control-app/src/router.ts` — `/api/material` GET+POST, `/api/material/item`, `/api/material/file`, `/api/material/description`, `/api/material/fetch` | All six registered inside `routeUncached`, with typed error mapping (413/400/403/404) at the catch block |
| `admit()` (REQ-167) | `apps/control-app/src/index.ts:95-99` | Runs inside `fetch` before `route()`, after `guardAccess` |
| `guardAccess` shape change | `apps/control-app/src/access.ts:352` → `AccessOutcome` | Sole caller `index.ts` updated to `gate.ok` / `gate.response` |
| `db/migrations/0004_identity.sql` | `apps/control-app/wrangler.toml:128, 243` `migrations_dir = "../../db/migrations"` | Directory convention, same as 0003 |
| `[ai]` binding | `wrangler.toml` top-level **and** `[env.production.ai]` | Both halves present |
| `webui-list-detail` / `webui-scroll` | `tools/generate/src/cli/webui.ts:163-164` | Added to `WEBUI_PACKAGES`, incl. the transitive dep |
| Builder Library + upload overlay | `apps/control-app/src/builder/app.js:6, 9` | `createLibraryPanel` / `createUploadOverlay` imported and mounted |
| `systemKnowledge` (REQ-158) | `router.ts:122` inside `chatHost` | Opened once per isolate, handed to `workerHost` |

### Smoke test

`./bin/1c` → usage prints, exit clean.
`./bin/1c kb status` → runs, no stack trace:

```
corpus: 1 exported + 3 projected ⚠ 0 ticket(s) carry doc_kind: system_kb — the corpus is stale; run `1c kb export`
index:  missing
chunks: missing
map:    missing
```

The new REQ-164 status line works exactly as designed — and the warning it prints is issue #2 below, surfacing itself. (`1c kb export` / `1c kb build` were not invoked: they write into the repository's real `kb/system/`, and this review is read-only.)

One cosmetic note: `1c kb` with no subcommand prints `status` output rather than `KB_USAGE`. Harmless; not a finding.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/assets.ts:340-360` | `KNOWLEDGE_EXPORTS` is the generated `.d.ts`'s whole content and is maintained by hand, with no check that every name imported from `./generated/knowledge` appears in it. That is how issue #1 reached a merged state. | Critical (see Issues) |
| `apps/control-app/src/fetch-guard.ts:102-144` | SSRF guard is thorough — literal v4/v6 ranges, `.local`/`.internal`, IPv4-mapped-IPv6 canonicalisation (`::ffff:7f00:1`), and per-hop re-validation with `redirect: 'manual'`. DNS-rebinding limitation documented at the module head rather than glossed. | None (commendable) |
| `tools/generate/src/cli/kb-projection.ts:129-240` | Doc comments are harvested from TS source by regex rather than the compiler API. Deliberate and documented: the harvest degrades to less prose, never to wrong prose, since everything structural comes from the schema objects. Acceptable. | None |
| `apps/control-app/src/knowledge.ts:82` | `type Untyped = any` with a scoped eslint-disable for the untyped JS component boundary. Narrow and named. | None |
| `apps/control-app/src/router.ts:668-690` | Material list/item/file deliberately split by payload size; the `content-disposition` filename strips quotes and backslashes. | None |
| all changed files | No TODO/FIXME/XXX/HACK, no `console.log` debug, no commented-out blocks, no `.only`/`.skip` in the new suites, no `_v2` files, no duplicated helpers. | None |
| Constants | `MAX_REDIRECTS`, `TRANSCRIPT_INDEX_CHARS`, `ENUMERATE_BUDGET_CHARS`, `FALLBACK_EXCERPT_CHARS`, `PROSE_BUDGET`, territory divisors — all named, exported and justified in prose. No magic numbers found. | None |

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists in the store — verified by enumerating all 2097 report tickets and counting `fields.report_kind`; none of the three kinds is present. All three sections are therefore skipped, per the review instructions.

## Issues Found

### Critical (must fix)

**1. The TypeScript build does not compile — two TS2305 errors.**

```
apps/control-app/src/system-knowledge.ts(10,3): error TS2305: Module './generated/knowledge' has no exported member 'landscapeText'.
apps/control-app/src/system-knowledge.ts(11,3): error TS2305: Module './generated/knowledge' has no exported member 'mechanismText'.
```

Reproduced on both project configs, exit code 2 each:
- `node node_modules/typescript/bin/tsc --noEmit -p tools/generate/tsconfig.json`
- `node node_modules/typescript/bin/tsc --noEmit -p apps/control-app/tsconfig.json`

Root cause: `apps/control-app/src/generated/knowledge.d.ts` is emitted by `writeKnowledgeShim` (`tools/generate/src/cli/assets.ts:302-321`) from the hand-maintained `KNOWLEDGE_EXPORTS` list (`assets.ts:340-360`). That list holds 16 names and omits `landscapeText` and `mechanismText`, which `system-knowledge.ts:10-11` imports.

This is **not** a stale-artefact problem: regenerating with `1c assets` on this branch emits the same 16 names, because the list is the source. It is also not upstream drift — both names *are* exported by the real package (`@lagrangefoundry/knowledge/src/index.js:180, 182`), so the `export *` runtime shim resolves them fine. Only the type declaration is short, which is why tests pass while `tsc` fails.

Attribution is unambiguous: `git show main:tools/generate/src/cli/assets.ts` has no `KNOWLEDGE_EXPORTS` and `git show main:apps/control-app/src/system-knowledge.ts` does not exist. Both are new in this bundle — REQ-158 added the importer, REQ-159 added the generator, and neither ticket's verification caught the seam between them. REQ-164's own body claims the generator type-check is clean; it is not clean at this HEAD.

**2. `test_UAT_AC1297` is red, against a live acceptance criterion.**

```
FAIL |node| tests/reconciliation-system-knowledge-base.test.ts
  > test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document
AssertionError: expected 0 to be greater than 0
  ❯ tests/reconciliation-system-knowledge-base.test.ts:1197:29
```

AC-1297 (`acceptance_criterion-6ebb875b`, status `active`, `uat_coverage: pass`, story-c4f329d3) requires, verbatim: *"Apply the same assertions to the real document store's export, where the count must also round-trip."* The synthetic half of the UAT passes; the real-store half cannot, because `exportCorpus()` selects on `doc_kind: system_kb` and **0 of the 38 doc tickets in this branch's store carry it** (counted directly: 32 `architecture`, and one each of `project_context_summary`, `project_context`, `interface_design_policy`, `test_asset_catalogue`, `security_policy`, `architecture_policy`).

This file *is* in scope — the branch rewrote it (commits `97244b5e67`, `2744c2943b`, `5ca1bc4f69`, `e043e6001d`).

Two premises the last reconciliation review (report-e50bfc47) relied on to pass are false, and should not be inherited:

- *"test_UAT_AC1297, whose AC is absent from this branch's store"* — **AC-1297 is present**, uid `acceptance_criterion-6ebb875b`, and it is `active` with `uat_coverage: pass`.
- *"`doc_kind: system_kb` is not yet a value the closed enum accepts, which REQ-164's own body declares as a blocker on xgd REQ-827"* — **the installed xgd 0.17.13 accepts it**: `xgd_source/core/ticketing/ticket_types.yaml:498` lists `system_kb` in the `doc_kind` enum. The blocker described in REQ-164's body has shipped, which REQ-164's own "What landed" section already states ("Both blockers had already shipped in the installed `xgd` (0.15.419)").

The operational consequence beyond the red test: this branch's shipped corpus is wrong today. `1c kb status` reports `1 exported + 3 projected ⚠ 0 ticket(s) carry doc_kind: system_kb`, and running `1c kb export` now would sweep the corpus down to the projections alone — an assistant with the reference material and none of the consultation material.

### Warnings (should fix)

**3. The quality gate cannot see either failure.** report-15525ef6 (`commit a2f2f26ff6`) records `build: success` on stdout `"No tsconfig.json — type-check skipped (JS-only project)"`, `suites: {}`, 0 tests, `lint` 0 errors in 0.0001s. Every recent scoped quality report for this bundle has the same shape. A bundle of ~5,000 lines of new TypeScript merged behind a gate that type-checked nothing and ran nothing. This is not a defect in the free-coded work, but it is why two failures reached a sixth review cycle, and it should be raised with the operator rather than fixed here.

**4. `KNOWLEDGE_EXPORTS` has no guard in the direction that failed.** REQ-159's `test_UAT_FC_REQ-159_project_kb_config` pins every *listed* name against the component — catching an upstream rename. Nothing pins the converse: that every name imported from `./generated/knowledge` is listed. That asymmetry is exactly issue #1.

### Not attributable to this bundle (no action required here)

`test_UAT_AC1318` and `test_UAT_AC1319` in `tests/reconciliation-assistant-conversation-knowledge.test.ts` also fail — a hand-listed tool roster that upstream outgrew (`KnowledgeChanges`, `KnowledgeOutline` now declared), and a call to `KnowledgeDocs.open` on an export the upstream package no longer has. **This branch never touched that file**: it is byte-identical to the merge-base (`507c45a1fe`), `git log main..HEAD -- <file>` is empty, and `main` already carries the repair in `a1680d56b6` / `b12758a877` — where the roster is derived from `DECLARATION` and the priming case observes a real turn instead of re-assembling it. Both failures disappear on merge-back, since main's side of an untouched file wins cleanly. Recording them so the fix loop does not spend an iteration on them.

## Fix-It Prompt

Two independent fixes. Neither requires touching the free-coded designs; both are gaps between what was written and what was declared.

**Fix 1 — make the build compile.**

Add the two missing names to the generated-shim declaration list in `tools/generate/src/cli/assets.ts`, in the existing alphabetical order of `KNOWLEDGE_EXPORTS` (`assets.ts:340-360`):

```ts
  'knowledgeBasesFromMapping',
  'landscapeText',      // REQ-158 — system-knowledge.ts:10
  'loadIndex',
  'mechanismText',      // REQ-158 — system-knowledge.ts:11
  'memoryIndexSource',
```

Both are real exports of `@lagrangefoundry/knowledge` (`src/index.js:180, 182`), so the runtime `export *` already resolves them; only the `.d.ts` is short. Extend the list's doc comment to say which half of the surface they belong to — they are priming (`./priming.js`), alongside the index and map groups already named there.

Then regenerate and verify — **both** must exit 0:

```
./bin/1c assets
node node_modules/typescript/bin/tsc --noEmit -p tools/generate/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit -p apps/control-app/tsconfig.json
```

While you are there, close the asymmetry from warning #4: extend the shim UAT so it asserts the list is a **superset** of what `apps/control-app/src/**/*.ts` actually imports from `./generated/knowledge`, not only that each listed name exists upstream. A missing name must fail a test, not a build nobody runs.

**Fix 2 — give the corpus its members, do not weaken the UAT.**

Set `doc_kind: system_kb` on the four documents REQ-164's own "What landed" section names as carrying it. They exist in this branch's store and currently read `architecture`:

| Document | uid | current `doc_kind` |
|---|---|---|
| DOC-33 — The Consultation Playbook | `doc-58cf04a4` | `architecture` |
| DOC-35 — Personas, Modes & Registers | `doc-edba99c9` | `architecture` |
| DOC-31 — Differentiation Audit | `doc-8d51d90d` | `architecture` |
| DOC-17 — Design Lessons Log | `doc-721a48c9` | `architecture` |

Use `xgd ticket update <uid> --field doc_kind=system_kb` — never a whole-file rewrite. The value is accepted: `system_kb` is in the `doc_kind` enum of the installed xgd 0.17.13 (`xgd_source/core/ticketing/ticket_types.yaml:498`). Setting it *replaces* `architecture`, which is the point — DOC-39 §3.1's exclusivity is enforced by the field being single-valued, and REQ-164 chose `doc_kind` over a boolean for exactly that reason.

Do **not** resolve this by relaxing `tests/reconciliation-system-knowledge-base.test.ts:1197`. AC-1297's Verification asks for the seeded set *and* the real store's round-trip, and it says in terms why: *"a loop over an empty corpus asserts nothing while reporting green, which is the failure that survives a passing suite."* Deleting the `toBeGreaterThan(0)` guard would produce precisely the green-on-nothing the criterion was written to forbid.

Verify:

```
./bin/1c kb status
  # expect: corpus: 4 exported + 3 projected (of 4 ticket(s) carrying doc_kind: system_kb)
npm test -- --project node tests/reconciliation-system-knowledge-base.test.ts
  # expect: test_UAT_AC1297 green, and AC1295/AC1300 still green
```

If the marker turns out to be genuinely unsettable in this tree, that is a different report: say so with the failing `xgd ticket update` output, and escalate rather than restating the criterion — two review cycles have now been spent on restatements founded on the belief that it could not be set.

**Do not touch** `tests/reconciliation-assistant-conversation-knowledge.test.ts`. Its two failures are inherited from the branch point and already fixed on main; editing it here would create a conflict against a better version.

**Out of reach in this environment.** The `workers` vitest project cannot start under the sandbox (`listen EPERM` from miniflare), so the 11 workers-project suites carrying most of this bundle's evidence were not executed. If the fix session has a working socket path, run them; if not, record the same caveat rather than claiming the evidence.
