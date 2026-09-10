---
uid: report-d6b1f43d
id: REPORT-3719
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-09-10T11:15:57.980727+00:00'
updated_at: '2026-09-10T11:15:57.980727+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 4
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 6

## Cumulative Intent Considered

Intents reaching CAP-70's story tree, chronological. The pivot bundle (BUNDLE-7,
`bundle-31e474b9`) and BUNDLE-18/20 are expanded to the member REQs the stories
actually cite. Rows before 2026-08-16 are carried forward from REPORT-2092 and
re-checked against the current tickets; rows from 2026-08-16 onward are new to
this cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules: typed config + named L1 presentation slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | Rename runtime type `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; **no back-compat alias** | YES |
| **REQ-93** (`request-f26cbe32`) | **free_and_reconciled** | 2026-07-25 | An L1 page hosts behavior modules **in its slots**: page-schema slot binding (unbound / dangling / double-bound / orphan / slot-without-l1 all rejected), fold seams, `contact-form` config derived from capture incl. `labelMode`, **renderer mounts the module fragment into the slot**, `mountInL1` conformance mode | YES |
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
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Substrate half of the image editor: framing (`objectPosition`), shape vocabulary, colour adjustment; fixed-order + deterministic emission | YES |
| **REQ-137** (`bundle-d9226698` / BUNDLE-18) | **free_and_reconciled** (was `bundled`/`reconciling` at the last cycle) | 2026-08-13 | Palette entry becomes one colour: **`steps` deleted**, continuous `shade` on the reference (Oklab); supersedes REQ-114 AC3's byte-identity with a bounded ≤8/255 guarantee | **YES — now enforced** |
| **REQ-148** (`bundle-b3b7c399` / BUNDLE-20) | **free_and_reconciled** | 2026-08-15 (reconciled 2026-08-31) | Astro leaves the module render path: behavior modules are plain-function components rendering in workerd; module chrome into the page stylesheet; 12 conformance fixtures convert `.astro`→`.ts` | YES |
| REQ-141…REQ-147, REQ-149, REQ-150 (BUNDLE-20 and after) | free_and_reconciled | 2026-08-15…18 | workerd test project, async SiteStore port, Cloudflare store, build/deploy/smoke, control-app becomes the builder, AI host in workerd, Access gate, cloud publish, Vite SSR launcher | NO — platform/builder/CLI surfaces, not the substrate |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Site locale identity + rendered `lang`/`dir`; money/time formatting seam; locale-shaped slug reservation | NO — CAP-bcbcdaf1 / CAP-40a5527e own these; CAP-70 claims none of them |
| REQ-154 / BUG-39 | bundled | 2026-08-20 / 08-24 | Browser Rendering driver; node chat-host streaming contract | NO — capture & chat surfaces |
| BUG-36 / BUG-37 / BUG-38 | free_and_reconciled | 2026-08-23/24 | control-app deployment, preview render cache, builder chat | NO — builder surface |
| REQ-155…REQ-166 (minus REQ-162) | draft | 2026-08-20…31 | ReferenceStore port, sharp removal, fidelity surface, KB work, Library tab | NO — drafts |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store, TypePack, material types | NO — CAP-dfb0a4ff |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |

**Change since the last story-level cycle (REPORT-2092, 2026-08-16)**: two ledger
rows moved. REQ-137 reached `free_and_reconciled` (BUNDLE-18), and BUNDLE-20's
REQ-148 landed on 2026-08-31. Nothing else in the 2026-08-14→09-10 window is
substrate intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-83 (`story-d0a8cfad`) — L1 substrate rendered safe by construction | REQ-79/82/84, REQ-87, REQ-90, REQ-91, REQ-96, REQ-97, REQ-98, REQ-103, REQ-105, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **gap**: still asserts the negation of REQ-93's renderer clause (finding 3), and still points at STORY-81 as archived (finding 6). Body unchanged since REQ-136; `updated_at` moved only for `uat_coverage`. |
| STORY-85 (`story-179b8c06`) — Behavior modules: core + config + slots | REQ-85, REQ-87, REQ-96, BUG-28, **REQ-148** | **partially repaired**: BUNDLE-20 rewrote the body for REQ-148 (plain-function components, portable catalog, edge runtime, module chrome in the page stylesheet) — that half is aligned. REQ-93's page-level binding rule and `mountInL1` remain unexpressed (finding 4). |
| STORY-82 (`story-46e3b3c7`) — Reproduction treatments | REQ-85 (+ pivot supersession of REQ-26/28/32/45) | **stale, unchanged**: body last edited by `bundle-31e474b9` (2026-07-22). Still describes REQ-96-deleted `intro`/`submit` slots (finding 1), still denies the `labelMode` REQ-93 restored (finding 2), still uses REQ-87's retired "capability module" vocabulary (finding 5). `uat_coverage: stale`. |
| STORY-80 (`story-c490f1cf`) — Absolute values re-homed in L1 | REQ-79/84, REQ-114, **REQ-137** | **repaired since last cycle** — aligned. The body now states "an entry is exactly one colour", "the entry schema has no `steps` field and the reference has no `step`; both are gone", the Oklab `shade` on [-1,+1], the shade/alpha independence, the REQ-114 AC3 supersession and the re-run retrofit counts. REPORT-2092's warning 5 is closed. |
| STORY-81 (`story-3569e1a4`) — Responsive layout mode per breakpoint | REQ-104 (+ pivot supersession of the old per-breakpoint dials) | aligned |
| STORY-90 (`story-d2b5cb1c`) — Interaction state, scroll motion, pointer accent | REQ-99, REQ-100, REQ-108 | aligned |
| STORY-91 (`story-2e4e2c45`) — L1 navigation / link role | REQ-106 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Description says contact-form's presentation is authored as "L1 mounted into the `submit` slot, decorative framing into the `intro` slot". REQ-96 (free_and_reconciled, 2026-08-06) **deleted both slots** and replaced them with one required `form` slot carrying `control` leaves — recorded as a deliberate supersession in STORY-85's Technical Context ("REQ-96 bumped both again … replacing the `intro`/`submit` slots with a required `form` slot are breaking contract changes") and confirmed in code: `packages/framework/src/modules/contact-form/meta.ts:58-61` (`slots: { form: { required: true } }`), with `submit` now a **control** entry at `meta.ts:68`. | Repoint the contact-form paragraph to the required `form` slot plus per-field / `submit` `control` leaves; keep `intro`/`submit` only as a named REQ-96 supersession |
| 2 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Description asserts `fieldLabels=placeholder` "is gone" and that "field labelling stays part of the core as an accessibility obligation (not a styling option)". REQ-93 (free_and_reconciled, 2026-07-25) added `config.fields[].labelMode: 'visible' \| 'placeholder'` as a **captured a11y fact** — `meta.ts:41-47` ("Not an aesthetic dial: it is a captured FACT about the control's accessible name"), applied at `packages/framework/src/modules/contact-form/controls.ts:52` and `component.ts:49`. The story's own title and user story promise "compact **placeholder-labelled** … contact forms", so the body denies the mechanism that delivers its headline promise. | Replace the "`fieldLabels=placeholder` is gone" clause with `config.fields[].labelMode`, framed as REQ-93 frames it — a captured fact about the reference's accessible name, not an aesthetic dial |
| 3 | violation | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | The Out-of-scope section closes: "In L1, a `slot` renders as an inert labelled placeholder — a `div` carrying its slot name and, when declared, its target behavior-module id, **with no module code and no behaviour attached**." REQ-93 (free_and_reconciled) gave the sole emitter a `mounts` map — `packages/framework/src/l1/render.ts:1819, 2392, 2425` — and at `render.ts:2150-2168` a bound module's already-rendered fragment becomes the slot's content, inserted **verbatim, unescaped** (`const mounted = state.mounts?.[node.name] ?? ''` interpolated raw into the `div`). The code comment there states the boundary explicitly; the story states its negation. This is a property of the single safe renderer — the story's own load-bearing claim. | State the mount: a slot is the inert placeholder **when no mount is supplied**, and carries the bound module's framework-rendered fragment when one is; state the trust boundary the carve-out rests on (framework-rendered markup already through the module's own escaping/URL sinks, binding pre-proved by the page validator) |
| 4 | violation | coverage | STORY-85 (`story-179b8c06`) | story-body-edit | REQ-93 (free_and_reconciled) is expressed nowhere in this capability's story tree. Its page-level rule — "modules may accompany `l1` when each is bound by name to a `slot` present in the L1 tree" — and its five rejections (unbound module, dangling slot name, double-bound seam, orphan seam, `slot` with no `l1`; plus duplicate slot names as ambiguous) are implemented at `packages/site-schema/src/schema.ts:540-620` over `packages/site-schema/src/l1/slots.ts`, and the `mountInL1` conformance mode that runs the universal ACs against the *mounted* shape is live at `tools/generate/src/conformance/types.ts:85-92` and `harness.ts:92-141`. STORY-85's In-scope list stops at "instance validation incl. the slot-as-L1 security line and the two-directional control check". No AC anywhere in the matrix cites REQ-93 (grep over `.xgd/tickets/hot/acceptance_criterion-*.md` returns nothing), and STORY-93 (`story-86c7c21b`) explicitly disclaims ownership: "the rule that a behavior module on such a page must name the seam it mounts into … **belongs to the behavior-module contract**; this capability is what makes it bite immediately." STORY-84 (`story-8acc338d`, CAP-71) carries only the fold's seam emission. | Extend STORY-85's in-scope list with the page-level binding rule and its rejections, and with `mountInL1` as the position a behavior inherits its obligations in |
| 5 | warning | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | Body calls contact-form a "**capability module**", refers to "its **capability config** plus named L1 slots", says slot content "is validated as an L1 subtree by the **capability validators**", and names its dependency "the **Capability Modules** story". REQ-87 (free_and_reconciled, 2026-07-24) renamed the runtime type to *behavior module* precisely to end the collision with the XGD capability matrix and **forbids a back-compat alias**; every other story in this capability uses "behavior module", and the published names are `Behavior*` (STORY-85). | Rename to "behavior module" / "behavioural config" / "behavior validators" / STORY-85 throughout |
| 6 | warning | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | The "Merged from STORY-81" section describes STORY-81 as "(\"Responsive dials …\", CAP-68, **now archived**)". STORY-81 (`story-3569e1a4`) is live on CAP-70 with distinct REQ-104 behaviour (per-width layout track, wrapping row), `status: updated`, `uat_coverage: pass`. A reader following the pointer lands on a story the note says does not exist. | Update the merge note: STORY-81's *pre-REQ-104* archived state is what the AC-717 reassignment refers to; the story itself is active |
| 7 | info | consistency | STORY-80 (`story-c490f1cf`) | — | REPORT-2092's warning 5 is **closed**. BUNDLE-18 reached `free_and_reconciled` and STORY-80's body was repointed to REQ-137 before this cycle — `steps`/`step` are stated as deleted, the Oklab `shade` on [-1,+1] is described, the REQ-114 AC3 byte-identity supersession is recorded, and the retrofit counts are the post-REQ-137 re-run ("zero steps"). The predicted escalation did not materialise. | none |
| 8 | info | exclusivity | STORY-82 (`story-46e3b3c7`) | — | STORY-82 still describes no behaviour the other stories do not own — its Description says the treatments are "re-homed" in STORY-83's L1 leaf axes and STORY-85's contact-form config, and its Out-of-scope disclaims both mechanisms. It is provenance rather than capability surface. Not raised as a violation: the pivot supersession is genuine matrix history worth keeping, and its ACs (out of scope at this level) are where duplication would actually bite. | none — flagged for the AC-level cycle |

## Notes for the Editor

**Two of the four violations are one intent, and it is the same intent as last
cycle.** REQ-93 landed 2026-07-25, between the pivot bundle that last edited
STORY-82 and everything after it. Findings 2, 3 and 4 are its three orphaned
clauses (`labelMode`, the renderer mount, the page-level binding + `mountInL1`);
finding 1 is REQ-96 landing on the same paragraph. Fixing STORY-82's contact-form
paragraph and STORY-83's slot sentence together with STORY-85's in-scope list is
one coordinated pass, not four unrelated edits.

**REPORT-2092's four violations are byte-for-byte unrepaired.** STORY-82's body
has not been edited since `bundle-31e474b9` (2026-07-22) — its `updated_at`
(2026-08-09) moved only because `uat_coverage` was rewritten, and
`last_field_updated` is `uat_coverage` on both STORY-82 and STORY-83. Whatever
consumed the previous six attempts did not reach these bodies. STORY-80 is the
one element that *was* repaired in the interval (finding 7), which shows the
repair path works when it is exercised.

**Finding 3 has a security dimension worth stating explicitly in the edit.**
STORY-83's whole argument is "a single safe renderer … re-checks and neutralises
every value at emit time". The `mounts` path is the one place that inserts markup
verbatim. It is sound — `render.ts:2150-2158` argues it, and the fragment is
framework-rendered rather than instance data — but a story that claims universal
neutralisation while the emitter carries an unescaped insertion point leaves the
reasoning for that carve-out nowhere on record. State the boundary rather than
restoring the false absolute.

**Nothing needed escalation.** Every finding cites a `free_and_reconciled`
intent, and every claim was re-verified against the code on this branch rather
than carried over on the prior report's authority. No story body describes
behaviour the ledger is silent about.

**BUNDLE-20 is accounted for.** REQ-141…REQ-150 and the locale/formatting REQs
(151/152/153) landed since the last cycle; none of them is substrate intent, and
the one that is — REQ-148 — was already absorbed into STORY-85 on 2026-08-31.
That half of STORY-85 is aligned; only its REQ-93 gap remains.
