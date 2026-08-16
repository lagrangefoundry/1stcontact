---
uid: report-cd1bf91b
id: REPORT-2056
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=uat)'
created_by: xgd
created_at: '2026-08-16T03:21:15.234786+00:00'
updated_at: '2026-08-16T03:21:15.234786+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: uat
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-00e77e55 (CAP-92).

Level cascade state: story level passed (report-920fcded), AC level passed on
attempt 2 (report-33a003cd, after fix report-19027252 added AC-1142 and amended
AC-1080). This is the first `uat`-level check recorded for this capability —
`xgd ticket list --type report --filter fields.subject_uid=capability-00e77e55`
returns only the story- and ac-level reports plus the one fix report, so the
`previous_attempt_count=1` carried into this invocation belongs to the ac-level
cycle, not to a prior uat cycle. The tree and the test file were both re-read
from disk rather than assumed.

Tree as it stands: one story (STORY-105 / `story-93905de4`, `story_kind=feature`,
status `completed`), thirteen acceptance criteria — AC-1071 … AC-1082 plus
AC-1142 — all `active`, all `kind=behavior`, none `regression_only`
(`next_cursor: null` at 13 items, so this is the whole tree).

Evidence file: `tests/reconciliation-assistant-control-surface.test.ts`
(494 lines, 12 `it(...)` blocks). No internal component is mocked — the tests
drive `createL1Toolbox` / `l1Operations` / `editL1Set` for real against a
per-test `mkdtemp` site created by `cmdNew`, and read the draft's bytes from
disk. Evidence validity is not in question anywhere in this tree; the two
findings below are both about *what is not asserted*.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5`. No element in the tree
— capability, story, or any of the thirteen ACs — carries an `updated_by`
chain, so the bundle is the sole intent attachment point.

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
intent in the ledger retires behaviour this tree claims. Per the level cascade,
the AC bodies are the working reference here and were treated as correct — the
ac-level cycle closed clean. Intent was consulted only to corroborate the two
elements the ac-level fix touched (AC-1142, AC-1080), because those are exactly
the elements whose tests could not have been written against them.

## Alignment Ledger

One row per AC, recording the test that is its evidence and whether that test
exercises what the AC claims. Line numbers are in
`tests/reconciliation-assistant-control-surface.test.ts`.

| Element | Test (evidence) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1071 (`acceptance_criterion-6dec52fd`) | `test_UAT_AC1071_declaration_and_grant_check_clean_before_anything_runs` (:150) | REQ-126 §5 | aligned — runs the framework's own `validateData([L1_DECLARATION], L1_INSTANCES)` at author time, asserts `problems: []`, `ok`, `surfaces: ['l1']`, roles ⊇ `CARETAKER_ROLE` (`roles.ts:102` = `'caretaker'`, the role `instances.json` configures). All four verification clauses present. |
| AC-1072 (`acceptance_criterion-becf310b`) | `test_UAT_AC1072_...version_distinct_from_the_format_version` (:166) | REQ-126 R6 | aligned — asserts format `version === 1`, `L1_SURFACE_VERSION` integer > 0, and that it equals `surface_version` re-read from the shipped JSON on disk and differs from `version` (declaration carries `version: 1`, `surface_version: 3`). The "read from the declaration rather than hard-coded beside it" clause is genuinely exercised. |
| AC-1073 (`acceptance_criterion-1c764340`) | `test_UAT_AC1073_everything_callable_is_declared_and_the_write_set_is_closed` (:186) | REQ-126 §1, §2 | aligned — set equality between `Object.keys(l1Operations(...))` and declared `op` names; every write tool in exactly one group whose effect is `write`; the 12-name write set pinned literally; the read half grouped on the same terms. |
| AC-1074 (`acceptance_criterion-c595b0f5`) | `test_UAT_AC1074_declared_operations_can_be_withheld_from_a_consumer` (:232) | REQ-126 §3 | aligned (see warning 3) — declared ⊇ {add_asset, remove_asset, publish}; absent from `toolNames()` and from the manual, group titles included; calling `add_asset` yields `/not enabled/i`, byte-identical draft, and a last audit record of `{decision: 'refuse', rule: 'capability'}` naming the operation. |
| AC-1075 (`acceptance_criterion-95620a93`) | `test_UAT_AC1075_a_read_only_grant_cannot_reach_a_write` (:272) | REQ-126 | aligned — a `ReadSite`-only grant built through the real `createL1Toolbox`; read offered, `set_l1` neither offered nor mentioned; invoking it anyway refused, draft bytes unchanged, and the headline still reads as before. |
| AC-1076 (`acceptance_criterion-b589483b`) | `test_UAT_AC1076_arguments_are_checked_before_any_value_reaches_the_site` (:298) | REQ-126 §2 | aligned — all three declared faults (wrong type, missing required, undeclared parameter) each named in the answer; draft unchanged; exactly three audit records, every one `{decision: 'refuse', rule: 'schema'}`, which is what proves the refusal was decided on the declaration and not returned from the write path. |
| AC-1077 (`acceptance_criterion-72dfce4f`) | `test_UAT_AC1077_a_refusal_names_its_code_and_that_codes_published_meaning` (:327) | REQ-126 §1 | aligned — write at a composed address `9.9.9`; answer contains `NOT_FOUND` **and** `L1_DECLARATION.errors.NOT_FOUND.message` taken from the taxonomy rather than restated locally, with the "Re-read the listing" guidance asserted; draft byte-identical. Correctly does not claim the recorded upstream pointer-drop gap closed. |
| AC-1078 (`acceptance_criterion-bd0f50cc`) | `test_UAT_AC1078_reads_are_marked_third_party_and_write_confirmations_are_not` (:350) | REQ-126 §4 | aligned — read wrapped in `UNTRUSTED_OPEN`/`UNTRUSTED_CLOSE` with the page's own words inside; write confirmation carries neither marker; manual contains the marker and explains it (`/third part/i`). All three clauses. |
| AC-1079 (`acceptance_criterion-ffa07ea7`) | `test_UAT_AC1079_every_call_against_the_site_is_recorded` (:377) | REQ-126 §4 | aligned — read + successful write + site-refused write produce exactly three records; surface/operation/effect on the read; effect, `params`, `{decision: 'allow', rule: null}` and `ok: true` on the write; and the allowed-but-unsuccessful third record carrying `NOT_FOUND`. |
| AC-1080 (`acceptance_criterion-73371752`) | `test_UAT_AC1080_the_manual_is_a_projection_of_the_declaration_and_the_grant` (:413) | REQ-126 §6, REQ-127 | **gap — finding 2**: three of the criterion's four projected items asserted (offered operations, declared absences incl. HTML/CSS/JS, error code with its published meaning); the **addressing rule** clause the ac-level fix added is not asserted anywhere in the test. |
| AC-1081 (`acceptance_criterion-ea231234`) | `test_UAT_AC1081_the_addressing_rule_is_stated_once_and_every_address_is_typed` (:435) | REQ-126 §1, DOC-30 R4 | aligned — `param_types.l1_address.description` matches `/re-read/i` and `/regenerat/i`, the overview matches `/re-read/i`; address-taking operations identified *structurally* (params carrying the `module`+`slot` scope pair) and pinned to `['get_l1','set_l1']`, each declared as type `l1_address` with no per-operation restatement. Verified against the declaration: `add_page`/`update_page` also carry a `path`, but it is a URL path of type `string`, correctly outside this set. |
| AC-1082 (`acceptance_criterion-f4dc6dcc`) | `test_UAT_AC1082_a_change_through_the_surface_lands_via_the_one_write_path` (:458) | REQ-126 Behaviour | aligned — address taken from the map rather than composed; change report's `changed`/`message` asserted; new value read back from disk; then the draft is rewound and the same change made through `editL1Set` directly, with the resulting file asserted byte-for-byte equal to what the surface produced. That byte equality is the strongest available form of "no second write route". |
| **AC-1142 (`acceptance_criterion-670113cb`)** | **none** | REQ-126 §1, REQ-129, REQ-130, DOC-30 R5 | **gap — finding 1**: no `test_UAT_AC1142_*` exists anywhere under `tests/`. |

Exclusivity: a repo-wide scan of `test_UAT_AC1060`–`AC1099` and `AC1140`–`AC1149`
returns exactly one test per AC number, each in a single file. No AC in this
tree is covered twice, in the same shape or any other.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1142 (`acceptance_criterion-670113cb`) | uat-add | No substantive UAT exists. `grep -rn "AC1142" tests/` returns nothing; the AC was created by the ac-level fix (report-19027252) after the evidence file was written, so no test was ever authored against it. The nearest thing in the repo is `test_UAT_AC1088` (`tests/reconciliation-page-composition-surface.test.ts:472-478`), which belongs to a different capability's AC and touches only one of this AC's five clauses — it asserts the add/remove sequence's steps and note as corroboration for a composition flow, and asserts nothing about the sequence list as a whole, about steps being declared operations, or about the manual. Four clauses are wholly unevidenced, including the grant-filtering one: the declaration's sixth sequence, "Publish deliberately", names `publish`, which `instances.json` does **not** grant the caretaker (granted: ReadSite, AuthorPages, ManagePages, ManageComponents, WriteConfig, DrawImages). Nothing currently proves that sequence is withheld from what the assistant is shown, and AC-1074's manual assertions would not catch it — they match the offered-operation form `**publish**` and the group heading `### Publishing`, neither of which is how a sequence step renders. | Add `test_UAT_AC1142_*` to `tests/reconciliation-assistant-control-surface.test.ts`, reading `L1_DECLARATION.sequences` directly (not via `validateData`, which an empty list satisfies): assert the list is non-empty; each entry has a `name`, ≥2 ordered `steps` and a `note`; every step is the `tool` of a declared operation; the "Change something on a page" sequence orders `get_l1` before `set_l1`; the add/remove sequence has the same read-then-write shape and names no insert/delete operation; then build the caretaker Toolbox and assert every sequence surfaced to it names only operations in `box.toolNames()` — `publish` being today's instance. |
| 2 | violation | consistency | AC-1080 (`acceptance_criterion-73371752`) / `test_UAT_AC1080_...` at `tests/reconciliation-assistant-control-surface.test.ts:413-433` | uat-edit | The test does not exercise its AC's full claim. AC-1080's verification names four things the manual must carry, and its title lists "the addressing rule" as the third; the ac-level fix (report-19027252) added that item precisely because it had been missing from the criterion. The test asserts the other three — offered operations (:419), the `Not available` section with every `L1_DECLARATION.absences` name and the HTML/CSS/JavaScript absence (:423-427), and `NOT_FOUND` with `taxonomy.NOT_FOUND.message` (:430-432) — and makes no assertion whatsoever about the manual and the addressing rule. AC-1081 does not close this: it asserts the rule in the *declaration* (`param_types.l1_address.description`, `overview`), which is a different artifact from the manual projected for a consumer. So the specific thing AC-1080 asserts — that the rule survives the projection rather than depending on prose kept beside it — has no evidence. The declaration's overview does carry the wording ("Addresses last exactly as long as the map you read them from… regenerated every time the page is rendered… re-read the map"), so the assertion is expected to be satisfiable; the manual generator itself lives in the upstream `@lagrangefoundry/ai` store and was not resolvable in this worktree, so whether it currently projects that paragraph could not be confirmed statically — the added assertion is what settles it. | In `test_UAT_AC1080_...`, assert `manual` matches `/re-read/i` and `/regenerat/i`, and tie the wording to its source rather than to a literal — e.g. assert the manual contains the overview's addressing paragraph taken from `L1_DECLARATION.overview` — so the test fails if the rule is re-authored beside the manual instead of projected from the declaration. |
| 3 | warning | consistency | AC-1074 (`acceptance_criterion-c595b0f5`) / `test_UAT_AC1074_...` at `tests/reconciliation-assistant-control-surface.test.ts:256-257` | uat-edit | Evidence durability, not a coverage gap: the "nor does the title of a group it was not granted" clause is asserted with hard-coded strings `'### Managing images and fonts'` and `'### Publishing'`. Both currently match `l1-surface.json` group titles exactly, so the assertion bites today — but it is a `not.toContain` on a literal, so re-wording either title upstream turns it silently vacuous while the test stays green. The same test's sibling assertions and AC-1080's absence loop already use the better pattern (deriving names from `L1_DECLARATION`). Non-blocking. | Derive the withheld titles from the declaration: take the groups in `L1_DECLARATION.groups` whose `group` is absent from the caretaker grant and assert the manual contains neither their `title` nor their operations. |

