---
uid: comment-087e2b1d
id: COMMENT-1354
type: comment
title: Comment on capability CAP-101
created_by: xgd
created_at: '2026-08-20T17:58:11.234779+00:00'
updated_at: '2026-08-20T17:58:11.234779+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: capability-c4c7a854
  kind: note
---

# OPERATOR DECISION REQUIRED — uat-level repair is unactionable on this branch

**Raised by**: `fix_structural_validation` (level=uat), attempt 7 of 20
**Anchor**: REPORT-2485 (`report-2485c83c`) · **Latest check**: REPORT-2487 (`report-ac0a349a`)
**Status**: seven consecutive check passes, byte-identical findings, **zero** fixes applied across
six fix loops (REPORT-2476/2478/2480/2482/2484/2486 — the last three already declared
`progress_made=false`).

This comment exists because the escalation has so far lived only inside a chain of fix reports,
where it has not reached a decision. It is recorded on the capability itself so it is visible
without reading seven reports.

## The blocker, re-derived this pass

`regression-cb0dad9c` was cut **before the code under validation existed**.

| Fact | Value |
|---|---|
| branch point (`merge-base HEAD main`) | `0f44ef1ba` — 2026-08-20T00:43:02Z |
| port merged to `main` | `b18b859d7` — 2026-08-20T12:49:19Z (**12h06m later**) |
| `main` | `bda6c9939` (unmoved since REPORT-2485) |
| `tools/generate/src/store/` here | 8 modules |
| `tools/generate/src/store/` on `main` | 14 — adds `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal.ts`, `journal-model.ts` |

All eight actionable findings (1–8) are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. **Neither file, nor the
modules they import, exists in this tree.** Authoring them here would fail at import collection —
adding a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of
`xgd-stable`, red against *correct* code.

The check itself is sound and runnable here; only the **repair** has nowhere to land.

## Levers already tried and correctly rejected

- **Author the tests anyway** — red at collection, poisons the regression gate.
- **Set `uat_coverage` to manufacture movement** — that field belongs to
  `check`/`fix_uat_coverage`, not to this loop.
- **Resolve findings 1–2 by editing AC-1353 / AC-1354 instead** — the assessor categorized both
  `uat-add`; substituting a different lever would misreport the matrix as repaired.

There is no fourth lever on the fix side. **An eighth pass reproduces REPORT-2487 verbatim.**

## Why the loop has not self-terminated

The inner fix loop *is* signalling stuck correctly (`needs_more_work=true` +
`progress_made=false`, attempts 4–6). The outer `fix_uat_validation` → `check_uat_validation`
cycle nonetheless re-runs the check and re-enters the fix loop, so the stuck signal is consumed
without producing an escalation. Each cycle costs a full validation pass. This is noted for the
operator, not diagnosed here — the outer workflow is outside this prompt's scope.

## Decision needed — one of

- **(c) RECOMMENDED** — run `check_uat_validation` + `fix_uat_validation` for
  `capability-c4c7a854` on a branch at or past `b18b859d7`, where all eight findings are both
  actionable and runnable.
- **(b)** — scope `capability-c4c7a854` out of regression `cb0dad9c`. Note this only relocates the
  *repair*; the check's result here is sound and stands.
- **(a) LEAST ATTRACTIVE** — resync `regression-cb0dad9c` past `b18b859d7`. Makes the findings
  actionable here, but changes what the regression is testing mid-run.

## The eight findings, held for whichever branch takes them

Ordering recommended by the assessor: **4 first** (a deletion — it removes CAP-85/AC-1033's
evidence from inside CAP-101's), then **3** and **5** (extensions to existing tests), then **1**
and **2** (new tests, the largest authoring jobs). Warnings **6–8** are cheap once their host
tests are open.

| # | Sev | AC | Category | One-line |
|---|---|---|---|---|
| 1 | violation | AC-1353 | uat-add | No `test_UAT_AC1353_*`; substance exists only under the FC name `test_UAT_FC_REQ-142_site_store_port.test.ts:104,115`. Third bullet (fs adapter behind its own entry point) unasserted in either |
| 2 | violation | AC-1354 | uat-add | No `test_UAT_AC1354_*`; neither the single-construction-site claim nor the tool-adapter end-to-end claim asserted anywhere. Target `l1Operations(slug, {store})` at `ai/toolbox.ts:176`, **not** `createL1Toolbox` (which overrides `store` by design) |
| 3 | violation | AC-1321 | uat-edit | `asked` array carries 7 verbs against a totality claim covering 10; `appendChange` / `changesSince` / `pendingChanges` called by no test in the repo |
| 4 | violation | AC-1327 | uat-edit | `…test.ts:585-590` asserts the preview-freshness claim AC-1327 explicitly disowns and assigns to CAP-85 / AC-1033. Exclusivity breach — delete it and its `'Before'` scaffolding |
| 5 | violation | AC-1329 | uat-edit | The ac-level repair's fourth bullet (no behavioural assertion conditioned on runtime) is asserted nowhere |
| 6 | warning | AC-1328 | uat-edit | Bullets 3 and 4-compat are asserted inside AC-1329's test; bullet 2 only under an FC name |
| 7 | warning | AC-1325 | uat-edit | Shared body covers 4 of 8 enumerated items; the other 4 exist only inside AC-1324's memory-only test, so they prove over one adapter |
| 8 | warning | AC-1321 | uat-edit | `loadDraft`'s reported-errors branch unasserted — a `loadDraft` that *threw* would pass |

## Root cause of findings 1–5 (recorded so it is not re-derived)

Not the production code. The reconciliation UATs were frozen when BUNDLE-19 merged (`b18b859d7`,
12:49Z). The ac-level fix loop then ran 15:43–16:32 and **added AC-1353 and AC-1354, widened
AC-1321, narrowed AC-1327, widened AC-1329** — all after the tests were frozen. Findings 1–5 map
one-to-one onto those five edits. No `code-issue` was raised, deliberately: every suggested edit
is test-side, and every claim the ACs make is reachable from code already on `main`.
