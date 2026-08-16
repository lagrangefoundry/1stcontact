---
uid: report-40dfb843
id: REPORT-2033
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=story)'
created_by: xgd
created_at: '2026-08-16T00:48:07.666279+00:00'
updated_at: '2026-08-16T00:48:07.666279+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Capability CAP-94 (`capability-2d32662d`) holds exactly one story:
STORY-107 (`story-b3de4571`, `story_kind=feature`, 3 points, status `completed`,
`intent_uid=bundle-e59210c5`) with 15 active ACs (AC-1095 … AC-1109).

## Cumulative Intent Considered

The capability's originating intent is **BUNDLE-17** (`bundle-e59210c5`,
`free_and_reconciled`, merged at `0198704b7e29db3c53cf569070042cec0eb467bc`).
BUNDLE-17 carries eight source requests; STORY-107 is the reconciliation of
**REQ-130** specifically. Neither CAP-94 nor STORY-107 nor its ACs carry an
`updated_by` chain — no later intent has yet touched this tree.

Chronological ledger (intents that originate, or plausibly bear on, this capability):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | The control surface declared as a governed API — reconciled to STORY-105 (`story-93905de4`), a **different** capability. STORY-107 depends on it. | YES (as dependency, not as this capability's content) |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | `get_l1` / `set_l1` element-tree authoring — reconciled to STORY-106 (`story-189fc1ac`), a different capability. STORY-107 depends on it. | YES (as dependency) |
| **REQ-130** (`request-ed6ba145`) | free_and_reconciled | 2026-08-09 | **The originating intent for CAP-94.** Structured `set_config` (object `settings` + optional `key`, deep merge); `add_component` / `configure_component` / `remove_component` / `list_behaviors` + `describe_page` instance listing; `seo` on `add_page` / `update_page`; `write_image` for assistant-composed SVG under its own `DrawImages` grant with a closed-by-construction validator. | YES |
| REQ-131 (`request-5d3bf630`) | free_coded | 2026-08-11 | Draft change journal — instruments the *same* `edit.ts` write path every operation in this capability uses. Adds a journal alongside; retires nothing STORY-107 claims. Not yet reconciled, so the matrix is not yet expected to describe it. | NOT YET (pending its own reconciliation) |
| REQ-133 (`request-8467b1a3`) | ready_to_reconcile | 2026-08-12 | Palette popup (builder UI): display / pick / edit palette entries. A builder-surface capability; does not touch the four operations STORY-107 owns. | imminent — no bearing on this capability |
| REQ-134 (`request-ba3e3fba`) | **abandoned** | 2026-08-12 | Proposed a provider-backed image *generation* component (photographic / atmospheric raster imagery, multi-provider). Retired. STORY-107's generated-image scope correctly remains assistant-composed SVG only. | NO |
| REQ-137 (`request-d2980a95`) | bundled (in BUNDLE-18 `bundle-d9226698`, `reconciling`) | 2026-08-12 | L1 palette model change: an entry becomes one colour, `steps` is **deleted** from the entry schema, `shade` moves onto the reference. Owned by the L1-palette capability, but STORY-107's prose names `steps` as an example settings shape. | imminent (see finding 1) |

Not counted and not bearing on this capability: REQ-132, REQ-135, REQ-136, REQ-138,
REQ-139, REQ-140 (page / image-editor surfaces); REQ-141–REQ-148 (Workers-runtime /
SiteStore / deployment; REQ-143 and REQ-145–148 are `draft`).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-94 (`capability-2d32662d`) | REQ-130 (via BUNDLE-17) | aligned — capability body's four-part scope (settings, components, page metadata, generated images) matches REQ-130's four-part "Behaviour — as built". Body's "palette families" phrasing carries the same REQ-137 exposure as finding 1. |
| STORY-107 (`story-b3de4571`) | REQ-130 (via BUNDLE-17); depends on REQ-126 / REQ-129 | aligned, with two warnings. Every REQ-130 acceptance item is expressed: §1 structured config → "Settings" ¶ (object value, group key, merge-at-every-depth, list/scalar replaces, top-level write when the group is omitted, nothing newly validated); §2 components → "Components" ¶ (closed catalog, `list_behaviors` contract disclosure, add / reconfigure / remove, `describe_page` instance listing, contract-checked before the site validator, optional presentation with a vetted default laid out from config); §3 → "Page metadata" ¶ (written on create, merged on update, reaches the rendered document); §4 → "Generated images" ¶ (ordinary image entry, referenced from a picture element, unaltered into the render, separate grantable capability, accepted-or-refused-whole validator closed by construction). REQ-130's "Not in scope" (new behaviour types, extending L1, binary / font upload) is reproduced in the story's "Out of scope". |
| STORY-107 Technical Context — naming note | REQ-130 | aligned and **verified against code**: the CLI does name these `1c module add\|set\|rm` (`tools/generate/src/cli/index.ts:1158-1187`) and `1c behavior list` (`:340`, `:1150`), while the declared surface names them `add_component` / `configure_component` / `remove_component` / `list_behaviors`. Two vocabularies, one behaviour — as the story says. |
| STORY-107 Technical Context — "item 6" / "item 7" references | REQ-130 | aligned — the numbering is the operator's plan numbering, used identically by sibling STORY-106 ("Plan item 6 — the control surface declared as a governed API (STORY-105…)"), not BUNDLE-17's title ordering. Both referenced UIDs (`story-93905de4`, `story-189fc1ac`) resolve correctly. Not a finding. |
| STORY-107 Technical Context — deferred L2 flag | REQ-130 §2 | aligned — the story explicitly declines to claim the "a behaviour declares a default presentation retrievable by its id" index, attributing it to CAP-70 / `story-179b8c06`. CAP-70 does already hold AC-811 ("An L2 preset supplies a vetted default look for an uncaptured contact form"), which is the *render-side* observable; STORY-107's AC-1099 is the *instantiation-side* observable ("added with its configuration alone, arrives rendering, laid out from that configuration"). Distinct observables on a declared boundary — no exclusivity conflict. |
| Exclusivity within CAP-94 | — | trivially satisfied: one story. Against siblings from the same bundle, STORY-105 owns the declaration / grant / audit contract and STORY-106 the element tree; neither claims settings, components, page metadata or generated images. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-107 (`story-b3de4571`); also CAP-94 body | story-body-edit | Story body names the palette settings group as "a colour palette with its families and steps"; CAP-94's body says "palette families". REQ-137 (`request-d2980a95`, `bundled` in BUNDLE-18 `bundle-d9226698`, status `reconciling`, 2026-08-12) **deletes `steps`** from the palette entry schema — "no legacy mode, no dual path" — replacing it with a continuous `shade` on the reference. Imminent, **not yet enforced**: the branch under test still carries `steps` at `packages/site-schema/src/l1/palette.ts:72` and `:159-163`, and no `shade` exists there, so the story is accurate against today's code. | When BUNDLE-18 reconciles, replace "families and steps" with entry / shade language (e.g. "a colour palette and its entries") in the STORY-107 body, and "palette families" in the CAP-94 body. Do not pre-empt it while REQ-137 is unreconciled — the illustration is a settings-shape example, and the palette model itself is another capability's to own. |
| 2 | warning | coverage | STORY-107 (`story-b3de4571`) | story-body-edit (downstream: ac-add) | REQ-130 states under "⚠️ The operator's editor must not break": "Additionally proven rather than assumed: copy inside a component the **assistant** instantiated is addressable and editable in the modal, over the same `/api/copy` transport the browser uses" — and it is evidenced, by `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642`, under the describe block "REQ-130 — the modal still reaches copy inside an AI-added component", `:617`). The story body expresses only the adjacent claim — that operations "go through the same single write path as the command line and the operator's click-to-edit modal" (direction: this capability's writes use that path) — and names the element-tree write path alone as the refinement channel ("refined afterwards through the element-tree write path"). The reverse guarantee, that the operator's modal reaches *into* what the assistant instantiated, is unexpressed, and none of AC-1095…AC-1109 covers it. Held at warning rather than violation because the guarantee is a regression proof over the click-to-edit modal capability (REQ-117 / REQ-118), which another capability owns, and because the story body does already name the modal as a co-user of the single write path. | Extend the Components paragraph to say that what a component instantiation produces is refined afterwards through the element-tree write path **and is reachable by the operator's click-to-edit modal like any other page content**. If the editor agrees the reverse guarantee is this capability's to hold, follow with an `ac-add` under STORY-107 anchored on the existing UAT at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642`. |
| 3 | info | coverage | STORY-107 | — | REQ-134 (`abandoned`, 2026-08-12) proposed provider-backed image *generation* (raster, multi-provider, photographic-adjacent). It is retired, so this capability's generated-image scope correctly remains assistant-composed SVG only. Recorded so a future reader does not mistake the absence of raster generation here for drift. | none |
| 4 | info | consistency | STORY-107 | — | REQ-131 (`free_coded`, 2026-08-11) instruments `edit.ts` — the single write path behind every operation this capability owns — with a per-mutation journal and a monotone draft counter. It adds, and retires nothing STORY-107 claims. Not yet reconciled, so no matrix expression is expected yet; it should appear in this capability's ledger at its own reconciliation. | none |
| 5 | info | consistency | STORY-107 Technical Context | — | The story's claim that "the enum-control, single-field-layout and refusal-rendering gaps recorded in this bundle are filed against other capabilities" is substantiated in BUNDLE-17: the enum-control limitation is recorded under REQ-128 ("`webui-fields`' enum control renders each option as its value verbatim"), and refusal specificity under REQ-126's "Upstream finding — refusal specificity". Verified as a true disclaimer, not an unfiled gap. | none |

## Notes for the Editor

**Nothing here blocks the level.** Zero violations, zero needs_review — the story is a
faithful, complete expression of REQ-130, and every one of REQ-130's four evidenced
acceptance items has a corresponding paragraph in the story body and at least one AC.

Two things to carry forward:

1. **Finding 1 is a scheduling dependency, not a defect.** It should be repaired *by* the
   REQ-137 / BUNDLE-18 reconciliation, not before it — editing the story now would put
   the matrix ahead of the code and create the inverse drift. The same `steps` wording
   also sits in the CAP-94 capability body; whoever repairs one should repair both.

2. **Finding 2 is the only genuine expression gap, and its ownership is a judgment call.**
   The behaviour is real and evidenced by a passing UAT; the open question is whether
   "the operator's modal reaches copy inside an AI-instantiated component" belongs to
   CAP-94 (which created the component) or to the click-to-edit-modal capability
   (which owns the modal, REQ-117 / REQ-118). This check does not resolve capability
   ownership, so it is reported at the level where the behaviour is observable and
   left at warning. If the editor concludes it belongs elsewhere, the correct outcome
   is an AC on that capability rather than a body edit here — either way the UAT at
   `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642` is currently evidence with no AC
   above it.

**Cross-cutting observation on the deferred L2 flag.** STORY-107 carries an explicit,
well-formed deferral: `presetSlots(behaviorId, config)` lives in the framework's L2
layer, owned by CAP-70 / `story-179b8c06`, and the story documents the behaviour here
(where it is observable in one call) while declining to claim it. CAP-70's existing
AC-811 covers the neighbouring render-side claim but not retrieval-by-behavior-id from
configuration. That flag remains open and correctly attributed — it should surface when
CAP-70 is next reconciled, not as a finding against CAP-94.
