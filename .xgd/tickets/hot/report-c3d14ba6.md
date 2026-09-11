---
uid: report-c3d14ba6
id: REPORT-3970
type: report
title: 'Code Review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T09:57:59.912534+00:00'
updated_at: '2026-09-11T09:57:59.912534+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Code Review

**Result**: PASS

**Anchor**: bundle-87be4669 (BUNDLE-26 — REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158, REQ-167)
**Mode**: commits
**Cycle**: re-review following report-fb619bd5 (FAIL) and its fix (report-5d6bdeee)

## Summary

Both criticals from the previous review are fixed, and I reproduced each fix
first-hand rather than inheriting the fix report's claims. The TypeScript build
now compiles on both project configs (exit 0, was exit 2), and
`test_UAT_AC1297` is green because the four documents genuinely carry
`doc_kind: system_kb` — the criterion was satisfied, not relaxed. The fix also
closed warning #4 with a guard of the right shape: it derives the importer set
from `apps/control-app/src/**` rather than re-listing it, so the guard cannot
itself go stale the way the list did.

The implementation quality findings from the prior review stand unchanged and
were positive: no dead modules, no debug leftovers, no unreached entry points,
no magic numbers. The three remaining node-project failures are in a file this
branch never touched, which I verified independently rather than accepting the
attribution.

Warning #3 — the quality gate type-checks nothing and runs no tests — is
**still true and still unaddressed**. It does not fail this review, because the
real gates were run by hand here and pass, but it is why two failures reached a
sixth cycle and it deserves the operator's attention.

## Quality Gates

| Gate | Status | Evidence (first-hand this session) |
|------|--------|------------------------------------|
| Build (type-check) | **PASS** | `node node_modules/typescript/bin/tsc --noEmit -p tools/generate/tsconfig.json` → exit 0, no output. `-p apps/control-app/tsconfig.json` → exit 0, no output. Both were exit 2 with two `TS2305` errors before the fix. |
| Tests (node, in scope) | **PASS** | 7 bundle suites: **54 passed / 57**. The only 3 failures are out of scope (see Attribution). |
| Tests (KB suites specifically) | **PASS** | `reconciliation-system-knowledge-base` + `-packed`: **21/21 pass**, `test_UAT_AC1297` included. |
| Tests (workers project) | **NOT EXECUTABLE HERE** | `Error: listen EPERM: operation not permitted 127.0.0.1` — miniflare cannot bind in this session's sandbox, both for the whole project and for a 3-suite subset. Environment limit, not a code finding. |
| Lint | N/A (vacuous) | No ESLint config exists in the repo. report-ee913437 records 0 errors in 0.0001s — nothing was linted. |
| Coverage | Not measured | No coverage run in any quality report for this bundle. |

The most recent quality report (report-ee913437, `commit b3cc84f899`) again
records `build: success` on stdout `"No tsconfig.json — type-check skipped
(JS-only project)"`, `suites: {}`, 0 tests. Every gate value above was produced
by running the commands directly, not read from that report.

### Workers project — stated as what it is

The prior review recorded the workers project as unrunnable; the fix session
reported running it successfully (36 files, 250 tests, all pass). **In this
session it does not start**, failing identically at the whole-project level and
at a 3-suite subset. So identity/admission, material ingestion/description/
types/blob storage, library surface, client KB + clocks, guarded fetch and
site-asset promotion carry no first-hand execution *in this review*. I record
the fix session's green run as reported evidence rather than restating it as my
own, and I do not hold the gap against the code.

## Verification of the Previous Review's Criticals

**Critical #1 — build did not compile. FIXED.**

`KNOWLEDGE_EXPORTS` (`tools/generate/src/cli/assets.ts:353-377`) now carries
`landscapeText` (`:367`) and `mechanismText` (`:369`), each with an inline note
naming REQ-158 and the priming group, and the list's doc comment
(`assets.ts:340-351`) now names priming as the fourth group and states the
superset claim explicitly. The regenerated shim declares both
(`apps/control-app/src/generated/knowledge.d.ts:14, 16`), matching the imports
at `system-knowledge.ts:10-11`. Both type-checks exit 0.

