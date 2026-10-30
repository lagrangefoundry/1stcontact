---
uid: report-4aadf2dc
id: REPORT-910
type: report
title: 'UAT Coverage: 1c CLI Argument Parsing & Output Hygiene'
created_by: xgd
created_at: '2026-07-24T08:19:38.470480+00:00'
updated_at: '2026-07-24T08:19:38.470480+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ac7ca849
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c CLI Argument Parsing & Output Hygiene

**Result**: PASS
**AC verdicts**: 5 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (via its sole story STORY-79):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6, REQ-58 pass-3) | free_and_reconciled | 2026-07-17 | Guarantee 1 (boolean `--multi-viewport` keeps slug positional) + guarantee 2 (`--json` stdout hygiene: render/bootstrap diagnostics → stderr, stdout single JSON doc, stdout restored even on failure) | YES |
| BUNDLE-7 (bundle-31e474b9, BUNDLE-7) | free_and_reconciled | 2026-07-22 | Guarantee 3 (store-selecting flags propagate: `aligned-crops --sandbox` forwards sandbox+cwd+source to the render and serve it drives) | YES |

Both intents are reconciled; nothing later retired any behavior. Current cumulative intent = all three guarantees. Story body describes exactly these three, and no more.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-79 | BUNDLE-6, BUNDLE-7 | aligned | Body's three guarantees each map to a counting reconciled intent; no obsolete claims |

## Findings — Categorized by Editor Action

No findings. All ACs active and substantively covered; story body aligned with cumulative intent.

## Evidence Detail (per AC)

| AC | Guarantee | Test | Real seam exercised | Verdict |
|---|---|---|---|---|
| AC-656 | 1 — boolean flag keeps slug positional | test_UAT_AC656_multi_viewport_keeps_slug_positional | `parseArgs` (args.ts:14; used at index.ts:217). Asserts slug survives as positional in BOTH flag orders and value-taking `--ref` keeps its value | pass |
| AC-657 | 2 — `--json` is one parseable document | test_UAT_AC657_json_is_exactly_one_parseable_document | `withCleanStdout` (stdio.ts:15; used at index.ts:394/427/551/580). Writes render chatter inside the seam, asserts stdout parses as the single diff JSON and chatter is diverted to stderr | pass |
| AC-658 | 2 — diagnostics on stderr not stdout | test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr | `withCleanStdout`. All three diagnostic classes (re-optimize / deprecation / missing-pages) present on stderr, absent from stdout | pass |
| AC-659 | 2 — stdout restored (incl. on failure) | test_UAT_AC659_stdout_restored_after_success_and_failure | `withCleanStdout`. Post-phase write lands on stdout after both a returning phase and a throwing phase (finally-restore) | pass |
| AC-720 | 3 — `--sandbox` routes render+serve to sandbox store | test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve | `subRenderOptions` (aligned-crops.ts:163). Three routing cases; production confirms the result is forwarded to BOTH cmdRender (aligned-crops.ts:178) and startServe (:179) | pass |

## Notes for the Editor

- All five tests are pure/in-process TypeScript vitest tests against real production seams (`parseArgs`, `withCleanStdout`, `subRenderOptions`) — no internal mocking, no source-text/structural assertions. Executed live during assessment: 2 files, 5 tests, all pass (1.74s).
- `.xgd/uat_index.json` marked all five tests `missing` — this is the known fresh-regression-worktree phantom (the gitignored index was not rebuilt for the TS suite), NOT a genuine coverage gap. Verdicts here are grounded in reading and running the actual test files, not the index status.
- AC-720's test verifies the store-routing decision at the pure `subRenderOptions` seam; the downstream browser+sharp crop pipeline is exercised manually per the commit (7 crop pairs). The seam value plus the confirmed production wiring to both sub-commands covers the AC's behavioral claim.
