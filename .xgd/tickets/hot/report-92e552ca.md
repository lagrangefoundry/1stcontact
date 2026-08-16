---
uid: report-92e552ca
id: REPORT-2058
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=uat)'
created_by: xgd
created_at: '2026-08-16T03:30:13.412746+00:00'
updated_at: '2026-08-16T03:30:13.412746+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-00e77e55 (CAP-92).

Attempt 2 — a re-check after the fix workflow (report-4298fc9e / REPORT-2057,
`fix_structural_validation`, 3 fixes applied) responded to attempt 1
(report-cd1bf91b: 2 violations, 1 warning). The tree was re-read from the ticket
store and the evidence file re-read from disk rather than assumed fixed; all
three prior findings are independently confirmed closed below, against the
shipped `l1-surface.json` / `instances.json` rather than against the fix
report's account of itself.

Tree as it stands: one story (STORY-105 / `story-93905de4`, `story_kind=feature`,
status `completed`), thirteen acceptance criteria — AC-1071 … AC-1082 plus
AC-1142 — all `active`, all `kind=behavior`, none `regression_only`
(`next_cursor: null` at 13 items, so this is the whole tree and not a paginated
slice). No AC title or body changed between attempts; the fix was entirely
test-layer, as attempt 1 predicted it would have to be.

Evidence file: `tests/reconciliation-assistant-control-surface.test.ts`, now 592
lines and **thirteen** `it(...)` blocks — one per AC. `git diff HEAD~1 --stat`
confirms the fix touched this file and nothing else (104 insertions, 6
deletions); no production file and no ticket body was modified. No internal
component is mocked anywhere in the file: the tests drive `createL1Toolbox`,
`l1Operations` and `editL1Set` for real against a per-test `mkdtemp` site built
by `cmdNew`, and read the draft's bytes back from disk.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5`. No element in the tree
— capability, story, or any of the thirteen ACs — carries an `updated_by` chain,
so the bundle remains the sole intent attachment point. Ledger carried forward
from attempts 1 (story, ac, uat) and re-confirmed:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | merged at `0198704b7e29db3c53cf569070042cec0eb467bc` | Umbrella for the eight constituent requests below | YES |
| REQ-125 (`request-dbdc904a`) | legacy_done | design predecessor | DOC-30 — the L1 control-surface API design and its gap list | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | BUNDLE-17 | Builder chat panel: AI session, declared tool surface, per-site sessions | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | BUNDLE-17 | Built the surface: declaration as data, error taxonomy with caller-facing meanings, effect-homogeneous groups, **sequences**, absences, addressing contract, surface version, grant, provenance, audit, CI validator | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | BUNDLE-17 | L1 tooling configuration projected over the surface | YES |
| REQ-129 (`request-b1300473`) | free_and_reconciled | BUNDLE-17 | Verbatim `get_l1` / `set_l1`; **`sequences` rewritten around read-then-replace plus an explicit add/remove sequence** | YES |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | BUNDLE-17 | Structured config, module instantiation, page metadata, generated assets; a `sequences:` entry for read-before-amend | YES |
| REQ-119 / REQ-121 / REQ-128 | free_and_reconciled | BUNDLE-17 | Request-time render, copy-edit modal chrome, background image picker — do not touch this capability | YES (not applicable here) |

Every counting intent is fully reconciled; nothing is merely imminent, and no
intent in the ledger retires behaviour this tree claims. Per the level cascade
the AC bodies are the working reference and were treated as correct — the
ac-level cycle closed clean at report-33a003cd. Intent was consulted only to
corroborate AC-1142 and AC-1080, the two elements the ac-level fix authored or
amended, since those are the ones whose tests could not have predated them.

## Alignment Ledger

One row per AC, recording its evidence and whether that test exercises what the
AC claims. Line numbers are current, in
`tests/reconciliation-assistant-control-surface.test.ts`.

