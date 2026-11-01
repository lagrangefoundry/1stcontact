---
uid: report-c0e80833
id: REPORT-934
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=ac)'
created_by: xgd
created_at: '2026-07-24T09:57:41.364464+00:00'
updated_at: '2026-07-24T09:57:41.364464+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ce902be4
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capability Module Contract & Catalog
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

At `ac` level the story body (STORY-85) is the working reference; intent history
is consulted only to confirm the ledger and status. The capability tree resolves
to a single originating intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | Origin of STORY-85 + AC-697..704: the post-pivot capability-module contract (config/slots/conformance), instance validation incl. slot-as-L1 security line, reframed survivor capabilities (carousel, contact-form), shipped-client-JS asset, isolation conformance dimension | YES |

No later intent touches this capability's story or ACs: `updated_by` is null on
STORY-85 and on every AC (AC-697..704); ACs carry no independent `intent_uid`
(inherit from story). Nothing retired, nothing imminent.

## Alignment Ledger

Story body in-scope surface (STORY-85):
(1) capability contract config/slots/conformance; (2) instance validation incl.
slot-as-L1 security line; (3) the two survivor capabilities + observable
behaviour; (4) shipped-client-JS asset; (5) isolation conformance dimension.

| Element | Story surface aligned to | Outcome |
|---|---|---|
| AC-697 — config validated vs typed contract | (1) config, (2) instance validation | aligned — mirrors "config values checked against typed field specs" |
| AC-698 — slots validated as L1 subtrees (security line) | (1) slots, (2) slot-as-L1 security line | aligned — mirrors "every slot subtree must parse as a valid L1 node" |
| AC-699 — carousel L1-authored swipeable track from config | (3) carousel | aligned — mirrors pure-CSS scroll-snap, view, decorative dots, L1 slides, no aesthetic dials |
| AC-700 — carousel autoplay/loop as vetted client behaviour | (3) carousel, (4) client asset | aligned — mirrors "optional autoplay/loop" + defensive client.js |
| AC-701 — contact-form functional form + L1 intro/submit | (3) contact-form | aligned — mirrors field schema, a11y labels, honeypot+Turnstile, no-JS method=post, L1 intro/submit slots |
| AC-702 — client behaviour ships as one page-referenced asset | (4) shipped-client-JS asset | aligned — mirrors "render pipeline folds client.js into one page-referenced module script" incl. the closed 404 pipeline gap |
| AC-703 — isolation conformance discriminates | (5) isolation dimension | aligned — mirrors "misbehaving capability degrades inertly, never breaking page robustness"; render-level, no browser |
| AC-704 — declare full five-dimension conformance set | (1) conformance, (5) isolation | aligned — mirrors "universal ACs (safety/security/x-browser/responsive) plus isolation" = exactly 5 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-85 (Technical Context) | — | The version-pinned catalog/registry (`<id>@<version>` resolution; carousel v1→v2, contact-form v2→v3) appears only in Technical Context, not the explicit "In scope" behavioural list, so no AC asserts version-pinned resolution. This is an implementation mechanism, not a listed acceptance surface — not a coverage gap at AC level. | none |

## Notes for the Editor

- **Coverage** is complete: all five in-scope behavioural items map to ≥1 AC with
  no story-body behaviour left unaddressed.
- **Consistency** holds: each AC's criterion is derivable from the story body;
  ACs add faithful detail (e.g. AC-697's list-of-objects `itemSchema` recursion;
  AC-698's repeated-slot array bounds) without introducing behaviour the story
  does not support.
- **Exclusivity** holds: the two closest pairs are distinct scenarios, not
  duplicates — AC-699 (static track render + view + dots) vs AC-700 (autoplay/loop
  client behaviour); AC-700 (carousel behaviour correctness) vs AC-702 (build-level
  single-asset emission + once-per-page reference across all capabilities).
- The capability title includes "Catalog"; if the operator later wants
  version-pinned catalog resolution proven as an observable behaviour, promote it
  from Technical Context into the in-scope list and add an AC — tracked here as
  info, not a required fix.
