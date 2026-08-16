---
uid: report-c461de60
id: REPORT-2043
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=uat)'
created_by: xgd
created_at: '2026-08-16T01:49:27.433322+00:00'
updated_at: '2026-08-16T01:49:27.433322+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-7ef6a9ea. Second uat-level check, re-run after fix attempt 1
(REPORT-2042 / report-f700fb44, `fixes_applied: 8`, commit 33fab518f, +184/-14 in
`tests/reconciliation-beyond-l1-authoring.test.ts`). Capability CAP-94, one story
(STORY-107 / story-b3de4571, `story_kind=feature`), 15 active ACs (AC-1095 … AC-1109),
15 UATs.

The previous check (REPORT-2041 / report-aabaf2e1) raised 1 violation and 3 warnings, all
`uat-edit`. **All four are resolved.** The state was re-read rather than assumed: the
commit diff was read in full, and each new assertion was checked against the production
code it drives.

**Method note (same limit as both previous passes).** The session's permission mode again
refused `npx vitest`, so the suite was **not executed** — one attempt was made this turn
and denied. Every judgement below is from static reading of the new assertions against
`packages/framework/src/l2/presets.ts`, `packages/framework/src/l2/contact-form.ts`,
`packages/framework/src/modules/contact-form/{meta,controls}.ts`,
`tools/generate/src/cli/{edit,index,scaffold}.ts` and
`tools/generate/src/cli/ai/{toolbox.ts,l1-surface.json}`. No claim is made that the suite
currently passes; the fix report (REPORT-2042) forwards the same gap and it remains the
one outstanding verification for this capability.

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference; the `ac` level ran and passed
(REPORT-2040) after its own fix. Ledger unchanged since REPORT-2041.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | The declared control surface this story builds on — owned by another capability | YES (dependency) |
| REQ-129 | free_and_reconciled | 2026-08-09 | Element-tree authoring (`get_l1`/`set_l1`) — owned by another capability | YES (dependency) |
| REQ-130 (request-ed6ba145) | free_and_reconciled | 2026-08-09 | Beyond L1: structured config, module instantiation, page metadata, generated assets — the whole of this capability | YES |
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | 2026-08-10 | Bundle carrying REQ-130 to main (`merged_at_commit` 0198704b) | YES |

