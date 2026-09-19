---
uid: report-31d4da32
id: REPORT-787
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=ac)'
created_by: xgd
created_at: '2026-07-23T06:44:39.624986+00:00'
updated_at: '2026-07-23T06:44:39.624986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ce902be4
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Capability Module Contract & Catalog
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

CAP-72 has a single story (STORY-85, feature, completed), aligned to one
reconciled intent bundle. At `ac` level the story body is the working reference;
it is internally consistent, so no escalation to intent history was required.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9; REQ-63+REQ-79+REQ-82+REQ-83+REQ-84 +2) | free_and_reconciled | merged @ edeb1c2c | Framework pivot: layout → L1 substrate; module reframed as capability (vetted core + typed config + L1 slots + conformance incl. isolation); carousel v1→v2, contact-form v2→v3; shipped-client-JS asset | YES |

## Alignment Ledger

| Element | Aligned to | Outcome |
|---|---|---|
| STORY-85 (story-179b8c06) | BUNDLE-7 | aligned; in-scope list maps cleanly to the 8 ACs |
| AC-697 config-validation | BUNDLE-7 | aligned — follows story "typed field specs" surface |
| AC-698 slot-L1-security-line | BUNDLE-7 | aligned — the load-bearing structured-only security line |
| AC-699 carousel presentation/config | BUNDLE-7 | aligned — scroll-snap, view/dots, no aesthetic dials |
| AC-700 carousel autoplay/loop client | BUNDLE-7 | aligned — defensive client behaviour over static SSR baseline |
| AC-701 contact-form functional + L1 slots | BUNDLE-7 | aligned — but does not assert the JSON-fetch enhancement behaviour (see Finding 1) |
| AC-702 folded client asset | BUNDLE-7 | aligned — closes the 404'd island-script gap |
| AC-703 isolation conformance | BUNDLE-7 | aligned — inert-degrade pass + throwing-core discriminator |
| AC-704 five-dimension declaration | BUNDLE-7 | aligned — {safety, security, x-browser, responsive, isolation} |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-85 (contact-form) | ac-add | Story body lists contact-form's "JSON-fetch progressive enhancement" as kept functional behaviour. AC-701 covers only the no-JS `<form method=post>` baseline; AC-702 covers only that the enhancement *ships* in the folded asset. No AC asserts the enhancement's runtime behaviour (intercept submit → JSON fetch → in-place result). This is asymmetric with the carousel side, where AC-700 gives autoplay/loop a dedicated behavioural AC. | Author a behavioural AC for the contact-form progressive enhancement (submit interception, JSON POST, success/error handling, defensive no-JS fallback), paralleling AC-700 for carousel autoplay. |

## Notes for the Editor

- The warning is deliberately not a violation: the contact-form enhancement is
  genuinely *progressive* — the load-bearing path (no-JS `<form method=post>`
  baseline, honeypot, Turnstile, L1 validation) is covered by AC-701, and the
  enhancement's presence in the shipped asset is covered by AC-702. The gap is
  behavioural coverage of the enhancement when it runs, which is lower-criticality
  than the baseline. Close it opportunistically for parity with AC-700.
- No consistency violations: every AC's criterion follows from the story body,
  including the specific config vocabulary (`view: single/peek/multi`,
  `controls: dots`) that elaborates the story's "slides-per-view" / "decorative
  dots row" without contradicting it.
- No exclusivity violations: AC-699 vs AC-700 (static presentation vs client
  behaviour), AC-700 vs AC-702 (autoplay behaviour vs asset packaging), and
  AC-703 vs AC-704 (isolation behaviour vs contract enumeration) are distinct
  criteria, not duplicates.
- The catalog/registry/`<id>@<version>` resolution mechanics appear only in the
  story's Technical Context, not its "In scope" list, so the absence of a
  dedicated AC for version resolution is correct, not a gap.

