---
uid: report-b8a37c51
id: REPORT-2059
type: report
title: 'UAT Coverage: Site Control Surface: Declared, Granted, Validated & Audited'
created_by: xgd
created_at: '2026-08-16T03:40:39.167863+00:00'
updated_at: '2026-08-16T03:40:39.167863+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-00e77e55
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Control Surface: Declared, Granted, Validated & Audited

**Result**: PASS
**AC verdicts**: 13 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-7ef6a9ea. Capability: capability-00e77e55 (CAP-92).
Scope path `xgd/structural_validation/report-7ef6a9ea/cap/capability-00e77e55/2/0`.

Tree: one story (STORY-105 / `story-93905de4`, `story_kind=feature`, status
`completed`), thirteen acceptance criteria — AC-1071 … AC-1082 plus AC-1142 — all
`active`, all `kind=behavior`, none `regression_only`. `next_cursor: null` at 13
items, so this is the whole tree and not a paginated slice.

Evidence: `tests/reconciliation-assistant-control-surface.test.ts`, 592 lines,
thirteen `it(...)` blocks — one per AC, and the only file in the repo carrying
`test_UAT_AC1071_*` … `test_UAT_AC1082_*` / `test_UAT_AC1142_*`.

## Method note — `.xgd/uat_index.json` is empty

