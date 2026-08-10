---
uid: report-8cf89ae5
id: REPORT-1751
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=uat)'
created_by: xgd
created_at: '2026-08-10T08:08:17.155075+00:00'
updated_at: '2026-08-10T08:08:17.155075+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-69e94af9. Previous attempts: 3.

Level is `uat`, so **AC bodies are the working reference**. Every one of the 36
ACs was read in full and compared against the body of the test claiming it; the
intent ledger below is recorded as the drift-prevention artifact, but no finding
rests on intent-history interpretation — no AC was found internally inconsistent
or ambiguous enough to force escalation.

All four suites were executed, not merely read. **35 of 36 UATs pass; 1 skips**
(AC-871, browser-gated — see the warning).

## Cumulative Intent Considered

Every story carries a bundle or request as `intent_uid`; all resolve to
`free_and_reconciled` (verified directly, not inherited from the prior report).

| Intent ID | UID | Status | Merged | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-11 → REQ-101 | bundle-ee56a66e | free_and_reconciled | f9a415a8 | Font provenance record + `1c fonts check`, four violation kinds, three-state redistribution, distribution marker → STORY-92 | YES |
| BUNDLE-11 → REQ-102 | bundle-ee56a66e | free_and_reconciled | f9a415a8 | `1c new` seeds a complete valid L1 document; render+shot immediately; repro overwrites; no flag/mode → STORY-93 | YES |
| BUNDLE-14 → REQ-114 | bundle-0385746c | free_and_reconciled | cd8f98c8 | Palette colour model + retrofit of existing sites; retires the theme colour group → STORY-97, and `updated_by` on STORY-93 | YES |
| REQ-118 | request-66e4c630 | free_and_reconciled | b2b9208c | Union asset listing over registry + `draft/assets/`, one handle vocabulary, CLI + builder origin → STORY-102 | YES |

## Alignment Ledger

All four stories are `story_kind: feature`; all 36 ACs are `status: active`
(no deprecated or archived ACs exist under any of them). Exactly one UAT per AC —
no AC carries a duplicate test, and no two tests exercise the same scenario in
the same shape.

