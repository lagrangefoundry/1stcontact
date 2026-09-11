---
uid: report-5f540e8d
id: REPORT-3858
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=uat)'
created_by: xgd
created_at: '2026-09-11T01:44:45.983543+00:00'
updated_at: '2026-09-11T01:44:45.983543+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-00e77e55 (CAP-92). Attempt 4
(three prior fix cycles).

CAP-92 holds exactly one story, STORY-105 (`story-93905de4`, `story_kind: upgrade`,
status `updated`), carrying 14 acceptance criteria: AC-1071…AC-1082, AC-1142 and
AC-1411.

**Level cascade state.** The story-level cycle closed clean this run (REPORT-3840,
`result: pass`, 0 violations) and the ac-level cycle closed clean immediately after
(REPORT-3845, `result: pass`, 0 violations / 1 warning). Both were re-read from the
store this pass rather than assumed. Per the cascade, **the AC bodies are the
working reference here**; intent history was consulted only to confirm that no AC
body or test names a retired vehicle ticket.

**What this pass is actually assessing.** The prior uat pass (REPORT-3850,
2026-09-11 01:30) raised one violation and one warning; the fix cycle
(REPORT-3855, 01:39) claims both closed. This pass re-derives the answer from the
tree rather than accepting that claim, and finds both closed — see the ledger.

## Evidence execution — what ran, what could not, and why

| Command | Result |
|---|---|
| `npm test -- tests/reconciliation-assistant-control-surface.test.ts` | **13 passed / 13**, 502ms — AC-1071…AC-1082 and AC-1142, including AC-1073's new disjointness assertion |
| `npm test -- tests/reconciliation-assistant-control-surface-audit.workers.test.ts` | **could not run** — the process dies at `Error: listen EPERM: operation not permitted 127.0.0.1` before any test executes |
| `npm test -- tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` | **could not run** — identical `listen EPERM` |

The second failure is **environmental, not a property of the new suite**: an
untouched, long-standing workerd suite (REQ-146) fails in exactly the same way at
exactly the same point. Miniflare cannot open a loopback listener in this sandbox,
so the whole `vitest.workers.config.mts` project is unreachable here regardless of
what it contains.

REPORT-3855 recorded the opposite — that the EPERM was only wrangler's debug-log
write and that all four AC-1411 cases passed inside workerd at 01:39 today. Both
observations can be true of different sandbox grants; I can neither reproduce nor
refute its run. **So AC-1411's evidence is assessed by reading, and that limit is
stated rather than papered over.** What was verified statically is specific and is
listed in the ledger row: the file is inside the workers project's `include`
glob (`vitest.workers.config.mts:51`, `tests/**/*.workers.test.ts`); every import
it names resolves to a real export (`nextSlug`/`siteSeed` in
`tests/support/site-seed.ts:62,68`; `modelSaw`/`scriptedClient`/`calls`/`says` in
`tests/support/scripted-model-client.ts:71,107,130,194`; `applySchema` in
`tests/support/d1-site-factory.ts:51`; `resetChatHost` in
`apps/control-app/src/router.ts:114`; `setModelClient`/`resetAiHost` in
`tools/generate/src/cli/ai/host-core.ts:105,717`); and each assertion lands on the
production mechanism it names (`router.ts` `finally`-inside-the-stream flush with
the bare `catch` around `host.flush`; `ai.ts:136-151` `flushAudit`, one object per
record under `audit/<tenant>/<session>/<stamp>-<nnnn>.json`, which is the exact
prefix `trailFor()` lists).

## Cumulative Intent Considered

Chronological ledger of the intents that touched this capability. Nothing has been
added since the prior pass; every entry is `free_and_reconciled`.

