---
uid: report-b64f2cad
id: REPORT-968
type: report
title: 'Reconciliation Review: commits (REQ-87 behavior-module rename)'
created_by: xgd
created_at: '2026-07-24T23:24:02.069473+00:00'
updated_at: '2026-07-24T23:24:02.069473+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-84af044b
  anchor_uid: request-84af044b
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: request-84af044b (REQ-87)
**Stories Reviewed**: 2 (story-179b8c06 / STORY-85 / CAP-72; story-d0a8cfad / STORY-83 / CAP-70)

## Step 1 — Intent (ticket body + amendments; no chat comments exist)

REQ-87 declares a **mechanical rename with no functional change**: the runtime
framework module type becomes a *behavior module*, freeing "capability" to mean
only the XGD capability matrix. Declared scope:

1. `Capability*` -> `Behavior*` identifiers (American spelling); `validateCapability*` -> `validateBehavior*`.
2. `modules/capability.ts` -> `behavior.ts` via git mv (history preserved).
3. Discriminant `kind: 'capability'` -> `kind: 'behavior'`, **atomic** across `modules/`, `site-schema`, `tools/generate/src/conformance`, and every UAT fixture.
4. **No back-compat alias** (CLAUDE.md no-legacy-modes).
5. Docs: CLAUDE.md, DOC-25/DOC-26 (+ DOC-8/20/21, REQ-79/85 bodies).
6. Explicitly **out of scope**: the XGD capability-matrix vocabulary — untouched.
7. Folded in: two comment-only nits (styles.ts stale `.hero`/`.header__inner` note; contact-form dead `enhance.ts` references).

## Behavior Inventory (read from code, independently of the plan)

6 behaviours identified in commit `7c55ef86`:

1. Behavior-module contract published under the `Behavior*` names from the framework package root (11 types + 3 validators), `modules/behavior.ts`.
2. `kind: 'behavior'` discriminant on every catalog meta (carousel@2, contact-form@3); registry typed `BehaviorDefinition[]`.
3. L1 slot seam — `l1SlotSchema` optional field `capability` -> `behavior` on a `.strict()` object (schema.ts:173).
4. L1 emitter — `data-l1-capability` -> `data-l1-behavior`, HTML-escaped, omitted when the field is absent (render.ts:212-213).
5. Deliberately preserved `capability` vocabulary — verified by grep, the *only* surviving uses are exactly the declared non-changes: emitted asset `capabilities.js` (styles.ts:75, render.ts:118/166/170), driver capability negotiation (cli/capture/types.ts:103), "schema-only capability" (site-schema/schema.ts:672).
6. Comment-only nits — verified applied (styles.ts now reads `.carousel__track` / `.contact-form__field`; contact-form `index.astro` + `meta.ts` now name `client.js`).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `Behavior*` contract published from package root; 3 renamed validators; no alias | Covered | story-179b8c06 | Story body restated in the new vocabulary; AC-722 added and pins the surface |
| 2 | `kind: 'behavior'` discriminant on every catalog entry | Covered | story-179b8c06 | AC-722, asserted over the real registry |
| 3 | L1 slot field renamed; legacy key now *rejected* by the strict envelope | Covered | story-d0a8cfad | AC-682 (accepted form) + AC-686 (legacy key rejected as unknown key) |
| 4 | `data-l1-behavior` emitted, escaped, omitted when absent | Covered | story-d0a8cfad | AC-723 added — previously asserted by no test at all |
| 5 | Deliberate non-changes (`capabilities.js`, English-word uses) | Covered | story-179b8c06 | AC-702 body + STORY-85 Technical Context both state the filename is deliberately unchanged, so it is not later "corrected" |
| 6 | Comment-only nits | Uncovered (acceptable) | — | Zero runtime effect; no user-visible capability; correctly excluded from the matrix |
| — | Behavioural obligations of REQ-85/REQ-83 that must survive the rename | Covered | both | AC-697/698/699/700/701/703/704 and AC-683/684/685/687/688 unchanged in substance and all passing |

**Intent fidelity**: faithful on all 7 declared scope points. No absorbed
divergence — the code matches the declared intent, including the negative
declarations (grep confirms the preserved set is exactly the declared set, no
more and no less). The stories additionally *flag* the two consequences the
operator did not spell out but that follow from the design — the strict-schema
rejection of the legacy slot key (STORY-83 Technical Context + AC-686) and the
deliberate `capabilities.js` non-change (AC-702) — rather than leaving them for a
later reader to mistake for residue.

## Ungrounded Stories

None. Every claim in both story bodies traces to code read this session.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Behavior-Module Contract & Catalog | story-179b8c06 (upgrade) | ✓ story retitled + body restated; CAP-72 retitled "Behavior Module Contract & Catalog"; AC-697/698/702/703/704 reworded as specified; **AC-722 added** |
| 2. L1 slot seam | story-d0a8cfad (upgrade) | ✓ AC-682 names the renamed field; AC-686 records the legacy key as rejected; **AC-723 added**; the failing fixture is repaired |

