---
uid: report-5d6bdeee
id: REPORT-3968
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-09-11T09:52:18.327455+00:00'
updated_at: '2026-09-11T09:52:18.327455+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-87be4669
---

All fixes verified. I left the changes uncommitted in the worktree, matching how prior iterations were committed by the workflow's own phase.

## Issues fixed

**Critical #1 — TypeScript build did not compile.** Added the two missing names to the generated-shim declaration list in `tools/generate/src/cli/assets.ts:351-356`, in alphabetical order, and extended the list's doc comment (`assets.ts:334-352`) to name priming as the fourth group (upstream's `./priming.js`, verified at `@lagrangefoundry/knowledge/src/index.js:180,182`). Regenerated with `./bin/1c assets` — `knowledge.d.ts` now declares 18 names.

- Before: both configs exit 2 with two `TS2305` errors. After: `tsc --noEmit -p tools/generate/tsconfig.json` → **exit 0**, `-p apps/control-app/tsconfig.json` → **exit 0**.

**Critical #2 — `test_UAT_AC1297` red.** Set `doc_kind: system_kb` on the four documents (DOC-33, DOC-35, DOC-31, DOC-17) via `xgd ticket update`. I did not touch the assertion at `tests/reconciliation-system-knowledge-base.test.ts:1197`.

- `tests/reconciliation-system-knowledge-base.test.ts`: **18/18 pass**, AC-1297 included.
- Ran `1c kb export` (writes only into gitignored `kb/system/`), so `./bin/1c kb status` now prints exactly the expected line: `corpus: 4 exported + 3 projected (of 4 ticket(s) carrying doc_kind: system_kb)`.
- One correction for the next report: the command shape in the Fix-It Prompt, `--field doc_kind=system_kb`, fails — that flag parses JSON. `--field '{"doc_kind": "system_kb"}'` works.

**Warning #4 — no guard in the direction that failed.** Added a superset assertion to AC-1648's UAT (`tests/reconciliation-system-knowledge-base-packed.test.ts:369-395`), with a `knowledgeImports()` helper (`:104-148`) that reads the names out of `apps/control-app/src/**/*.ts` rather than re-listing them, handles `search as kmSearch`, and guards itself against matching nothing. **Proven to bite**: removing `landscapeText` made it fail with a named message; restored, 3/3 pass.

## Additional in-scope defect found and fixed

The review recorded the workers project as "NOT EXECUTABLE". **It runs here** — the vitest project is named `workers`. Running the 11 suites it could not, I found `test_UAT_AC1712` (`reconciliation-site-asset-promotion.workers.test.ts`, in-bundle via `ff04368ee6`) failing ~50% of runs. Cause: two `knowledge.search()` calls fell back to the default `topK = 5` (`apps/control-app/src/knowledge.ts:335`), and the 64-bucket stub embedder ties on short queries with the tie broken by the randomly-generated uid — a coin flip on ranking, while the property under test ("still in the index") held every time. Widened both to an explicit window (`:362-377`, `:411-413`). Not a weakening: a material absent from the index still fails. **4/4 consecutive passes**, and the whole workers project is now green.

## Verification

| Gate | Result |
|---|---|
| Type-check, both configs | **exit 0** (was exit 2) |
| Workers project, entire | **36 files, 250 tests, all pass** |
| Node project, bundle's 7 suites | 54/57 — the only 3 failures are in the out-of-scope file |

## Deliberately not touched, with evidence

- `reconciliation-assistant-conversation-knowledge.test.ts` (AC-1317/1318/1319): `git log main..HEAD` on it is empty; main repairs it in `a1680d56b6`/`b12758a877`. As instructed.
- `test_UAT_FC_REQ-123_system_kb.test.ts`: fails on upstream drift (`KnowledgeConfigError … source 'shipped'`). It seeds its own corpus in a tmpdir, so my export cannot have caused it; main already carries the exact repair (`47fe3cc820 fix(kb): follow the knowledge library's indexes-by-source-name API`) and retires the suite (`671a09196f`).
- `test_UAT_AC1455` (binding set): already red on main — main's `wrangler.toml` carries `BLOBS` and `BROWSER` against a 3-binding expectation. The branch never touched it; `[ai]` adds a fourth extra entry to an already-failing assertion.
- Warning #3 (quality gate type-checks nothing, runs nothing) — the review says raise with the operator, not fix here. **Still true and still worth the operator's attention**: it is why two failures reached a sixth cycle.

The full node project has 28 failures (1962 pass). All are outside this bundle: lockfile drift, wrangler `EPERM`/socket timeouts, and the upstream-drift files above.

**Confidence: high** on the two criticals — both were reproduced first-hand, fixed, and re-verified with the exact commands the report specified. Moderate on the re-review passing overall, with one caveat I can't close from here: if the re-reviewer scopes tests to the whole node project rather than the bundle, it will see the same 28 pre-existing failures I did, none of which this bundle can fix without editing files main already repairs better.