Note on shape, and it is the correct one: `apps/control-app/src/generated/` is
gitignored (`.gitignore:188`), so the tracked source of truth is the
`KNOWLEDGE_EXPORTS` list, not the emitted `.d.ts`. The fix was made at the
source, so a fresh checkout produces a compiling tree after the normal
`./bin/1c assets` step.

**Critical #2 — `test_UAT_AC1297` red. FIXED, without weakening the assertion.**

All four documents now carry the marker, each with `last_field_updated:
doc_kind`, i.e. set via a field update rather than a file rewrite:

| Document | uid | `doc_kind` |
|---|---|---|
| DOC-33 — The Consultation Playbook | `doc-58cf04a4` | `system_kb` |
| DOC-35 — Personas, Modes & Registers | `doc-edba99c9` | `system_kb` |
| DOC-31 — Differentiation Audit | `doc-8d51d90d` | `system_kb` |
| DOC-17 — Design Lessons Log | `doc-721a48c9` | `system_kb` |

The assertion at `tests/reconciliation-system-knowledge-base.test.ts:1197` is
untouched — I checked, because relaxing it was the failure mode the prior
review explicitly forbade. The AC is satisfied by giving the corpus its
members, which is what the criterion asked for.

**Warning #4 — no guard in the direction that failed. FIXED, and well.**

`tests/reconciliation-system-knowledge-base-packed.test.ts:399-427` asserts
`KNOWLEDGE_EXPORTS` is a superset of what the deployable actually imports. Three
things make this the right guard rather than a second list to maintain:

- It reads the importer set out of `apps/control-app/src/**/*.ts` by regex
  (`knowledgeImports`, `:131-154`) instead of re-listing names — the comment at
  `:120-130` states exactly this reasoning.