No plan item was dropped. Both `add` ACs and all 7 `modify` ACs in the plan landed.

## Step 5b — Evidence Sufficiency

Ran `pnpm --filter @1stcontact/site-schema build` then
`npx vitest run tests/reconciliation-l1-substrate.test.ts tests/reconciliation-behavior-modules.test.ts tests/req87-behavior-rename.test.ts`:
**3 files, 20 tests, 20 passed, 0 skipped** (18.8s). The browser-dependent ACs
(AC-683 round-trip, AC-688 cross-browser) genuinely executed — they are not
skipped-as-passed.

**The regression the plan flagged is fixed.** `tests/reconciliation-l1-substrate.test.ts:129`
now authors `{ kind: 'slot', name: 'gallery', behavior: 'carousel' }`;
`test_UAT_AC682_valid_document_and_optional_primitives_accepted` passes.

Per-AC evidence for the new/modified ACs:

- **AC-722** — runtime assertions over the real artifacts: every `registry` entry's `meta.kind === 'behavior'`; the root export list contains no key matching `/capability/i`; the three validators drive real accept/reject outcomes (`config.view`, `slots.slide[0]`, union of both); a dynamic import of the pre-rename `modules/capability` path rejects. Discriminating: each assertion fails if the behaviour regresses.
- **AC-682** — real `validateL1` over a hand-authored document plus per-primitive variants, including a slot **with and without** the optional `behavior` field.
- **AC-686** — the decisive paired assertion: the *same* slot keyed `behavior` is accepted and keyed `capability` is rejected, alongside 12 other single-rule envelope violations with an in-range positive control.
- **AC-723** — renders through the real emitter and asserts (a) both attributes for a declared id, (b) attribute *absent* (not empty) when undeclared, (c) attribute-breakout payloads escaped in both the name and the module id, and no `data-l1-capability` in the page.
- **AC-697/698/703/704/702** — reworded only; each still reaches the behaviour through the renamed validators / real conformance harness / a real `cmdNew`+`cmdRender` build. AC-702 additionally asserts the `capabilities.js` filename and `./capabilities.js` page reference the AC now explicitly claims.

No AC lacks a covering UAT; no covering UAT would pass with its AC's behaviour removed.

## Judgment Calls

- **Comment-only nits excluded from the matrix — acceptable.** No user-visible capability; the plan's justification test correctly rejects them. Verified applied in code so nothing is silently lost.
- **`capability` residue in test prose — acceptable.** `tests/req85-capability-contract.test.ts` keeps its filename and several `describe` strings / comments across `req85-*`, `framework-content-modules`, `generate`, `chat9-edit-hooks` still say "capability module". Grep confirms **no live `kind: 'capability'` discriminant, no `Capability*` identifier, and no `data-l1-capability` survives in `tests/`** — the only occurrences are negative assertions and prose. The intent's acceptance wording is discriminant-atomicity, which holds. A cosmetic follow-up sweep ticket is optional, not required.
- **AC-722's type-name evidence is partly source-text inspection — non-blocking, but worth recording.** TypeScript types erase at runtime, so "published under the `Behavior*` names" has no runtime form; the UAT supplements its runtime assertions with `readFileSync` checks on `index.ts` / `behavior.ts`. Two mitigations make this sufficient rather than structural bookkeeping: (a) every *behavioural* claim of AC-722 has an independent runtime assertion (registry discriminant, export-key scan, validator outcomes, legacy-path import rejection); (b) `packages/framework/tsconfig.json` typechecks `src/**`, so a re-export naming a nonexistent type fails the package build. **Caveat for a future reader**: no tsconfig includes `tests/`, so the in-test comment "the file would not compile if any had failed to resolve" is inaccurate — the test file's `import type` bindings are erased by esbuild and never typechecked. Adding `tests/` to a typecheck target would convert that comment into real evidence.
- **AC-702's negative arm mocks `getModuleClientJs` — non-blocking.** It substitutes one repo-owned seam to construct a catalog that ships no client behaviour, which cannot otherwise be expressed without editing the real catalog. The positive arm runs the real pipeline end-to-end with zero mocking, and a closing assertion (`getModuleClientJs().length > 0`) proves the positive arm is not vacuous. Pre-existing structure, not introduced by this reconciliation.

## Verdict

**PASS**. Stories accurately and completely document the behaviour surface of
REQ-87 and are faithful to the operator's stated intent, including its explicit
negative declarations. A developer reading STORY-85 and STORY-83 would have a
correct mental model: the runtime type is renamed atomically with no alias, the
L1 slot field follows it and the legacy key now fails loudly at the strict
envelope, the emitted attribute is `data-l1-behavior`, and `capabilities.js` is a
deliberate non-change rather than missed residue. Both plan items produced
output, the fixture regression the plan identified is repaired, and all 20
covering UATs pass with assertions a broken implementation would not survive.
