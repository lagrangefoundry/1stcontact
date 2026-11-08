---
uid: report-78885f0c
id: REPORT-1301
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=uat)'
created_by: xgd
created_at: '2026-08-05T19:32:09.571927+00:00'
updated_at: '2026-08-05T19:32:09.571927+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Summary

`capability-ac7ca849` (CAP-66) owns **zero stories**, therefore **zero acceptance
criteria**, therefore **zero UATs**. The uat level is **vacuously aligned**: with no
owned ACs there is no test that can mis-exercise its AC (consistency), no active AC
left without a substantive UAT (coverage), and no pair of tests that can duplicate a
scenario (exclusivity).

This was verified against ticket records, not the index. All 12 unique story tickets
in the project were fetched individually; their `capability_uid` values are
`ae9d65d6` x5, `aa030c83` x5, `2049c9ec` x2 — **none** is `capability-ac7ca849`.
AC tickets carry no `capability_uid` of their own (verified on
`acceptance_criterion-72db61ca`: fields are `story_uid`, `kind`, `regression_only`,
`uat_coverage`), so an AC can only reach a capability transitively through
`story_uid`. With no story owning this capability, no AC and no UAT can resolve to
it. The proof is transitive and complete.

Cumulative intent for this capability is expressed by `story-e15a19ef` (STORY-79)
under the survivor `capability-aa030c83` (CAP-63, "1c Capture & Diff Fidelity"),
reassigned by the 2026-08-05 structural rebalance (`report-bdaf6840` / REPORT-1266).
All 7 of its ACs carry substantive UATs, verified by reading the test bodies this
run — see the ledger.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-17 → 2026-07-19, main `7a42e182` | Originating intent (REQ-58 pass-3, plan item 5). Boolean `--multi-viewport` flag parsing (`4f681c73`); `--json` stdout hygiene, render diagnostics to stderr, stdout restored on failure (`a4323720`) | YES |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Store-selecting flags propagate into driven sub-commands (`aligned-crops --sandbox`, plan item 9, `09fa7cf5`). Reaches this tree via STORY-79 only | YES |
| BUNDLE-8 (`bundle-cceaba25`) | free_and_reconciled | 2026-07-29 | Extended output hygiene: "Missing pages directory" suppressed at source on every command; Astro-free render path unless a page carries behavior modules (REQ-89, `5dc46d0f`) | YES |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`. No intent asks for
behavior that is absent from the surviving tree.

## Alignment Ledger

Owned by `capability-ac7ca849` at uat level: **nothing**. The ledger below records
where this capability's intent now lives, so a future check can see the 1:1 mapping
and the evidence that backed it.

| Element (under survivor `capability-aa030c83`) | Intents aligned to | Covering UAT | Outcome |
|---|---|---|---|
| AC-656 `--multi-viewport` keeps slug positional | BUNDLE-6 | `test_UAT_AC656_multi_viewport_keeps_slug_positional` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:25`) | aligned — drives real `parseArgs`, both flag orderings |
| AC-657 `--json` prints exactly one parseable document | BUNDLE-6 | `test_UAT_AC657_json_is_exactly_one_parseable_document` (:53) | aligned — real `withCleanStdout`, asserts on raw stdout byte channel, `JSON.parse` round-trip |
| AC-658 diagnostics on stderr not stdout | BUNDLE-6, BUNDLE-8 | `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (:100) | aligned |
| AC-659 stdout restored after success and failure | BUNDLE-6 | `test_UAT_AC659_stdout_restored_after_success_and_failure` (:138) | aligned |
| AC-720 `aligned-crops --sandbox` routes to sandbox repro | BUNDLE-7 | `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33`) | aligned |
| AC-738 every command boots quietly on both streams | BUNDLE-8 | `test_UAT_AC738_commands_boot_without_missing_pages_warning` (`tests/reconciliation-1c-astro-free-render.test.ts:95`) | aligned — spawns the real `1c` binary as a subprocess, asserts both streams |
| AC-739 Astro container only for module pages | BUNDLE-8 | `test_UAT_AC739_astro_container_created_only_for_module_pages` (:132) | aligned — real render entry point, spies on container construction |

All 7 UATs exercise real entry points (argument parser, stdout plumbing primitive,
subprocess invocation of the shipped binary, real render). None is a structural/AST
check. No two verify the same scenario in the same shape.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | capability-ac7ca849 | code-issue (upstream) | Stale branch-worktree index still lists STORY-79 under this capability (and duplicates 9 further story rows), double-attributing STORY-79's 7 ACs and 7 UATs across two capabilities. The ticket record is correct (`capability_uid: capability-aa030c83`); only the index is wrong. Human-ID lookup is also broken in this worktree (`xgd ticket get STORY-79` / `REPORT-1300` both 404 while UID lookup succeeds) | None at uat level. Already diagnosed in `report-bdaf6840` and already raised as the story-level **violation** in `report-1ba06894` with category `code-issue`. Fix belongs in the xgd index layer; re-raising per level would duplicate one upstream fix |

## Notes for the Editor

- **Nothing to edit at this level.** There is no uat-level matrix element under this
  capability to add, edit, or deprecate. A uat-level matrix editor has no valid
  action here — any attempt to "fix" this capability's UATs would have to invent
  elements, which would create the drift this check exists to detect.
- **The one open defect is a system defect, not matrix drift**, and it is not
  repairable by a matrix editor at any level. It is recorded here as a warning purely
  for traceability, matching the disposition the ac-level report (`report-1d7527b2`)
  chose for the same defect.
- **The capability's own body is already accurate** — it states it was absorbed,
  holds zero stories, and is retained as a historical pointer. It correctly documents
  that it could not be set to `status: deprecated` because of the index defect. The
  body needs no edit; the residual `status: active` + `uat_coverage: pass` +
  `merged_into: capability-aa030c83` field combination will resolve when the index
  defect is fixed and the capability can be deprecated.
- **Level cascade honoured**: per the uat-level rule, AC bodies were the working
  reference. Intent history was consulted only because the subject owns no ACs, which
  forced escalation to establish where the intent went.
