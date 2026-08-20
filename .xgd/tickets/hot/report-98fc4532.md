---
uid: report-98fc4532
id: REPORT-2402
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-08-20T07:39:47.409613+00:00'
updated_at: '2026-08-20T07:39:56.021359+00:00'
completed_at: null
last_field_updated: body
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 6
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 6
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Bundles are listed
by the constituent intents relevant to CAP-70; unrelated members are elided.

| Intent ID | Status | When (completed) | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58/59/61/62 (BUNDLE-6, `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Pre-pivot module dials — absolute values, per-breakpoint dials, reproduction treatments | YES (mostly superseded below) |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-24 | Renamed the runtime type `capability module` → **behavior module**; `Capability*` → `Behavior*`; slot field `capability` → `behavior`; **no back-compat alias** | YES |
| REQ-63/79/82/83/84 + 2 (BUNDLE-7, `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 substrate + safety envelope; deleted the semantic layout modules and their ~20 dials | YES (retires the BUNDLE-6 delivery) |
| REQ-85 (`request-015e42ac`) | free_and_reconciled | (pivot D) | Module contract; reframed carousel & contact-form | YES |
| **REQ-93** (`request-f26cbe32`, via BUNDLE-10 `bundle-4ff83a8b`) | **free_and_reconciled** | **2026-08-05** | **L1 pages host behavior modules in their slots**: relaxed the REQ-88 XOR to slot-bound mounting, page-level binding validation, renderer mounts the module fragment into the seam, `mountInL1` conformance mode, `labelMode` config field | **YES** |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | L1 resource table + `@font-face`; typed axes for every captured pixel-mover | YES |
| REQ-96/97/98/99/100/103/104/105/106/107 + BUG-28 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | `control` leaf + zero-CSS module contract (deleting `config.view` and the `intro`/`submit` slots); shared axis groups; interaction/motion/texture; layout track; link role; envelope on the authoring path; client-side isolation | YES |
| REQ-108/109/110/111/113 + BUG-30 (BUNDLE-13, `bundle-e0143ffa`) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | 2026-08-06 | Palette colour model; token colour palette retired; edit-render settled-state carve-out | YES |
| REQ-117 | free_and_reconciled | 2026-07-31+ | nowrap captured width becomes a floor | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment — substrate half | YES |
| BUG-34 + REQ-137 (BUNDLE-18, `bundle-d9226698`) | free_and_reconciled | 2026-08-17 | Palette `shade` on the reference replaces named `steps` | YES (retires steps) |
| REQ-145 (`request-b474390f`) | ready_to_reconcile | — | L1 render moves into workerd | imminent |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | — | Behavior modules render in workerd — **Astro deleted from the module render path**; `AstroComponentFactory` → `BehaviorComponent` on the behavior contract | imminent |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 (`story-c490f1cf`) — absolute values + palette overlay | REQ-58/59/62/61 → REQ-79/84, REQ-114, REQ-137 | aligned — body carries the steps→shade replacement and states it as a replacement with no legacy reader |
| STORY-81 (`story-3569e1a4`) — responsive layout track | REQ-58… (archived delivery), REQ-104 | aligned — body correctly records the pre-pivot dial delivery as deleted and REQ-104 as the reviving intent |
| STORY-82 (`story-46e3b3c7`) — reproduction treatments | REQ-58/59/62/61, REQ-79/84, REQ-85 | **gap: body is frozen at REQ-85 vocabulary — never updated for REQ-87 (rename) or REQ-96 (slot deletion). `uat_coverage=stale`** |
| STORY-83 (`story-d0a8cfad`) — L1 substrate | REQ-79/82/84, REQ-87, REQ-90/91, REQ-96/97/98/103/105/107, REQ-106, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **gap: unconditional "a slot renders inert" claim contradicts REQ-93; stale merge note about STORY-81** |
| STORY-85 (`story-179b8c06`) — behavior modules | REQ-85, REQ-87, REQ-96, BUG-28, REQ-116 | **gap: REQ-93's slot-bound mounting and page-level binding validation are expressed nowhere** |
| STORY-90 (`story-d2b5cb1c`) — interaction / motion / pointer accent | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 (`story-2e4e2c45`) — L1 navigation | REQ-106 | aligned (status `completed`) |
| — | **REQ-93** | **unowned by any story in any capability** — only its fold half is documented, on STORY-84 (CAP-71) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-85 (`story-179b8c06`) | story-body-edit | REQ-93 (free_and_reconciled, reconciled 2026-08-05) delivered **page-level slot-bound module mounting**, and no story in the matrix expresses it. Live in code: `packages/site-schema/src/schema.ts:523-600` enforces five distinct rejection cases (module with `l1` but no `slot`; `slot` naming a seam absent from the tree; a seam bound by two modules; an orphan seam no module binds; a `slot` on a module when the page has no `l1`), plus duplicate slot names rejected as ambiguous via `l1DocumentSlotNames` (`packages/site-schema/src/l1/slots.ts`). A cross-matrix scan of all 31 stories found zero references to REQ-93 and zero occurrences of `double-bound` / `dangling slot` / `orphan seam` / `unbound module`. STORY-85's "In scope" covers only *instance* validation (config, slot subtrees, control bindings) — not the page composition rule. | Add the page composition rule to STORY-85's Description and In-scope list: modules may accompany `l1` only when each binds by name to exactly one existing seam, and each of the five rejection cases is a validation error rather than a silent no-op |
| 2 | violation | coverage | STORY-83 (`story-d0a8cfad`) | story-body-edit | REQ-93's **renderer half** is likewise unexpressed. `packages/framework/src/l1/render.ts:1815-1816, 2106-2122, 2342-2380` gives `renderL1Document` / `renderL1Fragment` a `mounts` option keyed by slot name, and a bound seam emits the module's pre-rendered fragment inside the same positioned box with prefix namespacing keeping per-instance CSS collision-free. `tools/generate/src/conformance/harness.ts:140` adds the `mountInL1` fixture mode that runs the universal ACs against the *mounted* shape. Neither is in STORY-83's In-scope list. | Add the slot-mount emission (and its namespacing guarantee) to STORY-83's safe-renderer scope; record `mountInL1` conformance on STORY-85 |
| 3 | violation | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | STORY-83's In-scope paragraph ends: "In L1, a `slot` renders as an inert labelled placeholder — a `div` carrying its slot name and, when declared, its target behavior-module id, **with no module code and no behaviour attached**." Stated unconditionally, this is contradicted by REQ-93: `render.ts:2119` reads `const mounted = state.mounts?.[node.name] ?? ''` and emits `>${mounted}</div>`, and the adjacent comment says "with **no mount** it stays the inert, labelled placeholder". The inert render is the *unbound* case only. | Qualify the claim: an **unbound** seam renders as the inert labelled placeholder; a bound seam emits the mounted behavior's fragment in the same positioned box |
| 4 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | STORY-82 describes contact-form throughout in the **retired `Capability*` vocabulary** REQ-87 (free_and_reconciled, completed 2026-07-24) removed with no back-compat alias: "contact-form presentation via its **capability config**", "reframed `contact-form` … into a **capability module**", "validated as an L1 subtree by the **capability validators**", and a dependency on "the **Capability Modules** story". `grep` for `CapabilityMeta` / `CapabilityModule` / `validateCapability` across `packages/framework/src` returns nothing — the rename is complete in code and only this story body still carries the old names. | Replace every `capability module` / `capability config` / `capability validators` / `Capability Modules story` with the `Behavior*` equivalents (`behavior module`, behavioural `config`, `validateBehaviorSlots/Instance`, STORY-85) |
| 5 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | STORY-82 states "the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot". REQ-96 (free_and_reconciled, reconciled 2026-08-06) **deleted both slots**, replacing them with a single required `form` slot carrying `control` leaves — a breaking change that bumped contact-form v3→v4. Confirmed at `packages/framework/src/modules/contact-form/meta.ts:58-63`: `slots: { form: { required: true } }` and nothing else; `controls` now carries `field`, `submit`, and the invariant `label`/`honeypot`/Turnstile elements. STORY-85 already documents this supersession; STORY-82 was never updated. | Repoint to the post-REQ-96 surface: one required `form` slot holding the whole L1 presentation, with the submit button as a `control` leaf inside it |
| 6 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | STORY-82 claims "What used to be aesthetic dials — `submitColor`, `submitInline`, **`fieldLabels=placeholder`**, submit look — **is gone**". Placeholder labelling was *not* removed: REQ-93 landed it as behavioural config `config.fields[].labelMode: 'visible' \| 'placeholder'` (`contact-form/meta.ts:41-49`), explicitly documented there as "**not an aesthetic dial: it is a captured FACT** about the control's accessible name, and the a11y tree is its only witness". The story body therefore contradicts both the code and its own story statement, which promises "compact **placeholder-labelled** or single-row contact forms". | Remove `fieldLabels=placeholder` from the deleted-dials list and record `labelMode` as surviving behavioural config carrying a captured a11y fact |
| 7 | warning | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | STORY-83's closing "Merged from STORY-81" note describes STORY-81 as `("Responsive dials …", CAP-68, **now archived**)`. REQ-104 (free_and_reconciled, reconciled 2026-08-06) revived STORY-81 with distinct behaviour — it is `status: updated`, titled "Responsive layout: a container's layout mode varies per breakpoint and a row can wrap", and STORY-81's own body records "this story stood archived … from 2026-07-23. REQ-104 gives it distinct behaviour again". The note's substantive claim (AC-717 collapsed into AC-684) still holds; only the archived characterisation is stale, and a reader would wrongly conclude STORY-81 carries no criteria. | Note that STORY-81 was subsequently revived by REQ-104 with a different scope (the per-width layout mode), and that only its pre-REQ-104 dial delivery was merged here |

## Notes for the Editor

**The REQ-93 gap is the load-bearing finding, and it is a clean two-story split.**
REQ-93 spans four layers; three are unowned and one is already covered:

| REQ-93 layer | Where it lives in code | Owner |
|---|---|---|
| Page composition rule + binding validation | `site-schema/src/schema.ts:523-600`, `l1/slots.ts` | **unowned** → STORY-85 (finding 1) |
| Renderer mounts fragment into seam | `framework/src/l1/render.ts:2106-2122` | **unowned** → STORY-83 (finding 2) |
| `mountInL1` conformance fixture mode | `tools/generate/src/conformance/harness.ts:140` | **unowned** → STORY-85 (finding 2) |
| Fold clusters captured controls into a slot node | `tools/generate/src/l1/forms.ts` | covered — STORY-84 (CAP-71) |

The capability body's "Out of scope" line correctly sends the *fold* half to CAP-71,
which is why only that half survived into the matrix. The schema, renderer and
conformance halves are squarely inside this capability's declared
"Behavior module contract & catalog" scope and were dropped rather than delegated.

**STORY-82 is stale wholesale, not in three spots.** Findings 4–6 are three
citable instances, but the underlying condition is that the story's last
substantive update was the REQ-85 reframe (`updated_by: bundle-31e474b9`,
BUNDLE-7, 2026-07-22) while every intent that changed its subject matter —
REQ-87 (2026-07-24), REQ-93 (2026-08-05), REQ-96 (2026-08-06) — landed
afterwards. Its `uat_coverage` field independently reads `stale`. An editor
should re-read the whole body against contact-form v4 rather than patching the
three quoted sentences.

**Cross-cutting pattern worth noting.** Findings 3, 4 and 5 are all the same
failure shape: a story body pinned to a surface that a later reconciled intent
deleted outright (the inert-only slot render; the `Capability*` names; the
`intro`/`submit` slots). CLAUDE.md's no-legacy-modes rule means the deleted
surfaces leave no trace in code to contradict the matrix — the only place they
still exist is in these story bodies, which is exactly the drift this check
exists to catch.

**Two imminent intents will move this capability again.** REQ-145 and REQ-148
are both `ready_to_reconcile`. REQ-148 in particular changes the behavior-module
contract itself — it deletes Astro from the module render path and replaces
`AstroComponentFactory` with `BehaviorComponent` on the contract — so STORY-85
should be expected to take a further upgrade shortly. Neither is a violation
now; they are recorded so the next check can tell "not yet reconciled" from
"dropped".

**Not raised as findings, deliberately.** STORY-82's continued existence
alongside STORY-83/85 is thin but not an exclusivity violation — the capability
body lists "Reproduction treatments" as its own scope area and STORY-82 scopes
itself to documenting that the treatments are *re-homed*, not to owning the
mechanisms. No `needs_review` items: every finding above resolves against an
intent whose status and asks are unambiguous.