| Intent ID | Bundle | Status | When | Asked / changed (CAP-92 portion) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | 2026-08-07 | Tool surface declared as data; the manual as a projection; declared absences | YES |
| REQ-126 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | **Primary.** `l1-surface.json` as data; error codes with caller-facing meanings; effect-homogeneous groups; sequences; absences; `surface_version`; `instances.json` as a separate grant; `provenance: untrusted`; an audit sink per call; an author-time validator | YES |
| REQ-127 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | Read/write classification becomes enforced rather than an unchecked flag | YES |
| REQ-129 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | `get_copy`/`set_copy` → `get_l1`/`set_l1`; `WriteCopy` → `AuthorPages` | YES |
| REQ-130 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | Five operations added; `DrawImages` split from `ManageAssets` so it can be withheld | YES |
| REQ-131 | BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | 2026-08-11 | `list_changes` declared into `ReadSite`, untrusted return, own sequence entry | YES |
| REQ-133 | BUNDLE-19 | free_and_reconciled | 2026-08-12 | `get_palette` into `ReadSite`; `ManagePalette` group of four writes | YES |
| REQ-142 | — | free_and_reconciled | 2026-08-15 | Async `SiteStore` port — every L1 operation becomes async | YES |
| REQ-146 | BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | 2026-08-15 | **AC3: the audit is durable and survives the host.** Surface splits into a portable core + the host's own operations | YES |
| REQ-149 | BUNDLE-20 | free_and_reconciled | 2026-08-17 | Revisions move onto the storage port: `publish` becomes an ordinary portable-half operation; `add_asset` becomes **the sole disk-bound operation** | YES |

Nothing in the ledger is `abandoned`, `deprecated` or `wont_fix`, and no AC body
or test names a retired vehicle ticket — **Step 2.5's named-abandoned-vehicle case
does not arise anywhere in this tree.**

## Alignment Ledger

One row per AC. Line numbers are in `tests/reconciliation-assistant-control-surface.test.ts`
unless stated otherwise.

