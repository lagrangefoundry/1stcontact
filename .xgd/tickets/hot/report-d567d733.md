---
uid: report-d567d733
id: REPORT-2049
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface (level=ac)'
created_by: xgd
created_at: '2026-08-16T02:17:36.453016+00:00'
updated_at: '2026-08-16T02:17:36.453016+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

CAP-93 has one story, STORY-106 (story-189fc1ac, story_kind=feature), intent_uid
bundle-e59210c5, no updated_by chain. No AC carries its own intent_uid/updated_by, so the
ledger is one intent deep. The constituent REQ tickets were consumed into the bundle,
whose body carries their full text and is the intent ticket of record.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled, result=pass | 2026-08-10, merged at 0198704b7e29db3c53cf569070042cec0eb467bc | Bundles REQ-119/122/121/126/128/127/129/130 | YES |
| - REQ-129 (verbatim get_l1/set_l1) | in bundle | same | THE DRIVING INTENT: describe_page widened to every node as {path,kind,label}+{module,slot}; get_l1 verbatim subtree; set_l1 subtree replace; get_copy/set_copy retired; group WriteCopy to AuthorPages + grant; HTML/CSS/JS guarantee moved onto L1's closed schema; refusal-specificity divergence recorded | YES |
| - REQ-126 (L1 control surface API) | in bundle | same | CAP-92's intent: addressing contract, error taxonomy, argument checking, all inherited unchanged; bounds what CAP-93 may claim | YES (boundary) |
| - REQ-122 (chat panel tool surface) | in bundle | same | Session tool list + manual that AC-1092 asserts the retired pair is absent from | YES (context) |
| - REQ-130 (beyond L1: config, modules, metadata, assets) | in bundle | same | The next tier out; precisely CAP-93's declared out-of-scope | YES (bounds scope) |
| - REQ-119/121/127/128 | in bundle | same | Render-time move, modal chrome, tooling config, image picker; no bearing here | YES, not implicated |

**Cumulative picture.** One reconciled intent (REQ-129) is fully live; nothing retires any
behavior CAP-93 claims. REQ-129 itself retires the get_copy/set_copy pair and two stale
declaration absences; neither the story body nor any AC still describes those as
available, and the retirement is asserted positively by AC-1092.

## Alignment Ledger

At ac level the story body is the working reference; intent was consulted only where it
was terse (the whole-page-submission bullet, the declaration changes).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1083 map returns every element incl. containers | REQ-129 (walkSegments no longer filters on copyFieldsOf) | aligned |
| AC-1084 label identifies without reproducing; no styling in map | REQ-129 (Segment.values to Segment.label; no axes reach the model) | aligned |
| AC-1085 verbatim read, unresolved | REQ-129 (palette refs stay refs, responsive tracks stay tracks) | aligned |
| AC-1086 read then write-back accepted, page unchanged | REQ-129 (round-trip UAT incl. assert-accepted caveat) | aligned |
| AC-1087 replace whole subtree, siblings untouched | REQ-129 (replaceL1Node / editL1Set) | aligned |
| AC-1088 add/remove as group replace; result renders | REQ-129 (nav-bar acceptance UAT; REQ-106 link roles render as anchors) | aligned; carries half the bounded-payload claim (Finding 1) |
| AC-1089 off-vocabulary element refused whole, draft byte-unchanged | REQ-129 (six measured refusals) | aligned; all six correspond one-for-one |
| AC-1090 refusal states nothing written + what to do | REQ-129 (Toolbox._renderHostError upstream finding) | aligned; asserts the mitigation, not the absent fix |
| AC-1091 not-found / malformed address refused | REQ-129 (bad address); addressing is REQ-126's | aligned (Finding 3) |
| AC-1092 one way to change a page; declared == implemented | REQ-129 (retirement, AuthorPages); REQ-126/122 | aligned (Findings 1, 2) |
| AC-1093 click-to-edit opens/saves on AI-composed element, styling survives | REQ-129 (modal invariant 1, over /api/copy) | aligned |
| AC-1094 click-to-edit exposes no fields on a kind it does not edit | REQ-129 (modal invariant 2) | aligned |

