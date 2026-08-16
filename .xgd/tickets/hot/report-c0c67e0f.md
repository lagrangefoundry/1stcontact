---
uid: report-c0c67e0f
id: REPORT-2046
type: report
title: 'UAT Coverage: Site Authoring Beyond The Element Tree: Settings, Components,
  Page Metadata & Generated Images'
created_by: xgd
created_at: '2026-08-16T02:01:09.096293+00:00'
updated_at: '2026-08-16T02:01:09.096293+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2d32662d
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images

**Result**: PASS
**AC verdicts**: 15 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-7ef6a9ea. CAP-94, one story (STORY-107 / story-b3de4571,
`story_kind=feature`), 15 active ACs (AC-1095 … AC-1109), 15 UATs, all in
`tests/reconciliation-beyond-l1-authoring.test.ts` (1119 lines).

**`.xgd/uat_index.json` is empty** (`acs: {}`), so the prescribed index lookup returns
nothing for every AC. AC→test resolution was done by grepping the repo for
`test_UAT_AC10(9[5-9]|[0-9]{2})` instead; one file matched and it carries exactly one `it()`
per AC, so the mapping is complete and unambiguous. The empty index is an infrastructure
observation, not a coverage gap — recorded in the notes.

**Method limit (carried, third cycle).** The suite was **not executed**: the session's
permission mode denied `./node_modules/.bin/vitest run <file>` and `pnpm test`, both
attempted this turn. Every judgement below is static — each UAT's assertions read against
the production code they drive (`tools/generate/src/cli/ai/{toolbox.ts,l1-surface.json}`,
`tools/generate/src/cli/index.ts`, `packages/site-schema/src/{svg.ts,l1/palette.ts}`). This
turn additionally re-verified that every symbol and parameter the tests bind to actually
exists on the surface: `createL1Toolbox` / `L1_DECLARATION` / `L1_INSTANCES`
(`toolbox.ts:64,69,466`), `validateSvg` / `SVG_MAX_BYTES` / `SVG_MAX_ELEMENTS`
(`svg.ts:239,66,73`), `add_component.presentation`, `write_image.replace`,
`add_page.seo` / `update_page.seo`, `set_config.{key,settings}`, and the CLI verbs
`behavior list` / `module add|set|rm` / `page add|update` / `config set` / `asset write`
(`index.ts:1095-1222`). No claim is made that the suite currently passes; that remains the
one outstanding verification for this capability and is unchanged from REPORT-2041 /
REPORT-2043.

## Cumulative Intent Considered

`STORY-107.fields.intent_uid = bundle-e59210c5` (BUNDLE-17). No `updated_by` chain on the
capability, the story or any AC.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | The declared control surface this story builds on — owned by the capability for story-93905de4 | YES (dependency) |
| REQ-129 (request-b1300473) | free_and_reconciled | 2026-08-09 | Element-tree authoring (`get_l1`/`set_l1`) — owned by story-189fc1ac | YES (dependency) |
| REQ-130 (request-ed6ba145) | free_and_reconciled | 2026-08-09 | **The whole of this capability**: structured `set_config`, component instantiation, page `seo`, `write_image` + the closed SVG validator, all four reachable from the CLI | YES |
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | 2026-08-10 | Carried REQ-130 to main (`merged_at_commit` 0198704b) | YES |
| REQ-137 (request-d2980a95) | **bundled** | 2026-08-12 | Deletes `steps` from the palette entry schema; `shade` on the reference replaces it. "no `site.json` carries one", "no reader that accepts both" | YES (imminent) — see finding 1 |
| REQ-134 (request-ba3e3fba) | abandoned | 2026-08-12 | An image-generation component (several providers behind one API) | NO (never wanted) |

REQ-130 supports every one of the 15 ACs; each maps to a clause of its §1–§4 and its
"Acceptance — all four, evidenced" list. **No reconciled intent retires any behavior in
this capability**, so there is nothing to deprecate. REQ-137 is imminent and touches this
capability only through the *example shape* used to illustrate the settings merge rule
(see the notes for why that is a warning and not staleness).

