---
uid: report-eec5c62c
id: REPORT-909
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=uat)'
created_by: xgd
created_at: '2026-07-24T08:01:39.729779+00:00'
updated_at: '2026-07-24T08:01:39.729779+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

| Intent ID | Status | Asked / changed | Counts? |
|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | Guarantees 1–2: `--multi-viewport` boolean-flag parsing (AC-656); `--json` stdout hygiene + stderr routing + stdout restore (AC-657/658/659). REQ-58 pass-3, commits 4f681c73, a4323720 | YES |
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | Guarantee 3: store-selecting flags propagate into aligned-crops render/serve sub-commands (AC-720). BUNDLE-7 plan item 9, commit 09fa7cf5 | YES |

Both intents are fully reconciled; every asked behavior is expressed in the
capability's single story (STORY-79, story_kind=upgrade) and covered by ACs.

## Alignment Ledger

At uat level the AC bodies are the working reference; the test body must exercise
what its AC claims. Each test was read and traced to the real production seam it
drives (`tools/generate/src/cli`), and each seam was inspected to confirm it does
what the AC describes (no code-issue).

| Element (AC → UAT) | Production seam | Outcome |
|---|---|---|
| AC-656 → `test_UAT_AC656_multi_viewport_keeps_slug_positional` | `parseArgs` (args.ts:14; `multi-viewport` ∈ BOOLEAN_FLAGS) | aligned — asserts slug survives as positional in both flag orders, toggle on, `--ref` value preserved |
| AC-657 → `test_UAT_AC657_json_is_exactly_one_parseable_document` | `withCleanStdout` (stdio.ts:15) | aligned — chatter diverted, emitted JSON parses as exactly one document, no diagnostics leaked to stdout, chatter present on stderr |
| AC-658 → `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` | `withCleanStdout` (stdio.ts:15) | aligned — all three named diagnostic classes (re-optimize, deprecation, "Missing pages directory") on stderr, absent from stdout |
| AC-659 → `test_UAT_AC659_stdout_restored_after_success_and_failure` | `withCleanStdout` (stdio.ts:23 finally) | aligned — post-phase write lands on stdout after both a returning and a throwing fn; error propagates |
| AC-720 → `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` | `subRenderOptions` (aligned-crops.ts:163; consumed identically by cmdRender+startServe at :178/:179) | aligned — three cases assert sandbox/cwd forwarded under `--sandbox`, absent without it, source (default draft) preserved throughout |

## Findings

None.

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| — | — | — | — | — | No violations, warnings, or needs_review at uat level | — |

## Notes for the Editor

- **Coverage**: all 5 active ACs have exactly one substantive UAT each. Every test
  invokes a real, exported production function with real inputs and asserts real
  behavior — none are structural/AST-only checks.
- **Consistency**: each test's assertions match its AC's Verification section
  verbatim in intent (flag-order invariance, single-document parseability,
  stderr routing of the three named diagnostic classes, stdout restore on
  success+throw, store-routing forwarding). The production seams were inspected
  and behave as the ACs describe — no code-issue.
- **Exclusivity**: AC-657 and AC-658 both touch the "chatter off stdout"
  behavior of `withCleanStdout`, but they are not duplicates — AC-657 asserts the
  positive property (stdout is exactly one parseable JSON document) while AC-658
  asserts the routing property (each named diagnostic class lands on stderr).
  Distinct scenarios and assertions; acceptable.
- **Reconciliation shape**: STORY-79 is an upgrade/reconciliation story over pure
  in-process seams; the tests deliberately verify at the `parseArgs` /
  `withCleanStdout` / `subRenderOptions` boundaries and note that the downstream
  browser+Astro+sharp pipeline is the manual/orchestrator layer (7-crop-pair
  end-to-end check is documented as manual in the AC-720 test rationale). This is
  an appropriate seam choice for these correctness guarantees.
