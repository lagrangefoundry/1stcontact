---
uid: report-5be1ac98
id: REPORT-834
type: report
title: 'UAT Coverage: 1c CLI Argument Parsing & Output Hygiene'
created_by: xgd
created_at: '2026-07-23T10:19:14.214125+00:00'
updated_at: '2026-07-23T10:19:14.214125+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ac7ca849
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c CLI Argument Parsing & Output Hygiene

**Result**: PASS
**AC verdicts**: N/A — no AC-type tickets exist in this system (only capability/story/report). The AC-656/657/658/659/720 identifiers are test-naming anchors, not tickets. All embedded-AC behaviors are covered.
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (REQ-58+59+61+62) | free_and_reconciled | merged @7a42e182 | Guarantee 1 (boolean `--multi-viewport` flag, commit 4f681c73) + Guarantee 2 (`--json` stdout hygiene, commit a4323720) | YES |
| bundle-31e474b9 (REQ-63+79+82+83+84+…) | free_and_reconciled | merged @edeb1c2c | Guarantee 3 (store-selecting flag `--sandbox` propagates into render/serve sub-commands, commit 09fa7cf5) | YES |

No later intent retires any guarantee. All three behaviors are active per cumulative intent.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-79 (story-e15a19ef) | bundle-ab9e0cb6, bundle-31e474b9 | aligned | Body's 3 guarantees each traced to a reconciled intent; none retired |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-79 (guarantee 3) | — | Automated coverage of `--sandbox` propagation stops at the pure `subRenderOptions` seam (test_UAT_AC720). The actual forwarding into `cmdRender`/`startServe` is verified by code inspection (aligned-crops.ts:177–179 hands the identical `sub` object to both) + a manual e2e (7 crop pairs), not by an automated end-to-end assertion. | Acceptable as-is; if hardening later, add a spy-level assertion that `cmdRender`/`startServe` receive the `subRenderOptions` result. Warning only — does not gate. |

## Coverage Detail (per guarantee)

- **Guarantee 1 — boolean flag parsing.** Covered by `test_UAT_AC656_multi_viewport_keeps_slug_positional` and `test_UAT_FC_REQ-58_multiviewport_flag_is_boolean`. Both invoke the real `parseArgs` and assert the slug survives as a positional with the flag in either order, and value-taking `--ref` keeps its value. Substantive — distinguishes a boolean-aware parser from a value-consuming one. **pass**
- **Guarantee 2 — `--json` output hygiene.** Covered by `test_UAT_AC657_json_is_exactly_one_parseable_document`, `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr`, `test_UAT_AC659_stdout_restored_after_success_and_failure`, and `test_UAT_FC_REQ-58_multiviewport_json_stdout_clean`. All drive the real `withCleanStdout` seam: chatter written to stdout is diverted to stderr, stdout is the single parseable JSON document, and stdout is restored after both success and a throwing body. Substantive. **pass**
- **Guarantee 3 — store-selecting flags propagate into sub-commands.** Covered by `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve`, exercising the real `subRenderOptions` across three invocation shapes (--sandbox default source, --sandbox + published, no --sandbox). Production wiring confirmed at aligned-crops.ts:177–179. Substantive for the routing logic (all logic lives in the tested seam). **pass** (see warning #1 for the seam-vs-e2e boundary).

## Evidence Validity

All 3 test files run green: **11 passed / 11** (vitest, 18.7s). No internal mocking of the units under test — `parseArgs`, `withCleanStdout`, and `subRenderOptions` are the real production entry points. Multi-viewport browser tests drive real headless Chromium against committed loopback fixtures.

## Notes for the Editor

No violations and no needs_review — nothing to action for the fix loop. The single warning is an honest scope note on guarantee 3's reconciliation (pure-seam + manual e2e was the deliberate reconciled evidence shape, per the test docstring), not a coverage gap.
