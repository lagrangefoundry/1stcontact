---
uid: report-aabaf2e1
id: REPORT-2041
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=uat)'
created_by: xgd
created_at: '2026-08-16T01:35:49.887661+00:00'
updated_at: '2026-08-16T01:35:49.887661+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: uat
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability CAP-94 (capability-2d32662d), one story
(STORY-107 / story-b3de4571, `story_kind=feature`), 15 active ACs (AC-1095 … AC-1109),
15 UATs, all in `tests/reconciliation-beyond-l1-authoring.test.ts`.

**Method note (bounds what is claimed below).** The session's permission mode refused
`npx vitest`, so the suite was **not executed**. Every finding is from static reading of
each test body against its AC body and against the production code the test drives
(`tools/generate/src/cli/edit.ts`, `tools/generate/src/cli/ai/toolbox.ts`,
`tools/generate/src/cli/ai/l1-surface.json`, `tools/generate/src/cli/index.ts`). No claim
is made here about whether the suite currently passes.

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference (the `ac` level ran and passed
after one fix attempt). The ledger is recorded for continuity rather than re-derived.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-130 (request-ed6ba145) | free_and_reconciled | 2026-08-09 | Beyond L1: structured config, module instantiation, page metadata, generated assets — the whole of this capability | YES |
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | 2026-08-10 | Bundle carrying REQ-130 to main (`merged_at_commit` 0198704b) | YES |
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | The declared control surface this story builds on — owned by another capability | YES (dependency) |
| REQ-129 | free_and_reconciled | 2026-08-09 | Element-tree authoring (`get_l1`/`set_l1`) — owned by another capability | YES (dependency) |

