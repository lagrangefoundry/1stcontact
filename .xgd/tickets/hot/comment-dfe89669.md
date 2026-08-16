---
uid: comment-dfe89669
id: COMMENT-1097
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T09:12:44.654537+00:00'
updated_at: '2026-08-16T09:12:44.654537+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-845f21a1
  kind: note
---

**REPORT-2098** (`report-845f21a1`) — **FAIL**: 4 violations, 4 warnings, 0 needs_review.

## What I found

Coverage is structurally complete — all 47 active ACs have a `test_UAT_AC<n>_*` test (AC-637 is now `lifecycle: deprecated` and excluded), and exclusivity is clean across the six multi-test ACs. Every finding is about **depth of evidence**, not absence.

**Violations:**
1. **AC-657** — the test never runs the command. It calls `withCleanStdout` directly, writes the JSON itself, then parses what it just wrote (`reconciliation-1c-cli-output-hygiene.test.ts:77,86`).
2. **AC-643** — passes `actualImagePath`, so `perceptual.ts:483`'s branch never runs and `viewport: opts.size` at `:493` is unexercised.
3. **AC-720** — covers only the `subRenderOptions` seam; the AC's end-to-end crop-pair clause is, per the test's own docstring, a manual check.
4. **AC-815** — the fixture has zero `overflow` declarations, so the `Math.min(docW, …)` clamp at `extract.ts:499` never runs; the "conventional band unchanged" assertion is absent.

Warnings: AC-658 and AC-639 (same seam-vs-command pattern), AC-631 (capture leg only browser-gated), AC-815's `itA` helper passing silently instead of skipping.

## Two things that changed since the last cycle

- **AC-637's deprecation resolved** the prior report's finding 9 — the second repair to land here, and the right one.
- **The AC-657 gap widened.** `index.ts` has moved (`734bf5db1`) and `values-diff` now has *two* `--json` emit paths (`:787` multi-viewport, `:815` single-width). AC-657's Criterion names both; neither is tested. I also corrected the remediation: the prior report suggested the in-process `runCli` harness, but that spies `console.log` and wouldn't catch a raw `process.stdout.write` — AC-738's `spawnSync` pattern is the faithful shape.

## Escalation worth your attention

This is attempt 7. `git log` over the five artifacts involved returns **no commit after `164dc05ab` (2026-08-05)** — across four consecutive reporting cycles, not one of these test files has been edited. Meanwhile two repairs *did* land in that window, both on ticket surfaces (AC-637's deprecation, STORY-76's body). Every unrepaired finding is categorized `uat-edit`/`uat-add`; every repaired one was `ac-*`/`story-body-edit`. That pattern suggests the downstream editor may not be writing to `tests/` at all, which is worth confirming before the next cycle — otherwise this level can't converge regardless of finding quality.
