---
uid: comment-fc83567b
id: COMMENT-1271
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-08-20T07:21:31.827548+00:00'
updated_at: '2026-08-20T07:21:31.827548+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5b3fe8e5
  kind: note
---

Done. All four actionable findings are resolved, verified by execution.

## What I did

**V1 (violation, uat-edit) — AC-657's test never ran the command.** Rewrote `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts`) to drive the real dispatcher: a real reference capture bundle plus a real actual manifest on disk, `run(['values-diff','--ref',…,'--actual',…,'--out',…,'--json'])`, stdout read as **bytes**. It asserts the whole stream parses as one document, that the document is byte-identical to the report the same run wrote through `--out` (a file the test never touches), the seeded delta, and exit code 1. The hand-written body, the literal, and the `toEqual` against that same literal are gone.

I proved it's load-bearing by mutation: removing `withCleanStdout` from `tools/generate/src/cli/index.ts:810` turns it **red**. The production edit was reverted immediately — `git status` shows only the two test files modified.

Also added the `--multi-viewport --json` command-level test the Criterion names, end-to-end over a real starter site the command renders and serves itself.

**W1 (ac-edit)** — AC-1310's Criterion/Verification now say "one run per **text node**", matching the implementation and `bug25:282-287`; tests untouched.
**W2 (uat-add)** — added the pre-`surface` bundle test; 7/7 pass in that file.
**W3 (ac-edit + paired story-body-edit)** — trimmed the end-to-end crop-pair clause from AC-720 and from STORY-79's guarantee 3, citing the capability's own CLI ownership rule and REQ-78.

Fields: `AC-657.uat_coverage` → pass, `STORY-79.uat_coverage` → pass. Report: `report-5b3fe8e5` (REPORT-2398).

## Two deviations you should know about

- **The report's suggested W2 assertion was wrong.** "Assert no `shape`" would fail: with `surface` absent, `values-diff.ts:2116` falls back to the label's own `borderRadiusPx`, so the legacy `radius 8px → 0px` row fires — which *is* what inert means. The test asserts that instead (no surface-attributed rows, legacy row intact). Confirmed by running it.
- **The multi-viewport test is environment-gated.** It needs a loopback listener, and this sandbox denies `listen` (`EPERM ... 0.0.0.0` from `serve.ts:54`; the first run hung to a 180s timeout). It's gated on a probe in the same style as `chromiumAvailable()`, and AC-657 keeps an ungated command-level test on every runner. It needs confirming on a runner that may bind a port.

Regression sweep across 10 neighbouring capability files: 70 passed, 8 skipped, 0 failures. `tsc --noEmit --strict` clean on both changed files.
