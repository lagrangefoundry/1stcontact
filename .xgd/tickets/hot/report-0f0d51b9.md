---
uid: report-0f0d51b9
id: REPORT-3890
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=story)'
created_by: xgd
created_at: '2026-09-11T03:17:33.901237+00:00'
updated_at: '2026-09-11T03:17:33.901237+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

CAP-94 (`capability-2d32662d`) holds exactly one story: STORY-107 (`story-b3de4571`,
`story_kind=feature`, 3 points, status `completed`, `intent_uid=bundle-e59210c5`), now with
16 ACs (AC-1095 … AC-1109 `active`, AC-1650 `pending`). Neither CAP-94 nor STORY-107 carries
an `updated_by` chain; no later intent has been reconciled *into* this capability.

**This is attempt 3.** The two violations raised by REPORT-3886 (`report-f08cca9a`,
2026-09-11T03:06Z) were both repaired at 03:08–03:09Z, and both of that report's warnings were
repaired in the same pass. Every repair was re-verified against the current ticket bodies and
against current code — not taken on the strength of the fix commit. Nothing new drifted.

## Cumulative Intent Considered

Intent set re-derived from the ticket store this cycle, not inherited: 157 requests (max
REQ-166) and 38 bugs. No intent has been created or changed status since REPORT-3886, and no
bug in the store touches CAP-94's four operation families.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | Control surface declared as a governed API → STORY-105 (`story-93905de4`), another capability. STORY-107 depends on it. | YES (as dependency) |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | Tool surface becomes configuration over the declared L1 API; `declare.ts` deleted. Item 6 of BUNDLE-17; reconciled alongside REQ-126 into STORY-105. | YES (as dependency) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | `get_l1` / `set_l1` element-tree authoring → STORY-106 (`story-189fc1ac`). STORY-107 depends on it. | YES (as dependency) |
| **REQ-130** (`request-ed6ba145`, via BUNDLE-17 `bundle-e59210c5`, merged `0198704b7e29db3c53cf569070042cec0eb467bc`) | free_and_reconciled | 2026-08-09 | **The originating intent for CAP-94.** Structured `set_config` (object `settings` + optional `key`, deep merge); `add_component` / `configure_component` / `remove_component` / `list_behaviors` + `describe_page` instance listing; `seo` on `add_page` / `update_page`; `write_image` for assistant-composed SVG under its own `DrawImages` grant with a closed-by-construction validator; and the modal invariant under "⚠️ The operator's editor must not break". | YES |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | 2026-08-11 | Draft change journal over the same `edit.ts` write path → STORY-115 (`story-6cd17452`, `capability-702b7c02`). Retires nothing STORY-107 claims. | YES (elsewhere) |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette as an editable subject with its own guarded surface → STORY-113 / STORY-114 (`capability-a0bba4ec`). | YES (elsewhere) |
| **REQ-137** (`request-d2980a95`) | free_and_reconciled | 2026-08-12 | **L1 palette model change** — a palette entry is one colour; named `steps` deleted; the light↔dark family is generated from `L1PaletteRef.shade`. Retired the stored family/step vocabulary that REPORT-3886's findings 1–3 were about. | YES (retired — now fully absorbed) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Provider-backed raster image *generation*. Retired. | NO |
| REQ-141–REQ-149 | free_and_reconciled | 2026-08-15 → 08-17 | Workers-runtime test project, async SiteStore port, Cloudflare SiteStore (D1+R2), builder/AI host/behavior modules in workerd, Cloudflare Access, cloud publish → STORY-118 … STORY-121 and neighbours. They change the substrate *under* `edit.ts`, not CAP-94's four operation families. | YES (elsewhere) |
| REQ-150–REQ-153 | free_and_reconciled | 2026-08-18 → 08-20 | Vite SSR boot; site locale identity; money/time seam; reserved locale-shaped slugs. Each owns its own capability. | YES (elsewhere) |
| REQ-154 (`bundled`), REQ-162 (`free_and_reconciled`) | — | 2026-08-20 / 08-31 | Browser-rendering driver; product ticket store. No bearing on CAP-94. | YES (elsewhere) |
| REQ-155–REQ-161, REQ-163–REQ-166 | draft | 2026-08-20 → 08-31 | Fidelity surface, sharp-off-path, capture in workerd, project KB, session seeding, Library tab, ingestion, corpus export, projected reference, capture-to-ticket. | NO (not yet active) |
| BUG-1 … BUG-39 | various | 2026-07 → 08 | Swept for CAP-94 relevance: none touches structured settings writes, component instantiation, page `seo` or `write_image`. BUG-28 (contact-form `mailto:` submit) is the behaviour-module capability's, not the instantiation path's. | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-94 (`capability-2d32662d`) body | REQ-130 (via BUNDLE-17), REQ-137 | **aligned (repaired)** — the settings parenthetical now reads "(palette entries, theme groups, navigation entries)". REPORT-3886 finding 2 is closed; no occurrence of `famil*` or `step*` remains in the body. |
| STORY-107 — Settings ¶ | REQ-130 §1, REQ-137 | **aligned (repaired)** — now "a colour palette and its named entries" and "an entry left unnamed is not silently deleted". Verified against code: a palette entry is `{ value: <opaque hex> }` and `.strict()` (`packages/site-schema/src/l1/palette.ts:78-85`), the light↔dark family is generated on the reference via `shade` (`:96-107`), `site.palette` IS that schema (`packages/site-schema/src/schema.ts:989`). The merge rule itself was correctly left untouched and still matches `editConfigSet`. The theme illustration resolves: `typographyTokensSchema` / `spacingTokensSchema` are real theme groups (`schema.ts:731`, `:807`, `:884-885`). |
| STORY-107 — Components ¶ | REQ-130 §2, REQ-130 "⚠️ The operator's editor must not break" | **aligned (repaired)** — the closed catalog, contract-first validation and config-derived default presentation were already aligned; the paragraph now also states the modal reach REPORT-3886 finding 4 called out as unexpressed. Verified: `presetSlots` is framework L2 (`packages/framework/src/l2/presets.ts:37`) and is what `edit.ts:1269` calls for optional presentation. |
| STORY-107 — Page metadata ¶ | REQ-130 §3 | aligned — `seo` on add and update, merged not replaced, reaching the rendered document. |
| STORY-107 — Generated images ¶ | REQ-130 §4 + its security section | aligned — re-verified: `write_image` sits in its own `DrawImages` group, declared separately from `ManageAssets` (`tools/generate/src/cli/ai/l1-surface.json:840`, `:850-855`), and the closed-by-construction validator is `packages/site-schema/src/svg.ts`. |
| STORY-107 — Out of scope ¶ | REQ-130 "Not in scope" | aligned — new behaviour types, extending L1, and binary/font upload all reproduced; the surface's own absence note (`l1-surface.json:960`) says the same. |
| STORY-107 Technical Context — modal bullet (new) | REQ-130 "⚠️ The operator's editor must not break" | **aligned (new, and correct)** — the bullet claims only the consequence, explicitly leaving `editCopyGet`/`editCopySet`/`copyFieldsOf` to REQ-117/REQ-118. Its mechanism claim ("a module slot is an L1 subtree that the page's segment walk already enters") matches the evidence at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:640-643`, `:675-709`, which drives real HTTP `/api/copy` against a started builder. |
| STORY-107 Technical Context — naming note | REQ-130 | aligned, re-verified this cycle: the CLI still names these `1c module add\|set\|rm` (`tools/generate/src/cli/index.ts:1447-1475`) and `1c behavior list` (`:426`, `:1439-1440`) while the declared surface names them `add_component` / `configure_component` / `remove_component` / `list_behaviors`. |
| STORY-107 Technical Context — deferred L2 flag | REQ-130 §2 | aligned — CAP-70 resolves to `capability-ae9d65d6` ("Framework Substrate: L1 Layout, Values & Behavior Modules") and `story-179b8c06` to STORY-85 ("Behavior modules…"), so the attribution of the `presetSlots(behaviorId, config)` index is still correct and still open there. |
| STORY-107 Dependencies | REQ-126, REQ-127, REQ-129 | aligned — both UIDs resolve to the right stories. |
| Exclusivity within CAP-94 | — | trivially satisfied: one story. |
| Exclusivity across capabilities | REQ-133, REQ-117/REQ-118 | satisfied — no other story in the store mentions `set_config`, `add_component`, `list_behaviors` or `write_image`, and no other story claims the "copy inside an AI-added component" guarantee. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | CAP-94 body, STORY-107 Settings ¶, AC-1095 (`acceptance_criterion-3e72e4c7`), AC-1097 (`acceptance_criterion-411cb7f0`) | — | **REPORT-3886 findings 1–3 are closed.** The retired REQ-137 family/step vocabulary is gone from all four elements — a case-insensitive sweep for `famil`/`step` across them returns nothing. The two AC repairs are internally coherent, not just word-substituted: AC-1095's verification now exercises entries-then-one-entry plus a deeper-than-first-level theme merge plus a list-replaces case; AC-1097's example ("a palette entry whose colour is not an opaque hex value") is accurate against `l1PaletteEntrySchema` (`palette.ts:56-63`), which rejects 8-digit hex on purpose. | none |
| 2 | info | coverage | STORY-107, AC-1650 (`acceptance_criterion-3eae0d6b`) | — | **REPORT-3886 finding 4 is closed, and closed the way the report proposed:** the Components ¶ now states the modal reach, a new Technical Context bullet resolves the ownership question that had left it at warning for two cycles (claimed here as a consequence, with the modal's own contract left to REQ-117/REQ-118), and AC-1650 was authored anchored on the existing UAT at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`. The AC is explicit that it expresses an already-proven behaviour rather than requesting a new test. | none |
| 3 | info | coverage | AC-1650 (`acceptance_criterion-3eae0d6b`) | — | AC-1650 is `status: pending` while AC-1095…AC-1109 are `active`. That is the ordinary creation status here (27 pending vs 635 active store-wide), not drift — recorded so the downstream **ac** and **uat** checks, which key on active ACs, do not silently skip it. | none — for the workflow, not an edit |
| 4 | info | coverage | CAP-94, STORY-107 `uat_coverage` | — | Both still read `uat_coverage: pass`, a value that predates AC-1650's creation (2026-09-11T03:09:49Z). The field is owned by the UAT-coverage check, not by this one, so it is untouched here; it should be recomputed when that check next runs, since the tree gained an AC. | none — do not hand-edit this field |
| 5 | info | consistency | STORY-107 Dependencies | — | "Item 6" / "Item 7" are BUNDLE-17 source-ticket ordinals (1 REQ-119, 2 REQ-122, 3 REQ-121, 4 REQ-126, 5 REQ-128, 6 REQ-127, 7 REQ-129, 8 REQ-130), not story ordinals — the bundle produced 5 stories, so the labels cannot be read as such. Item 7 = REQ-129 = `story-189fc1ac` exactly; item 6 = REQ-127, which reconciled into `story-93905de4` alongside REQ-126, so the label and the UID agree. Recorded because the numbering is not self-evident to a later reader. | none |
| 6 | info | exclusivity | STORY-107 vs STORY-113 (`story-ee073693`, `capability-a0bba4ec`) | — | Unchanged from REPORT-3886 finding 5: REQ-133's guarded palette surface does not retire STORY-107's settings path over the palette — `editConfigSet` still writes it, by merge. No exclusivity violation. Note that the repaired AC-1095 keeps the palette as its merge illustration; that is defensible (the palette is the clearest deep-merge case, and the AC now also exercises the theme group), so it is left alone rather than reopened. | none |
| 7 | info | coverage | STORY-107 | — | REQ-134 (`abandoned`, 2026-08-12) proposed provider-backed raster image *generation*. Still retired, so the generated-image scope correctly remains assistant-composed SVG only. Carried forward so a future reader does not mistake the absence of raster generation for drift. | none |

