---
uid: report-3a0d1cad
id: REPORT-1668
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-08-08T00:05:42.331706+00:00'
updated_at: '2026-08-08T00:05:42.331706+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 5
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 5
**Warnings**: 3
**Needs review**: 0

Anchor report: report-17a279f7. Previous attempts: 0.

## Cumulative Intent Considered

Every story in this capability carries a **bundle** as its `intent_uid`, so the
ledger below is the de-duplicated set of member intents from those bundles
(BUNDLE-6/7/11/13/14/16) plus the intents named directly in the story bodies
(REQ-87, REQ-90, REQ-91, REQ-93). Intents whose subject matter belongs to a
sibling capability (CAP-63 capture/diff, CAP-71 fold & gate, CAP-82 delivery,
CAP-85/86/87 builder & editing, CAP-89 site materials) are marked *sibling* and
are not expected to be expressed here.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58, REQ-59, REQ-61, REQ-62 (BUNDLE-6) | free_and_reconciled | 2026-07-17 | Expression audit / gradient / responsive-diff work that produced the original module dials — originating intent for STORY-80/81/82 | YES (delivery since superseded) |
| REQ-67, REQ-68 | free_and_reconciled | 2026-07-18 | contact-form field dials; footer `copyrightOpacity` + services-grid card fill/badge — originating intent for STORY-82's archived AC-674..681 | YES (retired by REQ-84/85) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 layout substrate + capability modules (safety envelope) | YES |
| REQ-82 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Pivot B1: L1 schema, renderer, envelope validator | YES |
| REQ-84 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Pivot C: delete header/hero/footer/text-block/services-grid/layer and their ~20 dials | YES (retires) |
| REQ-85 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Pivot D: module contract; reframe carousel & contact-form | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | Rename capability-module → **behavior module**; no back-compat alias | YES (retires `Capability*` naming) |
| REQ-90 | free_and_reconciled | 2026-07-23 | L1 document resource table + renderer `@font-face` | YES |
| REQ-91 | free_and_reconciled | 2026-07-23 | Extend L1 axes to every captured pixel-mover | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | **A page hosts behavior modules in its L1 slots**: schema binding rule + renderer mounts the fragment into the seam | YES |
| REQ-96 (BUNDLE-11) | free_and_reconciled | 2026-07-26 | `control` leaf; delete `config.view`; **replace contact-form's `intro`/`submit` slots with one required `form` slot** | YES (retires) |
| REQ-97, REQ-98, REQ-105 (BUNDLE-11) | free_and_reconciled | 2026-07-26/27 | Text measure; uniform shared surface group; sizable slot | YES |
| REQ-99, REQ-100 (BUNDLE-11) | free_and_reconciled | 2026-07-26 | Typed hover/focus interaction state; typed scroll-reveal + stagger | YES |
| REQ-103 (BUNDLE-11) | free_and_reconciled | 2026-07-27 | Typed texture/pattern axis + radial gradients | YES |
| REQ-104 (BUNDLE-11) | free_and_reconciled | 2026-07-27 | Per-width **layout mode** track + wrapping row | YES (revives STORY-81) |
| REQ-106 (BUNDLE-11) | free_and_reconciled | 2026-07-27 | Typed link role + DOM id emission | YES |
| REQ-107 (BUNDLE-11) | free_and_reconciled | 2026-07-27 | Envelope validator wired to the authoring path | YES |
| BUG-28 (BUNDLE-11) | free_and_reconciled | 2026-07-27 | contact-form enhancement must not cancel a baseline it cannot complete | YES |
| REQ-108 (BUNDLE-13) | free_and_reconciled | 2026-07-29 | Pointer-reactive texture accent | YES |
| REQ-109 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-07-30/31 | Relocatable document-relative URL emission; empty-first-segment & colon cases | YES |
| REQ-114 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | L1 palette colour model; **retire the 15-slot theme colour-role palette** | YES (retires) |
| REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | Edit render — imposes the settled-state carve-out on the module contract | YES |
| REQ-117 (BUNDLE-16) | free_and_reconciled | 2026-07-31 | Copy editing — surfaced the nowrap captured-width floor | YES |
| REQ-63, REQ-83, REQ-86, REQ-88, REQ-92, REQ-94, BUG-27 | free_and_reconciled | 2026-07-17…08-05 | Capture/diff coverage, capture→L1 fold, 3-probe gate, gate calibration | YES — *sibling* (CAP-63 / CAP-71) |
| REQ-101, REQ-102 | free_and_reconciled | 2026-07-26 | Font registry & licence provenance; `1c new` scaffold | YES — *sibling* (CAP-89, STORY-92 / STORY-93) |
| REQ-110, REQ-111, REQ-113, BUG-31 | free_and_reconciled | 2026-07-30/31 | R2 deploy + public-site Worker + clean URLs | YES — *sibling* (CAP-82) |
| REQ-115, REQ-44 | free_and_reconciled | 2026-07-31 / 07-03 | Builder shell; tooling hygiene | YES — *sibling* (CAP-85 / none) |
| REQ-95 | legacy_done | 2026-07-25 | gendevlabs.ai authored in L1 (authoring-face probe) | YES — site content, not capability surface |
| REQ-69 | abandoned | 2026-07-18 | services-grid raw card fill/gradient/badge (superseded by REQ-68) | NO |
| REQ-80 | abandoned | 2026-07-19 | Per-element Elementor band backgrounds | NO |
| REQ-17, REQ-43 | draft | 2026-07-02/03 | Bespoke-module lifecycle; module-contract template + stamp | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-70 (capability body) | REQ-79, REQ-82, REQ-84, REQ-85, REQ-114 | **gap**: Scope has no section for interaction/motion/pointer (REQ-99/100/108), the link role (REQ-106), or the layout-mode track (REQ-104) — three stories it holds. Body written 2026-08-05, one day before STORY-90/91 were created |
| STORY-83 | REQ-79, REQ-82, REQ-87, REQ-90, REQ-91, REQ-96, REQ-97, REQ-98, REQ-103, REQ-105, REQ-107, REQ-109, BUG-30, REQ-114, REQ-117 | aligned on its own surface; **gap**: silent on REQ-93's page-level mount (AC-723 pins the inert placeholder only); stale "Merged from STORY-81" note |
| STORY-85 | REQ-85, REQ-87, REQ-96, REQ-116, BUG-28 | aligned and current (records the REQ-96 supersession explicitly); **gap**: does not express REQ-93's page-level slot binding |
| STORY-80 | REQ-58/59/61/62 (superseded delivery), REQ-79, REQ-84, REQ-114 | aligned |
| STORY-81 | REQ-58…62 (original, deleted), REQ-79/84, REQ-104 | aligned — REQ-104 gives it distinct behaviour (AC-833…838) |
| STORY-82 | REQ-67, REQ-68 (original, retired), REQ-79, REQ-84, REQ-85 | **drifted**: predates REQ-87 (rename) and REQ-96 (slot restructure); both are free_and_reconciled |
| STORY-90 | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-82 | story-body-edit | Body describes contact-form as a "**capability module**" with "capability config" and "capability validators", and points at "the **Capability Modules** story". REQ-87 (free_and_reconciled, 2026-07-21) renamed the runtime type to *behavior module* and forbids a back-compat alias; STORY-85 records "There is **no** back-compat alias for the pre-rename `Capability*` names" | Replace every `capability module` / `capability config` / `capability validators` / `Capability Modules story` with the behavior-module terms and a reference to STORY-85 |
| 2 | violation | consistency | STORY-82 | story-body-edit | Body states "the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot". REQ-96 (free_and_reconciled, 2026-07-26) **deleted both slots**: contact-form v4 declares one required `form` slot and `submit` is a *control* leaf (`packages/framework/src/modules/contact-form/meta.ts:58-68`). STORY-85 already records this supersession | Rewrite the contact-form paragraph to the required `form` slot + `control`-leaf model, matching STORY-85 |
| 3 | violation | coverage | STORY-85 (with a cross-ref on STORY-83) | story-body-edit (+ ac-add) | REQ-93 (free_and_reconciled, 2026-07-25) required a page to **bind behavior-module instances to L1 slots** — unbound, dangling, double-bound, orphan and duplicate-name seams all rejected — and the renderer to **mount the module fragment into the seam**. Delivered in `packages/site-schema/src/schema.ts:478-599` and `packages/framework/src/l1/render.ts:1714,1998,2234`, but no story expresses it: STORY-83/AC-723 pins only the *inert placeholder*, STORY-85's scope covers per-instance config/slot/control validation only, and STORY-84 (CAP-71) explicitly scopes out "how it wires a bound control" | Add the page-level binding rule and the render-time mount to STORY-85's in-scope, with an AC; add a sentence to STORY-83 (and AC-723) that a bound module replaces the placeholder at page render |
| 4 | violation | consistency | CAP-70 (capability body) | story-body-edit | The Scope section's four headings cover none of: interaction state / entrance motion / pointer accent (STORY-90 — REQ-99, REQ-100, REQ-108), the typed link role and in-page anchors (STORY-91 — REQ-106), or the per-width layout-mode track and wrapping row (STORY-81 — REQ-104). All three intents are free_and_reconciled and all three stories sit in this capability, so the body materially under-describes what it holds | Add scope paragraphs for the interaction/motion/pointer axes, the navigation role, and the layout-mode track |
| 5 | violation | consistency | AC-718 (under STORY-82) | ac-edit | Criterion asserts "`submit`/`intro` are declared L1 slots" and that config carries only `action`/`fields`/`successMessage`. REQ-96 retired both slots; the live meta declares `slots: { form }`, `controls: { field, submit, label, honeypot, turnstile }` and a `submitLabel` config key. The AC's own test (`tests/reconciliation-reproduction-treatments.test.ts:126`) already asserts the REQ-96 shape — the AC text is stale, the code is not | Repoint AC-718 to the required `form` slot, the `submit` control leaf, and the current config key set |
| 6 | warning | consistency | STORY-83 | story-body-edit | The "Merged from STORY-81 (overlap cluster 2 resolution)" section reads as though STORY-81 is dead (its sole AC reassigned, no criteria of its own). REQ-104 (free_and_reconciled, 2026-07-27) revived STORY-81 with distinct behaviour — the per-width layout-mode track and wrapping row, AC-833…838 | Add a closing note that REQ-104 gave STORY-81 distinct behaviour again; the merge covers only the deleted *dials* and AC-717 |
| 7 | warning | exclusivity | STORY-82 vs STORY-80 + STORY-85 | story-body-edit (merge) | STORY-82's two remaining criteria restate what STORY-80 (AC-716 — L1 leaf axes carry the absolute literal) and STORY-85 (AC-701 — contact-form's every control painted by L1; AC-698 — slot presentation validated as L1) already assert. Post-REQ-96, STORY-82 documents a supersession rather than distinct behaviour | Consider folding STORY-82's supersession record into STORY-80 / STORY-85 rather than keeping a story whose ACs duplicate theirs |
| 8 | warning | consistency | STORY-82 body + AC-719 | ac-edit | Both say an L1 colour literal may instead be "a named overlay **role**". REQ-114 (free_and_reconciled, 2026-07-31) deleted the closed colour-role vocabulary outright — the overlay is now a free-form kebab-case **palette reference**, and STORY-83's AC-935 asserts "No closed colour-role vocabulary survives in the schema, in a definition, or on a layer" | Replace "named overlay role" with "palette reference" in both places |