| Element | Test | Outcome |
|---|---|---|
| STORY-102 — AC-1018…AC-1023 (6) | `tests/reconciliation-site-asset-listing.test.ts` | **aligned**. All 6 drive the real CLI (`run(['asset','list',…])`) and, for AC-1023, the real builder origin over HTTP plus the builder's own `fetchAssets` client. AC-1018 undeclared-file union, AC-1019 declared/no-file merge (one entry per handle), AC-1020 handle normalisation incl. the off-site absolute-URL boundary, AC-1021 kind derivation with no narrowing, AC-1022 no-editing-gesture + empty-is-success, AC-1023 two ways in + 400 on missing slug. All pass. |
| STORY-92 — AC-857…AC-868 (12) | `tests/reconciliation-font-provenance.test.ts` | **aligned**. Every test drives `cmdFontsCheck` / `run(['fonts','check'])` against real on-disk workspaces. Each of the four violation kinds is asserted by kind, message and remediation; AC-861 varies only the two gate inputs and covers all four cells; AC-864 covers all four record-integrity failures and asserts non-zero exit and absence of `PASS`; AC-867 runs against the repo as it stands with non-zero counts, honouring the AC's "not a pass that could have come from finding nothing". All pass. |
| STORY-97 — AC-932, AC-939…AC-947 (10) | `tests/reconciliation-colour-census-and-retrofit.test.ts`, `…-colour-palette-overlay.test.ts` (AC-932) | **aligned**. All drive the real `colors` CLI against seeded/repro'd sites. AC-944 proves byte-identical render before/after **and** independently that every reference resolves back to the exact literal; AC-945 asserts byte-identical file trees via `hashTree` for all three refusal causes; AC-946 proves rename-changes-names-only by diffing against the un-renamed palette; AC-947 proves re-runnability. AC-932's pinned counts (16→6, 30→8) are mandated verbatim by its own AC body, so they are faithful rather than brittle. All pass. |
| STORY-93 — AC-869…AC-876 (8) | `tests/reconciliation-scaffold-starter-l1.test.ts` | **aligned**. All read artifacts back off disk rather than recomputing from the scaffold function. AC-870 asserts on `<body>` specifically (the slug is also in `<title>`, so a whole-document match would pass on an empty body) and ties the rendered colour to the seeded one. AC-873 correctly reflects REQ-114's retirement of the theme colour group. AC-875 runs the shipped `1c` launcher as a subprocess for the documented-usage half. 7 pass; **AC-871 skips** (see warning). |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-871 (acceptance_criterion-b17420aa) / `tests/reconciliation-scaffold-starter-l1.test.ts:177` | — (environment provisioning, not matrix drift) | AC-871's sole UAT is `itB = it.runIf(browserOk)` and **did not execute** in this worktree: `engineAvailable('chromium')` returns false because the installed `playwright` expects `chromium_headless_shell-1228` while the local cache holds `-1234`. The criterion is therefore unproven in this regression environment. This is **not** drift: AC-871's own body sanctions the gate ("Requires a headless browser; the check is gated on browser availability"), the test is substantive when it runs (drives `cmdShot` — render, serve, capture — and asserts the PNG signature, not mere file existence), and the same gate is a repo-wide convention across 20+ suites | No matrix or test change. Provision the engine (`npx playwright install --with-deps chromium`) so the regression run proves AC-871 rather than skipping it |
| 2 | info | exclusivity | AC-932 UAT vs AC-941 / AC-944 UATs | — | AC-932's test shares two claims with AC-941 (materially-smaller palette) and AC-944 (colour losslessness), mirroring the open ac-level violation in report-34f54ad3. It is **not** a uat-level exclusivity violation: the three differ in fixture and shape — AC-932 against the two real stored sites with the counts its AC pins, AC-941 against a sandbox-seeded site measuring counts dynamically, AC-944 against a synthetic repro'd site proving byte-identical render. AC-932's test also carries the one claim no other test makes: the zero-colour no-op over `1stcontact` and `harbor-cafe` | none at this level — but see Notes |
| 3 | info | consistency | all 36 ACs | — | Every test exercises the behaviour its AC claims, at the real entry point. No structural/AST-only test, no internal mocking; the only test doubles are `console` spies for output capture and `process.chdir` for cwd-scoped commands — both output/observation shims, not internal component substitutes | none |

## Notes for the Editor

**Forward dependency on the open ac-level finding.** report-34f54ad3 (level=ac,
FAIL) proposes narrowing AC-932 to its one non-duplicated criterion — the
zero-colour vacuous retrofit — and moving the "materially smaller" and
"colour-lossless" claims to AC-941 and AC-944, which already own them. If that
edit is applied, `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours`
must be narrowed in step: its first loop (the two stored sites, the pinned
16→6 / 30→8 counts and the painted-colour multiset comparison) would become
evidence for ACs it no longer belongs to, leaving only the second loop (the
`1stcontact` / `harbor-cafe` no-op). The test name should change with it. This is
recorded here so the uat level is not re-derived from scratch after the ac-level
repair — **this uat level passes as the matrix currently stands.**

**Evidence quality is uniformly high across this capability.** Notable patterns
worth preserving if these tests are edited: several UATs guard explicitly against
vacuous passes (AC-932 asserts the site paints >0 colours before comparing;
AC-867 asserts non-zero counts; AC-947 asserts literals exist on arrival), and
AC-870 deliberately asserts on `<body>` rather than the whole document. Those
guards are load-bearing — a well-meaning simplification would silently hollow
them out.

**AC-932's test file placement.** AC-932 lives in
`tests/reconciliation-colour-palette-overlay.test.ts` alongside AC-928…AC-931,
which belong to STORY-80 in the framework-substrate capability (CAP-70), while
its nine sibling ACs live in `…-colour-census-and-retrofit.test.ts`. That split
is coherent — AC-932 is the retrofit's palette-shape claim and sits with the
palette-model tests — but it is worth knowing when tracing this capability's
evidence, since a file-scoped search for STORY-97's UATs will miss it.
