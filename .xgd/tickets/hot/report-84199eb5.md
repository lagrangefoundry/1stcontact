---
uid: report-84199eb5
id: REPORT-3850
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=uat)'
created_by: xgd
created_at: '2026-09-11T01:30:06.760031+00:00'
updated_at: '2026-09-11T01:30:06.760031+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-00e77e55 (CAP-92).

CAP-92 holds exactly one story, STORY-105 (`story-93905de4`, `story_kind: upgrade`,
status `updated`), carrying 14 acceptance criteria: AC-1071…AC-1082, AC-1142 and
AC-1411.

**Level cascade state.** The story-level cycle closed clean this run (REPORT-3833,
1 violation → REPORT-3835 fix → REPORT-3840 PASS, 2026-09-11), and the ac-level
cycle closed clean immediately after (REPORT-3845, 0 violations / 1 warning,
2026-09-11). Per the cascade, **the AC bodies are the working reference here** and
are treated as aligned. Intent history was consulted only to (a) confirm no cited
vehicle ticket is retired, and (b) ground the one criterion whose evidence is the
subject of finding 1.

**The prior uat pass does not cover the current tree.** REPORT-2058 (2026-08-16,
0 violations) assessed **thirteen** ACs. AC-1411 was created 2026-08-31 and has
never been assessed at this level; AC-1073's title and body were rewritten the same
day (`last_field_updated: title`) to restate its invariant over the composition of
the two runtime halves. Both are assessed here for the first time. Findings 1 and 2
are exactly those two elements.

**Evidence was executed, not read.** `npm test -- tests/reconciliation-assistant-control-surface.test.ts`
→ **13 passed / 13**, 441ms. The workerd suite carrying the free-coded durability
assertions (`tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`) **cannot
run in this sandbox** — it dies at `Error: listen EPERM: operation not permitted
127.0.0.1` before any test executes. That is an environment limit, not a test
failure; those two assertions were therefore verified by reading the source, and
that limitation is stated rather than papered over.

## Cumulative Intent Considered

Chronological ledger of the intents that touched this capability. Every one is
`free_and_reconciled` — re-read from the store this pass, not carried forward from
the ac report.

| Intent ID | Bundle | Status | When | Asked / changed (CAP-92 portion) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | 2026-08-07 | Tool surface declared as data; the manual as a projection; declared absences | YES |
| REQ-126 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | **Primary.** `l1-surface.json` as data; six error codes with caller-facing meanings; effect-homogeneous groups; sequences; absences; `surface_version`; `instances.json` as a separate grant; `provenance: untrusted`; an audit sink per call; an author-time validator | YES |
| REQ-127 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | Read/write classification becomes enforced rather than an unchecked flag | YES |
| REQ-129 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | `get_copy`/`set_copy` → `get_l1`/`set_l1`; `WriteCopy` → `AuthorPages` | YES |
| REQ-130 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | Five operations added; `DrawImages` split from `ManageAssets` so it can be withheld | YES |
| REQ-131 | BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | 2026-08-11 | `list_changes` declared into `ReadSite`, untrusted return, own sequence entry | YES |
| REQ-133 | BUNDLE-19 | free_and_reconciled | 2026-08-12 | `get_palette` into `ReadSite`; `ManagePalette` group of four writes | YES |
| REQ-142 | — | free_and_reconciled | 2026-08-15 | Async `SiteStore` port — every L1 operation becomes async (why every call in the evidence is awaited) | YES |
| REQ-146 | BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | 2026-08-15 | **AC3: the audit is durable and survives the host.** Surface splits into a portable core + the host's own operations, so "everything declared is callable" is a claim about their composition | YES |
| REQ-149 | BUNDLE-20 | free_and_reconciled | 2026-08-17 | Revisions move onto the storage port: `publish` becomes an ordinary portable-half operation, and `add_asset` becomes **the sole disk-bound operation** | YES |

BUNDLE-17, BUNDLE-19 and BUNDLE-20 are all `free_and_reconciled`. Nothing in the
ledger is `abandoned`, `deprecated` or `wont_fix`, and no AC body or test names a
retired vehicle ticket — **Step 2.5's named-abandoned-vehicle case does not arise
anywhere in this tree.**

## Alignment Ledger

One row per AC, recording the test that is its evidence and whether that test
exercises what the AC claims. Line numbers are in
`tests/reconciliation-assistant-control-surface.test.ts` unless stated otherwise.

