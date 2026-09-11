---
uid: report-44159af4
id: REPORT-3895
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=uat)'
created_by: xgd
created_at: '2026-09-11T03:35:06.291726+00:00'
updated_at: '2026-09-11T03:35:06.291726+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability CAP-94 (capability-2d32662d), one story
(STORY-107 / story-b3de4571, `story_kind=feature`, `intent_uid=bundle-e59210c5`),
15 active ACs (AC-1095 … AC-1109) plus AC-1650 (`pending`, created 2026-09-11 by the
story-level fix this session). 15 AC-named UATs in
`tests/reconciliation-beyond-l1-authoring.test.ts`; AC-1650 is evidenced by a named
test in `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts`.

**Method note — the suite was EXECUTED this time.** The three prior sessions
(report-aabaf2e1, report-f700fb44, report-c461de60) each recorded that they could not
run the file. This session ran it:

```
npm test -- tests/reconciliation-beyond-l1-authoring.test.ts --reporter=verbose
→ Test Files 1 passed (1) · Tests 15 passed (15) · 891ms
```

All fifteen `test_UAT_AC1095…AC1109` tests pass, each in 3-22 ms, including the three
that drive a real `cmdRender` and assert on emitted HTML. The static justifications
recorded in report-c461de60 findings 2-4 are therefore now backed by a green run — the
one item that report left open is closed.

AC-1650's evidence test could **not** be run here: it calls `startBuilder`, and the
sandbox refuses `listen EPERM 0.0.0.0` (`tools/generate/src/cli/builder.ts:363`). That
is an environment limit, not a matrix finding (see finding 5).

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference; the `ac` cycle ran and passed
earlier today (report-2544b1fd, 2026-09-11T03:24, 0 violations), and the `story` cycle
before it (report-0f0d51b9, 03:17, 0 violations). The ledger is carried forward for
continuity rather than re-derived.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | The declared control surface this story builds on — owned by another capability | YES (dependency) |
| REQ-129 | free_and_reconciled | 2026-08-09 | Element-tree authoring (`get_l1` / `set_l1`) — owned by another capability | YES (dependency) |
| REQ-130 (request-ed6ba145) | free_and_reconciled | 2026-08-09 | Beyond L1: structured settings, component instantiation, page metadata, generated drawings — the whole of this capability | YES |
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | 2026-08-10 | Bundle carrying REQ-130 to main (`merged_at_commit` 0198704b); `STORY-107.fields.intent_uid` | YES |
| REQ-137 (request-d2980a95) | free_and_reconciled | 2026-08-12 | L1 palette: `shade` on the reference replaces named steps — reshaped a palette entry, which is why AC-1095/AC-1097's Verification wording was re-written on 2026-09-11 (commits 1c6523cc55, c6bab78938) | YES (consequential) |
| REQ-117 / REQ-118 | free_and_reconciled | — | The click-to-edit modal's own contract (`/api/copy`) — owned by another capability; AC-1650 claims only the consequence of this story's "ordinary page content", not the contract | YES (dependency) |