## Notes for the Editor

- **Two of the five violations are one root cause.** STORY-82 (and its AC-718) was
  last substantively updated under BUNDLE-7 (the pivot, 2026-07-22) and never
  caught up with REQ-87 (2026-07-21 rename) or REQ-96 (2026-07-26 slot
  restructure). Findings 1, 2, 5 and 8 all fall out of that one stale snapshot —
  fixing them is one editing pass over STORY-82 + AC-718 + AC-719. Its
  `fields.uat_coverage` is already `stale`, and both its ACs are `pending`, which
  is the same signal from a different direction.
- **Finding 3 is the only genuine coverage hole**, and it is a real one: REQ-93 is
  a whole reconciled intent — the page-composition rule that makes "100% L1 layout
  plus one behavior module" representable at all — with ~120 lines of live
  validation in `site-schema` and a mount path in the L1 renderer, and it is
  named in no story and no AC across CAP-70 *or* CAP-71. It did not fall between
  two capabilities by accident: STORY-84's out-of-scope explicitly hands the
  binding to "the behavior-module contract", and the behavior-module story never
  picked it up. Note that AC-723's "inert placeholder" claim is not *wrong* (it
  describes `renderL1Document` standing alone) but reads as the whole truth about
  a slot, which it no longer is.
- **No code issues found.** Every divergence in this pass is matrix text lagging
  behind code that already implements the intent. The one place a test could have
  been suspected of proving a retired contract (AC-718) turned out to have been
  updated to the REQ-96 shape while its AC body was not — the drift is one-sided.
- **No needs_review.** Every intent in the ledger resolved cleanly to a capability;
  the sibling-capability assignments were confirmed against the owning stories
  (STORY-84/86 for the fold and gate, STORY-92/93 for fonts and scaffolding,
  STORY-94/95/96 for delivery) rather than assumed.
