---
uid: report-33a003cd
id: REPORT-2055
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=ac)'
created_by: xgd
created_at: '2026-08-16T03:14:19.632937+00:00'
updated_at: '2026-08-16T03:14:19.632937+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-00e77e55 (CAP-92).
Attempt 2 — this is a re-check after the fix workflow (report-19027252,
`fix_structural_validation`, 3 fixes applied) responded to attempt 1
(report-bb057ea2: 1 violation, 1 warning). The tree was re-read from the
ticket store rather than assumed fixed, and both prior findings are
independently confirmed closed below.

Tree as it stands: one story (STORY-105 / `story-93905de4`,
`story_kind=feature`, status `completed`), **thirteen** acceptance criteria
(AC-1071 … AC-1082 plus AC-1142), all `active`, all `kind=behavior`, none
`regression_only`. The AC list query returned `next_cursor: null` at 13 items,
so this is the complete tree and not a paginated slice.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5` (BUNDLE-17, status
`free_and_reconciled`, `merged_at_commit
0198704b7e29db3c53cf569070042cec0eb467bc`, result `pass`). No element in the
tree — capability, story, or any AC — carries an `updated_by` chain, so the
bundle remains the sole intent attachment point. Ledger carried forward from
attempt 1 and re-confirmed against the bundle body (72,003 chars, eight
constituent requests):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-125 (`request-dbdc904a`) | legacy_done | design predecessor | Completed DOC-30 (`doc-aca10bce`) — the L1 control surface API design and its gap list | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | BUNDLE-17 | Builder chat panel: AI session, **declared tool surface**, per-site sessions | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | BUNDLE-17 | Built the surface: declaration as data, error taxonomy w/ caller-facing meanings, effect-homogeneous groups, **sequences**, absences, addressing contract, surface version, grant, provenance, audit, CI validator | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | BUNDLE-17 | L1 tooling configuration projected over the surface (deletes `declare.ts`) | YES |
| REQ-129 (`request-b1300473`) | free_and_reconciled | BUNDLE-17 | Verbatim `get_l1` / `set_l1`; **`sequences` rewritten around read-then-replace, plus an explicit add/remove sequence** | YES |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | BUNDLE-17 | Structured config, module instantiation, page metadata, generated assets; **a `sequences:` entry for read-before-amend** | YES |
| REQ-119 / REQ-121 / REQ-128 | free_and_reconciled | BUNDLE-17 | Request-time render, copy-edit modal chrome, background image picker — do not touch this capability | YES (not applicable here) |

No intent in the ledger retires behaviour this tree claims, and no AC
describes behaviour a retired intent introduced. Every counting intent is
fully reconciled — nothing is merely imminent — so there is no "live but not
yet enforced" caveat.

Per the level cascade, STORY-105's body is the working reference. It is
internally consistent, so intent and DOC-30 were consulted only to corroborate
the two elements the fix workflow touched (AC-1142, AC-1080).

## Alignment Ledger

STORY-105's body enumerates its behavioural surface as nine in-scope bullets,
and bullet 1 ("The declaration") itself enumerates seven declared components.
The ledger is recorded at that granularity, since that is what the ACs
partition.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-105 | REQ-122, REQ-126, REQ-127, REQ-129, REQ-130 | aligned; divergences from intent recorded in Technical Context rather than absorbed |
| AC-1071 — declaration + grant checkable before anything runs | REQ-126 §5 (CI validator) | aligned |
| AC-1072 — surface version distinct from format version | REQ-126 "Decisions taken" (`surface_version` beside format `version`, raised upstream as R6) | aligned — declaration carries `version: 1`, `surface_version: 3` |
| AC-1073 — declared ≡ callable; write set closed and grouped | REQ-126 §1, §2 | aligned — 21 declared operations, 9 effect-homogeneous groups, every write op in exactly one write group |
| AC-1074 — declared but withheld from a consumer | REQ-126 §3 | aligned, with recorded divergence (info finding 2) |
| AC-1075 — read-only grant cannot reach a write | REQ-126 (declared read/write classification) | aligned |
| AC-1076 — arguments validated before invocation | REQ-126 §2 | aligned |
| AC-1077 — refusal names code + caller-facing meaning | REQ-126 §1 (six `ErrorCode`s with `ERROR_MEANINGS` promoted to the surface) | aligned; correctly does not claim the recorded upstream pointer-drop gap closed |
| AC-1078 — reads marked third-party, writes not | REQ-126 §4 | aligned |
| AC-1079 — one audit record per call | REQ-126 §4 | aligned |
| AC-1080 — manual is a projection (operations, error meanings, **addressing rule**, absences) | REQ-126 §6, REQ-127 | **aligned — attempt 1's warning is closed**; criterion, verification and title now carry all four items STORY-105's self-documentation bullet enumerates |
| AC-1081 — addressing rule stated once in the declaration; addresses typed | REQ-126 §1, DOC-30 R4 | aligned |
| AC-1082 — one write path, unbypassed | REQ-126 Behaviour | aligned |
| **AC-1142 — declared worked sequences** | REQ-126 §1, REQ-129, REQ-130, DOC-30 R5 | **aligned — attempt 1's violation is closed**; new AC covers the seventh declaration component |

Coverage of bullet 1's seven declared components, for the record: operations →
AC-1073 / AC-1071; error taxonomy → AC-1077 / AC-1080; effect-homogeneous
capability groups → AC-1073; **worked sequences → AC-1142**; addressing rule →
AC-1081; declared absences → AC-1080; surface version → AC-1072. **Seven of
seven.** Bullets 2–9 map one-to-one onto AC-1074, AC-1075, AC-1076, AC-1077,
AC-1078, AC-1079, AC-1080 and AC-1082 respectively. Nothing in the story body
is now unaddressed.

## Verification of the two closed findings

Both were re-checked against the shipped artifacts, not taken on the fix
report's word.

**Attempt 1, finding 1 (violation, `ac-add`) — closed by AC-1142.** The new
criterion is grounded three ways. (a) STORY-105 bullet 1 names worked
sequences among the declaration's contents. (b) The shipped declaration
`tools/generate/src/cli/ai/l1-surface.json` carries `sequences[]` with six
entries, each with `name`, `steps` and `note`; every step name is the `tool`
of a declared operation (verified: the step set is a strict subset of the 21
declared tool names, with no residue). (c) The specific shapes AC-1142 pins
are the shipped ones — "Change something on a page" is
`describe_page → get_l1 → set_l1` (read precedes replace), and "Add something
to a page, or take something away" has the same three steps with a note saying
"There is no separate way to insert or delete", so the AC's "rather than
naming an insert or delete operation" is true by the declaration and not just
by assertion. AC-1142's verification correctly reads `L1_DECLARATION.sequences`
directly rather than through the format check, which an empty list would
satisfy unchanged — the exact weakness attempt 1 identified.

**Attempt 1, finding 2 (warning, `ac-edit`) — closed by AC-1080.** The
criterion now carries the addressing rule ("the re-read / regeneration
wording") through from the declaration's `overview` rather than a hand-written
preamble, the verification asserts it against the built manual, and the title
enumerates four items to match the four-item body. This closes the projection
loop `tools/generate/src/cli/ai/roles.ts:21-26` depends on — that file records
REQ-126 moving the addressing rule *out* of the preamble precisely so the
manual would carry it from the `overview`. AC-1081 remains distinct: its
subject is the declaration (`param_types.l1_address.description` + `overview`),
AC-1080's is the projection. Not a duplication (see info finding 3).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-105 (`story-93905de4`) | — | All nine in-scope story bullets and all seven components of bullet 1 are now covered by exactly one AC each. The enumeration pattern attempt 1 flagged (story prose lists N, ACs cover N−1) is exhausted: both instances are repaired and no third instance exists — the remaining seven bullets each map cleanly onto one AC. | none |
| 2 | info | consistency | AC-1074 (`acceptance_criterion-c595b0f5`) | — | REQ-126 §3 says "copy, pages, config and publish are granted; asset add/remove is declared but not granted". What shipped withholds **both** asset management and publishing. Confirmed at the artifacts: `instances.json` grants `caretaker` the groups `ReadSite`, `AuthorPages`, `ManagePages`, `ManageComponents`, `WriteConfig`, `DrawImages` — not `ManageAssets`, not `Publish`. STORY-105's Technical Context records the divergence, its cause (`Toolbox.run` is synchronous, so an operation awaiting a published render cannot be hosted correctly yet) and its containment (declared, documented, validated, not granted); `toolbox.ts:357-373` carries the same reasoning at the code. AC-1074 is correctly written as "an operation is declared and not granted", naming both instances rather than fixing the granted set, so it stays true when the upstream fix lands. Note the grant *does* include `DrawImages` (`write_image`), which is a separate group from `ManageAssets` (`add_asset` / `remove_asset`) — so "management of image and font files is not granted" is accurate, not contradicted by the assistant being able to draw one. | none |
| 3 | info | exclusivity | AC-1074 + AC-1075; AC-1080 + AC-1081; AC-1142 + AC-1073 | — | Three pairs read as near-duplicates and none is. AC-1074 tests the **capability** rule (withheld by grant; refused with `rule: 'capability'`), AC-1075 the **effect** rule (a write unreachable from a read-only grant, gating independently of what is offered) — STORY-105 separates these into its "The grant" and "Effect, enforced" bullets. AC-1081 is about the **declaration** stating the addressing rule in exactly two places; AC-1080 is about that rule **surviving projection** into the manual. AC-1073 asserts declared ≡ callable over the operation set; AC-1142 asserts the sequences' steps are drawn from that set and are ordered read-before-write. Different subjects in each pair. | none |
| 4 | info | consistency | AC-1142 (`acceptance_criterion-670113cb`) | — | AC-1142's second clause — no sequence shown to a consumer names an operation it was not granted — is **not** self-evident from the shipped declaration read alone: `sequences[]` contains "Publish deliberately" (`status → publish`), and `publish` is in the `Publish` group the caretaker is not granted. The clause rests on the Toolbox's manual projection dropping a sequence whose step is ungranted, which DOC-30 (`doc-aca10bce`) records as an upstream capability in its R5 row — the gap it lists against the *old* local `declare.ts` is precisely that its `reads:` list was "not projected away when a step is ungranted". So the AC is grounded in intent and in the documented upstream contract, and stands. Recorded here because the dependency is on upstream behaviour rather than on code in this repository. | none — but see Notes for the Editor |

## Notes for the Editor

**Nothing to fix at this level.** Both attempt-1 findings are independently
confirmed closed, the AC tree now covers STORY-105's behavioural surface
completely, and no new drift was introduced by the repair — I re-read all
thirteen ACs in full rather than only the two that changed.

**One thing to carry into the uat cycle, from info finding 4.** AC-1142's
grant-filtering clause is the one assertion in this tree whose truth depends on
upstream (`@lagrangefoundry/ai/core`'s manual projection) rather than on code
in this repository, and the shipped declaration does contain a sequence naming
an ungranted operation (`publish`). The UAT for AC-1142 must therefore exercise
the **projected manual** of the caretaker box, not just `L1_DECLARATION`. Note
also that the existing AC-1074 UAT
(`tests/reconciliation-assistant-control-surface.test.ts:252-257`) would not
catch a leak here: it asserts the absence of `**publish**` and
`### Publishing` — the manual's bold-tool and group-heading forms — which a
sequence step rendered in any other form would slip past. If the projection
turns out not to filter, that is an upstream/code issue, not an AC edit:
AC-1142 states the contract DOC-30 R5 records.

