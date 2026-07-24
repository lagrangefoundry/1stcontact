---
uid: report-c6d48521
id: REPORT-965
type: report
title: 'Reconciliation Review: commits (REQ-87 capability-module -> behavior-module
  rename)'
created_by: xgd
created_at: '2026-07-24T23:14:03.323472+00:00'
updated_at: '2026-07-24T23:14:03.323472+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: request-84af044b
  anchor_uid: request-84af044b
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: request-84af044b (REQ-87)
**Stories Reviewed**: 2 (story-179b8c06 / STORY-85, story-d0a8cfad / STORY-83)

## Summary

The **substance of this reconciliation is correct**. Intent fidelity, behavioural
coverage, plan-item accounting, and evidence sufficiency all pass, and I verified
the code independently this session:

- `npx vitest run` — **81 files, 572 tests, 0 failures**.
- `tsc --noEmit` on `packages/site-schema`, `packages/framework`, `tools/generate`
  — clean (the intent's own declared Verify step).
- `grep -rn "Capability|'capability'" packages tools --include=*.ts/*.astro/*.js`
  — **zero hits**. The rename is atomic, as the intent requires.

The FAIL is narrow and **prose-only**: three tickets carry "known defect / fails
on this branch" annotations that were true when written but were remediated by
the downstream test_fix loop (commit `088f2a81`). They now assert, in the durable
matrix record, that evidence for eight ACs does not execute — which is false. No
code, test, or AC semantics need to change.

## Behavior Inventory

5 behaviours identified in the free-coded commit `6cb7e8c4`:

1. Behavior-module contract published under the `Behavior*` names (8 contract
   types + `ConformanceObligation` + `BehaviorValidationError` + `AssertBehaviorMeta`
   + 3 renamed validators), `modules/capability.ts` git-mv'd to `behavior.ts`.
2. `kind: 'behavior'` discriminant on every catalog meta, atomic — no back-compat alias.
3. L1 slot seam: `l1SlotSchema`'s optional `capability` field renamed to `behavior`
   (schema stays `.strict()`, so the legacy key is *rejected*, not deprecated);
   renderer emits `data-l1-behavior` instead of `data-l1-capability`.
4. Deliberately preserved `capability` vocabulary: the emitted `capabilities.js`
   asset filename and its `./capabilities.js` page reference; driver capability
   negotiation; "schema-only capability"; the whole XGD capability matrix.
5. Comment-only nits folded in: `styles.ts` stale `.hero`/`.header__inner`
   selector note; contact-form dead `enhance.ts` references.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `Behavior*` contract published from package root | Covered | story-179b8c06 | AC-722 (new) pins the full name list + validators; AC-697/698 reworded to the renamed validators |
| 2 | `kind: 'behavior'` atomic discriminant | Covered | story-179b8c06 | AC-722 enumerates the catalog and asserts no `Capability*` root export; legacy module path rejects on dynamic import |
| 3a | L1 slot field renamed to `behavior` | Covered | story-d0a8cfad | AC-682 names the renamed field; AC-686 records the legacy key is rejected as an unknown key |
| 3b | `data-l1-behavior` render attribute | Covered | story-d0a8cfad | AC-723 (new) — previously asserted by no test at all; now proven incl. omit-when-absent and escaping |
| 4 | Deliberately preserved `capability` vocabulary | Covered | story-179b8c06 | AC-702 states the `capabilities.js` non-change explicitly so it is not later "corrected"; STORY-85 Technical Context repeats it |
| 5 | Comment-only nits | Covered (no AC — correct) | — | Verified landed in `styles.ts` and `contact-form/`; zero runtime effect, correctly not a plan item |

**Intent fidelity**: faithful on every declared item. The story bodies preserve
every REQ-85 behavioural obligation verbatim through the reword (config drives
behaviour, slots mount validated L1, five-dimension conformance incl. isolation),
and both capability buckets were retitled (CAP-72 -> "Behavior Module Contract &
Catalog"). No divergence between intent and code was absorbed silently.

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-179b8c06 | "### Known UAT defect — this story's reconciliation UAT file does not load ... `tests/reconciliation-capability-modules.test.ts` ... fails at import ... collecting **0 tests**" | The named file does not exist. It is now `tests/reconciliation-behavior-modules.test.ts`; it loads and **9 tests pass** (verified this session). |
| story-179b8c06 | "The per-AC `uat_coverage: pass` markings therefore predate the rename and are stale — no UAT in this file currently executes." | False, and actively harmful: it disclaims the evidence backing all eight of AC-697…AC-704, every one of which now has a passing UAT. |
| story-d0a8cfad | "**Known stale fixture at reconciliation time.** ... `test_UAT_AC682_valid_document_and_optional_primitives_accepted` fails on this branch (verified: 1 failed \| 6 passed)" | The fixture was repaired to the `behavior` key. That test passes; the whole file passes (11 tests). |
| story-d0a8cfad | "The emitted `data-l1-slot` attribute has incidental coverage ...; `data-l1-behavior` is asserted nowhere." | Superseded by AC-723's own UAT, which asserts both attributes directly. |
| acceptance_criterion-78662fd0 (AC-682) | "Note for UAT authoring: the existing fixture for this criterion still authors a slot with the pre-REQ-87 `capability` key and asserts acceptance, so it fails on this branch." | Remediation instruction that has been carried out; the fixture at `tests/reconciliation-l1-substrate.test.ts` now authors `behavior: 'carousel'` and passes. |

These are not behavioural inventions — they are transient workflow scaffolding
that leaked into durable records and is now factually wrong. That is why the
remedy below is strictly prose.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Behavior-Module Contract & Catalog (upgrade, 2pt) | story-179b8c06 | ✓ — story + CAP-72 retitled and restated; AC-697/698/702/703/704 reworded; AC-722 added pinning the `Behavior*` surface and the atomic discriminant |
| 2. L1 slot seam (upgrade, 1pt) | story-d0a8cfad | ✓ — AC-682 names the renamed field (fixture repaired), AC-686 extended to the rejected legacy key, AC-723 added for `data-l1-behavior` |

No plan items dropped. Points reconcile: 2 + 1 = 3, matching the anchor's declared
`story_points: 3`. Zero feature items, as expected for a mechanical rename.

## Evidence Sufficiency (Step 5b)

All 16 active ACs across the two stories have a passing, behaviourally-grounded UAT:

- **AC-682, 683, 684, 685, 686, 687, 688, 723** (STORY-83) — `tests/reconciliation-l1-substrate.test.ts`
- **AC-697, 698, 699, 700, 701, 702, 703, 704, 722** (STORY-85) — `tests/reconciliation-behavior-modules.test.ts`

Spot-checked the two ACs added by this reconciliation, since they carry the
rename's load-bearing claims:

- **AC-722** — not a source-inspection test in substance. It resolves the real
  registry, enumerates every catalog entry's runtime `kind`, drives
  `validateBehaviorConfig/Slots/Instance` through real accept **and** reject
  outcomes (`config.view`, `slots.slide[0]`, union ordering), filters the runtime
  root export list for `/capability/i`, and asserts the pre-rename module path
  **rejects on dynamic import**. A broken implementation cannot pass it. The two
  source-text reads are confined to the TypeScript *type* names, which erase at
  runtime and have no other observable form — a legitimate and explicitly-justified
  use, backed by the fact that the file would not compile if the types failed to resolve.
- **AC-723** — pure runtime observation of emitted HTML: three slots (declared id,
  no id, injection payloads), asserting both attributes present, the attribute
  *absent entirely* when undeclared, both values escaped, no live element, and no
  `data-l1-capability` residue. Would fail if any claim were removed.

No AC is covered by a mock of repository-owned code, and none passes by asserting
on source text alone.

## Judgment Calls

- **Comment-only nits given no AC — acceptable.** Zero runtime effect; an AC would
  be unfalsifiable bookkeeping. Verified landed by reading the files.
- **`capabilities.js` filename preserved — correctly documented, not a gap.**
  AC-702 and STORY-85's Technical Context both state the non-change and why, which
  is exactly the right handling of a deliberate inconsistency.
- **Cosmetic prose residue in unrelated test files** (`tests/req85-capability-contract.test.ts`
  filename, some `describe` strings) — **acceptable omission**. The intent's
  acceptance wording is that no `'capability'` *discriminant* remains, which holds.
  No behaviour attached; not worth a fix cycle.
- **Docs half of the intent (DOC-25/26, CLAUDE.md) not represented by a story** —
  acceptable. The matrix records behaviour, not doc tickets; the plan verified
  DOC-25/DOC-26 already read "Behavior Modules".
- **Stale defect notes flagged as material.** These are not omissions — they are
  positive misstatements about evidence validity sitting in the permanent record,
  covering eight ACs, and naming a file that no longer exists. A reader (human or a
  later assessor/regression pass) would reasonably conclude those ACs are unevidenced.
  That is precisely the failure mode this gate exists to prevent, and the fix is cheap.

## Required Fixes

**Scope: prose only, in three tickets. Do NOT change any code, any test, any AC
criterion or verification semantics, and do NOT re-open the rename.**

1. **story-179b8c06 (STORY-85)** — delete the `### Known UAT defect — this story's
   reconciliation UAT file does not load` section from `## Technical Context`
   entirely. Its remediation is complete: the file is now
   `tests/reconciliation-behavior-modules.test.ts`, it imports from
   `modules/behavior`, its fixtures declare `kind: 'behavior'`, and its 9 UATs pass.
   If any residue is worth keeping, it is one sentence recording that the UAT file
   was renamed and repaired in the same reconciliation — not a standing defect notice.

2. **story-d0a8cfad (STORY-83)** — in `## Technical Context`, delete the
   `**Known stale fixture at reconciliation time.**` bullet (the fixture now
   authors the `behavior` key and passes), and delete or rewrite the trailing
   bullet claiming `data-l1-behavior` "is asserted nowhere" — AC-723's UAT now
   asserts it directly.

3. **acceptance_criterion-78662fd0 (AC-682)** — delete the closing
   `Note for UAT authoring: ...` paragraph. The repair it requests has been made.
   The rest of the criterion and its Verification section are correct — leave them intact.

4. **Minor, non-blocking:** `acceptance_criterion-8d11ea8d` (AC-722) and
   `acceptance_criterion-8db8ef76` (AC-723) have no `uat_coverage` field set,
   while their sibling ACs are marked `pass`. Both have passing UATs. Set them to
   `pass` for consistency if the field is workflow-managed rather than derived.

## Verdict

**FAIL** — on record accuracy, not on coverage.

Behavioural coverage is complete, intent fidelity is faithful, both plan items
produced output, and all 16 active ACs are backed by passing UATs that a broken
implementation could not satisfy (572/572 tests green, typecheck clean, zero
`Capability*` residue in source). The matrix's *substance* is ready to merge.

What blocks it is that STORY-85, STORY-83, and AC-682 still carry defect notices
describing failures that the downstream test_fix loop has since repaired —
including an explicit claim that the evidence for eight ACs does not execute. Left
in place, the permanent record contradicts its own passing evidence and points a
future reader at a test file that no longer exists. Strike those three prose
blocks and this passes.