- It handles `X as Y` by taking the upstream name, skips the `generated/`
  directory (the shim's output, not a consumer), and strips `type` clauses.
- It guards itself against a vacuous pass (`expect(reached.size).toBeGreaterThan(0)`,
  `:416`), and fails with a message naming the undeclared names and the file to
  edit (`:419-426`).

It reads `KNOWLEDGE_EXPORTS` from `assets.ts` — the tracked source — not from
the gitignored artefact, so it stays meaningful in a clean checkout.

## External Interface Accessibility

New entry points wired in: **yes**. The prior review verified twelve surfaces
(`writeProjections`, the `1c kb status` ticket count, `CATALOG`/`getModuleMeta`,
the six material routes, `admit()`, the `guardAccess` → `AccessOutcome` shape
change, `0004_identity.sql`, the `[ai]` binding, the two `webui` packages, the
builder Library + upload overlay, and `systemKnowledge` in `chatHost`) and found
no gaps. The fix cycle added no new surfaces — it touched `assets.ts` and two
test files only (`git show 1cf94d0846 --stat`) — so that finding carries over
intact. I re-confirmed the `1c kb status` surface live (below).

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/assets.ts:340-377` | The fix is at the source of truth, alphabetically placed, and the doc comment now states the superset claim and both directions it is pinned in. Exemplary. | None |
| `tests/reconciliation-system-knowledge-base-packed.test.ts:112-154, 399-427` | Source-derived guard, self-guarded against vacuous pass, named failure message. The one correct shape for this check. | None |
| `tests/reconciliation-site-asset-promotion.workers.test.ts:360-380, 415-421` | Test-side de-flake: two `knowledge.search()` calls widened to an explicit `{ topK: 50 }`. Legitimate — AC-1712's property is "still in the index", not "outranks its neighbours", and a material absent from the index still fails. The 11-line comment states the ranking assumption being removed and why. Test-only; no production code touched. | None |
| all 33 changed production files + changed tests | No `TODO`/`FIXME`/`XXX`/`HACK`/`debugger`. No `.only`/`.skip`/`it.todo` in changed suites. The `console.log` hits are all in `tools/generate/src/cli/index.ts` — the CLI's own output channel, not debug leftovers. | None |
| `apps/control-app/src/fetch-guard.ts`, `kb-projection.ts`, `router.ts`, constants | Prior review's assessment stands: SSRF guard thorough with documented DNS-rebinding limit; regex doc-harvest deliberate and documented; no magic numbers. | None |

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report
exists in the store. Verified independently this session by counting every
`report_kind` value present: `resolve_conflicts` (112), `quality` (26),
`test_naming_check` (17), `reconciliation_story_generation` (17),
`reconciliation_uat_generation` (10), `reconciliation_review` (6),
`fix_reconciliation_review` (5), `reconciliation_plan` (1),
`fix_review_free_coded` (1), `fc_orphan_check` (1), `code_review` (1). None of
the three checklist kinds appears. All three sections skipped per the review
instructions.

## Smoke Test

Entry points invoked live:

- `./bin/1c` → usage prints, exits clean.
- `./bin/1c kb status` → the REQ-164 status line, and the warning the prior
  review flagged is gone:

```
corpus: 4 exported + 3 projected (of 4 ticket(s) carrying doc_kind: system_kb)
index:  missing
chunks: missing
map:    missing
```

This is the exact line the prior review's Fix-It Prompt specified as the
expected outcome. The operational consequence it warned about — that running
`1c kb export` would sweep the corpus down to projections alone — is resolved:
the corpus has its four members.

`1c kb export` / `1c kb build` were not invoked; they write into the
repository's real `kb/system/`, and this review is read-only. (`index`/`chunks`/
`map` read `missing` for that reason, not as a defect.)

One cosmetic note carried over: `1c kb` with no subcommand prints `status`
output rather than a usage block. Harmless; not a finding.

## Attribution: the 3 remaining node failures

`tests/reconciliation-assistant-conversation-knowledge.test.ts` fails
`test_UAT_AC1317`, `AC1318` and `AC1319`. **Not attributable to this bundle** —
verified independently rather than inherited:

- `git log main..HEAD -- tests/reconciliation-assistant-conversation-knowledge.test.ts`
  is **empty**: this branch has no commit touching the file.
- `git diff main..HEAD` on it is non-empty only because *main* moved ahead
  (77 insertions / 150 deletions on main's side) — main carries the repair in
  `a1680d56b6` and `b12758a877`, where the tool roster is derived from
  `DECLARATION` instead of hand-listed.
- On merge-back, main's side of a file this branch never touched wins cleanly,
  so all three disappear.

The prior review recorded two of these (AC1318/AC1319); AC1317 now fails too,
from the same cause — the hand-listed roster that upstream outgrew. The
attribution is unchanged by the extra failure: the file is still untouched by
this branch and still repaired on main.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix — none blocking this review)**:

- **The quality gate sees nothing.** report-ee913437, the newest quality report
  for this bundle, records `build: success` on `"No tsconfig.json — type-check
  skipped (JS-only project)"`, `suites: {}`, 0 tests, and a lint pass in 0.0001s
  against a repo with no ESLint config. A bundle of ~5,000 lines of new
  TypeScript is gated by a check that type-checks nothing, lints nothing and
  runs nothing. Both criticals in the previous cycle were invisible to it and
  were found only by running the tools by hand. **This is for the operator, not
  the fix loop** — it is a gate-configuration problem outside this bundle's
  scope, and it will keep letting defects through on every future bundle until
  the gate is pointed at `tools/generate/tsconfig.json` and
  `apps/control-app/tsconfig.json` and given a test selection.
- **Workers-project evidence remains unattested by review.** The suites
  carrying most of this bundle's evidence have never been executed inside a
  review session — the prior review could not start them, and neither could
  this one. The fix session reports them green. That is reported evidence, not
  verified evidence, and the gap should be closed by a session with a working
  socket path rather than by repeated review cycles that cannot close it.