**Two AC↔UAT gaps that belong to the uat cycle, flagged early so they are not
read as new drift.** (a) AC-1142 has no test yet — the twelve tests in
`tests/reconciliation-assistant-control-surface.test.ts` are named
`test_UAT_AC1071_*` … `test_UAT_AC1082_*`, one per pre-existing AC, and no
`test_UAT_AC1142_*` exists anywhere in `tests/`. (b) AC-1080's UAT
(`:413-433`) predates the addressing-rule clause added by the fix and asserts
only the offered operations, the absences and the error meanings, so the
manual's addressing rule is currently unasserted. Both are `uat-add` /
`uat-edit` shaped and neither affects this level's verdict.

**Placement observation, carried forward from attempt 1 and re-confirmed.** The
only existing assertion about sequences lives at
`tests/reconciliation-page-composition-surface.test.ts:472-478`, under CAP-93's
AC-1088, where it leans on the add/remove sequence while testing add/remove
semantics. When AC-1142's UAT is authored, leave that one alone — different
shape, different subject, not an exclusivity problem.

**Ledger note for future checks.** Nothing in this tree carries an `updated_by`
chain; every element still traces to `bundle-e59210c5` alone, including
AC-1142, which was authored by the fix workflow rather than by an intent. The
sequences have now been rewritten twice by intent (REQ-129, REQ-130) and the AC
tree moved once, by repair rather than by intent. If a later intent amends the
surface again, the empty `updated_by` chain is where drift will show first, and
its emptiness remains deliberate at this point in time rather than lost.
