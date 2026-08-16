---
uid: report-97baa7a9
id: REPORT-2050
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface (level=uat)'
created_by: xgd
created_at: '2026-08-16T02:32:51.693485+00:00'
updated_at: '2026-08-16T02:32:51.693485+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

At uat level the AC bodies AC-1083 to AC-1094 are the working reference; intent was read to build the ledger and confirm nothing after REQ-129 retires or widens a behaviour a UAT asserts.

## Cumulative Intent Considered

STORY-106 (story-189fc1ac) is the only story under CAP-93; intent_uid bundle-e59210c5 (BUNDLE-17, free_and_reconciled, merged 0198704b7e29db3c53cf569070042cec0eb467bc). Its source ticket here is REQ-129.

| Intent | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the surface, error taxonomy, addressing (CAP-92); used unchanged | YES (prereq) |
| REQ-129 | free_and_reconciled | 2026-08-09 | Originating intent: describe_page over every node (path/kind/label, plus module/slot); verbatim get_l1; subtree-replacing set_l1; get_copy and set_copy retired; WriteCopy renamed AuthorPages; guarantee moved into the closed vocabulary; refusal specificity recorded as a known limit | YES |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond L1 (config, modules, metadata, assets); outside CAP-93 scope; surface_version 2 to 3 | YES (adjacent) |
| REQ-131 | ready_to_reconcile | 2026-08-11 | Draft change journal; no change to element read or replace | imminent |
| REQ-135 | free_and_reconciled | 2026-08-12 | Editor text properties (CAP-86/87); widens copyFieldsOf descriptors | YES (warning 2) |
| REQ-137 | bundled | 2026-08-12 | Palette shade on the reference; the shape AC-1085 reads verbatim | imminent |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |

Nothing in the ledger retires a behaviour a CAP-93 UAT asserts, and nothing adds an element-tree behaviour no UAT covers.

## Alignment Ledger

All 12 UATs are in tests/reconciliation-page-composition-surface.test.ts and all are substantive: real toolbox (toolbox.ts:466), real declaration (l1-surface.json), real draft bytes, real render, real /api/copy. Nothing mocked; no structural-only test.

| Element | Intents | Outcome |
|---|---|---|
| AC-1083 (:221) | REQ-129 | aligned - map compared to a walk written in the test (:169), not the notion the code holds of interesting nodes; order, address/kind/label, module+slot only inside instances, count closure |
| AC-1084 (:271) | REQ-129 | aligned - label rule per kind, control name taken off the stored instance; no axis name in the map; size-independence measured unstyled vs richly styled |
| AC-1085 (:362) | REQ-129 | aligned - ref stays a ref, keyframe track stays a track; target names page and path; scoped read names module and slot |
| AC-1086 (:410) | REQ-129 | aligned - acceptance asserted before unchanged-ness, as the AC demands; compared as structure |
| AC-1087 (:426) | REQ-129 | aligned - siblings and a second page byte-identical; count arithmetic closes the inserted-beside-it gap |
| AC-1088 (:469) | REQ-129 | aligned - declared sequence asserted, then map/read/replace, then a real render asserting both anchor targets, then removal |
| AC-1089 (:531) | REQ-129, DOC-2 | aligned - the six enumerated cases, each SCHEMA_INVALID, draft bytes identical after |
| AC-1090 (:556) | REQ-129 | aligned - code plus all three strategy statements; correctly does not assert the field name |
| AC-1091 (:575) | REQ-129 | aligned - NOT_FOUND with the remedy; malformed is SCHEMA_INVALID and not NOT_FOUND; bytes unchanged |
| AC-1092 (:602) | REQ-129, REQ-130 | aligned, warning 1 - exact set equality both directions; retired pair gone; AuthorPages declared, granted, covers set_l1 |
| AC-1093 (:679) | REQ-129, REQ-135 | aligned, warning 2 - real /api/copy on an assistant-authored subtree; axes byte-identical after the operator save |
| AC-1094 (:720) | REQ-129 | aligned - container returns 200 with empty fields and values, not a failure |

## Findings

| # | Severity | Property | Element | Category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1092, test file :620 | uat-edit | AC-1092 requires the retired PAIR absent from the manual; the test checks only set_copy there. get_copy is checked in the declaration (:613) and the tool list (:618) but not the manual, so a manual still describing the retired read half would pass | Assert the manual does not contain get_copy |
| 2 | warning | consistency | AC-1093, test file :691 | uat-edit | AC-1093 asks that the returned fields be the fields that kind exposes; the test asserts only the first field is text. The claim is indistinguishability from a hand-written node, so dropping the REQ-135 typography descriptors on assistant-authored nodes would still pass | Assert the full descriptor set for the kind, against copyFieldsOf or an equivalent hand-written node |
| 3 | info | exclusivity | FC REQ-129 suite vs this suite | - | Same scenarios in the same shape, but this is the repo-wide free-coded to reconciliation pattern and the reconciliation suite is strictly stronger | none |
| 4 | info | coverage | AC-1085 / REQ-137 | - | REQ-137 changes palette-reference shape; AC-1085 compares against its own seed so it will not break, but the shaded form is uncovered until REQ-137 reconciles | none |

## Notes for the Editor

- Passes: no violations, no needs_review. Both warnings strengthen assertions in existing tests; no new UAT, AC edit or production change needed.
- Both warnings share one shape: an assertion naming one instance where the AC names a set.
- No code-issue findings. Verified present: createL1Toolbox, l1Operations, L1_DECLARATION, L1_INSTANCES at toolbox.ts:466/239/64/69; get_l1 and set_l1 at l1-surface.json:145/212; AuthorPages at :457 granted at instances.json:6; the add-or-remove sequence and its no-separate-insert-or-delete note at :514. get_copy and set_copy appear nowhere in the declaration.
- Test execution was unavailable: the runner was denied by the session permission mode. Findings rest on static verification, each test body read in full against its AC verification clause and every asserted symbol confirmed in the sources above. No finding depends on a test outcome.
- surface_version is 3, not the 2 REQ-129 set, because REQ-130 bumped it. AC-1092 compares operation SETS rather than pinning a version, which is why it survived; preserve that.
