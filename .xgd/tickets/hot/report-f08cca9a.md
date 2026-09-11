---
uid: report-f08cca9a
id: REPORT-3886
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=story)'
created_by: xgd
created_at: '2026-09-11T03:06:51.067778+00:00'
updated_at: '2026-09-11T03:06:51.067778+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: story
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

CAP-94 (`capability-2d32662d`) holds exactly one story: STORY-107 (`story-b3de4571`,
`story_kind=feature`, 3 points, status `completed`, `intent_uid=bundle-e59210c5`) with
15 active ACs (AC-1095 … AC-1109). Neither CAP-94 nor STORY-107 carries an `updated_by`
chain; no later intent has been reconciled *into* this capability.

**This check supersedes REPORT-2033 (`report-40dfb843`, 2026-08-16, PASS).** That report's
finding 1 was explicitly held at *warning* on two conditions — REQ-137 was then `bundled`
inside BUNDLE-18 (`reconciling`), and "the branch under test still carries `steps` at
`packages/site-schema/src/l1/palette.ts`". **Both conditions have now flipped**: REQ-137 is
`free_and_reconciled`, and `steps` is gone from the schema. The deferred repair is now due,
so the same drift is reported here as a violation rather than a warning.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | Control surface declared as a governed API — reconciled to STORY-105 (`story-93905de4`), a different capability. STORY-107 depends on it. | YES (as dependency) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | `get_l1` / `set_l1` element-tree authoring — reconciled to STORY-106 (`story-189fc1ac`), a different capability. STORY-107 depends on it. | YES (as dependency) |
| **REQ-130** (`request-ed6ba145`, via BUNDLE-17 `bundle-e59210c5`, merged `0198704b7e29db3c53cf569070042cec0eb467bc`) | free_and_reconciled | 2026-08-09 | **The originating intent for CAP-94.** Structured `set_config` (object `settings` + optional `key`, deep merge); `add_component` / `configure_component` / `remove_component` / `list_behaviors` + `describe_page` instance listing; `seo` on `add_page` / `update_page`; `write_image` for assistant-composed SVG under its own `DrawImages` grant with a closed-by-construction validator. | YES |
| REQ-131 (`request-5d3bf630`) | **free_and_reconciled** (was `free_coded` at REPORT-2033) | 2026-08-11 | Draft change journal over the same `edit.ts` write path. Reconciled to STORY-115 (`story-6cd17452`, `capability-702b7c02`) — its own capability. Adds `list_changes` to the surface; retires nothing STORY-107 claims. | YES (elsewhere — see finding 6) |
| REQ-133 (`request-8467b1a3`) | **free_and_reconciled** (was `ready_to_reconcile`) | 2026-08-12 | Palette as an editable subject: census with usage counts, `set/add/remove/rename_palette_color`, `get_palette`. Reconciled to STORY-113 (`story-ee073693`) / STORY-114 (`story-4300366a`) under `capability-a0bba4ec`. | YES (elsewhere — see finding 5) |
| **REQ-137** (`request-d2980a95`) | **free_and_reconciled** (was `bundled` in BUNDLE-18, `reconciling`) | 2026-08-12 | **L1 palette model change.** "An entry becomes one color… `steps` is **deleted** — no legacy mode, no dual path, no reader that accepts both." The light↔dark family is no longer stored; it is generated from `L1PaletteRef.shade`. | YES (retires the stored `steps` / family shape — findings 1–3) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Proposed provider-backed raster image *generation*. Retired. | NO |
| REQ-141–REQ-149 (`free_and_reconciled`, 2026-08-15 → 08-17) | free_and_reconciled | 2026-08-15+ | Workers-runtime test project, async SiteStore port, Cloudflare SiteStore (D1 + R2), builder-in-workerd, AI host in workerd, behavior modules precompiled in workerd, Cloudflare Access, cloud publish. All reconciled into STORY-118 … STORY-121 under other capabilities (`capability-c4c7a854`, etc.). They change the substrate *under* `edit.ts`, not the four operation families STORY-107 owns. | YES (elsewhere — no CAP-94 expression expected) |
| REQ-150–REQ-153 (`free_and_reconciled`, 2026-08-18 → 08-20) | free_and_reconciled | 2026-08-20 | Vite SSR boot; site locale identity (STORY-122, `capability-bcbcdaf1`); money/time seam (STORY-123, `capability-40a5527e`); reserved locale-shaped slugs. Each owns its own capability. | YES (elsewhere) |
| REQ-154 (`bundled`), REQ-162 (`free_and_reconciled`) | — | 2026-08-20 / 08-31 | Browser-rendering driver; product ticket store. No bearing on CAP-94. | YES (elsewhere) |
| REQ-155–REQ-161, REQ-163–REQ-166 | draft | 2026-08-20 → 08-31 | Fidelity surface, sharp-off-path, capture in workerd, project KB, session seeding, Library tab, ingestion, corpus export, projected reference, capture-to-ticket. | NO (not yet active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-94 (`capability-2d32662d`) | REQ-130 (via BUNDLE-17) | **drift** — the four-part scope still matches REQ-130's "Behaviour — as built", but the body's parenthetical "(palette families, theme groups, navigation entries)" names a stored shape REQ-137 deleted. Finding 2. |
| STORY-107 (`story-b3de4571`) — Settings ¶ | REQ-130 §1; **contradicted by REQ-137** | **drift** — merge semantics (object/object merge, list-or-scalar replaces, omitted group → top level, nothing newly validated) are all still exactly true against `editConfigSet` (`tools/generate/src/cli/edit.ts:1437-1473`). The *illustration* is not: "a colour palette with its families and steps" and "a family left unnamed is not silently deleted". Finding 1. |
| STORY-107 — Components ¶ | REQ-130 §2 | aligned, verified against code: closed catalog + contract disclosure (`list_behaviors`), add / reconfigure / remove (`toolbox-core.ts:290-314`), `describe_page` instance listing with config (`toolbox-core.ts:228-237`), `validateBehaviorInstance` ahead of `validateOrThrow` (`edit.ts:1155`), optional presentation defaulted from config via `presetSlots` (`edit.ts:1269`, `:1218`). One expression gap remains — finding 4. |
| STORY-107 — Page metadata ¶ | REQ-130 §3 | aligned — `seo` on add and update, merged not replaced (`edit.ts:979`, `:1028`), reaching the rendered document. |
| STORY-107 — Generated images ¶ | REQ-130 §4 | aligned — `write_image` (`toolbox-core.ts:356-363`) sits in its own `DrawImages` group, declared separately from `ManageAssets` (`tools/generate/src/cli/ai/l1-surface.json`, `groups[]`), and the closed-by-construction validator is `packages/site-schema/src/svg.ts`. |
| STORY-107 — Out of scope ¶ | REQ-130 "Not in scope" | aligned — new behaviour types, extending L1, and binary/font upload are all reproduced, and the surface's own `absences[]` states the same three. |
| STORY-107 Technical Context — naming note | REQ-130 | aligned, re-verified against code: the CLI still names these `1c module add\|set\|rm` (`tools/generate/src/cli/index.ts:427`, `:1447-1475`) and `1c behavior list` (`:426`, `:1439-1440`), while the declared surface names them `add_component` / `configure_component` / `remove_component` / `list_behaviors`. |
| STORY-107 Technical Context — deferred L2 flag | REQ-130 §2 | aligned — the story declines to claim the "default presentation retrievable by behavior id" index, attributing it to CAP-70 / `story-179b8c06`. Still correctly attributed; still open there. |
| STORY-107 Dependencies | REQ-126, REQ-129 | aligned — `story-93905de4` and `story-189fc1ac` both resolve and still hold the declaration and element-tree halves. |
| Exclusivity within CAP-94 | — | trivially satisfied: one story. Against `capability-a0bba4ec` (palette management, REQ-133): no conflict — see finding 5. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | consistency | STORY-107 (`story-b3de4571`), Description → **Settings** ¶ | story-body-edit | The story names the palette settings group as "a colour palette with its **families and steps**" and justifies merge semantics with "a **family** left unnamed is not silently deleted". REQ-137 (`request-d2980a95`, **`free_and_reconciled`**, 2026-08-12) deleted that shape — "`steps` is **deleted** — no legacy mode, no dual path, no reader that accepts both" — and the code agrees: a palette entry is now exactly `{ value: <opaque hex> }` and `.strict()` (`packages/site-schema/src/l1/palette.ts:78-82`), a palette is a flat map of kebab-case names to entries (`:85`), the light↔dark family is *generated* from `L1PaletteRef.shade` on the reference (`:104-110`) — "there is no per-step tally any more, because there are no steps" (`:223-224`) — and `site.palette` IS that schema (`packages/site-schema/src/schema.ts:989`). So the story describes a stored settings shape that no longer exists. REPORT-2033 held this at warning solely because REQ-137 was then unreconciled and the branch still carried `steps`; both conditions have flipped. | Rewrite the illustration in entry/shade vocabulary: "a colour palette and its named entries" (not "families and steps"), and "an **entry** left unnamed is not silently deleted" (not "a family"). Do not change the merge rule itself — object/object merges, list-or-scalar replaces, omitted group writes at the top level — all of which remain exactly true. |
| 2 | **violation** | consistency | CAP-94 (`capability-2d32662d`) body | story-body-edit | The capability body enumerates the settings scope as "the site's structured settings (**palette families**, theme groups, navigation entries)". Same retirement, same intent: REQ-137 (`free_and_reconciled`, 2026-08-12) makes "family" a generated artefact of `shade`, not a stored settings shape. Reported separately from finding 1 because it is a different element needing its own edit — REPORT-2033's note ("whoever repairs one should repair both") was not acted on. | Replace "palette families" with "palette entries" (or "the colour palette") in the CAP-94 body parenthetical. |
| 3 | warning | consistency | AC-1095 (`acceptance_criterion-3e72e4c7`), AC-1097 (`acceptance_criterion-411cb7f0`) | ac-edit | The same retired shape has propagated into two AC bodies: AC-1095 — "Write a complete colour palette (**several families, each with steps**) … every family and step is present. Then write a single family again with one changed step…"; AC-1097 — "for example a **palette family whose steps are not the declared form**". Both describe a shape REQ-137 deleted. Held at **warning** because this level's repair surface is the story and capability bodies; recorded here so the story-level fix and the AC-level fix land as one coherent edit rather than two passes. Note that the most recent ac-level check (`report-10ed4fd2`, 0 violations) did not catch this. | After findings 1–2 land, re-run the **ac** level for CAP-94 and repair AC-1095 / AC-1097 to entry/shade vocabulary — and check the UATs beneath them (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:118`, `:137`, `:185`) still read as evidence of what the repaired ACs say. |
| 4 | warning | coverage | STORY-107 (`story-b3de4571`) | story-body-edit (downstream: ac-add) | **Carried forward from REPORT-2033 finding 2, still unrepaired.** REQ-130 states under "⚠️ The operator's editor must not break": "Additionally proven rather than assumed: copy inside a component the **assistant** instantiated is addressable and editable in the modal, over the same `/api/copy` transport the browser uses" — and it is evidenced, by `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`, under the describe block "REQ-130 — the modal still reaches copy inside an AI-added component", `:645`). The story body expresses only the forward direction (this capability's writes go through the same single write path as the CLI and the modal) and names the element-tree write path alone as the refinement channel. The reverse guarantee is unexpressed and no AC among AC-1095…AC-1109 covers it. Held at warning for the same reason as before: it is a regression proof over the click-to-edit-modal capability (REQ-117 / REQ-118), whose ownership this check does not resolve. | Extend the Components paragraph: what a component instantiation produces is refined afterwards through the element-tree write path **and is reachable by the operator's click-to-edit modal like any other page content**. If the editor agrees the guarantee is CAP-94's, follow with an `ac-add` anchored on the UAT at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`; if it belongs to the modal capability, file the AC there instead. |
| 5 | info | exclusivity | STORY-107 vs STORY-113 (`story-ee073693`, `capability-a0bba4ec`) | — | REQ-133 (now `free_and_reconciled`) gave the palette its own guarded surface (`get_palette`, `set/add/remove/rename_palette_color`, `ManagePalette` group). This does **not** retire STORY-107's settings path over the palette: `editConfigSet` can still write it, and `edit.ts:1480-1482` says so explicitly ("`editConfigSet` can already write a palette, because a palette is a setting — but it writes by *merge*"). STORY-113's own body frames itself as the addition ("a merge can change a colour and add one, but it cannot remove a key or move one"). No exclusivity violation. | none — but while rewriting the Settings ¶ for finding 1, consider illustrating merge semantics with the theme's typography/spacing or the navigation list rather than the palette, so the paragraph does not read as advice to edit colours through a blind merge now that a guarded palette surface exists. |
| 6 | info | consistency | STORY-107 | — | REQ-131 (draft change journal) moved from `free_coded` to **`free_and_reconciled`** since REPORT-2033 and reconciled to STORY-115 (`story-6cd17452`) under `capability-702b7c02` — its own capability, not CAP-94. It instruments the shared `edit.ts` write path (every CAP-94 write now returns a `now` counter, `toolbox-core.ts:351-363`) and adds `list_changes` to the surface, but retires nothing STORY-107 claims. The ledger entry REPORT-2033 asked for is recorded here. | none |
| 7 | info | coverage | STORY-107 | — | REQ-134 (`abandoned`, 2026-08-12) proposed provider-backed raster image *generation*. Still retired, so this capability's generated-image scope correctly remains assistant-composed SVG only. Carried forward so a future reader does not mistake the absence of raster generation for drift. | none |

## Notes for the Editor

**What fails this level, and why it is a short repair.** Two violations, both the same
sentence-level drift in two places, both already anticipated in writing by the previous
story-level check. REPORT-2033 (2026-08-16) deliberately deferred the repair — "Do not
pre-empt it while REQ-137 is unreconciled — editing the story now would put the matrix
ahead of the code and create the inverse drift." That was the right call then. REQ-137 is
now `free_and_reconciled` and `steps` is physically gone from
`packages/site-schema/src/l1/palette.ts`, so the deferral has expired and the same words
are now behind the code rather than ahead of it. Nothing else in STORY-107 drifted: every
one of REQ-130's four evidenced acceptance items was re-verified against current code and
still holds, through a month that moved the whole storage substrate into D1/R2 and the
host into workerd.

**Three places carry the retired palette vocabulary, not two.** The CAP-94 body, the
STORY-107 Settings paragraph, and two AC bodies (AC-1095, AC-1097). Findings 1–2 are
this level's; finding 3 records the AC half so the editor makes one coherent pass instead
of two — and so the **ac** level is re-run for CAP-94 afterwards, since its last check
(`report-10ed4fd2`) passed with this drift in place.

**Finding 4 is the one genuine expression gap and it is a judgment call, not a defect.**
Unchanged in substance from REPORT-2033: the behaviour is real and evidenced by a passing
UAT with no AC above it; the open question is whether "the operator's modal reaches copy
inside an AI-instantiated component" belongs to CAP-94 (which created the component) or to
the click-to-edit-modal capability (REQ-117 / REQ-118). This check does not resolve
capability ownership, so it is reported where the behaviour is observable and left at
warning. It has now survived two story-level checks unrepaired; if the editor concludes it
belongs elsewhere, saying so in the story body would stop it resurfacing every cycle.

**Cross-cutting observation, unchanged.** STORY-107's deferral of the
`presetSlots(behaviorId, config)` index to CAP-70 / `story-179b8c06` remains well-formed
and correctly attributed. It should surface when CAP-70 is next reconciled, not as a
finding against CAP-94.
