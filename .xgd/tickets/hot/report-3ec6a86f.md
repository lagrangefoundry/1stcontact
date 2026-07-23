---
uid: report-3ec6a86f
id: REPORT-833
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=uat)'
created_by: xgd
created_at: '2026-07-23T10:14:33.651406+00:00'
updated_at: '2026-07-23T10:14:33.651406+00:00'
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

The capability has one story (STORY-79, `story-e15a19ef`, kind=upgrade) reconciled
from two bundles. Both are fully reconciled and count toward cumulative intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6, REQ-58 pass-3) | free_and_reconciled | merged @7a42e182 | Guarantee 1 (`--multi-viewport` boolean flag, commit 4f681c73) + Guarantee 2 (`--json` stdout hygiene, commit a4323720) | YES |
| BUNDLE-7 (bundle-31e474b9, BUNDLE-7) | free_and_reconciled | merged @edeb1c2c | Guarantee 3 (aligned-crops `--sandbox` store routing forwarded to render+serve, commit 09fa7cf5) | YES |

Cumulative intent = three CLI-correctness guarantees: (1) boolean-flag parsing that
preserves positionals in any order; (2) `--json`/stdout hygiene (single clean JSON
document; render/bootstrap diagnostics to stderr; stdout restored after success or
throw); (3) store-selecting flags propagate from `aligned-crops` into the render and
serve it drives. The AC tree (5 ACs) and the UAT set match this scope exactly; no
retired behavior remains.

## Alignment Ledger

Working reference at uat level is the AC body; intent consulted only where noted.
Each UAT was read and its claimed seam confirmed against production code.

| Element (test) | AC | Seam exercised (production) | Outcome |
|---|---|---|---|
| test_UAT_AC656_multi_viewport_keeps_slug_positional | AC-656 | `parseArgs` (args.ts:11 `multi-viewport` ∈ BOOLEAN_FLAGS) | aligned — asserts slug survives as positional in both flag orders, toggle on, `--ref` value intact |
| test_UAT_AC657_json_is_exactly_one_parseable_document | AC-657 | `withCleanStdout` (stdio.ts) + JSON emit after wrapper | aligned — stdout parses as one document, no chatter interleaved, chatter present on stderr |
| test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr | AC-658 | `withCleanStdout` (stdio.ts) | aligned — all three named diag classes (re-optimize / deprecation / Missing pages) on stderr, absent from stdout |
| test_UAT_AC659_stdout_restored_after_success_and_failure | AC-659 | `withCleanStdout` finally-restore (stdio.ts:23) | aligned — post-phase write lands on stdout after both success and throw; error propagates |
| test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve | AC-720 | `subRenderOptions` (aligned-crops.ts:163) fed to both `cmdRender` and `startServe` (aligned-crops.ts:177-179) | aligned — `sandbox`/`cwd` forwarded under `--sandbox`, absent without it, `source` (default draft) preserved in all cases |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | all 5 UATs | — | Every AC has exactly one substantive UAT (`test_UAT_AC<n>_*`) that drives the real production seam, not a structural/AST check; verified passing (5/5) against real code | none |
| 2 | info | coverage | AC-656/657/658/659/720 | — | UAT coverage is complete: each active AC has ≥1 substantive UAT; production wiring for each seam confirmed present (parseArgs boolean set; withCleanStdout wraps cmdValuesDiff with JSON emitted after; subRenderOptions handed to both render and serve) | none |
| 3 | info | exclusivity | AC-657 + AC-658 | — | The two tests share incidental "Missing pages directory" assertions but verify distinct criteria (single-parseable-JSON-document integrity vs. three-class stderr routing). Not a same-shape duplicate | none |

## Notes for the Editor

No drift detected at the uat level. All three properties (consistency, coverage,
exclusivity) hold:

- **Consistency**: each UAT exercises precisely its AC's behavior, and the seam each
  test asserts is the actual production path (confirmed by reading args.ts, stdio.ts,
  index.ts:427-443, and aligned-crops.ts:163-179).
- **Coverage**: 5/5 active ACs have a substantive, passing UAT.
- **Exclusivity**: no redundant same-shape tests.

Observation (not a finding): the two test files are named `reconciliation-*.test.ts`
and their docstrings frame the tests as "Reconciliation UATs", while STORY-79 is
`story_kind=upgrade`. This is cosmetic — the tests correctly follow the mandatory
`test_UAT_AC<number>_*` naming convention and prove the ACs. It reflects that the
behavior was reconciled from prior bundle commits; no action required at this level.

The AC-720 and AC-657/658/659 UATs deliberately verify the pure store-routing /
stdout-plumbing seams rather than the full browser+sharp / in-process-Astro pipeline;
the AC verifications explicitly scope the boundary to "the options handed to render
and serve" and "capture stdout only", so the seam-level tests are the correct,
verifiable boundary. The end-to-end checks (7 crop pairs; live `| jq`) are the
manual orchestrator confirmations noted in the story's technical context.
