---
uid: report-6b02087e
id: REPORT-2092
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-08-16T08:14:02.050174+00:00'
updated_at: '2026-08-16T08:14:02.050174+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 4
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 3
**Needs review**: 0

Anchor report: report-7ef6a9ea · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 0

## Cumulative Intent Considered

Intents reaching CAP-70's story tree, chronological by reconciliation. The pivot
bundle (BUNDLE-7) is expanded to the member REQs the stories actually cite.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules: typed config + named L1 presentation slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | Rename the runtime type `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; **no back-compat alias** | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | An L1 page hosts behavior modules **in its slots**: page-schema slot binding (unbound / dangling / double-bound / orphan all rejected), fold seams, `contact-form` config derived from capture incl. `labelMode`, **renderer mounts the module fragment into the slot**, `mountInL1` conformance mode | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Document resource table + `@font-face`; extend L1 axes to cover captured pixel-movers | YES |
| REQ-96 | free_and_reconciled | 2026-08-06 | `control` leaf (L1-wraps-module); delete `carousel.config.view`; **replace contact-form's `intro`/`submit` slots with one required `form` slot**; zero-CSS module obligation | YES |
| REQ-97 / REQ-98 / REQ-105 | free_and_reconciled | 2026-08-06 | Shared surface + node-level axis groups across every kind; text measure; slot sizing | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Typed interaction state, scroll reveal + stagger, pointer-tracked texture accent; renderer-owned safety floor | YES |
| REQ-103 | free_and_reconciled | 2026-08-06 | Typed `pattern` texture axis + radial gradients (drawn, not fetched) | YES |
| REQ-104 | free_and_reconciled | 2026-08-06 | Per-width layout track + wrapping row + shared mode cascade | YES |
| REQ-106 | free_and_reconciled | 2026-08-06 | Typed link role + DOM id emission + unique-id envelope rule | YES |
| REQ-107 | free_and_reconciled | 2026-08-06 | Wire `validateL1` to the **authoring** path, not only reproduction | YES |
| BUG-28 | free_and_reconciled | 2026-08-06 | contact-form enhancement must not cancel a baseline it cannot complete (isolation, client half) | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Relocatable document-relative URL emission; empty-first-segment and colon-segment carve-outs | YES |
| REQ-114 | free_and_reconciled | 2026-08-07 | L1 palette colour model (literal base + palette overlay); retire the 15-slot theme colour group; page colour onto the L1 document | YES |
| REQ-117 | free_and_reconciled | 2026-08-07 | (side-effect) nowrap captured width becomes a floor | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Substrate half of the image editor: framing (`objectPosition`), shape vocabulary, colour adjustment; fixed-order + deterministic emission | YES |
| **REQ-137** (bundle-d9226698 / BUNDLE-18) | **bundled** (bundle `reconciling`, 2026-08-16) | 2026-08-12 | Palette entry becomes one colour: **`steps` deleted**, continuous `shade` on the **reference** (Oklab); supersedes REQ-114 AC3's byte-identity with a bounded ≤8/255 guarantee; sites re-retrofitted | **imminent** |
| REQ-133 / REQ-135 / REQ-139 / REQ-140 / BUG-34 / BUG-35 | ready_to_reconcile / bundled | 2026-08-13…15 | Editor-side controls, locks, copy-modal preview | NO — CAP-86/87/89 surface, not the substrate |
| REQ-141…REQ-148 | draft / ready_to_reconcile | 2026-08-15 | workerd runtime, SiteStore port, builder relocation | NO (drafts) / not substrate |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-83 (`story-d0a8cfad`) — L1 substrate rendered safe by construction | REQ-79/82/84, REQ-87, REQ-90, REQ-91, REQ-96, REQ-97, REQ-98, REQ-103, REQ-105, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **gap**: asserts the negation of REQ-93's renderer clause (finding 3). Otherwise the most current story in the tree — REQ-136 landed 2026-08-12. |
| STORY-85 (`story-179b8c06`) — Behavior modules: core + config + slots | REQ-85, REQ-87, REQ-96, BUG-28 | **gap**: REQ-93's page-level slot-binding rule and `mountInL1` conformance mode unexpressed (finding 4) |
| STORY-82 (`story-46e3b3c7`) — Reproduction treatments | REQ-85 (+ pivot supersession of REQ-26/28/32/45) | **stale**: body still describes REQ-96-deleted `intro`/`submit` slots (finding 1), denies the `labelMode` REQ-93 restored (finding 2), and uses REQ-87's retired "capability module" vocabulary (warning 2). Last body edit was the pivot bundle; nothing since. `uat_coverage: stale`. |
| STORY-80 (`story-c490f1cf`) — Absolute values re-homed in L1 | REQ-79/84, REQ-114, REQ-137 (imminent) | aligned to the enforced state; **imminent drift** from REQ-137 (warning 1) |
| STORY-81 (`story-3569e1a4`) — Responsive layout mode per breakpoint | REQ-104 (+ pivot supersession of the old per-breakpoint dials) | aligned |
| STORY-90 (`story-d2b5cb1c`) — Interaction state, scroll motion, pointer accent | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 (`story-2e4e2c45`) — L1 navigation / link role | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Body states contact-form's presentation is authored as "L1 mounted into the `submit` slot, decorative framing into the `intro` slot". REQ-96 (free_and_reconciled, 2026-08-06) **deleted both slots** and replaced them with one **required `form` slot** carrying `control` leaves — recorded as a deliberate supersession in STORY-85's own Technical Context, and confirmed in `packages/framework/src/modules/contact-form/meta.ts:58-62` (`slots: { form: { required: true } }`) with `submit` now a `controls` entry (`meta.ts:68`). | Repoint the contact-form paragraph to the required `form` slot + per-field/`submit` `control` leaves; keep the `intro`/`submit` slots only as a named supersession |
| 2 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Body asserts `fieldLabels=placeholder` "is gone" and that "field labelling stays part of the core as an accessibility obligation (not a styling option)". REQ-93 (free_and_reconciled, 2026-07-25) added `config.fields[].labelMode: 'visible' \| 'placeholder'` as a **captured a11y fact** (`meta.ts:41-47`; applied at `contact-form/controls.ts:52`). The story's own title and user story promise "compact **placeholder-labelled** … contact forms", so the body currently denies the mechanism that delivers its headline promise. | Replace the "`fieldLabels=placeholder` is gone" clause with `config.fields[].labelMode`, framed as REQ-93 frames it — a captured fact about the reference's accessible name, not an aesthetic dial |
| 3 | violation | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | Out-of-scope section closes: "In L1, a `slot` renders as an inert labelled placeholder — a `div` carrying its slot name and, when declared, its target behavior-module id, **with no module code and no behaviour attached**." REQ-93 (free_and_reconciled) gave the sole emitter a `mounts` map (`packages/framework/src/l1/render.ts:1816, 2347, 2380`): a bound module's already-rendered fragment becomes the slot's content and is inserted **verbatim, unescaped** (`render.ts:2105-2123`). This is a property of the single safe renderer — the story's own load-bearing claim — stated as its negation. | State the mount: a slot is the inert placeholder **when no mount is supplied**, and carries the bound module's framework-rendered fragment when one is; state the trust boundary the code relies on (framework-rendered markup, already through the module's own escaping/URL sinks, binding pre-proved by the page validator) |
| 4 | violation | coverage | STORY-85 (`story-179b8c06`) | story-body-edit | REQ-93 (free_and_reconciled) is expressed nowhere in this capability's story tree beyond its fold clause: the page-level rule "modules may accompany `l1` when each is bound by name to a `slot` present in the L1 tree", its five rejections (unbound module, dangling slot name, double-bound seam, orphan seam, `slot` with no `l1`), and the `mountInL1` conformance mode that runs the universal ACs against the *mounted* shape. STORY-85 owns instance validation and the conformance surface but stops at config/slots/controls; CAP-71's alignment report attributes REQ-93 to STORY-84 for "the fold's behaviour seams" only, and STORY-84's body confirms it excludes the binding. | Extend STORY-85's in-scope list with the page-level binding rule and its rejections, and with `mountInL1` as the position a behavior inherits its obligations in |
| 5 | warning | consistency | STORY-80 (`story-c490f1cf`) | story-body-edit | REQ-137 (`bundled`, in BUNDLE-18 which is `reconciling` as of 2026-08-16 — **imminent**) deletes `steps` from the palette entry and moves the light↔dark position onto the reference as a continuous Oklab `shade` on `[-1,+1]`. STORY-80 states an entry is "an **opaque** hex value plus optional named steps (a ramp belongs to its role…)". REQ-137 §3 also supersedes REQ-114 AC3's byte-identity with a bounded ≤8/255 guarantee, and re-shapes the retrofit (`xgd` 6→7 entries, `gigabytealchemy` 8→15) — so STORY-80's "Retrofit reach, as built" numbers and its "colour-lossless" claim will also be stale. **Warning, not violation**: REQ-137 is not yet reconciled and `steps` is still live on this branch (`packages/site-schema/src/l1/palette.ts:63-72, 159-163`), so the matrix correctly describes the enforced state. | No edit now — expected repair point is BUNDLE-18's own reconciliation. If that reconciliation does not update STORY-80's entry shape, retrofit counts and the superseded REQ-114 AC3 guarantee, this becomes a violation at the next cycle |
| 6 | warning | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Body calls contact-form a "**capability module**", refers to "its **capability config** plus named L1 slots", and names its dependency "the **Capability Modules** story". REQ-87 (free_and_reconciled, 2026-07-24) renamed the runtime type to *behavior module* precisely to end the collision with the XGD capability matrix and **forbids a back-compat alias**; every other story in this capability uses "behavior module". | Rename to "behavior module" / "behavioural config" / STORY-85 throughout |
| 7 | warning | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | Closing section describes STORY-81 as "(\"Responsive dials …\", CAP-68, **now archived**)". STORY-81 is live on CAP-70 with distinct REQ-104 behaviour (per-width layout track, wrapping row) and `uat_coverage: pass`; STORY-81's own body records that it stood archived only until REQ-104. A reader following the pointer lands on a story the note says does not exist. | Update the merge note: STORY-81's *pre-REQ-104* archived state is what AC-717's reassignment refers to; the story itself is active |
| 8 | info | exclusivity | STORY-82 (`story-46e3b3c7`) | — | STORY-82 now describes no behaviour the other stories do not own — its Description repeatedly says the treatments are "re-homed" in STORY-83's L1 leaf axes and STORY-85's contact-form config, and its own Out-of-scope disclaims both mechanisms. It is provenance rather than capability surface. Not raised as a violation: the pivot supersession is genuine matrix history worth keeping, and its ACs (out of scope at this level) are where duplication would actually bite. | none — flagged for the AC-level cycle |

## Notes for the Editor

**One intent accounts for three of the four violations.** REQ-93 landed on
2026-07-25, between the pivot bundle that last edited STORY-82 and everything
after it. Its five clauses were split across capabilities and only the fold
clause found a home (CAP-71/STORY-84). Findings 2, 3 and 4 are the three
orphaned clauses; fixing them is one coordinated pass, not three unrelated
edits.

**STORY-82 is the stalest element in the tree by a wide margin.** Its body has
not been edited since bundle-31e474b9 (2026-07-22) — REQ-87's rename, REQ-93's
`labelMode` and REQ-96's slot replacement have all passed it by, while its
`updated_at` moved only because `uat_coverage` was rewritten. Its
`uat_coverage: stale` is consistent with that and is the AC/UAT-level echo of
the same drift; expect the AC cycle to find the eight archived module-dial ACs
(AC-674..681) and the repointed survivors need the same treatment.

**Finding 3 has a security dimension worth stating explicitly in the edit.**
STORY-83's whole argument is "a single safe renderer … re-checks and
neutralises every value at emit time". The `mounts` path is the one place that
inserts markup verbatim. It is sound — the fragment is framework-rendered, not
instance data — but a story that claims universal neutralisation while the
emitter carries an unescaped insertion point leaves the reasoning for that
carve-out nowhere on record. State the boundary rather than restoring the false
absolute.

**Watch REQ-137 at the next cycle.** BUNDLE-18 was still `reconciling` at the
time of this check (2026-08-16). Warning 5 is deliberately not a violation
because the matrix describes what is enforced; it becomes one the moment that
bundle reaches `free_and_reconciled` without STORY-80 being repointed.

**Nothing needed escalation.** Every finding cites a reconciled or explicitly
imminent intent; no story body describes behaviour the ledger is silent about.