The index this prompt's lookup snippet reads (`idx['acs']`) contains **zero
entries** (`updated_at: 2026-08-16T00:03:30Z`), so every AC resolves to
`MISSING` through it. Test discovery was done instead by grepping the source tree
for the `test_UAT_AC<n>_*` convention, which found a test for all thirteen ACs.
The empty index is an XGD-tooling observation, not a finding against this
capability — flagged in the notes below.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5`. No element in the tree
carries an `updated_by` chain, so the bundle is the sole intent attachment point.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-125 (`request-dbdc904a`) | legacy_done | 2026-08-08 | DOC-30 — the L1 control-surface API design and its gap list (design predecessor) | YES |
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | merged at `0198704b7e29db3c53cf569070042cec0eb467bc` | Umbrella for the eight constituent requests | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Builder chat panel: AI session, declared tool surface, per-site sessions | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | Built the surface: declaration as data, error taxonomy with caller-facing meanings, effect-homogeneous groups, sequences, absences, addressing contract, surface version, grant, provenance, audit, CI validator | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | L1 tooling configuration projected over the surface (deletes `declare.ts`) | YES |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | Verbatim `get_l1` / `set_l1`; sequences rewritten around read-then-replace plus an explicit add/remove sequence | YES |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | 2026-08-09 | Structured config, module instantiation, page metadata, generated assets; extended the same declaration | YES |
| REQ-119 / REQ-121 / REQ-128 | free_and_reconciled | 2026-07-31 … 2026-08-08 | Request-time render, copy-edit modal chrome, background image picker — do not touch this capability | YES (not applicable here) |
| REQ-131 (`request-5d3bf630`) | ready_to_reconcile | 2026-08-11 | Draft change journal: a journal-read operation on the surface + a counter on every mutating return | imminent — **not yet landed** (see warning 2) |
| REQ-146 (`request-…`) | draft | 2026-08-15 | Moves the AI host and publish into workerd — would change the withheld-publish posture | NO (draft) |

Every counting intent is fully reconciled. **No intent in the ledger retires any
behavior this tree claims**, so no AC is `deprecated` and no story body is
`stale`. Every AC's behavior traces to REQ-126 (the declaration, grant, effect
gating, validation, provenance, audit, manual) as extended by REQ-129 / REQ-130
(sequences, the wider operation set) — none is `needs_review`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-105 (`story-93905de4`) | REQ-125, REQ-122, REQ-126, REQ-127, REQ-129, REQ-130 | aligned | Every in-scope bullet in the body maps to a reconciled intent and to at least one AC. The body's three recorded divergences were re-checked against the shipped artifacts and all three hold — see below. |

The story body's "Divergences from the intent, recorded rather than absorbed"
section was verified against `tools/generate/src/cli/ai/l1-surface.json` and
`instances.json` rather than taken on trust:

- **"What shipped withholds both asset management and publishing."** Confirmed:
  the grant is `[ReadSite, AuthorPages, ManagePages, ManageComponents,
  WriteConfig, DrawImages]`; `ManageAssets` and `Publish` are declared groups
  that are not granted, leaving `add_asset`, `remove_asset` and `publish`
  declared-but-unreachable. AC-1074 states this as "an operation is declared and
  not granted" rather than fixing the granted set, exactly as the body says.
- **"The intent names sixteen operations; the surface carries twenty-one … its
  own version reads 3."** Confirmed: `operations` has 21 entries and
  `surface_version` is `3` against format `version` `1`.
- **"Worked examples ride inside operation descriptions and the declared
  sequences."** Confirmed: 6 `sequences` entries, each with `name` / `steps` /
  `note`; no separate worked-example field exists in the format.

Story-level coverage (step 2b) is judged **pass** independently of the AC
verdicts. Walking the body's in-scope bullets against the test set: declaration
(AC-1071/1072/1073/1081/1142), grant (AC-1074), effect enforced (AC-1075),
validation before invocation (AC-1076), refusal as information (AC-1077),
provenance (AC-1078), audit (AC-1079), self-documentation (AC-1080), one write
path unbypassed (AC-1082). No behavioral claim in the body is left without a
test.

Two body clauses that no AC names directly were chased down rather than assumed:

- **"what comes back"** — every one of the 21 operations declares `returns`, and
  12 `shapes` are declared. DOC-30 states plainly that *"shapes document rather
  than validate (DOC-20)"*, so there is no runtime behavior here beyond the
  manual projection AC-1080 already covers, plus the concrete change report
  AC-1082 asserts. Not a gap.
- **"how it can fail"** — per-operation `errors` lists. DOC-30 R2 records that
  `ErrorCode` is closed and typed and that per-operation `errors` are typed
  against it *"so a declaration cannot promise a code the validator never
  raises"*. That closure is enforced by the format check, which AC-1071 runs on
  the shipped pair asserting `problems: []`. Covered transitively. Not a gap.

## Substantive-Coverage Judgments

Every test drives real entry points — `createL1Toolbox`, `l1Operations`,
`editL1Set`, `validateData`, and `cmdNew` against a per-test `mkdtemp` site — and
reads the draft's bytes back from disk. **No internal component is mocked
anywhere in the file**, and none of the thirteen is trivial, structural
(source-text scraping), or over-mocked.

Each test's assertions were checked against the shipped `l1-surface.json` /
`instances.json`, since the suite could not be executed here (see notes). All
thirteen are consistent with the shipped data — none would fail on a wrong
premise, and several are non-tautological in ways worth recording:

- **AC-1073** — set equality `callable ≡ declared`, then group homogeneity in
  both directions. Verified: the 8 groups partition all 21 operations exactly
  (9+1+3+3+1+2+1+1), every write group's ops are writes and `ReadSite`'s are all
  reads. The hard-coded 12-name write set matches the declaration exactly, so an
  unlisted new write fails there — the closure the AC claims.
- **AC-1081** — selects addressing operations *structurally* (`params.module &&
  params.slot`) rather than by the type under test, so it cannot pass by
  tautology. Verified: that filter yields exactly `[get_l1, set_l1]`, both carry
  `path.type: "l1_address"`, and neither restates the rule in a per-op
  `description` (both `undefined`). The `l1_address` type description does carry
  the re-read / regeneration wording.
- **AC-1080** — extracts the addressing paragraph from `overview` structurally
  (split on blank lines, keep the `/re-read/i` match, assert exactly one) and
  requires the manual to contain it verbatim. This is what makes the test fail if
  the rule is ever re-authored beside the manual instead of projected from the
  declaration — the AC's actual claim, and the thing AC-1081 cannot cover.
- **AC-1082** — the strongest of the set: makes the change through the surface,
  captures the resulting draft bytes, rewinds the file, makes the *same* change
  through `editL1Set` directly, and asserts the two drafts are byte-identical.
  That is a real proof of "one write path", not an assertion about it.
- **AC-1142** — verified non-vacuous against the shipped data: 6 sequences; the
  `get_l1`+`set_l1` filter catches exactly the 2 page-editing sequences with
  `describe_page < get_l1 < set_l1` in both; the changing sequence's note does
  carry "the whole thing back"; the add/remove note does carry "no separate way
  to insert or delete"; no declared tool name matches `/insert|delete/`; and
  `ungranted` resolves to exactly `['Publish deliberately']`, so the
  `toContain` anchor bites today.
- **AC-1074** — derives the withheld set as `groups ∖ grant` rather than from
  literals, with an `arrayContaining(['ManageAssets','Publish'])` anchor that
  fails loudly if the grant widens instead of going silently vacuous.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1142 | uat-edit | The grant-filtering clause is *conditionally* vacuous. `expect(manual).not.toContain(seq.name)` for the ungranted sequence, and the follow-up loop over `list.filter(s => manual.includes(s.name))`, are both satisfied trivially if the upstream manual renderer projects **no** sequences at all. Nothing in this repo asserts sequences reach the manual, and the renderer lives in `@lagrangefoundry/ai`, so the test cannot today distinguish "filtered correctly" from "never projected". It does still catch the regression that matters (an *unfiltered* projection would fail it). | Add one positive assertion that at least one *granted* sequence's name does appear in `box.manual()` — that pins the projection as live and makes the filtering clause bite from both sides. |
| 2 | warning | story | STORY-105 | story-body-edit | REQ-131 (`ready_to_reconcile`, imminent) will add a journal-read operation to this surface and a counter to every mutating operation's return. It has not landed — the declaration carries no such operation — so this is not a present coverage gap, but it will require an ac-add plus a body edit when it reconciles, and it will invalidate AC-1073's hard-coded 12-name write set. | No edit now. When REQ-131 reconciles, extend the body's declaration bullet and add ACs for the journal operation and the counter-bearing returns. |

**Violations: 0. Needs review: 0. Warnings: 2.**

## Notes for the Editor

**The evidence has now gone two consecutive rounds without being executed, and
this round is the third.** The prior uat fix (report-4298fc9e / REPORT-2057)
recorded that `npx vitest run` and `tsc --noEmit` were both refused by the
session's permission mode; the same refusals occurred here for `npx vitest run`,
`./node_modules/.bin/vitest run`, and any path outside the worktree. This
assessment is therefore a **static** one: every assertion in all thirteen tests
was hand-checked against the shipped `l1-surface.json` and `instances.json` and
all thirteen are consistent with them, but *no test in this file has been
observed to pass.* That is a bound on this verdict's confidence, not a defect in
the coverage.

Compounding it: **`@lagrangefoundry/ai` is not installed in this worktree.** The
scope is absent from `node_modules`, from every workspace package's
`node_modules`, and from `pnpm-lock.yaml` entirely — it is resolved by
`sharedModuleUrl` through `require.resolve` against a shared store installed by a
separate step. Ten of the thirteen tests call `aiCore()` or `createL1Toolbox()`
and would fail at resolution without it. The test file's own docstring
anticipates exactly this ("the shared artifact store is a PRECONDITION … failing
to resolve it is an environment failure and reads as one"), so this is expected
behaviour rather than a bug — but it does mean a runner reaching this file
without that install produces thirteen environment failures, not thirteen
verdicts. Worth confirming the regression runner has the shared store installed
before reading a green result from this file as meaningful.

**`.xgd/uat_index.json` is empty** (`acs: {}`, stamped `2026-08-16T00:03:30Z`)
while 110 acceptance_criterion tickets and a fully-conventional set of
`test_UAT_AC*` functions exist in the tree. Every prompt that resolves tests
through that index — this one included — will read `MISSING` for every AC and,
if it trusts the index over the source tree, will report a total coverage gap
that does not exist. This is an XGD-tooling defect rather than a finding against
CAP-92, but it will misfire on every capability assessed until the index is
rebuilt.

Beyond the two warnings, this tree is in good shape: thirteen ACs, thirteen
substantive tests, one file, no internal mocking, and a story body whose three
recorded divergences from the intent all still match the shipped artifacts. The
ac-level and uat-level cycles both closed clean before this one, and the coverage
level confirms it independently rather than by inheritance.