| Element | Test (evidence) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1071 (`acceptance_criterion-6dec52fd`) | `test_UAT_AC1071_...` (:162) | REQ-126 §5 | aligned — framework's own `validateData([L1_DECLARATION], L1_INSTANCES)` at author time; `problems: []`, `ok`, `surfaces: ['l1']`, roles ⊇ `CARETAKER_ROLE`. Unchanged by the fix. |
| AC-1072 (`acceptance_criterion-becf310b`) | `test_UAT_AC1072_...` (:178) | REQ-126 R6 | aligned — format `version === 1`; `L1_SURFACE_VERSION` an integer > 0, equal to `surface_version` re-read from the shipped JSON and distinct from `version` (`1` vs `3`). Unchanged. |
| AC-1073 (`acceptance_criterion-1c764340`) | `test_UAT_AC1073_...` (:198) | REQ-126 §1, §2 | aligned — set equality callable ≡ declared; every write tool in exactly one `write` group; the 12-name write set pinned; read half grouped on the same terms. Unchanged. |
| AC-1074 (`acceptance_criterion-c595b0f5`) | `test_UAT_AC1074_...` (:244) | REQ-126 §3 | **aligned — attempt 1's warning is closed** (finding 3 below). |
| AC-1075 (`acceptance_criterion-95620a93`) | `test_UAT_AC1075_...` (:291) | REQ-126 | aligned — `ReadSite`-only grant; write neither offered nor mentioned; invoking it refused, draft bytes unchanged, prior value still readable. Unchanged. |
| AC-1076 (`acceptance_criterion-b589483b`) | `test_UAT_AC1076_...` (:317) | REQ-126 §2 | aligned — all three declared faults named; draft unchanged; exactly three audit records, each `{decision: 'refuse', rule: 'schema'}`. Unchanged. |
| AC-1077 (`acceptance_criterion-72dfce4f`) | `test_UAT_AC1077_...` (:346) | REQ-126 §1 | aligned — `NOT_FOUND` plus `L1_DECLARATION.errors.NOT_FOUND.message` taken from the taxonomy, "Re-read the listing" guidance asserted, draft byte-identical. Unchanged. |
| AC-1078 (`acceptance_criterion-bd0f50cc`) | `test_UAT_AC1078_...` (:369) | REQ-126 §4 | aligned — read wrapped in the untrusted markers with the page's words inside; write confirmation unmarked; manual carries and explains the marker. Unchanged. |
| AC-1079 (`acceptance_criterion-ffa07ea7`) | `test_UAT_AC1079_...` (:396) | REQ-126 §4 | aligned — exactly three records; surface/operation/effect on the read; effect, `params`, `{decision: 'allow', rule: null}`, `ok: true` on the write; allowed-but-unsuccessful third carrying `NOT_FOUND`. Unchanged. |
| AC-1080 (`acceptance_criterion-73371752`) | `test_UAT_AC1080_...` (:432) | REQ-126 §6, REQ-127 | **aligned — attempt 1's violation is closed** (finding 2 below); all four projected items now asserted. |
| AC-1081 (`acceptance_criterion-ea231234`) | `test_UAT_AC1081_...` (:468) | REQ-126 §1, DOC-30 R4 | aligned — rule asserted on `param_types.l1_address.description` and the overview; address-taking operations identified structurally (the `module`+`slot` scope pair) and pinned to `['get_l1','set_l1']`, each typed `l1_address` with no per-operation restatement. Unchanged. |
| AC-1082 (`acceptance_criterion-f4dc6dcc`) | `test_UAT_AC1082_...` (:491) | REQ-126 Behaviour | aligned — address taken from the map; change report asserted; value read back from disk; draft rewound and the same change made through `editL1Set`, with byte-for-byte equality against what the surface produced. Unchanged. |
| **AC-1142 (`acceptance_criterion-670113cb`)** | **`test_UAT_AC1142_worked_sequences_are_declared_data_and_none_names_an_ungranted_operation` (:528)** | REQ-126 §1, REQ-129, REQ-130, DOC-30 R5 | **aligned — attempt 1's violation is closed** (finding 1 below). |