No retired, abandoned or imminent intent touches this capability. No `updated_by` chain
on the capability, the story or any AC; the 2026-09-11 edits to STORY-107's body,
AC-1095, AC-1097 and the creation of AC-1650 are this session's own story/ac fix cycles,
not new intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 → test_UAT_AC1095 (`reconciliation-beyond-l1-authoring.test.ts:160`) | REQ-130, REQ-137 | aligned — whole palette in one call, single-entry merge with all four siblings asserted, deeper-than-one-level merge shown on `theme.typography`, list-replaces with the scalar sibling still merged. The AC's re-worded Verification (entries, not families/steps; the typography depth case) is exactly what the test now does. **Executed: pass (16 ms)** |
| AC-1096 → test_UAT_AC1096 (`:201`) | REQ-130 | aligned — no-`key` write merges at top level with pre-existing top-level settings and `theme` intact; the observable refusal (`/must be an object/i`) asserted with byte-identity; the advised group-plus-object form then proven actionable. Hint clause remains unobservable at either boundary — see finding 2. **Executed: pass (3 ms)** |
| AC-1097 → test_UAT_AC1097 (`:248`) | REQ-130, REQ-137 | aligned — a palette entry whose colour is not hex (`{accent:{value:'cornflower'}}`) is `SCHEMA_INVALID`, site bytes identical, `get_config` shows the prior group with no `accent` key. Matches the AC's re-worded example. **Executed: pass (4 ms)** |
| AC-1098 → test_UAT_AC1098 (`:279`) | REQ-130 | aligned — kind, version, required config fields, list item shape, seams, controls, default-look flag; closed set refused `NOT_FOUND` at the surface and, at the CLI envelope, enumerating every catalog kind plus the "developer" hint. **Executed: pass (4 ms)** |
| AC-1099 → test_UAT_AC1099 (`:334`) | REQ-130 | aligned — config-only instantiation with a control per field, verbatim `get_l1` subtree equality, module-scoped `set_l1` round-trip reaching the render, no-default-look refusal naming the `slide` seam, and the supplied presentation exercised through **both** the CLI `--slots` and the surface's declared `presentation` parameter. **Executed: pass (22 ms)** |
| AC-1100 → test_UAT_AC1100 (`:497`) | REQ-130 | aligned — refusal names `action`, says required, hint points at `behavior list`; page byte-identical and no instance in `describe_page`. **Executed: pass (3 ms)** |
| AC-1101 → test_UAT_AC1101 (`:541`) | REQ-130 | aligned — merge on reconfigure, the merged result re-checked (`type: 'carrier-pigeon'` refused, prior fields intact), seam survives removal, `NOT_FOUND` for both verbs on an absent name. **Executed: pass (6 ms)** |
| AC-1102 → test_UAT_AC1102 (`:587`) | REQ-130 | aligned — empty list present before, then id/type/version/slot/config alongside a non-empty segment map. **Executed: pass (4 ms)** |
| AC-1103 → test_UAT_AC1103 (`:635`) | REQ-130 | aligned — written on create, merged on update, empty update refused naming `--title`/`--seo` with the stored title untouched, and `<title>` + description meta asserted in the rendered document. **Executed: pass (5 ms)** |
| AC-1104 → test_UAT_AC1104 (`:744`) | REQ-130 | aligned — handle (`/assets/wordmark.svg`), alt echoed, listing reports `kind: image`, document-relative `<img src="assets/…">`, emitted bytes byte-identical to `MARK`. **Executed: pass (5 ms)** |
| AC-1105 → test_UAT_AC1105 (`:783`) | REQ-130 | aligned — all twelve hostile categories the criterion enumerates, each `SCHEMA_INVALID` and each refusal text matched, then an empty assets dir and a byte-identical `site.json`. **Executed: pass (3 ms)** |
| AC-1106 → test_UAT_AC1106 (`:802`) | REQ-130 | aligned — four unrecognised-construct cases, `SVG_MAX_ELEMENTS`/`SVG_MAX_BYTES` breaches refused, a 1500-element drawing accepted. Validator-shaped because the AC's own Verification scopes it there (finding 4). **Executed: pass (4 ms)** |
| AC-1107 → test_UAT_AC1107 (`:829`) | REQ-130 | aligned — five bad-name shapes refused at both boundaries with an acceptable name in the hint, no byte left behind, generated `wordmark.svg`, `CONFLICT` on reuse, explicit replace storing `REDRAWN`. **Executed: pass (4 ms)** |
| AC-1108 → test_UAT_AC1108 (`:866`) | REQ-130 | aligned — `write_image` and `add_asset`/`remove_asset` in different declared groups, only the drawing group granted, the offered tool set matching, and a real write performed. **Executed: pass (3 ms)** |
| AC-1109 → test_UAT_AC1109 (`:920`) | REQ-130 | aligned — `behavior list`, `module add/set/rm`, `asset write --content --alt` and a replacing `--force`, `page add/update --seo`, `config set` ×2, all mirrored by the surface and closed with three deep-equality assertions plus substance checks. **Executed: pass (22 ms)** |
| AC-1650 (`pending`) → test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`, describe at `:645`) | REQ-130 (+ REQ-117/118 as the borrowed transport) | covered in substance — the cited file:line is accurate; the test starts a real builder, reads `describe_page` segments scoped to the instance, GETs and POSTs `/api/copy` over HTTP, and asserts the new copy landed in `modules[0].slots.form`. Not executable in this sandbox (finding 5); two Verification clauses under-asserted (finding 1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1650 (`acceptance_criterion-3eae0d6b`) / `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:690-709` | uat-edit | AC-1650's Verification asks that "the read returns the text run" and that "the new copy is what the site **and a subsequent read** report". The test asserts only `expect(read.kind).toBe('text')` — it never compares `read.values.text` to the label the segment map reported (`'Email address'`), so a read resolving to the wrong run would still pass — and after the POST it asserts the stored slot JSON only, with no second GET. The addressing claim survives anyway (the write lands inside `modules[0].slots.form`, which only a correctly-addressed path reaches), which is why this is a warning and not a violation | Add `expect(read.values.text).toBe(label!.label)` after the GET, and re-issue the same GET after the POST asserting it now returns `'Your work email'`. Both are additive; no existing assertion changes |
| 2 | info | consistency | AC-1096 (`acceptance_criterion-61fb6823`) / test_UAT_AC1096 | — | Carried from report-aabaf2e1 finding 3 / report-c461de60 finding 1: the AC's "how to write a single setting instead" hint exists only at `tools/generate/src/cli/edit.ts:1449-1451` and no caller can reach it (the CLI takes the key positionally; the surface declares `settings` as `{type:object,required:true}` so the declaration's shape check fires first). The `ac` cycle earlier today (report-2544b1fd, ledger row for AC-1096) considered this and ruled the criterion aligned to `edit.ts:1445-1451`. The UAT asserts the refusal a caller actually receives and then proves the advice actionable, recording the reason in-test (`:220-228`). Nothing to change at this level, and re-opening it would re-litigate today's `ac` verdict | none |
| 3 | info | exclusivity | test_UAT_AC1095…AC1109 vs `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts` | — | Unchanged from the last two checks: REQ-130's free-coded suite covers overlapping scenarios in the same shape (Toolbox-driven, real renders, the same `MARK` and hostile-SVG corpus). Expected under reconciliation — the FC tests are intent-era evidence, the AC UATs are the matrix's — so not a matrix-exclusivity violation. The two suites do both pay full render cost | none |
| 4 | info | consistency | AC-1106 / test_UAT_AC1106 | — | Verified by calling `validateSvg` directly rather than through `write_image`. That is what AC-1106's own Verification asks for, closure cannot be demonstrated by a sample of surface payloads, and AC-1105 covers the same categories end-to-end through the surface — different shapes, not duplicates | none |
| 5 | info | — | AC-1650's evidence test | — | `npm test -- tests/test_UAT_FC_REQ-130_beyond_l1.test.ts -t "copy_inside_the_component"` fails in this session with `Error: listen EPERM: operation not permitted 0.0.0.0` at `tools/generate/src/cli/builder.ts:363` (all 18 tests in the file reported skipped after the uncaught exception in `beforeAll`). That is the sandbox refusing to bind a socket, not a defect in the test or the code; the same file's non-builder describes are unaffected in an environment that allows `listen` | none — needs an operator run or a CI leg that can bind a port |
| 6 | info | coverage | AC-1650 | — | AC-1650 is evidenced by a test named `test_UAT_FC_REQ_130_…`, not `test_UAT_AC1650_…`, so a checker keying on the `test_UAT_AC<number>_` convention will not find it, and the AC carries no `uat_coverage` field yet. Coverage in substance is satisfied — the AC says so explicitly in its own Evidence section, and the citation checks out — so this is not a `uat-add`; it is a note for whoever owns `uat_coverage` | none at this level |
| 7 | info | — | whole level | — | **The suite ran green**: 15/15 in 891 ms. This closes the open item report-c461de60 left ("the one thing this check cannot close is execution") | none |

## Notes for the Editor

- **Nothing blocks this level.** Zero violations, zero needs_review. The single warning is
  a two-line additive tightening of an FC-suite test that already proves the behaviour;
  it can be taken opportunistically or left.

- **The four findings from report-aabaf2e1 are all still fixed** — the surface
  `presentation` parameter (`:475-487`), the verbatim `get_l1` equality and module-scoped
  `set_l1` round-trip (`:376-411`), the AC-1096 refusal-plus-recovery pair (`:220-245`)
  and the AC-1109 CLI verbs (`module set`, `module rm`, replacing `asset write --force`)
  are all present and now demonstrably green. No assertion was weakened since the last
  check; the file's only subsequent touches are the repo-wide `2b902ead01` async-SiteStore
  conversion and `f544f8bcc5` (REQ-137 palette), both of which it survives.

- **What changed since the last uat check (2026-08-16)**: STORY-107's body gained the
  "reached by the operator's click-to-edit modal" claim and its Technical Context note
  (commit `512d1da69d`); AC-1095 and AC-1097 had their Verification wording brought onto
  REQ-137's palette shape (`1c6523cc55`, `c6bab78938`); AC-1650 was created to carry the
  modal claim. All three land inside what the existing tests already assert — the tests
  were written against REQ-137's shape from the start (`PALETTE` entries are
  `{value:'#hex'}`, and the depth case is `theme.typography`), and the modal claim has
  had a real end-to-end test since REQ-130 shipped.

- **AC-1650 is `pending`, not `active`.** It is recorded in the ledger and assessed, but
  the "every active AC has a substantive UAT" rule is evaluated over AC-1095…AC-1109;
  AC-1650 clears the same bar anyway on the evidence it names.