No retired or imminent intent touches this capability. `STORY-107.fields.intent_uid =
bundle-e59210c5`; no `updated_by` chain on the capability, story or ACs.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 → test_UAT_AC1095 (:148) | REQ-130 | aligned — whole palette in one call, depth-wise sibling survival, list-replaces, scalar sibling merged: every clause asserted |
| AC-1096 → test_UAT_AC1096 (:184) | REQ-130 | gap (warning) — refusal assertion does not bind to the refusal the AC describes; hint clause unasserted |
| AC-1097 → test_UAT_AC1097 (:209) | REQ-130 | aligned — refused whole, `SCHEMA_INVALID`, site bytes identical, group read back unchanged |
| AC-1098 → test_UAT_AC1098 (:240) | REQ-130 | aligned — catalog fields, item shapes, seams, controls, default-look flag, closed set with enumerating refusal |
| AC-1099 → test_UAT_AC1099 (:295) | REQ-130 | gap (violation + warning) — supplied-presentation clause exercised only at the CLI; read assertion near-vacuous |
| AC-1100 → test_UAT_AC1100 (:398) | REQ-130 | aligned — field-named refusal, contract pointer, page byte-identical, instance absent |
| AC-1101 → test_UAT_AC1101 (:442) | REQ-130 | aligned — merge, re-check of merged result, seam survives removal, NOT_FOUND both ways |
| AC-1102 → test_UAT_AC1102 (:488) | REQ-130 | aligned — empty list present, then name/kind/version/seam/config alongside the element map |
| AC-1103 → test_UAT_AC1103 (:536) | REQ-130 | aligned — written on create, merged on update, `<title>` + description meta in the render, empty update refused |
| AC-1104 → test_UAT_AC1104 (:645) | REQ-130 | aligned — handle, listing kind, document-relative reference, byte-identical asset in the output |
| AC-1105 → test_UAT_AC1105 (:684) | REQ-130 | aligned — all 12 hostile categories the AC names, refusal text, empty assets dir, registry byte-identical |
| AC-1106 → test_UAT_AC1106 (:703) | REQ-130 | aligned — closure cases, element cap, byte cap, and a large-but-legal drawing accepted |
| AC-1107 → test_UAT_AC1107 (:730) | REQ-130 | aligned — five bad-name shapes, no byte left, generated filename, conflict, explicit replace |
| AC-1108 → test_UAT_AC1108 (:768) | REQ-130 | aligned — distinct groups, grant, offered tool set, and a real write |
| AC-1109 → test_UAT_AC1109 (:818) | REQ-130 | gap (warning) — four areas proven CLI↔surface identical, but two named verbs and explicit replacement undriven |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1099 / test_UAT_AC1099 (tests/reconciliation-beyond-l1-authoring.test.ts:372-395) | uat-edit | AC-1099 is a **control-surface** criterion ("Supplying a presentation is optional rather than forbidden: a presentation the caller supplies … is what the instance mounts instead"), but the only accepted-presentation call in the suite goes through `1c module add --slots`. The surface's declared `presentation` parameter (`l1-surface.json` → `add_component.params.presentation`, wired at `tools/generate/src/cli/ai/toolbox.ts:312` as `slots: obj(p, 'presentation')`) is called by **no test in the repo** — a `grep` for `presentation` across `tests/` returns only comments. CLI parity is AC-1109's job, so this clause currently has no surface evidence: a mis-wired `presentation` key would render the surface manual's promise false with every UAT still green | Repeat the accepted case through the Toolbox — `box.run('add_component', { page:'home', name:'gallery', behavior:'carousel', slot:'gallery', config:{}, presentation:{ slide:[{kind:'text', text: SLIDE_COPY}] } })` — and assert the stored `slots.slide` equals what was supplied and that the copy reaches the render, as the CLI branch already does |
| 2 | warning | consistency | AC-1099 / test_UAT_AC1099 (:326-337) | uat-edit | The "what arrives is ordinary page content" assertion is near-vacuous: after `get_l1` with `{module:'signup', slot:'form'}` it asserts only `typeof node.kind === 'string'`, which any node whatsoever satisfies. The criterion's other half — "it can be read **and replaced** through the element-tree write path like anything else" — has no evidence at all: no module-scoped `set_l1` exists in this suite or in `tests/reconciliation-page-composition-surface.test.ts` (story-189fc1ac's ACs), whose `set_l1` calls are all page-scoped | Assert the returned subtree against the stored `modules[0].slots.form` content (e.g. that it carries the `control` leaf for a configured field), then round-trip it: `set_l1` with the same module/slot scope and confirm the replacement is stored and rendered |
| 3 | warning | consistency | AC-1096 / test_UAT_AC1096 (:203-206) | uat-edit | The negative case asserts `expect(refused).toMatch(/must be an object/i)` and byte-identity, but the refusal AC-1096 describes is `edit.ts:1189-1196` — message "Writing the top-level settings needs an object of settings to write.", hint "Name a key to write a single setting, e.g. key \"config\" with { \"businessName\": \"…\" }." — which contains no "must be an object". Neither the `SCHEMA_INVALID` code nor the hint (the AC's "how to write a single setting instead" / "a hint naming the group-plus-object form") is asserted anywhere. See also the note below: that `edit.ts` branch looks unreachable from either boundary | Assert the refusal at the CLI envelope as the sibling tests do (`error.code === 'SCHEMA_INVALID'` plus the hint text), or — if the surface's declared-type check is what a caller actually receives — assert that refusal explicitly and record why the `edit.ts` hint is defence in depth rather than the observed message |
| 4 | warning | coverage | AC-1109 / test_UAT_AC1109 (:818-948) | uat-edit | The criterion names, at the command line, "listing component kinds and **adding, reconfiguring and removing** an instance on a page" and "writing a drawing … with optional alt text and **explicit replacement**". The UAT drives `behavior list`, `module add`, `asset write --content --alt`, `page add/update --seo` and `config set` twice. `1c module set` and `1c module rm` (`tools/generate/src/cli/index.ts:1168-1184`) and a replacing `asset write` are driven by no test in the repo, though their surface twins are covered by AC-1101 and AC-1107. The test does satisfy the AC's own four-outcome Verification recipe, which is why this is a warning and not a violation | Extend the `viaCli`/`viaSurface` pair with `module set --config`, `module rm`, and a replacing `asset write`, mirrored by `configure_component` / `remove_component` / `write_image {replace:true}`, so the existing `readSite`/`readPage` equality assertions cover them for free |
| 5 | info | consistency | AC-1106 / test_UAT_AC1106 (:703) | — | Verified by calling `validateSvg` directly rather than through the surface. That is what AC-1106's own Verification asks for ("Assert a well-formed drawing validates…"), the closure cannot be demonstrated by a sample of surface payloads, and AC-1105 covers the same refusal categories end-to-end through `write_image` — different shapes, not duplicates | none |
| 6 | info | exclusivity | test_UAT_AC1095-1109 vs tests/test_UAT_FC_REQ-130_beyond_l1.test.ts | — | REQ-130's free-coded suite covers substantially the same scenarios in the same shape (Toolbox-driven integration, real renders). Expected under reconciliation — FC tests are intent-era evidence, AC UATs are the matrix's — so not a matrix-exclusivity violation, but the two suites both pay full render cost | none |
| 7 | info | — | whole level | — | Suite not executed: the session's permission mode refused `npx vitest`. Findings are static | none |

## Notes for the Editor

- **Findings 1-3 are one pattern**: assertions that stop just short of the boundary the AC
  names. In each case the sibling tests in the same file already show the technique — the
  CLI envelope is used elsewhere in this suite precisely because "the Toolbox replaces a
  refusal's text with per-code coaching" (test comment, :271-273), and the Toolbox is used
  elsewhere for the accepted paths. Fixing all four findings is additive; no existing
  assertion needs to be weakened or removed.

- **Finding 3 may have an `ac`-level tail.** `editConfigSet`'s top-level non-object refusal
  (`edit.ts:1189-1196`) appears unreachable from both boundaries: the CLI's `config set`
  requires the key positionally (`index.ts:1215-1219`, `requireArg(rest[2], 'key')`), so
  the `scoped` branch is never entered there; and on the surface `settings` is declared
  `{type: object, required: true}` (`l1-surface.json`), with `toolbox.ts:206-219` stating
  arguments "arrive type-checked against the declaration" — so a scalar is refused by the
  declared-type check before `editConfigSet` runs. If that reading is right, AC-1096's
  clause about the hint describes defence in depth that no caller can observe. The `ac`
  level passed and is the working reference, so this is recorded rather than acted on —
  but if the fix session finds it cannot write an honest assertion for the hint, that is
  the reason, and it wants an `ac`-level follow-up rather than a contorted test.

- **Coverage is otherwise complete**: every one of the 15 active ACs has a substantive UAT
  driving a real boundary (the bound Toolbox, `1c`'s argv entry point, or the validator
  where the AC scopes it there), asserting on the draft on disk, the rendered bytes, or the
  surface's own declaration. No internal mocking, no stubbed Toolbox, no AST-only checks.
  AC-1105's hostile set covers all twelve categories the criterion enumerates, and AC-1107
  covers all five bad-name shapes. No two UATs verify the same scenario in the same shape.