Coverage: thirteen active ACs, thirteen tests, one apiece. Exclusivity: a
repo-wide scan of `test_UAT_AC1060`–`AC1099` and `AC1140`–`AC1149` returns
exactly one test per AC number, each in one file; no AC in this tree is covered
twice.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1142 (`acceptance_criterion-670113cb`) | — | **Attempt 1's `uat-add` violation is closed.** `test_UAT_AC1142_...` (:528-591) exists and is substantive — it drives the real Toolbox, not an AST check. Every clause of the AC's verification is asserted, and each was re-checked against the shipped declaration so that none of them is vacuously true: sequences read from `L1_DECLARATION.sequences` directly rather than through `validateData` (:532); list non-empty (6 entries); each entry named, ≥2 ordered steps, non-empty note (:538-547); every step a declared operation tool (:546 — verified: all 6 sequences' steps are declared tools); read-then-replace ordering on the sequences that both read and write (:552-559 — verified: exactly the two page-editing sequences match the filter, both ordered `describe_page` → `get_l1` → `set_l1`, so the `>= 2` and both `indexOf` assertions bite); the changing sequence's note explaining whole-element replacement (:563 — the note reads "…you are sending the whole thing back…"); the add/remove sequence sharing that shape and naming no insert/delete, with the "because none is declared" half evidenced by asserting the declaration declares no such tool (:569-571 — verified: no declared tool matches `/insert|delete/`); and the grant-filtering clause (:578-590), where the ungranted set is computed against `box.toolNames()` and anchored with `toContain('Publish deliberately')` — verified as today's single instance, since `instances.json` grants the caretaker six of eight groups and withholds `Publish`, whose sequence names `publish`. | none |
| 2 | info | consistency | AC-1080 (`acceptance_criterion-73371752`) | — | **Attempt 1's `uat-edit` violation is closed.** The manual's addressing-rule clause is now asserted at `:440-452`, and asserted the way the AC frames it — the paragraph is extracted from `L1_DECLARATION.overview` structurally (split on blank lines, filtered by wording) and required to appear in `box.manual()` verbatim, so the rule cannot come from a preamble maintained beside the manual while the declaration's own says something else. The extraction was verified against the shipped overview: it splits into 5 paragraphs, exactly one matches `/re-read/i`, and that paragraph also matches `/regenerat/i` — so `expect(addressing).toHaveLength(1)` holds on real data and the assertion is well-defined rather than accidentally passing on an empty or multi-element array. This is genuinely distinct from AC-1081, which asserts the same rule on the *declaration*; the two now cover the declaration and its projection respectively. | none |
| 3 | info | consistency | AC-1074 (`acceptance_criterion-c595b0f5`) | — | **Attempt 1's warning is closed.** The two hard-coded title literals are gone; `:268-276` derives `withheld = groups() ∖ grantedGroups()` from `L1_DECLARATION` and `L1_INSTANCES` and asserts, per withheld group, that the manual contains neither `### <title>` nor `**<tool>**` for any of its operations. Verified: the derivation yields exactly `ManageAssets` ("Managing images and fonts" → `add_asset`, `remove_asset`) and `Publish` ("Publishing" → `publish`), so the loop reproduces all five assertions the six deleted lines carried — `git diff HEAD~1` confirms the deletions are confined to that block and nothing elsewhere was weakened. The `arrayContaining(['ManageAssets','Publish'])` anchor at :270-272 keeps the derivation honest: it fails loudly if the grant widens, which is exactly the silent-vacuity failure mode the warning named. | none |
| 4 | info | exclusivity | AC-1142 vs `test_UAT_AC1088` (`tests/reconciliation-page-composition-surface.test.ts:472-478`) | — | Not a duplicate, recorded so a future check does not re-raise it. AC-1088 belongs to a different capability and asserts the add/remove sequence's steps and note as corroboration inside a composition flow that then performs the add and renders it; AC-1142 asserts the sequence *collection*'s discipline and its filtering against the grant. Different ACs, different shapes, overlapping only in one incidental assertion. | none |

## Notes for the Editor

- **Nothing to repair.** All three attempt-1 findings are closed, no new drift
  appeared, and the fix was confined to the layer attempt 1 said it had to be
  (one test file; no production code, no ticket body). The cascade that produced
  attempt 1's findings — the ac-level fix adding AC-1142 and amending AC-1080,
  with the UAT layer left behind — is now resolved at both levels.
- **Verification caveat, unchanged from attempt 1 and stated plainly:** the test
  suite could **not** be executed in this session. Every attempt was refused by
  the session's permission mode (`npx vitest run …`), and `@lagrangefoundry/ai`
  — which generates the manual and supplies `validateData` and the untrusted
  markers — is not installed under this worktree's `node_modules`, so the manual
  could not be inspected statically either. This report therefore certifies
  **matrix alignment**: that thirteen active ACs each have exactly one
  substantive UAT which asserts every clause of its verification section. It
  does **not** certify that the suite is green.
- **What that caveat does and does not leave open.** Every assertion whose
  outcome is decidable from data in this repository was checked against that
  data and holds — the overview's single `/re-read/i` paragraph, the withheld
  group set and its titles, the two read-then-write sequences and their
  ordering, the absence of any declared insert/delete tool, and `Publish
  deliberately` as the one ungranted sequence. What remains untested here is
  only what the upstream manual generator emits: AC-1080's `toContain(addressing[0])`
  and AC-1142's assertions that ungranted sequences are absent from
  `box.manual()`. If either fails, the failure is upstream in the manual
  projection, not in this matrix — the regression run is where that surfaces,
  and a red result there would be a `code-issue` for the fix loop, not a
  realignment of this tree.
- **Two patterns in this file are worth keeping as house style**, since the fix
  extended both: deriving expected values from `L1_DECLARATION` / `L1_INSTANCES`
  rather than restating them as literals (AC-1074, AC-1080, AC-1142 all now do
  this), and pairing each derivation with a non-vacuity anchor so an empty
  derived set cannot pass silently (`arrayContaining(['ManageAssets','Publish'])`,
  `toHaveLength(1)`, `toContain('Publish deliberately')`).