No retired or imminent intent touches this capability. `STORY-107.fields.intent_uid =
bundle-e59210c5`; no `updated_by` chain on the capability, story or ACs.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 → test_UAT_AC1095 (:153) | REQ-130 | aligned — unchanged since last check |
| AC-1096 → test_UAT_AC1096 (:189) | REQ-130 | aligned (warning carried up to `ac`) — observable refusal asserted, and the advised group-plus-object form now proven actionable (:222-233) |
| AC-1097 → test_UAT_AC1097 (:236) | REQ-130 | aligned — unchanged |
| AC-1098 → test_UAT_AC1098 (:267) | REQ-130 | aligned — unchanged |
| AC-1099 → test_UAT_AC1099 (:322) | REQ-130 | **now aligned** — surface `presentation` param exercised (:456-470), verbatim read asserted (:370), module-scoped `set_l1` round-trip added (:376-395), both carousels reach the render |
| AC-1100 → test_UAT_AC1100 (:485) | REQ-130 | aligned — unchanged |
| AC-1101 → test_UAT_AC1101 (:529) | REQ-130 | aligned — unchanged |
| AC-1102 → test_UAT_AC1102 (:575) | REQ-130 | aligned — unchanged |
| AC-1103 → test_UAT_AC1103 (:623) | REQ-130 | aligned — unchanged |
| AC-1104 → test_UAT_AC1104 (:732) | REQ-130 | aligned — unchanged |
| AC-1105 → test_UAT_AC1105 (:771) | REQ-130 | aligned — unchanged |
| AC-1106 → test_UAT_AC1106 (:790) | REQ-130 | aligned — unchanged (validator-shaped by the AC's own Verification) |
| AC-1107 → test_UAT_AC1107 (:817) | REQ-130 | aligned — redrawn bytes hoisted to the shared `REDRAWN` constant, assertions byte-identical to before |
| AC-1108 → test_UAT_AC1108 (:855) | REQ-130 | aligned — unchanged |
| AC-1109 → test_UAT_AC1109 (:905) | REQ-130 | **now aligned** — `1c module set` / `1c module rm` / replacing `asset write --force` added on both sides of the CLI↔surface pair, with the merged config, the surviving `spare` seam and a single-entry registry asserted |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1096 (acceptance_criterion-61fb6823) | ac-edit | Carried up from the last check's finding 3, now confirmed at the code and correctly *not* forced into the test. AC-1096 says the top-level non-object write is refused "with a hint naming the group-plus-object form" — that hint exists only at `edit.ts:1191-1195`, and no caller can reach it: the CLI takes the key positionally (`index.ts:1215-1219`, `requireArg`), and the surface declares `settings` as `{type: object, required: true}` (`l1-surface.json`) so the declaration's shape check fires first. The UAT now asserts the refusal a caller actually receives and then proves the advice is actionable, recording the reason in-test (:208-216). Nothing further is fixable at uat level | If the criterion should stop describing text no caller can observe, that is an `ac`-level wording edit at the next `ac` cycle — not a test change. Non-blocking |
| 2 | info | consistency | AC-1099 / test_UAT_AC1099 | — | Violation from REPORT-2041 resolved and checked at the code: `presentation` reaches `editModuleAdd`'s `slots` at `toolbox.ts:312`, so the new surface call is real evidence; `expect(node).toEqual(readPage().modules[0].slots.form)` holds because `presetSlots` stores `form` as a single node (`l2/presets.ts:23-28`), `pageSegments` wraps it as a one-element root list so the first `module==='signup'` segment is path `0`, and `editL1Get` returns the stored node verbatim (`edit.ts:594-611`) | none |
| 3 | info | consistency | AC-1099 / test_UAT_AC1099 (:376-395) | — | The module-scoped `set_l1` round-trip is sound: with `twoFields`, `contactFormPreset` (`l2/contact-form.ts:100-115`) emits exactly one `text` node — the `message` field's visible label, since `email` is `labelMode: 'placeholder'` and `submit` is a bare control — so the `kind === 'text'` segment is unambiguous, and `writeSegmentRoots` (`edit.ts:388-397`) puts a single slot's subtree back. The `not.toContain('What do you need?')` assertion is scoped to the stored `slots.form` JSON, not the HTML, which is correct: the module also emits an invariant a11y `<label>` from `config` (`modules/contact-form/meta.ts:74`, `controls.ts:48-52`), so those words legitimately survive in the render | none |
| 4 | info | coverage | AC-1109 / test_UAT_AC1109 | — | The CLI additions are wired as claimed: `module set` requires `--config` (`index.ts:1168-1180`), `module rm` at `index.ts:1184`, and `asset write` takes `--force` and `--alt` (`index.ts:1234-1239`). `expect(assets.map(a => a.id)).toEqual(['wordmark.svg'])` is safe because the scaffold starts at `assets: []` (`scaffold.ts:36`), so it proves replacement is not a second asset. CLI and surface sequences are in the same order on both roots, which the closing deep-equality assertions require | none |
| 5 | info | exclusivity | AC-1107 vs AC-1109 | — | Both now exercise drawing replacement, but for different claims — AC-1107 proves conflict-then-explicit-replace at the surface, AC-1109 proves the CLI and the surface produce the same stored definition. Not redundant | none |
| 6 | info | exclusivity | test_UAT_AC1095-1109 vs tests/test_UAT_FC_REQ-130_beyond_l1.test.ts | — | Unchanged from last check: REQ-130's free-coded suite covers overlapping scenarios in the same shape. Expected under reconciliation (FC tests are intent-era evidence, AC UATs are the matrix's); not a matrix-exclusivity violation | none |
| 7 | info | — | whole level | — | Suite still not executed — `npx vitest` refused by the session's permission mode on a fresh attempt this turn. All findings static | none |

## Notes for the Editor

- **Nothing is outstanding at this level.** All four actionable findings from REPORT-2041
  were fixed additively; no prior assertion was weakened or removed, which the diff of
  commit 33fab518f confirms line by line (the only deletions are the two lines replaced by
  the stronger `toEqual`, the local `redrawn` hoisted to `REDRAWN`, and the two AC-1109
  assertions tightened from `toContain`/`MARK` to `toEqual`/`REDRAWN`).

- **The one thing this check cannot close is execution.** Three consecutive sessions
  (report-aabaf2e1, report-f700fb44, this one) have been unable to run
  `tests/reconciliation-beyond-l1-authoring.test.ts`. The new assertions are the kind that
  fail loudly if wrong — a deep `toEqual` against the stored subtree, an exact label
  string, an exact registry array — so a run is worth arranging before this capability is
  treated as evidenced. If the regression suite runs this file downstream, that satisfies
  it; if not, it wants an operator run. The static justifications are recorded in finding
  2-4 above with file:line so a failure can be triaged against them quickly.

- **AC-1096's `ac`-level tail is the only carried item**, and it is a wording question
  about an unreachable hint, not a behavioural gap. Recorded as a warning so the next `ac`
  cycle sees it; it does not block this level.
