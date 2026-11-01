---
uid: report-2ce76b72
id: REPORT-7578
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-01T11:51:03.670286+00:00'
updated_at: '2026-11-01T11:51:03.670286+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-e674c60a
  mode_override_uid: report-012b2e49
  parent_report_uid: report-e5febd9c
  batch_index: 0
  attempt: 2
  findings: []
---

# Override conformance

- Item 1 (named files only): PASS. `unnamed_files_touched` is empty. The only production file changed since granted_head 6a28909362 is tools/generate/src/cli/ai/ledger-core.ts, the one file the override names. The other changes are tests, test support, and AC/story tickets, which are outside the scope of code_frozen.
- Item 3 (consistent with intent/AC): PASS. AC-960: the scope literal `@lagrangefoundry/ai-ticketing` is removed from the JSDoc. AC-967 (acceptance_criterion-92c52943): the failing-listing claim and its verification sentence are removed, a note cites the fix_plan, and nothing new asserts that a failure empties the pane. story-e674c60a gains a correction withdrawing clause (c). In business-scope.test.ts only the failing-listing step is deleted (plus its `failNext` plumbing); every other assertion is kept. AC-964/AC-1400: the throwing DB proxy is replaced with a real local D1 (applyLocalD1Schema + seedIdentity), R2 stays unreachable, and the doc comments now say the routes touch D1 for admission only. The TENANT_ID '' probe now points at a configured tenant with no account row. The refusal assertion and the no-artifact-in-place-of-a-route assertions are kept.
- Item 4 (within planner's stated scope): PASS. Every edit falls under one of plan items (1) to (4). The AC-975 browser leg now fails loudly instead of warning and passing, as the plan asked.
- Item 5 (trust boundary): PASS. `trust_boundary_touched` is false and `trust_boundary_mismatch` is false.
- Item 6 (code_frozen, rung 2): PASS. The diff to ledger-core.ts changes only lines 17-18 of a JSDoc and no code token. The reference state (xgd-working:tools/generate/src/cli/ai/ledger-core.ts:17-18) reads "The shared `ai-ticketing` component already declares `TicketAppendBody` and `TicketUpdate`", and the batch has the same wording. No behaviour, branch, error handling or API is added. apps/control-app/src/builder/app.js is untouched, as the override required.

Notes (not findings):
- tests/support/local-d1.ts adds a `localD1()` helper that uses wrangler `getPlatformProxy` over the same wrangler.toml and persist directory. The plan said to use local D1 "from tests/support/local-d1.ts". This is a second way to reach the same database, not a second schema or a stub store. It also sets WRANGLER_REGISTRY_PATH to a temporary directory for the duration of the call.
- For AC-975 the batch also changed `waitUntil: 'networkidle'` to `'load'` + `waitForSelector('.builder-panel__frame')`, and added a third launch attempt with `--single-process --no-zygote --disable-gpu`. The plan did not spell these out, but they are test-only changes made so the measurement can actually be taken under the sandbox (plan item 4: confirm AC975 passes). They do not weaken the height assertions. The final review should check that a single-process Chromium still gives a real layout measurement.