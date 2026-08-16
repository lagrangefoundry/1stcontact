---
uid: report-c10a21cb
id: REPORT-2051
type: report
title: 'UAT Coverage: Page Authoring Through The Control Surface: Read & Replace The
  Element Tree'
created_by: xgd
created_at: '2026-08-16T02:40:24.965710+00:00'
updated_at: '2026-08-16T02:40:24.965710+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-fe236246
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: Page Authoring Through The Control Surface: Read & Replace The Element Tree

**Result**: PASS
**AC verdicts**: 12 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

CAP-93 has one story (STORY-106, story-189fc1ac) carrying AC-1083..AC-1094. All twelve
UATs live in `tests/reconciliation-page-composition-surface.test.ts` (737 lines, one `it`
per AC, matching `test_UAT_AC<n>_*`). Nothing is mocked: the real toolbox
(`createL1Toolbox`, `l1Operations`, `L1_DECLARATION`, `L1_INSTANCES` in
`tools/generate/src/cli/ai/toolbox.ts`), the real declaration
(`tools/generate/src/cli/ai/l1-surface.json`), the draft's bytes on disk, a real
`cmdRender`, and a real builder answering `/api/copy` over the transport the browser uses.

## Cumulative Intent Considered

STORY-106's `intent_uid` is bundle-e59210c5 (BUNDLE-17, `free_and_reconciled`, merged at
`0198704b7e29db3c53cf569070042cec0eb467bc`). Its source ticket for this capability is
REQ-129; the rest of the bundle (REQ-119/121/122/126/127/128/130) is adjacent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the control surface, error taxonomy, addressing contract (CAP-92). Used unchanged by this capability | YES (prereq) |
| REQ-128 | free_and_reconciled | 2026-08-08 | Container `backgroundImageUrl` in the click-to-edit picker — makes a *painted* container editable | YES (warning 3) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **Originating intent.** `describe_page` widened to every node (`path`/`kind`/`label`, plus `module`/`slot` when scoped); verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired; `WriteCopy` renamed `AuthorPages`; the no-markup guarantee relocated into the closed vocabulary; refusal specificity recorded as a known limit | YES |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond L1 — config, module instantiation, page metadata, generated assets. Outside CAP-93's scope; bumped `surface_version` 2 to 3 | YES (adjacent) |
| REQ-131 | ready_to_reconcile | 2026-08-11 | Draft change journal; instruments the `edit.ts` chokepoint. Does not change element read or replace | imminent, no effect |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-135 | free_and_reconciled | 2026-08-12 | Editor text properties (CAP-86/87) — widens `copyFieldsOf` descriptors beside the copy field | YES (warning 2) |
| REQ-137 | bundled | 2026-08-12 | Palette: continuous `shade` on the reference replaces named steps — the shape AC-1085 reads verbatim | imminent |
| REQ-139 | ready_to_reconcile | 2026-08-12 | Editor locks unfaithful controls; changes descriptor state, not the assistant's reach | imminent, no effect |
| REQ-140 | ready_to_reconcile | 2026-08-15 | Background *colour* on a painted `box`/`container` segment — further widens what the operator's form edits | imminent (warning 3) |

Nothing after REQ-129 retires a behavior any CAP-93 AC asserts, and nothing adds an
element-tree behavior no AC covers. The later editor intents (REQ-128/135/139/140) widen
the *operator's* form, which AC-1093/AC-1094 deliberately do not enumerate.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-106 | REQ-129 (originating); REQ-126, REQ-130 adjacent; REQ-128/135/139/140 on the CAP-86/87 edge it must leave working | aligned | Every story-body claim maps to an AC: the map (AC-1083/1084), the verbatim read (AC-1085), the bounded replace (AC-1086/1087/1088), one way to change a page (AC-1092), the guarantee relocated into the closed vocabulary (AC-1089/1090/1091), the operator's gesture untouched (AC-1093/1094). The two recorded divergences — degraded refusal specificity, the vestigial navigation setting — are asserted as the mitigation (AC-1090) and correctly carry no AC |

Per-AC evidence:

| AC | Test (line) | Judgment |
|---|---|---|
| AC-1083 | `:221` | pass — map compared against a walk written in the test (`:169`), not against the code's own notion of an interesting node; order, address/kind/label, `module`+`slot` only inside instances, and a count closure so nothing is emitted twice or in neither space |
| AC-1084 | `:271` | pass — label rule asserted per kind, the control's label read off the stored instance rather than a fixture; every seeded axis name asserted absent from the serialised map; size-independence *measured* (unstyled map byte-equal to the richly styled one) |
| AC-1085 | `:362` | pass — palette `ref` still a `ref`, keyframe track still a track; `target` names page and path; a scoped read names `module` and `slot` and is compared to the stored slot subtree |
| AC-1086 | `:410` | pass — acceptance (`changed: ['0']`) asserted *before* unchanged-ness, exactly as the AC demands, then whole-page structural equality |
| AC-1087 | `:426` | pass — differently-shaped replacement; siblings and a second page byte-identical; element-count arithmetic closes the inserted-beside-it gap; reply names the address |
| AC-1088 | `:469` | pass — declared sequence and its "no separate way to insert or delete" note asserted, then map to read to replace, then a real `cmdRender` asserting both anchor targets in the published bytes, then removal restoring the child count |
| AC-1089 | `:531` | pass — the six enumerated cases (raw markup, raw stylesheet, `javascript:` link, `javascript:` image src, undeclared kind, wrong-typed axis) each `SCHEMA_INVALID`, draft bytes identical afterwards |
| AC-1090 | `:556` | pass — code plus all three strategy statements; correctly does not assert a field name the tool layer cannot deliver |
| AC-1091 | `:575` | pass — `NOT_FOUND` with the re-read remedy; a malformed address is `SCHEMA_INVALID` and explicitly not `NOT_FOUND`; bytes unchanged after both |
| AC-1092 | `:602` | pass (warnings 1, 4) — declared/implemented set equality in both directions; retired pair absent from declaration, tool list and (for `set_copy`) the manual; invoking it answers unknown/not-enabled; `AuthorPages` declared, granted, and covering `set_l1` |
| AC-1093 | `:679` | pass (warning 2) — real `/api/copy` GET and POST against a running builder, on a subtree the assistant authored through `set_l1`; the assistant's `axes` byte-identical after the operator's save |
| AC-1094 | `:720` | pass (warning 3) — an assistant-composed container answers 200 with an empty field list and empty values, a "nothing to edit" rather than a failure |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1092 (test `:620`) | uat-edit | AC-1092 requires the retired **pair** absent from the manual; the test checks the manual for `set_copy` only. `get_copy` is checked in the declaration (`:613`) and the tool list (`:618`) but not the manual, so a manual still describing the retired read half would pass | Add `expect(box.manual()).not.toContain('get_copy')` |
| 2 | warning | uat | AC-1093 (test `:691`) | uat-edit | AC-1093 asks that the returned fields be the fields that kind exposes; the test asserts only that `fields[0].name === 'text'`. Since the claim is indistinguishability from a hand-written node, dropping REQ-135's typography descriptors on assistant-authored nodes would still pass | Assert the full descriptor set for `text`, against `copyFieldsOf` or an equivalent hand-written node |
| 3 | warning | ac | AC-1094 | ac-edit | The criterion is worded by **kind** ("an element of a kind it does not edit"), but `copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:735`) keys on node *state*: a container carrying `backgroundImageUrl` does expose a field (REQ-128), and REQ-140 adds background colour on a painted container. The test authors an unpainted container, so it is correct today; the wording will read as retired once REQ-140 reconciles | Reword to "an element that carries no editable field" (state, not kind); keep the test's unpainted container |
| 4 | warning | uat | AC-1092 (test `:632`) | uat-edit | "Exactly one way to change what is on a page" is proven only by set equality plus `AuthorPages` *containing* `set_l1`. A second page-writing operation, declared and implemented, would pass. The declaration's own absence entry ("Replacing a whole page in one call") — which the story body lists as deliberately absent — is likewise unasserted | Assert `AuthorPages.operations` equals `['set_l1']` exactly, and that the declared absences still name the whole-page write |

## Notes for the Editor

- **Passes**: zero violations, zero needs_review. All four findings are warnings and none
  requires a new AC, a new UAT or any production change — three tighten assertions inside
  tests that already exercise the right entry points, one is a wording fix on an AC body.
- Findings 1, 2 and 4 share one shape: **an assertion naming one instance where the AC
  names a set** (one half of a retired pair; one field of a descriptor list; one member of
  a group). A single pass over `test_UAT_AC1092` / `test_UAT_AC1093` closes all three.
- Finding 3 is the only one with a deadline attached: it becomes materially wrong when
  REQ-140 (`ready_to_reconcile`) reconciles, so fix it in the same pass rather than waiting
  for the drift to surface as a violation.
- **Test execution was unavailable** — the runner was denied by this session's permission
  mode (`npx vitest run` refused, as was a batching shell loop). Every judgment here is
  static: each test body was read in full against its AC's Verification clause, and every
  symbol it leans on was confirmed in the sources — `createL1Toolbox` / `l1Operations` /
  `L1_DECLARATION` / `L1_INSTANCES` in `toolbox.ts`; `get_l1`, `set_l1`, `AuthorPages` and
  the add-or-remove sequence with its "no separate way to insert or delete" note in
  `l1-surface.json`; `AuthorPages` in `instances.json`; `copyFieldsOf` returning `null` for
  an unpainted container in `packages/site-schema/src/l1/edit.ts:735`. `get_copy` and
  `set_copy` appear nowhere outside test files. No verdict here depends on a test
  *outcome* — pass/fail is `check_uat_validation`'s question, and it reported done on this
  branch.
- `.xgd/uat_index.json` is **empty** (`acs: {}`, 67 bytes) on this branch, so the
  prescribed index lookup returns nothing for every AC. Tests were located by grepping
  `test_UAT_AC10(8[3-9]|9[0-4])` instead. Worth regenerating the index before the next
  coverage round, or every capability will look uncovered to a tool that trusts it.
- `surface_version` is 3, not the 2 REQ-129 set, because REQ-130 bumped it. AC-1092
  compares operation **sets** rather than pinning a version, which is why it survived that
  bump — preserve that property when acting on finding 4.
