---
uid: report-ad8aaf1c
id: REPORT-3896
type: report
title: 'UAT Coverage: Site Authoring Beyond The Element Tree: Settings, Components,
  Page Metadata & Generated Images'
created_by: xgd
created_at: '2026-09-11T03:41:36.049951+00:00'
updated_at: '2026-09-11T03:41:36.049951+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2d32662d
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images

**Result**: PASS
**AC verdicts**: 16 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability holds one story (STORY-107 / story-b3de4571), whose `intent_uid` is
BUNDLE-17 (bundle-e59210c5, `free_and_reconciled`, merged at
`0198704b7e29db3c53cf569070042cec0eb467bc`). Inside that bundle the intent that
actually asks for this capability's behaviour is **REQ-130**; the other bundle
members (REQ-119/121/122/126/127/128/129) build the surface it stands on.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Built the L1 control surface (declaration, error taxonomy, grants) this story extends | YES (substrate) |
| REQ-129 | free_and_reconciled | 2026-08-09 | `get_l1` / `set_l1` — the element-tree write path a component instantiation is refined through | YES (substrate) |
| **REQ-130** | **free_and_reconciled** | **2026-08-09** | **The whole of this capability: structured `set_config` (object-valued, merge-at-depth), `list_behaviors` / `add_component` / `configure_component` / `remove_component` + `describe_page` component listing, `seo` on `add_page` / `update_page`, `write_image` under its own `DrawImages` group with a closed-by-construction SVG validator, CLI parity, and the modal-reach invariant "proven rather than assumed"** | **YES (primary)** |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal; references `write_image` as a journalled write — additive, retires nothing here | YES (additive) |
| REQ-137 | free_and_reconciled | 2026-08-12 | Palette model: `shade` on the reference replaces named `steps`. Changes the *shape* a palette entry has, not the settings-write semantics this capability owns; both UAT files already carry the post-REQ-137 palette shape and say so in comments | YES (absorbed) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component behind several providers | NO (abandoned) |
| REQ-148 | free_and_reconciled | 2026-08-15 | contact-form precompiled for workerd — a render-host change, not a change to instantiation | YES (no effect) |
| REQ-155…REQ-166 | draft | 2026-08-20…31 | Capture-in-workerd, fidelity surface, KB/library work | NO (not yet active) |