| Element | Test (evidence) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1071 `acceptance_criterion-6dec52fd` | `test_UAT_AC1071_declaration_and_grant_check_clean_before_anything_runs` (:169) | REQ-126 | **aligned** — runs `validateData([L1_DECLARATION], L1_INSTANCES)` at author time; all four verification clauses asserted (empty problems, overall pass, the one surface, the caretaker role) |
| AC-1072 `acceptance_criterion-becf310b` | `test_UAT_AC1072_surface_states_its_own_version_distinct_from_the_format_version` (:185) | REQ-126 | **aligned** — format version and `L1_SURFACE_VERSION` both read, and the surface version re-read from the shipped JSON on disk so the two cannot drift |
| AC-1073 `acceptance_criterion-1c764340` | `test_UAT_AC1073_everything_callable_is_declared_and_the_write_set_is_closed` (:205) | REQ-126, REQ-127, REQ-146, REQ-149 | **aligned — the prior warning is closed.** The halves are now captured separately (`core` :222, `host` :223) and `expect(core.filter((op) => host.includes(op))).toEqual([])` (:231) asserts disjointness **before** `callable` is composed from the two captured lists (:233) rather than from a spread merge. All five of the AC's verification clauses are now evidenced (the placement clause in a complementary shape — see info 3) |
| AC-1074 `acceptance_criterion-c595b0f5` | `test_UAT_AC1074_declared_operations_can_be_withheld_from_a_consumer` (:283) | REQ-126, REQ-130, REQ-146 | **aligned** — declared ⊇ the withheld set; absent from `toolNames()`; absent from the manual with the withheld group set *derived* from declaration + grant; the call refused with draft bytes identical and the last audit record `{decision: 'refuse', rule: 'capability'}` |
| AC-1075 `acceptance_criterion-95620a93` | `test_UAT_AC1075_a_read_only_grant_cannot_reach_a_write` (:330) | REQ-127 | **aligned** — a real `ReadSite`-only toolbox; the write neither offered nor documented; invoking it refused, draft bytes unchanged, and the value it would have replaced still reads as before |
| AC-1076 `acceptance_criterion-b589483b` | `test_UAT_AC1076_arguments_are_checked_before_any_value_reaches_the_site` (:356) | REQ-126 | **aligned** — all three declared faults; each answer names its own fault; draft bytes unchanged; all three audit records `{decision: 'refuse', rule: 'schema'}`, which is what separates "refused on the declaration" from "reported back from the write path" |
| AC-1077 `acceptance_criterion-72dfce4f` | `test_UAT_AC1077_a_refusal_names_its_code_and_that_codes_published_meaning` (:385) | REQ-122, REQ-126 | **aligned** — the guidance string is taken from `L1_DECLARATION.errors.NOT_FOUND.message` rather than restated, so the assertion tracks the declared taxonomy; draft byte-identical |
| AC-1078 `acceptance_criterion-bd0f50cc` | `test_UAT_AC1078_reads_are_marked_third_party_and_write_confirmations_are_not` (:408) | REQ-126, REQ-131 | **aligned** — markers taken from `aiCore()`, not hard-coded; open/close asserted around a real read carrying the page's own words; a real write's confirmation asserted unmarked; the manual asserted to carry and explain the marker |
| AC-1079 `acceptance_criterion-ffa07ea7` | `test_UAT_AC1079_every_call_against_the_site_is_recorded` (:435) | REQ-126 | **aligned** — three calls, exactly three records; and the allowed-but-failed write recorded as **both** (`policy.decision: allow`, `outcome.ok: false`, error containing `NOT_FOUND`), which is the clause that makes the trail reconstructive |
| AC-1080 `acceptance_criterion-73371752` | `test_UAT_AC1080_the_manual_is_a_projection_of_the_declaration_and_the_grant` (:471) | REQ-122, REQ-131 | **aligned** — re-verified this pass: the addressing paragraph is **selected out of `L1_DECLARATION.overview` by wording** (:484-486), asserted unique, and required verbatim in the manual (:488). That is what proves projection rather than parallel prose. Every declared absence named from `L1_DECLARATION.absences`; `NOT_FOUND` asserted together with `taxonomy.NOT_FOUND.message` |
| AC-1081 `acceptance_criterion-ea231234` | `test_UAT_AC1081_the_addressing_rule_is_stated_once_and_every_address_is_typed` (:507) | REQ-126, REQ-131 | **aligned, and non-tautological** — re-verified this pass: the address-taking operations are identified **structurally** (`o.params?.module && o.params?.slot`, :519) rather than by the type under test, and asserted to be exactly `['get_l1','set_l1']`, so the filter and the property coincide by fact rather than by construction |
| AC-1082 `acceptance_criterion-f4dc6dcc` | `test_UAT_AC1082_a_change_through_the_surface_lands_via_the_one_write_path` (:530) | REQ-122, REQ-126; CAP-86 | **aligned** — the address is read from the map rather than composed; the draft on disk is the evidence; then the draft is rewound and the same change made through `editL1Set` directly, the two drafts asserted byte-for-byte equal. A proof of "no second write route", not an assertion about one |
| AC-1142 `acceptance_criterion-670113cb` | `test_UAT_AC1142_worked_sequences_are_declared_data_and_none_names_an_ungranted_operation` (:567) | REQ-126, REQ-131, REQ-133 | **aligned** — sequences read from the declaration directly (honouring the AC's own warning that `validateData` would accept an empty list); each named, ≥2 ordered steps, note present, every step a declared tool; read-before-replace asserted by index; the ungranted set derived from the real toolbox |
| AC-1411 `acceptance_criterion-cb6e1b58` | four tests in `tests/reconciliation-assistant-control-surface-audit.workers.test.ts` (:255, :298, :342, :385) | REQ-146 (AC3) | **aligned — the prior violation is closed.** All four of the criterion's clauses now have an AC-named test, each driving the real Worker route. **Not executable in this sandbox** (see above); assessed by reading, clause by clause, in the paragraph below |

### AC-1411, clause by clause

The gap REPORT-3850 raised was that two of the criterion's four clauses were
asserted nowhere in the tree. Each now has a test, and each asserts the clause
rather than a proxy for it:

1. **Survives the host** — `test_UAT_AC1411_the_trail_survives_the_host_that_wrote_it`
   (:255). A turn that **changes** the site (`add_page`, not a read), then
   `resetAiHost()` + `resetChatHost()` + `setModelClient(null)`, then the record
   read back out of R2 via a prefix listing and asserted in full: `surface`,
   `effect: 'write'`, `params.page`, `policy.decision: 'allow'`, `outcome.ok`,
   `session`. "In full" is what the criterion asks for, and it is what is asserted.
2. **Concurrent callers lose no entry** — `test_UAT_AC1411_two_turns_at_once_lose_none_of_each_others_records`
   (:298). **Two real turns driven concurrently through the route** — both
   responses obtained before either body is read — not two direct `flushAudit`
   calls. The **delta** is asserted to be exactly 2 (:333), and `params.page` across
   both trails asserted to be `['alpha','beta']` (:339), so a fold shows fewer and
   fails. Measuring the delta rather than an absolute keeps the assertion about
   these two turns. The scripted client is replaced by a per-turn dispatcher
   (:195-220) precisely because the shared script's single index would let two
   concurrent turns consume each other's steps — a real hazard correctly handled.
3. **An abandoned turn still records what it managed to do** —
   `test_UAT_AC1411_a_turn_that_dies_part_way_still_records_what_it_managed_to_do`
   (:342). The tool call runs, then the model stream throws (`diesMidStream`,
   :176-182). Asserts the failure arrived **as a frame** (status 200, the message
   in the SSE text, a final `done`) and that the `add_page` record is in R2 anyway.
   This makes `router.ts`'s `finally`-inside-the-stream placement executable — the
   comment at `router.ts:659-666` calls that placement "the whole of AC3"; it is no
   longer carried by prose alone.
4. **A failed durable write does not also fail the turn** —
   `test_UAT_AC1411_a_failed_durable_write_does_not_also_fail_the_turn` (:385). R2
   made to refuse writes **under the `audit/` prefix only** (:148-165), which is
   correct and load-bearing: a bucket refusing every write would break `chat/` and
   `draft/` and the case would pass proving nothing. Asserts the assistant's own
   words still reached the caller and the turn ended with `done`, **and** that the
   trail is empty — the declared cost recorded rather than assumed. This forces the
   bare `catch` at `router.ts:704-708`, the other behaviour the prior report called
   prose-only.

### Coverage

All 14 ACs now have at least one AC-named, substantive UAT. 13 of them execute here
and all 13 pass; AC-1411's four are blocked by the sandbox, not by their own
content.

### Exclusivity

No two AC-named tests verify the same scenario in the same way. The four AC-1411
cases are four distinct properties, not four angles on one. The two closest
cross-suite pairs are recorded as info 3 and info 4 rather than as findings, with
the reasoning stated there.

### Evidence validity

Nothing in either suite mocks an internal component. The node suite drives
`createL1Toolbox`, `l1Operations`/`nodeOperations`, `validateData` and `editL1Set`
for real against a per-test `mkdtemp` site built by `cmdNew`, and reads draft bytes
back from disk. The workerd suite runs through the Worker's own `fetch` against a
real D1 database and a real R2 bucket, with the session manager, role assembly,
tool loop, tool handlers, `edit.ts` writes, SSE framing and audit trail all real.
Its two doubles are both at declared external boundaries — the Anthropic network
client, and (in the last case only) R2 itself, prefix-scoped. Both are within the
thin-mock rule.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | `tools/generate/src/cli/ai/host.ts:17` | code-issue (**comment text only — no behaviour is wrong**) | **A sixth copy of the stale `publish` sentence survives, and it is the one in production source.** REPORT-3850 tracked the claim "`nodeOperations` supplies `add_asset` and `publish`, the two that need a disk" — true at REQ-146, made false by REQ-149 when revisions moved onto the storage port and `publish` graduated into the portable core. REPORT-3855 corrected all five **test-file** copies (verified: the phrase no longer appears anywhere under `tests/`). It missed the production one: `tools/generate/src/cli/ai/host.ts:17` still reads "``add_asset`` and ``publish``, the two operations that need a disk". The code beneath it is correct — `nodeOperations` at `tools/generate/src/cli/ai/toolbox.ts:117-125` returns `add_asset` alone — so nothing fails and no test is wrong. This is a reader-facing inaccuracy in the file whose whole job is to state what Node supplies, sitting directly above the list it misstates, and it is the last copy of a claim the previous two cycles were cleaning up | One line: `tools/generate/src/cli/ai/host.ts:17` → "`add_asset`, the one operation that needs a disk (`publish` graduated to the portable core in REQ-149)". No test changes; no behaviour change |
| 2 | info | coverage | AC-1411 | — | **The prior violation is closed.** All four clauses now have AC-named tests against the real route, and clauses 3 and 4 — the two that had no assertion anywhere in the tree — are the two that are now hardest to regress silently. Recording this so a later cycle does not re-open it: the gap was coverage, not a defect, and the fix cycle confirms the tests pass against **unmodified production code** | none |
| 3 | info | consistency | AC-1073 | — | **The prior warning is closed**, and the placement clause remains covered in a complementary shape rather than in the AC-named test: `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:333-353` imports `toolbox-core` inside workerd and asserts the portable half contains `publish` and **not** `add_asset`. REPORT-3850's info 3 said the same; re-stated here so a fourth cycle does not raise placement as a fresh gap. The AC's five clauses are: equality over the union (:234), disjointness (:231, new), placement (the FC test above), one-group-per-write with effect `write` (:242-246), and the literal write set (:256+) | none |
| 4 | info | exclusivity | AC-1411 ↔ `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` | — | Two pairs overlap and neither is a duplicate. **Clause 1** ↔ `…_every_ai_write_is_audited_and_survives_a_restart` (:225): the FC test drives a **read** (`list_pages`) and asserts `operation`/`session`; the AC test drives a **write** (`add_page`) and asserts the full record including `effect`, `params`, `policy` and `outcome`. The AC test is a strict superset. **Clause 2** ↔ `…_the_audit_is_append_only_across_concurrent_flushes` (:255): the FC test calls `flushAudit` directly with two records in **one session**; the AC test drives two real turns in **two sessions**. These are genuinely complementary — the FC test is the only thing covering same-session concurrency, and the AC test is the only thing covering concurrency through the route. Deleting either would cost real coverage. This is the expected FC→AC reconciliation shape, as REPORT-3850's info 4 established for the node suites | none |
| 5 | info | coverage | AC-1411 | — | **`uat_coverage` on AC-1411 is still unset, and that is correct.** The field is owned by check/fix_uat_coverage. AC-1411's `status` is also still `pending`; REPORT-3850 established that neither is drift and neither is why the level previously failed. Four cycles have now reached this conclusion — it should not need re-deriving a fifth time | none |

## Notes for the Editor

- **Nothing blocks this level.** Zero violations, zero needs_review. Finding 1 is a
  one-line comment correction in production source, repairable opportunistically;
  findings 2-5 are ledger entries with resolution "none".

- **Do not set `uat_coverage` on AC-1411 from this cycle**, and do not touch its
  `status: pending`. Both are owned elsewhere and both have now been deliberately
  left alone by REPORT-3835, REPORT-3845, REPORT-3850 and REPORT-3855.

- **The AC-1411 suite could not be executed in this sandbox, and the reason is not
  the suite.** `vitest.workers.config.mts` cannot start miniflare here — it dies at
  `listen EPERM: operation not permitted 127.0.0.1` before the first test, and an
  untouched REQ-146 workerd suite fails identically. Any future cycle that needs
  live evidence for AC-1411 must run in an environment permitting a loopback
  listener; re-running it here will produce the same EPERM and should not be read
  as a test failure. What *was* verified statically this pass is enumerated above
  (include glob, every import resolving to a real export, and each assertion landing
  on the named production mechanism), and is recorded so a later cycle knows exactly
  what was and was not established.

- **The `publish` sentence is now a five-cycle thread.** It entered as REQ-146's own
  evidence prose, was copied into five test files, was corrected in all five by
  REPORT-3855, and survives in the production file that originated it. Finding 1 is
  the last copy. Correcting it closes the thread.
