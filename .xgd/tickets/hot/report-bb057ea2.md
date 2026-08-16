---
uid: report-bb057ea2
id: REPORT-2053
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=ac)'
created_by: xgd
created_at: '2026-08-16T03:00:28.795724+00:00'
updated_at: '2026-08-16T03:00:28.795724+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-00e77e55 (CAP-92).
Tree: one story (STORY-105 / `story-93905de4`, `story_kind=feature`, status
`completed`), twelve acceptance criteria (AC-1071 … AC-1082), all `active`,
all `kind=behavior`, none `regression_only`. Both list queries returned
`next_cursor: null`, so the tree below is complete and not a paginated slice.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5` (BUNDLE-17, status
`free_and_reconciled`, `merged_at_commit
0198704b7e29db3c53cf569070042cec0eb467bc`). No element in the tree —
capability, story, or any AC — carries an `updated_by` chain, so the bundle is
the sole intent attachment point. The bundle body was read in full (72,003
chars) and its eight constituent requests resolved individually; five of them
touch this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-125 (`request-dbdc904a`) | legacy_done | design predecessor | Completed DOC-30 — the L1 control surface API design and its gap list | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | BUNDLE-17 | Builder chat panel: AI session, **declared tool surface**, per-site sessions | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | BUNDLE-17 | Built the surface: declaration as data, error taxonomy w/ caller-facing meanings, effect-homogeneous groups, **sequences**, absences, addressing contract, surface version, grant, provenance, audit, CI validator | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | BUNDLE-17 | L1 tooling configuration projected over the surface (deletes `declare.ts`) | YES |
| REQ-129 (`request-b1300473`) | free_and_reconciled | BUNDLE-17 | Verbatim `get_l1` / `set_l1`; **`sequences` rewritten around read-then-replace, plus an explicit add/remove sequence** | YES |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | BUNDLE-17 | Structured config, module instantiation, page metadata, generated assets; **a `sequences:` entry added for read-before-amend** | YES |
| REQ-119 / REQ-121 / REQ-128 | free_and_reconciled | BUNDLE-17 | Request-time render, copy-edit modal chrome, background image picker — do not touch this capability | YES (not applicable here) |

No intent in the ledger retires behaviour claimed by this tree, and no AC
describes behaviour a retired intent introduced. The whole ledger is
reconciled — nothing is merely imminent — so there is no "live but not yet
enforced" caveat to carry.

Per the level cascade, STORY-105's body is the working reference below. It was
internally consistent throughout, so intent was consulted only to corroborate
the one coverage gap (finding 1), where the story body, the story's own
Technical Context, and three separate requests all agree.

## Alignment Ledger

STORY-105's body enumerates its behavioural surface as nine in-scope bullets.
Bullet 1 ("The declaration") itself enumerates seven declared components. The
ledger is recorded against those, since that is the granularity the ACs
partition.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-105 | REQ-122, REQ-126, REQ-127, REQ-129, REQ-130 | aligned; divergences from intent explicitly recorded in Technical Context rather than absorbed |
| AC-1071 — declaration + grant checkable before anything runs | REQ-126 (§5 CI validator) | aligned |
| AC-1072 — surface version distinct from format version | REQ-126 ("Decisions taken": `surface_version` beside format `version`, raised upstream as R6) | aligned |
| AC-1073 — declared ≡ callable; write set closed and grouped | REQ-126 §1, §2 | aligned |
| AC-1074 — declared but withheld from a consumer | REQ-126 §3 | aligned, with recorded divergence (see info finding 4) |
| AC-1075 — read-only grant cannot reach a write | REQ-126 (declared read/write classification) | aligned |
| AC-1076 — arguments validated before invocation | REQ-126 §2 (validation is the Toolbox's, pre-invocation) | aligned |
| AC-1077 — refusal names code + caller-facing meaning | REQ-126 §1 (`ErrorCode`s with `ERROR_MEANINGS` promoted to the surface) | aligned; correctly does not claim the recorded upstream pointer-drop gap closed |
| AC-1078 — reads marked third-party, writes not | REQ-126 §4 | aligned |
| AC-1079 — one audit record per call | REQ-126 §4 | aligned |
| AC-1080 — manual is a projection | REQ-126 §6 (local manual renderer deleted), REQ-127 | aligned but incomplete — see finding 2 |
| AC-1081 — addressing rule stated once; addresses typed | REQ-126 §1 (`overview` carries the render-scoped addressing rule), DOC-30 R4 | aligned |
| AC-1082 — one write path, unbypassed | REQ-126 Behaviour ("no consumer should gain a way to bypass validation, atomicity or re-render") | aligned |
| **Declared worked sequences** (story bullet 1, item 4 of 7) | REQ-126 §1, REQ-129, REQ-130 | **gap: no AC in this tree addresses them** — see finding 1 |

Coverage of bullet 1's seven declared components, for the record: operations
→ AC-1073/AC-1071; error taxonomy → AC-1077/AC-1080; effect-homogeneous
capability groups → AC-1073; **worked sequences → none**; addressing rule →
AC-1081; declared absences → AC-1080; surface version → AC-1072. Six of seven
are covered.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-105 (`story-93905de4`) | ac-add | STORY-105's body names **worked sequences** as one of the seven components the declaration carries ("Alongside them, the error taxonomy …, capability groups …, worked sequences, the rule governing how a place on a page is addressed, declared absences, and the surface's own version"), and its Technical Context returns to them ("Worked examples ride inside operation descriptions and the declared sequences, because the upstream declaration format has no field for them"). Intent corroborates three times over: REQ-126 §1 lists "sequences" among the declaration's contents; REQ-129 "sequences rewritten around read-then-replace, plus an explicit add/remove sequence"; REQ-130 "A `sequences:` entry now says to." The shipped declaration carries six (`tools/generate/src/cli/ai/l1-surface.json`, `sequences[]`). No AC among AC-1071…AC-1082 mentions sequences, and AC-1071's format check asserts only "problems is an empty list" — an empty `sequences[]` would satisfy it unchanged. The only assertion anywhere in the suite is incidental and belongs to a **sibling** capability: `tests/reconciliation-page-composition-surface.test.ts:474-478` under CAP-93's AC-1088, which pins one sequence's steps in passing while testing add/remove semantics. | Author an AC under STORY-105 covering the declared sequences: that the declaration carries named worked sequences, that each names its steps in order and every step is a declared operation, and that the sequences reachable by a given consumer refer only to operations that consumer is granted. Verification should read `L1_DECLARATION.sequences` directly rather than relying on the format check. |
| 2 | warning | coverage | AC-1080 (`acceptance_criterion-73371752`) | ac-edit | STORY-105's self-documentation bullet says the projection "names every operation actually offered, the error meanings, **the addressing rule**, and the declared absences" — four items. AC-1080's criterion and verification cover three: offered operations, error codes with published guidance, and declared absences. The addressing rule is absent from both. AC-1081 does cover the rule, but its subject is the **declaration** (the `l1_address` param type description and the surface `overview`), not what the consumer is told; its verification reads `L1_DECLARATION`, never the manual. Nothing in the tree asserts the rule survives projection into the manual, even though the implementation intends it to — `roles.ts:21-24` records that REQ-126 moved the addressing rule *out* of the hand-written preamble precisely so the manual would carry it from the `overview`. The behaviour is substantively covered by AC-1080 + AC-1081 read together, which is why this is a warning and not a violation; the enumeration is simply one item short of the story's. | Extend AC-1080's criterion and verification to assert the manual also states the addressing rule (the re-read / regeneration wording), closing the projection loop that `roles.ts` depends on. |
| 3 | info | exclusivity | AC-1074 + AC-1075 | — | Both criteria assert the same observable quartet (not offered, not in the manual, refused, draft byte-unchanged), which reads like duplication on a first pass. It is not. AC-1074 tests the **capability** rule (an operation withheld by the grant; refusal recorded with `rule: 'capability'`), AC-1075 the **effect** rule (a write unreachable from a read-only grant, gating "independently of what is offered"). STORY-105 separates these deliberately into its "The grant" and "Effect, enforced" bullets, and the shipped tests refuse via different rules. Not a duplicate; no action. | none |
| 4 | info | consistency | AC-1074 (`acceptance_criterion-c595b0f5`) | — | REQ-126 §3 states "copy, pages, config and publish are granted; **asset add/remove is declared but not granted**". What shipped withholds **both** asset management and publishing. This is not undetected drift: STORY-105's Technical Context records the divergence explicitly, with its cause (the upstream `Toolbox.run` is synchronous, so an operation awaiting a published render cannot be hosted correctly yet) and its containment (the mechanism is the intent's own — declared, documented, validated, not granted; the operator publishes from the toolbar or `1c publish`). `toolbox.ts:357-373` carries the same reasoning at the code. AC-1074 is correctly written as "an operation is declared and not granted", naming both instances rather than fixing the granted set — which keeps it true across the eventual fix. Correctly recorded; no action. | none |

## Notes for the Editor

**One violation, and it is narrow.** Eleven of twelve ACs are well-aligned, and
the AC↔UAT mapping is unusually clean — `tests/reconciliation-assistant-control-surface.test.ts`
carries exactly twelve tests named `test_UAT_AC1071_*` … `test_UAT_AC1082_*`,
one per AC, in order. Only finding 1 needs an AC authored before this level
passes; finding 2 is an opportunistic edit to an existing AC.

**Both findings are the same shape**, and an editor may want to treat them
together: the story's prose enumerates a list, and the AC tree covers the list
minus one item. Bullet 1 lists seven declaration components and the ACs cover
six (sequences missing). Bullet 8 lists four things the manual names and
AC-1080 covers three (addressing rule missing). Nothing else in the story body
enumerates in this style, so this pattern is exhausted by these two findings —
I checked the remaining seven bullets individually and each maps cleanly onto
exactly one AC.

**Do not reach for `code-issue` on either finding.** The production code does
what the story describes in both cases: the six sequences are present and
well-formed in `l1-surface.json`, and the addressing rule is in the `overview`
that the manual projects. These are gaps in the *matrix*, not the
implementation — the behaviour exists and is unproven at this level, which is
precisely the drift this check exists to surface.

**One placement observation worth carrying forward.** The only existing
assertion about sequences lives under CAP-93's AC-1088, a sibling capability,
where it is a means to an end rather than the subject. When the new AC from
finding 1 is authored, the CAP-93 assertion should be left alone — it is
legitimately testing add/remove semantics and merely leans on a sequence to do
it. The two are different shapes, not duplicates, so this will not create an
exclusivity problem at the uat level.

**Ledger note for future checks.** Nothing in this tree carries an
`updated_by` chain; every element traces to `bundle-e59210c5` alone. If a
later intent amends the surface — the sequences were already rewritten twice,
by REQ-129 and REQ-130, without the AC tree moving — that chain will be the
first place drift shows, and its current emptiness is worth knowing was
deliberate at this point in time rather than lost.