| Element | Test (evidence) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1071 `acceptance_criterion-6dec52fd` | `test_UAT_AC1071_declaration_and_grant_check_clean_before_anything_runs` (:169) | REQ-126 | **aligned** — runs the framework's own `validateData([L1_DECLARATION], L1_INSTANCES)` at author time; asserts `problems: []`, `ok`, `surfaces: ['l1']`, roles ⊇ `CARETAKER_ROLE`. All four verification clauses present, none by proxy |
| AC-1072 `acceptance_criterion-becf310b` | `test_UAT_AC1072_surface_states_its_own_version_distinct_from_the_format_version` (:185) | REQ-126 | **aligned** — format `version === 1`; `L1_SURFACE_VERSION` an integer > 0; and, the clause that matters, re-read from the shipped JSON on disk (`surface_version: 4`) and asserted distinct from `version`, so the two cannot drift |
| AC-1073 `acceptance_criterion-1c764340` | `test_UAT_AC1073_everything_callable_is_declared_and_the_write_set_is_closed` (:205) | REQ-126, REQ-127, REQ-146, REQ-149 | **partial — finding 2.** 4 of the AC's 5 verification clauses are asserted; the disjointness clause is asserted nowhere in the tree |
| AC-1074 `acceptance_criterion-c595b0f5` | `test_UAT_AC1074_declared_operations_can_be_withheld_from_a_consumer` (:273) | REQ-126, REQ-130, REQ-146 | **aligned** — all four clauses: declared ⊇ {`add_asset`,`remove_asset`,`publish`}; absent from `toolNames()`; absent from the manual, with the withheld group set *derived from the declaration and grant* rather than written out (:298), so an upstream re-wording cannot silently satisfy it; and the call refused with `draftBytes()` identical and the last audit record `{decision: 'refuse', rule: 'capability'}` naming the operation |
| AC-1075 `acceptance_criterion-95620a93` | `test_UAT_AC1075_a_read_only_grant_cannot_reach_a_write` (:320) | REQ-127 | **aligned** — a real `ReadSite`-only toolbox; the write neither offered nor in the manual; invoking it refused, draft bytes unchanged, **and** the value it would have replaced still reads as before (:343), which is the clause a bytes-only check would miss |
| AC-1076 `acceptance_criterion-b589483b` | `test_UAT_AC1076_arguments_are_checked_before_any_value_reaches_the_site` (:346) | REQ-126 | **aligned** — all three declared faults issued (wrong type, missing required, undeclared), each answer asserted to name its own fault, draft bytes unchanged, and all three audit records `{decision: 'refuse', rule: 'schema'}` — which is what distinguishes "refused on the declaration" from "reported back from the write path" |
| AC-1077 `acceptance_criterion-72dfce4f` | `test_UAT_AC1077_a_refusal_names_its_code_and_that_codes_published_meaning` (:375) | REQ-122, REQ-126 | **aligned** — the guidance string is taken from `L1_DECLARATION.errors.NOT_FOUND.message` rather than restated in the test (:389-392), so the assertion tracks the declared taxonomy; draft byte-identical |
| AC-1078 `acceptance_criterion-bd0f50cc` | `test_UAT_AC1078_reads_are_marked_third_party_and_write_confirmations_are_not` (:398) | REQ-126, REQ-131 | **aligned** — markers taken from `aiCore()`, not hard-coded; open/close asserted around a real read carrying the page's own words; a real write's confirmation asserted unmarked; manual asserted to carry the marker and explain it |
| AC-1079 `acceptance_criterion-ffa07ea7` | `test_UAT_AC1079_every_call_against_the_site_is_recorded` (:425) | REQ-126 | **aligned** — three calls, exactly three records; the read's surface/operation/effect; the write's effect, arguments and `{allow, null}`; and the allowed-but-failed write recorded as **both** (`policy.decision: allow`, `outcome.ok: false`, error containing `NOT_FOUND`), which is the clause that makes the trail reconstructive |
| AC-1080 `acceptance_criterion-73371752` | `test_UAT_AC1080_the_manual_is_a_projection_of_the_declaration_and_the_grant` (:461) | REQ-122, REQ-131 | **aligned** — every offered tool named; the addressing paragraph **lifted from `L1_DECLARATION.overview` by wording and required verbatim in the manual** (:474-479), which is what proves projection rather than parallel prose; every declared absence by name; and an error code with its published meaning |
| AC-1081 `acceptance_criterion-ea231234` | `test_UAT_AC1081_the_addressing_rule_is_stated_once_and_every_address_is_typed` (:497) | REQ-126, REQ-131 | **aligned, and non-tautological** — the address-taking operations are identified *structurally* (`params.module && params.slot`, :509) rather than by the type under test. Verified against the shipped declaration this pass: `get_l1` and `set_l1` are exactly the two operations carrying an `l1_address` parameter among all 27, so the structural filter and the property coincide and the test cannot pass by construction |
| AC-1082 `acceptance_criterion-f4dc6dcc` | `test_UAT_AC1082_a_change_through_the_surface_lands_via_the_one_write_path` (:520) | REQ-122, REQ-126; CAP-86 | **aligned, and the strongest test in the file** — the address is read from the map rather than composed; the change report is parsed; the draft on disk is the evidence; then the draft is rewound and the *same* change made through `editL1Set` directly, with the two drafts asserted **byte-for-byte equal** (:554). That is a real proof of "no second write route", not an assertion about one |
| AC-1142 `acceptance_criterion-670113cb` | `test_UAT_AC1142_worked_sequences_are_declared_data_and_none_names_an_ungranted_operation` (:557) | REQ-126, REQ-131, REQ-133 | **aligned** — sequences read from the declaration directly (the AC's own warning that `validateData` would accept an empty list is honoured, :560); each named, ≥2 ordered steps, note present, every step a declared tool; read-before-replace ordering asserted by index; add/remove asserted to name no insert/delete *and* no such tool declared; and the ungranted set derived from the real toolbox, with "Publish deliberately" asserted absent from the manual |
| AC-1411 `acceptance_criterion-cb6e1b58` | **none** | REQ-146 (AC3) | **gap — finding 1.** No `test_UAT_AC1411_*` test exists anywhere. Clauses 1-2 are exercised only under free-coded names in a suite that cannot run here; clauses 3-4 are asserted nowhere |

### Coverage

13 of the 14 ACs have exactly one AC-named UAT, and all 13 pass. The 14th, AC-1411,
has none — finding 1.

### Exclusivity

No two AC-named tests verify the same scenario. The three closest pairs were checked
explicitly rather than assumed: AC-1074 (a *group* withheld) vs AC-1075 (a
*read-only grant* gating by effect) build differently-granted toolboxes and assert
different refusal reasons; AC-1076 (refused on the declaration, `rule: 'schema'`)
vs AC-1077 (refused by the site after a well-formed call, `NOT_FOUND`) sit on
opposite sides of the invocation boundary and assert different audit rules; AC-1080
(the manual carries the rule) vs AC-1081 (the declaration states it in exactly two
places) are projection versus source. See info 4 for the one real duplication found,
which is between suites rather than within this one.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | coverage | AC-1411 (`acceptance_criterion-cb6e1b58`) | `uat-add` | **AC-1411 has no substantive AC-named UAT, and half of what it claims is asserted nowhere in the tree.** Confirmed by exhaustive search: `test_UAT_AC1411` appears in **zero** source files (the only matches repo-wide are inside `.xgd/tickets/`, i.e. prior reports discussing the gap). Clause by clause: **(1) survives the host** — exercised, but only as `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:225` (`…_every_ai_write_is_audited_and_survives_a_restart`), which drops in-memory state via `resetAiHost()`/`resetChatHost()` and reads the record back from R2. **(2) concurrent callers lose no entry** — exercised at `:255` (`…_the_audit_is_append_only_across_concurrent_flushes`), though it calls `flushAudit` directly rather than driving two turns. **(3) an abandoned or failed turn still records what it managed to do** — **no assertion anywhere.** The behaviour is implemented at `apps/control-app/src/router.ts:700-709`, where the flush sits in a `finally` inside the stream, and the comment at `:659-666` calls that placement "the whole of AC3" — but nothing tests it. **(4) a failed durable write does not also fail the turn** — **no assertion anywhere.** Implemented at `router.ts:704-708` as a bare `try/catch` around `host.flush` with a deliberately empty handler; nothing forces that catch. Consistently, AC-1411 is the only one of the store's 662 acceptance criteria with no `uat_coverage` field at all, while STORY-105 and CAP-92 both read `uat_coverage: pass` | Add `test_UAT_AC1411_*` coverage. Clauses 1-2: name the criterion on the two existing REQ-146 assertions (rename or add AC-named siblings) so the matrix can see them. Clauses 3-4 need **new** tests, both reachable from the existing workerd harness: abandon a turn part-way (make `streamPrompt` throw, or cancel the reader mid-stream) after a tool call has run, and assert the R2 audit prefix is non-empty; and stub `env.SITES.put` to reject, then assert the turn's own SSE frames still reached the caller and the route did not throw. Do **not** set `uat_coverage` on AC-1411 from this cycle — that field is owned by check/fix_uat_coverage |
| 2 | warning | consistency | AC-1073 (`acceptance_criterion-1c764340`) | `uat-edit` | **The test omits one of the AC's five explicitly enumerated verification clauses, and omits it in a way that makes the guarded failure invisible.** AC-1073's Verification says: "Assert the two halves are **disjoint**, so an operation cannot be counted twice or silently reimplemented on both sides." The test composes them with a spread merge — `Object.keys({...l1Operations(SLUG, acOpts), ...nodeOperations(SLUG, acOpts)})` (:220-223) — which silently collapses any overlap, so the union is identical whether the halves are disjoint or not. Concrete failure scenario: `publish` lived in `nodeOperations` until REQ-149 moved it to the portable core; if it were re-added there (or any core operation shadowed by a host reimplementation), `callable` would be unchanged, the declared-set equality at :224 would still pass, and no other assertion in the tree would notice — while at runtime the host's copy would silently shadow the core's, since `createL1Toolbox` passes `nodeOperations` as `extraOps` (`toolbox.ts:211`). Verified that no test asserts disjointness: all five `nodeOperations` call sites in `tests/` use the same spread shape (`test_UAT_FC_REQ-126_l1_surface.test.ts:180`, `test_UAT_FC_REQ-129_l1_authoring.test.ts:445`, `test_UAT_FC_REQ-130_beyond_l1.test.ts:604`, `reconciliation-page-composition-surface.test.ts:626`, and this one). **Why warning and not violation:** the AC's load-bearing invariant — callable ≡ declared over the composition — *is* asserted, and the AC's other unasserted-looking clause is in fact covered in a different shape (see info 3), so the criterion is evidenced, not unevidenced. This is a missing guard, not a missing proof. **Compounding detail:** the explanatory comment at :213-218 states that `nodeOperations` "supplies the two that need a disk (`add_asset` … and `publish` …)". That was true at REQ-146 and was made false by REQ-149 — `toolbox.ts:117-125` now supplies `add_asset` alone, and `toolbox-core.ts:169` says so. The same stale sentence is copy-pasted into four other test files (`test_UAT_FC_REQ-126_l1_surface.test.ts:171-172`, `test_UAT_FC_REQ-129_l1_authoring.test.ts:437`, `reconciliation-page-composition-surface.test.ts:618-619`, and `tests/…REQ-130…:604`'s neighbourhood) | Two lines in `test_UAT_AC1073_…`: capture the halves separately (`const core = Object.keys(l1Operations(SLUG, acOpts))`, `const host = Object.keys(nodeOperations(SLUG, acOpts))`), assert `core.filter((op) => host.includes(op))` is `[]`, then compose from the two captured lists. While there, correct the stale `publish` sentence in the comment — ideally in all five files, since it is one copy-pasted claim |
| 3 | info | consistency | AC-1073 | — | The clause "assert the operation needing the operator's own disk is present in the host's half and **absent from the portable one**" looks unasserted in the AC-named test, and is not — it is covered in a genuinely different shape, which the exclusivity guidance treats as acceptable rather than duplicative: `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:333-353` imports `toolbox-core` inside workerd and asserts `Object.keys(l1Operations(...))` contains `publish` and **not** `add_asset`. Its comment explicitly records why it no longer names `publish` (REQ-149 graduated it). The complementary half — `add_asset` present in the host's own operations — follows from that plus the union equality at :224, though nothing states it directly. Recording this so a later check does not re-open it as a second gap: **the gap in AC-1073 is disjointness only (finding 2), not placement** | none |
| 4 | info | exclusivity | `tests/reconciliation-assistant-control-surface.test.ts` ↔ `tests/test_UAT_FC_REQ-126_l1_surface.test.ts` | — | The two suites are near-clones in the **same shape** — same `mkdtemp` + `cmdNew` + `seedPage` fixture, same `caretaker()` helper, same `unwrap()`, same `auditLines()` — and cover the same twelve scenarios (`…REQ_126_declaration_validates_at_author_time` ↔ AC-1071, `…surface_carries_its_own_version` ↔ AC-1072, `…every_declared_operation_is_implemented_and_no_more` ↔ AC-1073, `…addressing_contract_is_stated_once` ↔ AC-1081, `…declares_operations_the_chat_is_not_granted` + `…ungranted_operation_is_refused_and_recorded` ↔ AC-1074, `…read_only_session_cannot_reach_a_write` ↔ AC-1075, `…bad_arguments_never_reach_the_write_path` ↔ AC-1076, `…a_refusal_names_the_declared_meaning_and_writes_nothing` ↔ AC-1077, `…map_then_write_lands_on_the_draft` ↔ AC-1082, `…site_content_comes_back_marked_as_third_party` ↔ AC-1078, `…every_call_against_the_site_is_recorded` ↔ AC-1079, `…manual_names_every_offered_operation_and_its_absences` ↔ AC-1080). Read literally this is the exclusivity property's "same scenario in the same way". It is deliberately **not** raised as a finding: the free-coded suite is REQ-126's own delivery evidence and the AC-named suite is the reconciliation that attached those behaviours to the matrix, so the pair is the expected product of the FC→AC reconciliation pattern rather than capability drift, and deleting either would cost regression coverage. The AC-named suite is additionally a strict superset in several places (AC-1072's on-disk re-read, AC-1073's literal write set and read-half grouping, AC-1074's derived withheld-group check). The one real cost of the clone is concrete and is folded into finding 2: a single stale sentence about `publish` now sits in five files | none |
| 5 | info | coverage | AC-1071…AC-1082, AC-1142 | — | Evidence validity is not in question anywhere in this tree. Nothing in the AC-named suite mocks an internal component: every test drives `createL1Toolbox`, `l1Operations`/`nodeOperations`, `validateData` and `editL1Set` for real against a per-test `mkdtemp` site built by `cmdNew`, and reads the draft's bytes back from disk. There is no stub, no spy and no fake store in the file. The four declaration-only tests (AC-1072, AC-1073, AC-1081, AC-1142) read the shipped `l1-surface.json`, which is the criterion's actual subject rather than a structural stand-in for it, so none of them is the "structural/AST check" the coverage rule excludes | none |

## Notes for the Editor

- **One thing to fix: finding 1.** Finding 2 is a warning (a missing guard on an
  otherwise-evidenced criterion) and findings 3-5 are ledger entries with
  resolution "none". A fixer that closes finding 1 and, opportunistically, the two
  lines and the stale comment in finding 2 has done everything this level asks.

- **Do not set `uat_coverage` on AC-1411.** That field is owned by
  check/fix_uat_coverage. Setting it from this cycle would record coverage that
  does not exist and would mask the only finding here from the cycle that can
  close it. REPORT-3835 and REPORT-3845 both made the same call deliberately and
  were both right to; this is the third cycle to reach the same conclusion, and
  the fourth should not have to re-derive it.

- **AC-1411's `status: pending` is not itself drift** and is not why it fails here.
  26 of the store's 662 ACs are `pending`, most carrying `uat_coverage: pass`. What
  singles AC-1411 out is that it is the only AC in the store with no `uat_coverage`
  field at all, and the substantive reason is finding 1: two of its four clauses
  have no assertion anywhere in the tree.

- **The two missing clauses are the two the implementation is proudest of.**
  `router.ts:659-666` devotes a nine-line comment to arguing that the `finally`
  placement "is the whole of AC3 and is not incidental", and `:701-703` explains why
  the flush failure is swallowed. Both arguments are currently carried by prose
  alone. That is the gap worth closing — an audit trail whose survival properties
  are argued rather than demonstrated is exactly the "reads as evidence while being
  wrong" failure the story's own Technical Context warns about.

- **A fixer cannot verify its own work in this sandbox.** The workerd project dies
  at `listen EPERM` before any test runs, so new AC-1411 tests written into
  `*.workers.test.ts` will not be executable here. Either run them in an
  environment that permits a loopback listener, or — for clause 4 in particular —
  consider whether the swallow-on-flush-failure property can be asserted against
  `workerHost().flush` / `flushAudit` directly with a rejecting `R2Bucket` double,
  which needs no listener. An external-boundary double like that is within the thin
  mock rule; do not reach for it for clauses 1-3, which need the real route.

- **Watch the `publish` sentence.** REQ-146's own evidence section
  (`request-0cdfdc5b`) records "`nodeOperations` supplies `add_asset` and `publish`,
  the two that need a disk" — true when written, made false by REQ-149 nine days
  later. That sentence has since been copied into five test files. It is comment
  text, so nothing fails because of it, but it is the reason a reader of
  `test_UAT_AC1073_…` would not notice the missing disjointness assertion.