No reconciled or imminent intent retires any behaviour this capability
describes. A sweep of every `request-*` and `bug-*` body for
`write_image` / `DrawImages` / `seoMeta` / `add_component` / `list_behaviors` /
`presetSlots` / `validateBehaviorInstance` surfaced only the intents listed
above — nothing after REQ-130 narrows or withdraws the four behaviours.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-107 (story-b3de4571) | REQ-130 (primary), REQ-126 + REQ-129 (substrate), REQ-131/137/148 (later, additive) | aligned | Every paragraph of the story body maps to a behaviour REQ-130 states as built: settings merge-at-depth and top-level write; closed catalog, contract-first validation, optional presentation with a vetted default look, instance reconfigure/remove and page listing; `seoMeta` merged and rendered; the drawing as an ordinary asset under its own grantable capability with a whole-or-nothing validator. The "Out of scope" paragraph (no new behaviour *kinds*, no L1 extension, no binary upload — fonts stay REQ-101's) restates REQ-130's own "Not in scope" list verbatim in substance. The Technical Context item that flags the L2 default-presentation index as *not* claimed here (owned by CAP-70 / story-179b8c06) is a deferral, not an unbacked claim. |

## AC-Level Detail

Every AC is active per REQ-130, and every AC is covered by a UAT that drives a
real boundary — the bound Toolbox the assistant is handed (`createL1Toolbox`),
`1c`'s real argv entry point (`run([...argv,'--json'])`), a real render
(`cmdRender`), or a real builder process over HTTP (`startBuilder` + `fetch`) —
asserting on the draft on disk, the rendered bytes, or the surface's own
declaration. Neither file mocks `edit.ts` or stubs the Toolbox; the only
non-behavioural assertions are against `L1_DECLARATION` / `L1_INSTANCES`, which
*are* the artefact under test for the grant criterion (AC-1108).

| AC | Behaviour | Evidence | Verdict |
|---|---|---|---|
| AC-1095 | Group written whole, siblings survive at every depth, list replaces | `test_UAT_AC1095_a_settings_group_is_written_whole_and_unnamed_siblings_survive` (`tests/reconciliation-beyond-l1-authoring.test.ts:160`) — writes a 5-entry palette, re-writes one entry and re-reads the other four; deep case on `theme.typography`; nav `entries` list replaced while its scalar sibling `pattern` merges | pass |
| AC-1096 | Omitted group writes top level; a non-object top-level write refused | `test_UAT_AC1096_…` (`:201`) — no `key`, object merges into top level with `theme` byte-identical; a string `settings` is refused (`/must be an object/i`) with `site.json` unchanged, then the prompted form succeeds | pass |
| AC-1097 | Schema-invalid settings refused whole, site unchanged | `test_UAT_AC1097_…` (`:248`) — `SCHEMA_INVALID`, `site.json` byte-identical, and `get_config` shows no partial key landed | pass |
| AC-1098 | Catalog listable, closed, states required config and default-look flag | `test_UAT_AC1098_…` (`:279`) — `list_behaviors` asserts `config.action.required`, list item enum, slots/controls, `hasDefaultPresentation`; unknown kind → `NOT_FOUND`, CLI envelope names every known kind and points at a developer | pass |
| AC-1099 | Added with configuration alone, arrives rendering; caller presentation accepted | `test_UAT_AC1099_…` (`:334`) — two-field form from config alone renders `<form action="/api/lead">`, `type="email"` and `<textarea>`; the subtree is ordinary L1 (`get_l1` returns exactly the stored slot, module-scoped `set_l1` rewrites copy and the change reaches the rendered HTML); a kind with no default look is refused naming its seams, then accepted with a supplied presentation through *both* vocabularies (`--slots`, `presentation`) and both reach the render | pass |
| AC-1100 | Contract violation refused at the field, ahead of the site validator | `test_UAT_AC1100_…` (`:497`) — a form with no `action` is `SCHEMA_INVALID`; the CLI envelope names `action`, says `required`, and hints at `behavior list` (i.e. the behaviour's own contract, not `siteSchema`); page byte-identical and no instance on it | pass |
| AC-1101 | Config merged on reconfigure; seam survives removal | `test_UAT_AC1101_…` (`:541`) — `submitLabel` changed, `action`/`fields` retained; a merged-but-invalid field type refused with the stored config untouched; after `remove_component`, `modules` empty and the `signup-form` slot still in the tree; `NOT_FOUND` for an absent name on both ops | pass |
| AC-1102 | `describe_page` reports instances with their configuration | `test_UAT_AC1102_…` (`:587`) — empty-but-present list first (so "none" ≠ "unsupported"), then id/type/version/slot/config alongside the segment map | pass |
| AC-1103 | SEO written on create, merged on update, reaches the document | `test_UAT_AC1103_…` (`:635`) — `seoMeta` on `add_page`, description-only update keeps the title, an empty update refused naming `--title`/`--seo` without disturbing stored metadata, and `<title>` + `meta name="description"` asserted in rendered `index.html` | pass |
| AC-1104 | Drawing is an ordinary site image, referenceable, ships unaltered | `test_UAT_AC1104_…` (`:744`) — `write_image` returns `/assets/wordmark.svg`, bytes on disk equal the source, `list_assets` reports `kind: image`, an L1 `image` node renders `src="assets/wordmark.svg"` document-relative and the emitted bytes are byte-identical | pass |
| AC-1105 | Anything executable/external/embedding refused whole | `test_UAT_AC1105_…` (`:783`) — 12 hostile documents (script, event handlers on root and shape, `foreignObject`, external `image href`, non-local `use`, `<style>`, `style=`, external paint `url()`, `<!ENTITY>`, out-of-set character entity, `javascript:` link) each `SCHEMA_INVALID` and named as refused; assets dir empty and `site.json` unchanged afterwards | pass |
| AC-1106 | Closed by construction; size and element caps | `test_UAT_AC1106_…` (`:802`) — the closure is tested at `validateSvg` with constructs the grammar *does not name* (unquoted attribute, CDATA, malformed tag, non-drawing root), plus `SVG_MAX_ELEMENTS+1` and `SVG_MAX_BYTES` refusals and a 1500-element document that still passes | pass |
| AC-1107 | Filename generated from a plain name; conflict unless explicit replace | `test_UAT_AC1107_…` (`:829`) — five hostile names (`../../etc/passwd`, `a/b`, `mark.png`, `.hidden`, `Mark Two`) refused at both boundaries with an acceptable name in the hint and no byte written; `wordmark` → `wordmark.svg`; second write `CONFLICT` with bytes unchanged; `replace: true` stores the redrawn bytes | pass |
| AC-1108 | Drawing is its own grantable capability | `test_UAT_AC1108_…` (`:866`) — `write_image` and `add_asset` are in different declared groups, the caretaker instance is granted the drawing group and not the supplied-file one, the offered tool set contains `write_image` and not `add_asset`/`remove_asset`, and the granted op performs a real write | pass |
| AC-1109 | All four capabilities reachable from the command line | `test_UAT_AC1109_…` (`:920`) — `behavior list`, `module add|set|rm`, `asset write [--force]`, `page add|update --seo`, `config set` driven through real argv against one site, the same operations driven through the Toolbox against a second, then the two stored definitions compared whole *and* by substance (palette merge, single asset id, replaced bytes, surviving seam, merged `seoMeta`) so an agreement of two empty results cannot pass for coverage | pass |
| AC-1650 | Copy inside an assistant-instantiated component is addressable and editable in the modal | `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`, describe at `:645`) — against a real `startBuilder` process: the segment map reports segments with `module === 'signup'`, a text run among them is read over `/api/copy` with the map's own path/module/slot, a POST changes it, and the stored page's module slot carries the new copy | pass |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1650 | — (no edit required) | AC-1650 was added in today's structural-validation fix round (2026-09-11T03:09) and carried no `uat_coverage` value until this assessment. Its evidence is real and substantive, but it is the only AC in this capability whose test is named `test_UAT_FC_REQ_130_*` rather than `test_UAT_AC1650_*`, so an AC-keyed index cannot resolve it from the name alone. The AC body already records the evidence path and line, and explicitly states it formalises an already-proven behaviour rather than requesting a new test — duplicating that builder-spawning test under an AC-named alias would buy traceability at the price of a second ~180 s server-start suite | None required for coverage. If AC-name traceability is wanted later, prefer teaching the index to read the AC's `## Evidence` path over re-authoring the test |
| 2 | warning | — | (tooling) | — | `.xgd/uat_index.json` is empty (`acs: {}`, 67 bytes) in this worktree, so the prescribed index lookup returns nothing for every AC. Coverage here was established by reading the two UAT files directly. This is the same empty-index condition recorded before and is a structural-health concern, not a coverage gap | Rebuild the index outside this assessment; it does not change any verdict above |

Zero violations. Zero `needs_review`. Zero `needs_review-default` — no AC or
story paragraph in this capability is intent-silent: REQ-130 states all four
behaviour families, the CLI parity and the modal-reach invariant explicitly,
so the impact screen (BUG-1306) was never reached.

## Notes for the Editor

- Nothing to fix. Both UAT files are exemplary against the project's evidence
  aesthetic: real entry points, assertions on the draft on disk and the rendered
  bytes, refusals checked for *what was not written* as well as for the error
  code, and — in AC-1109 — a two-site differential that defends against the
  classic "two empty results agree" false pass.
- The one place a reader might expect a gap and not find one is AC-1099's
  "or from a presentation the caller supplies": it is proven twice over, once
  through `--slots` at the CLI and once through the surface's `presentation`
  parameter, with a comment stating exactly why the second is not redundant
  (a parameter bound to the wrong option would leave the manual's promise false
  with every other assertion still green).
- Execution was **not** re-run in this pass; this is a coverage judgment, and
  the immediately preceding `check_uat_validation` round owns whether these
  suites are green. Two of the tests relied on here start a real builder and a
  real render, which this sandbox restricts, so a red result from re-running
  them locally would be an environment artefact rather than a coverage finding.