**Coverage sweep of the story's in-scope bullets.** Where is everything to AC-1083/1084;
read one element as it stands to AC-1085; replace one element to AC-1086/1087/1088 (+1091
for the empty address); one way to change a page to AC-1092; where the security guarantee
now lives to AC-1089/1090; operator gesture untouched to AC-1093/1094. Every bullet
addressed. Both recorded divergences handled correctly: the refusal-specificity limit is
asserted as the mitigation it is (AC-1090); the vestigial nav key correctly carries no AC.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1088 + AC-1092 | ac-add | STORY-106 states in scope "no separate insert or delete, and no way to submit a whole page in one call", repeated under Out of scope. REQ-129 made this a positive declaration artifact: stale absences deleted, "a new absence records that whole-document submission is deliberately absent". AC-1088 asserts the first clause verbatim and drops the second. AC-1092 covers the behavioural half (a single operation, plus declared-set == implemented-set equality, excludes a second whole-page operation) but no AC asserts the declaration NAMES whole-document submission among its absences | Extend AC-1092's verification to assert the declared absences include whole-document submission; or record that CAP-92 AC-1080 discharges it and leave CAP-93 unchanged |
| 2 | info | exclusivity | AC-1092 vs CAP-92 AC-1073 | - | AC-1092's middle paragraph restates AC-1073 near-verbatim, verification included. Not a within-story exclusivity issue, and load-bearing: set equality is how "the retired pair appears in neither" is proven | none; removing it would weaken AC-1092 |
| 3 | info | consistency | AC-1091 | - | The malformed-address sentence brushes CAP-92 AC-1076's argument checking, which STORY-106 disclaims as CAP-92's and unchanged. Defensible: the asserted property is "refused as malformed rather than resolved to some nearby element", which is CAP-93's own address-resolution semantics | none |
| 4 | info | consistency | AC-1090 | - | Asserts the mitigation that exists rather than the fix that does not, matching the story's recorded divergence and REQ-129's upstream finding, and says so in the criterion body | none |
| 5 | info | exclusivity | AC-1089 + AC-1090 | - | Share a stimulus (mistyped typed-property value) but assert different properties: refusal + byte-unchanged draft versus the refusal message's recovery strategy. Not duplicates | none |
| 6 | info | coverage | STORY-106 Technical Context | - | CAP-93's capability body lists the shared all-or-nothing write path under Scope with no CAP-93 AC asserting it. Correct: the story demotes it to Technical Context ("no new validation was written") and CAP-92 AC-1082 asserts it directly | none |

## Notes for the Editor

**Finding 1 is the only actionable item, and it is a judgment call, not a defect.** The
bounded-payload guarantee appears three times across the capability and story bodies. Its
behavioural half is covered by AC-1092; its declaration half (the absence entry REQ-129
added, which is what a consumer is shown) is asserted nowhere in CAP-93. Before adding an
AC, check whether CAP-92 AC-1080 discharges it: AC-1080 asserts the manual states declared
absences by name, but names only the HTML/CSS/JS absence specifically. If AC-1080 covers
it generically, the right edit is a cross-reference note on AC-1092, not a new AC.

**Cross-cutting pattern, recorded rather than flagged.** AC-1089/1090/1091 each re-assert
properties CAP-92 owns generically (byte-unchanged draft and code-plus-meaning in AC-1077,
argument checking in AC-1076). This is not duplication: STORY-106 makes the security
relocation "measured, not asserted", so re-measuring against these specific element-tree
payloads is the substance of CAP-93. Do not collapse them into CAP-92.

**Declaration-side items deliberately not raised as CAP-93 gaps.** REQ-129 also bumped
surface_version 1 to 2, rewrote the sequences, and changed roles.ts's preamble. The version
bump is CAP-92 AC-1072's; preamble and absences are CAP-92 AC-1080's; the sequences are
asserted by AC-1088.

**Level-cascade note.** Per the cascade rule this check assumed STORY-106's body is
aligned to intent. That held under spot-checking: every in-scope bullet traces to REQ-129's
"What was built", and both recorded divergences appear in REQ-129 verbatim. No evidence
forced escalation to the story level.