REQ-137's commits are **not** in this branch's HEAD (`git merge-base --is-ancestor
87306fa … HEAD` → false; `packages/site-schema/src/l1/palette.ts:72` still declares
`steps`), so today's fixtures and today's schema agree.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-107 (story-b3de4571) | REQ-130 (via BUNDLE-17); REQ-126, REQ-129 as declared dependencies | aligned | Every behavior in the body traces to a REQ-130 clause; every REQ-130 in-scope behavior has an AC. The two exclusions the body names — authoring a new behavior *kind*, and uploading supplied files/fonts (REQ-101's) — are themselves evidenced, as a closed-catalog `NOT_FOUND` (AC-1098) and as `add_asset`/`remove_asset` being absent from the assistant's offered tool set (AC-1108) |

Per-AC coverage, with the entry point each UAT actually drives:

| AC | UAT (line) | Entry point | Verdict |
|---|---|---|---|
| AC-1095 | `…AC1095…` (:153) | bound Toolbox `set_config` → draft on disk | pass — whole palette in one call, nested single-family rewrite preserving siblings at every depth, list-replaces with its scalar sibling still merged |
| AC-1096 | (:189) | Toolbox `set_config` with no `key` | pass — top-level merge proven against a pre-existing sibling; scalar refused and `site.json` byte-identical; advised group+object form proven actionable afterwards (finding 3) |
| AC-1097 | (:236) | Toolbox + `get_config` | pass — malformed palette family refused, file byte-identical, rejected key absent on read-back |
| AC-1098 | (:267) | `list_behaviors` + `add_component` + real `1c module add` argv | pass — version, required config, item-shape enum, seams, controls, default-look flag; `NOT_FOUND` enumerating every known kind and naming a developer |
| AC-1099 | (:322) | Toolbox + `1c` argv + `cmdRender` | pass — default look derived per configured field, verbatim `get_l1` round-trip, module-scoped `set_l1` rewrite reaching the rendered `<form action="/api/lead">`, no-default-look refusal naming the `slide` seam, supplied presentation accepted through *both* vocabularies and both reaching the render |
| AC-1100 | (:481) | Toolbox + `1c module add` | pass — missing `action` refused naming the field with a `behavior list` pointer; page byte-identical; no instance on `describe_page`. The field-level error is reachable only from `validateBehaviorInstance`, which is what makes the "ahead of the site validator" ordering observable |
| AC-1101 | (:525) | Toolbox `configure_component` / `remove_component` | pass — merge keeps `action`, bad merge (`type: 'carrier-pigeon'`) re-refused against the contract, seam `"name":"signup-form"` survives removal, `NOT_FOUND` on both ops |
| AC-1102 | (:571) | `describe_page` | pass — empty-but-present list, then id/type/version/slot/config alongside a non-empty segment map |
| AC-1103 | (:619) | `add_page`/`update_page` + `1c page update` + `cmdRender` | pass — written, merged, `<title>` and `name="description"` asserted in the rendered HTML, empty update refused naming `--title`/`--seo` with prior metadata intact (finding 3 covers the untested optional `ogImage` leg) |
| AC-1104 | (:728) | `write_image` + `list_assets` + `set_l1` + `cmdRender` | pass — returned handle is `/assets/wordmark.svg`, listing reports `kind: image`, rendered `src="assets/wordmark.svg"` is document-relative, emitted bytes byte-identical to `MARK` |
| AC-1105 | (:767) | `write_image` × 12 hostile documents | pass — every category REQ-130 names refused; assets dir empty and `site.json` byte-identical after the whole set (finding 2 covers one vacuous assertion inside it) |
| AC-1106 | (:786) | `validateSvg` directly | pass — the AC's own Verification specifies the validator as the boundary, because closure cannot be demonstrated by a sample of payloads; 4 unrecognised-construct cases, both caps, and an in-bounds detailed document |
| AC-1107 | (:813) | `write_image` + `1c asset write` | pass — 5 rejected name shapes each refused at both boundaries with a hint showing an acceptable name, no byte left behind, conflict then explicit `replace` with the redrawn bytes asserted |
| AC-1108 | (:850) | `L1_DECLARATION` + `L1_INSTANCES` + bound tool set | pass — `DrawImages` vs `ManageAssets` confirmed distinct in the declaration (verified against `l1-surface.json` this turn), grant asymmetric, `write_image` offered and `add_asset`/`remove_asset` absent, and the drawing write actually performed |
| AC-1109 | (:904) | real `run()` argv on one site vs Toolbox on a twin | pass — all four capabilities driven from argv, then `site.json` and both pages compared whole against the surface-built twin, with the merge result, single-entry registry, replaced bytes, surviving `spare` seam and merged `seoMeta` asserted individually so an agreement of two empty results cannot pass for coverage |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac + uat + story | AC-1095, AC-1109, STORY-107 | ac-edit + uat-edit + story-body-edit | REQ-137 (`bundled`, imminent) deletes `steps` from the palette entry schema — "no reader that accepts both". AC-1095's *Verification* illustrates the merge rule with "several families, each with steps", the story body says "a colour palette with its families and steps", and the shared `PALETTE` fixture (:106-110, used by AC-1095 and AC-1109) writes nested `steps`. The moment REQ-137 reconciles, that fixture stops validating and both UATs go red on a schema change that has nothing to do with the behavior they prove | When REQ-137 lands, re-illustrate the same merge rule with a nested group that survives it — `theme.typography`, or palette entries plus `nav` — in the fixture, in AC-1095's Verification and in the story body's example clause. One batch, three files. **Not actionable now**: REQ-137 is not in this branch (`palette.ts:72` still declares `steps`), so an edit today would break the tests it is meant to protect |
| 2 | warning | uat | AC-1105 | uat-edit | `expect(answer).toMatch(/refused/i)` (:778) is vacuous: the Toolbox answers a `SCHEMA_INVALID` with the declared per-code coaching text, which contains "the whole change was refused and nothing was written" for *every* refusal (`l1-surface.json` → `errors.SCHEMA_INVALID`). It therefore adds nothing to the `SCHEMA_INVALID` assertion on the line above, and the criterion's clause "identifying **which rule** it broke" is unproven. The in-test comment ("The refusal identifies the rule that was broken rather than saying only 'invalid'") overstates what is asserted. The AC's own *Verification* asks only that each is "refused with a schema-validation error", which **is** met — hence a warning, not a violation | Read one or two hostile cases back through the CLI boundary, as AC-1098/AC-1100/AC-1107 already do (`cli(cwd,'asset','write',SLUG,'attack','--content',hostile)`), and assert `error.message` names the broken rule (e.g. `script`, `style`, `ENTITY`). Then correct the comment |
| 3 | warning | ac | AC-1096, AC-1103 | ac-edit | Two clauses describe things no caller can observe or that no UAT exercises. (a) AC-1096: the hint "how to write a single setting instead" exists only at `edit.ts` and is unreachable — the CLI takes the key positionally and the surface declares `settings` as `{type: object, required: true}`, so the declaration's shape check fires first. Carried unchanged from REPORT-2043 finding 1; correctly *not* forced into the test. (b) AC-1103 says search metadata is "a title, a description, and optionally a shared-link image"; `ogImage` is declared on both `add_page` and `update_page` but no UAT writes or renders it | (a) Drop or soften AC-1096's unobservable hint clause at the next `ac` cycle. (b) Either add one `ogImage` write+merge assertion to the AC-1103 UAT, or drop the parenthetical from the criterion. Both non-blocking |

## Notes for the Editor

**Nothing here is a coverage gap in the AC-authoring sense.** All 15 ACs are active under
REQ-130, all 15 have a UAT, and every UAT drives a real entry point — the bound Toolbox the
assistant is actually handed, `1c`'s real argv `run()`, or `cmdRender` — asserting on the
draft on disk, the rendered bytes, or the surface's own declaration. Nothing mocks `edit.ts`
or stubs the Toolbox, and the file says so and then holds to it. There is no `uat-add`
finding and no `ac-add` finding.

**One cross-cutting theme, and it is a good one.** Where the Toolbox flattens a refusal's
text into per-code coaching, four of these UATs already re-read the same refusal through
`1c`'s `{ok:false,error}` envelope to assert its wording (AC-1098, AC-1099, AC-1100,
AC-1107). Finding 2 is the single place that idiom was not applied and a generic-text
assertion was left standing in its place. Applying it there closes the last wording claim
in the capability.

**Sequencing matters for finding 1.** It is filed now so it is not rediscovered as a
mystery test failure after REQ-137's reconcile; it must not be actioned before then. If the
editor's queue cannot hold a deferred item, attach it to REQ-137 rather than to this
capability.

**Infrastructure, not coverage**: `.xgd/uat_index.json` is `{"acs": {}}`, so the AC→test
lookup this prompt prescribes returns nothing for any AC in the project, not just these.
Every uat_coverage_check is currently falling back to grep. Worth regenerating the index
outside this assessment.

**Still unverified, third cycle running**: the suite has never been executed in any of these
sessions (permission mode denies `vitest`/`pnpm test`; two attempts made and denied this
turn). Static reading has now checked every imported symbol, every tool parameter and every
CLI verb these UATs bind to, so the tests are known to be *well-formed against today's
code* — but "well-formed" is not "green". A single
`pnpm test tests/reconciliation-beyond-l1-authoring.test.ts` in a session that can run it
would retire the only real doubt left on this capability.