## Notes for the Editor

- **Both violations trace to the same cause and neither is a code defect.** The
  ac-level fix (report-19027252) added AC-1142 and amended AC-1080's fourth
  item; the UAT layer was never re-synchronised behind it. This is the expected
  cascade shape — an ac-level repair leaves a uat-level debt — and both fixes
  are additive test work in one file. No production code change is implied by
  either finding, which is why neither is classified `code-issue`.
- **Both fixes belong in the same test and the same file**, and both need the
  caretaker Toolbox that `caretaker()` (`:117`) already builds, so they can be
  written together. Finding 1's last clause and finding 2 both read
  `box.manual()`.
- **Finding 1 is the more consequential of the two.** Its unevidenced clause is
  a containment claim — that a consumer is not shown a worked sequence built
  around an operation it was not granted — and the declaration does contain
  exactly such a sequence ("Publish deliberately" → `status`, `publish`). If the
  manual does not filter sequences by the grant, the assistant is told a
  procedure it cannot perform, and AC-1074's existing assertions would not
  detect it. Whoever writes the test should be prepared for it to fail on real
  code and for the repair to land upstream in the manual projection rather than
  in this repository.
- **Environment limitation, recorded rather than worked around:** the test suite
  could not be executed in this session (the Bash invocation was refused by the
  session's permission mode), and `@lagrangefoundry/ai` — which generates the
  manual and supplies `validateData`, `UNTRUSTED_OPEN`/`UNTRUSTED_CLOSE` — is
  not installed under this worktree's `node_modules`. Every judgement above is
  therefore static: AC bodies, test source, `l1-surface.json`, `instances.json`
  and `roles.ts`, all read directly. Nothing in the two findings depends on
  runtime behaviour — they are about assertions that are absent from the source,
  which is decidable by reading it.
- **Nothing else in the tree is suspect.** The ten remaining ACs are each
  covered by exactly one test that exercises every clause of its verification
  section, against real components with no internal mocking and with the draft's
  bytes on disk as the evidence for atomicity. AC-1082's byte-for-byte
  comparison against a direct `editL1Set` call, and AC-1076's assertion that all
  three refusals carry `rule: 'schema'`, are the two strongest pieces of
  evidence in the file and are worth preserving as patterns.
