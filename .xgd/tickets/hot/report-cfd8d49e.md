---
uid: report-cfd8d49e
id: REPORT-969
type: report
title: 'Code Review: request-84af044b'
created_by: xgd
created_at: '2026-07-24T23:29:19.918129+00:00'
updated_at: '2026-07-24T23:29:19.918129+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: request-84af044b
  anchor_uid: request-84af044b
---

# Code Review

**Result**: PASS

## Summary
REQ-87 is a clean, atomic mechanical rename of the runtime module type from `Capability*`/`kind: 'capability'` to `Behavior*`/`kind: 'behavior'`, with no back-compat aliases and no functional change. The rename flows through the framework core, export surface, registry, site-schema L1 slot seam, and the conformance harness; a workspace-wide `tsc` (the ticket's own Verify step) is clean, and the full 572-test suite passes. Both folded-in cosmetic nits from the REQ-84/85 audit are fixed.

## Quality Gates
| Gate | Status | Evidence |
|------|--------|----------|
| Lint | PASS | report-675d64b6 (REPORT-967): 0 errors, 0 warnings |
| Build | PASS | report-675d64b6 exit 0; re-verified `pnpm -r build` — all 7 projects Done |
| Tests | PASS | Scoped report: 17/17. Re-ran **full** suite (`pnpm test`): 81 files, **572 passed, 0 failed** |
| Coverage | PASS | 93.19% vs 60% threshold |
| Typecheck | PASS | `pnpm -r typecheck` clean across site-schema, framework, tools/generate — the ticket's explicit Verify step for catching missed discriminant occurrences |
| Preflight | PASS | report-675d64b6: no violations |

Note: the scoped quality report ran only 17 tests (555 deselected), which could not by itself prove the discriminant rename was atomic. The full suite and workspace typecheck were run during this review to close that gap.

## External Interface Accessibility
Wired in: **yes**, no gaps.

- Renamed validators re-exported through `packages/framework/src/modules/index.ts:50-52` → `packages/framework/src/index.ts:45-47`.
- Renamed types re-exported at `packages/framework/src/index.ts:76-86`.
- `registry` / `getModule` retyped to `BehaviorDefinition` (`packages/framework/src/modules/registry.ts:1,20,25,30`) and consumed by `tools/generate` (render + conformance harness).
- Both catalog modules carry the new discriminant: `carousel/meta.ts:18`, `contact-form/meta.ts:20` → `kind: 'behavior'`.
- `packages/framework/src/modules/capability.ts` is gone; `git diff -M` confirms a true rename (72% similarity), so history is preserved.

## Rename Atomicity (ticket's core AC)
| Check | Status | Evidence |
|-------|--------|----------|
| No `Capability*` identifier in source | PASS | grep over `packages/ tools/` returns zero hits; only test files mention it, exclusively inside negative assertions |
| No `kind: 'capability'` discriminant | PASS | grep returns only negative assertions (`reconciliation-behavior-modules.test.ts:657,696`) |
| No back-compat alias (CLAUDE.md: no legacy modes) | PASS | `reconciliation-behavior-modules.test.ts:688,697` assert `not.toMatch(/Capability/)` on root + contract sources; `:701` asserts the old module path is unresolvable |
| Discriminant atomic through site-schema | PASS | `l1/schema.ts:173` `behavior: z.string().optional()`; strict schema now rejects the old `capability` key — proven by `req87-behavior-rename.test.ts:69-75` |
| Render seam renamed | PASS | `l1/render.ts:213` emits `data-l1-behavior`; no consumer of the old attribute remains |
| Conformance harness | PASS | `tools/generate/src/conformance/types.ts`, `harness.ts`, `payloads.ts` updated |
| Docs | PASS | DOC-25 → "Behavior Modules — Contract & Catalog"; DOC-26 → "Behavior-Module Authoring & Vetting Process"; CLAUDE.md:55 updated |
| Matrix vocabulary untouched | PASS | CLAUDE.md correctly retains "capability gaps"/"capability matrix" — the separation the ticket exists to create |

## Added-Scope Cosmetic Nits
| Nit | Status | Evidence |
|-----|--------|----------|
| `styles.ts` stale `.hero`/`.header__inner` selector comment (REQ-84 residue) | FIXED | `packages/framework/src/modules/styles.ts:17` now names `.carousel__track`, `.contact-form__field`; grep confirms zero `.header__inner` residue |
| contact-form dead `enhance.ts` doc-comment references | FIXED | `contact-form/meta.ts:8` and `index.astro:10` now name `client.js`; grep for `enhance.ts` returns zero hits repo-wide |

## Test Evidence Validity
`tests/req87-behavior-rename.test.ts` (3 UATs) is valid evidence:
- Real components throughout — imports the actual framework root and the real `l1SlotSchema`. No internal mocking.
- Asserts in both directions: the new surface works (`kind === 'behavior'` for every registered module, validators drive real contract violations) **and** the old surface is gone (strict schema rejects a `capability` key).
- Exercises behaviour, not just names: config out of contract yields `config.view` violation; missing/non-L1 slot content yields `slots.slide` violation — confirming the REQ-85 contract survived the rename.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| `tests/req85-capability-contract.test.ts` | Filename still contains "capability" although its contents were fully renamed and its sibling `reconciliation-capability-modules.test.ts` **was** git-mv'd to `reconciliation-behavior-modules.test.ts`. Inconsistent treatment of two equivalent files. | Warning |
| `packages/framework/src/modules/registry.ts:11` | JSDoc mixes registers: "**behavior modules** — vetted behavioural cores". The ticket asked to align British prose to American "where it names the type"; this instance does not name the type, so it is defensible, but it reads as an incomplete sweep. | Nit |
| `packages/framework/src/modules/styles.ts:18-19` | Comment reflow after the nit fix left an awkward mid-sentence line break ("…the container / render emits"). | Nit |

No debug code, no commented-out blocks, no TODO stubs, no duplicated logic, no magic values introduced. The change is consistently mechanical and follows surrounding patterns.

## Checklist Compliance
No architecture, security, or design checklist reports exist for this project (`xgd ticket list --type report --filter fields.report_kind=<kind>` returned 0 for all three). Sections omitted per prompt instruction.

Relevant standing policy checks performed anyway:
- **CLAUDE.md "No Legacy Modes"**: satisfied — old file deleted via git mv, no alias, no dual-name code path, asserted by test.
- **DOC-2 structured-only security invariant**: unaffected — slots still validate through `l1NodeSchema`; `l1SlotSchema` remains `.strict()`, and the rename in fact *tightens* it (the old `capability` key is now a rejected unknown key).

## Smoke Test
The rename touches no CLI surface behaviourally (`tools/generate/src/cli/scaffold.ts` change is comment-only). The renamed public surface was exercised end-to-end by the full 572-test suite, which includes `tests/generate.test.ts` (render pipeline) and the conformance suites.

**Pre-existing defect found while smoke-testing, NOT introduced by REQ-87 and NOT a blocker for this review:**

`node tools/generate/bin/1c.mjs --help` fails with `Cannot find module .../packages/site-schema/dist/types`. Cause: `packages/site-schema` is `"type": "module"` but `src/index.ts:10-16` uses extensionless relative re-exports (`export * from './types'`), which `tsc` emits verbatim and Node ESM rejects. Confirmed pre-existing: `git show main:packages/site-schema/src/index.ts` is byte-identical, and REQ-87 does not touch that file (only `src/schema.ts` and `src/l1/schema.ts`). Vitest masks it via source-path aliasing. **Recommend filing a separate ticket** — the `1c` CLI cannot be launched from its built output on `main` today.

## Issues Found
**Critical (must fix)**: none.

**Warnings (should fix)**:
- `tests/req85-capability-contract.test.ts` should be renamed to `tests/req85-behavior-contract.test.ts` for consistency with the sibling file that was renamed in this same pass. Cosmetic; does not affect correctness or test selection.

**Out of scope (file separately)**:
- `packages/site-schema` ESM build emits extensionless relative imports, breaking the `1c` CLI from `dist`. Pre-existing on `main`.
- The generated client-JS asset is still named `capabilities.js` (`tools/generate/src/render/render.ts:118,170`). Left deliberately — renaming it would change generated site output, which this ticket explicitly forbids ("no functional change"). Worth a follow-up if the vocabulary split is to be total.