## Notes for the Editor

**Why this passes.** Every finding REPORT-3886 raised was repaired, and the repairs were checked
against the artefacts rather than against the fix report: the ticket bodies were re-read from
disk, the palette shape re-read from `packages/site-schema/src/l1/palette.ts` and
`schema.ts:989`, the CLI verb names re-read from `tools/generate/src/cli/index.ts`, the
`DrawImages`/`ManageAssets` split re-read from `l1-surface.json`, and the modal UAT re-read at
`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:645-710` to confirm it drives real `/api/copy` HTTP
rather than calling the copy functions in-process. The intent set was re-derived from the store
rather than inherited, and nothing in it moved since the last check.

**The long-running judgment call is now settled in writing.** Finding 4 of REPORT-2033 and of
REPORT-3886 — does "the operator's modal reaches copy inside an AI-instantiated component"
belong to CAP-94 or to the click-to-edit-modal capability — had survived two story-level checks
unrepaired precisely because no check resolves capability ownership. The repair does what the
previous report asked for: STORY-107 now says *why* it is CAP-94's (it is the consequence of
this story's own "what arrives is ordinary page content", not a borrowing of the modal's
contract) and says what it is *not* claiming. That reasoning should stop this resurfacing each
cycle; leave it in place rather than re-litigating it.

**One downstream action this level cannot take.** REPORT-3886 asked for the **ac** level to be
re-run for CAP-94 after the repair, because its last ac-level check (`report-10ed4fd2`,
2026-08-16, PASS) passed with the retired vocabulary in place. The AC bodies changed at
2026-09-11T03:09Z and a sixteenth AC was added, so that re-run is still outstanding — as is a
**uat** re-run, since the ac-level repair rewrote the verification text that the UATs at
`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:118`, `:137` and `:185` are read against. Neither
is a defect in this level; both are sequencing.
