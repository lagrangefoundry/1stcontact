---
uid: report-d040fcd0
id: REPORT-1725
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-08-09T03:17:10.844810+00:00'
updated_at: '2026-08-09T03:17:10.844810+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 4
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate — L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 4
**Warnings**: 1
**Needs review**: 0

## Matrix under review

CAP-70 (`capability-ae9d65d6`) carries seven stories:

| Story | UID | kind | status |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | `story-c490f1cf` | upgrade | updated |
| STORY-81 Responsive layout (per-width layout mode, wrapping row) | `story-3569e1a4` | upgrade | updated |
| STORY-82 Reproduction treatments | `story-46e3b3c7` | upgrade | updated |
| STORY-83 L1 layout substrate rendered safe by construction | `story-d0a8cfad` | upgrade | updated |
| STORY-85 Behavior modules: vetted core + typed config + L1 slots | `story-179b8c06` | upgrade | updated |
| STORY-90 L1 interaction state, scroll motion, pointer accent | `story-d2b5cb1c` | upgrade | updated |
| STORY-91 L1 navigation: typed link role + DOM ids | `story-2e4e2c45` | feature | completed |

Stories carry `fields.intent_uid` as a **bundle** UID, not a request UID, so the
ledger below was reconstructed from the intents each story body cites plus a sweep
of every `request`/`bug` ticket whose subject is L1, the value system, or the
behavior-module contract.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-46 | free_and_reconciled | 2026-07-06 | Renderer/validator hardening: fail loud on unsafe URL schemes + injection | YES |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 layout substrate + modules (safety envelope) | YES |
| REQ-82 | free_and_reconciled | 2026-07-20 | Pivot B1: L1 schema, renderer, envelope validator | YES |
| REQ-84 | free_and_reconciled | 2026-07-20 | Pivot C: delete hero/header/footer/text-block/services-grid/layer + ~20 dials | YES (retires) |
| REQ-85 | free_and_reconciled | 2026-07-20 | Pivot D: module contract; reframe carousel & contact-form | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | Rename capability-module → **behavior module**; no back-compat alias | YES (retires name) |
| REQ-90 | free_and_reconciled | 2026-07-23 | Document resource table + renderer `@font-face` | YES |
| REQ-91 | free_and_reconciled | 2026-07-23 | Extend L1 axes to cover captured pixel-movers | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | **L1 pages must host behavior modules in their slots** (page-level binding + render mounting) | YES |
| REQ-95 | legacy_done | 2026-07-25 | gendevlabs.ai authored in L1 (authoring-face probe) | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node; modules ship zero CSS; **`config.view` and the `intro`/`submit` slots deleted**; default look → L2 preset | YES (retires) |
| REQ-97 | free_and_reconciled | 2026-07-26 | Sizing on `l1TextSchema` (a run declares its measure) | YES |
| REQ-98 | free_and_reconciled | 2026-07-26 | Uniform surface (paint) group across node kinds | YES |
| REQ-99 | free_and_reconciled | 2026-07-26 | Typed hover / focus interaction state | YES |
| REQ-100 | free_and_reconciled | 2026-07-26 | Typed scroll-reveal and stagger | YES |
| REQ-103 | free_and_reconciled | 2026-07-27 | Typed `pattern` texture axis + radial gradients | YES |
| REQ-104 | free_and_reconciled | 2026-07-27 | Per-width layout track + wrapping row | YES (revives STORY-81) |
| REQ-105 | free_and_reconciled | 2026-07-27 | Hoist sizing to a shared shape (slot can be sized) | YES |
| REQ-106 | free_and_reconciled | 2026-07-27 | Typed link role + DOM id emission | YES |
| REQ-107 | free_and_reconciled | 2026-07-27 | Wire `validateL1` onto the authoring path | YES |
| BUG-28 | free_and_reconciled | 2026-07-27 | contact-form: `mailto:`/`tel:` endpoints must keep the native submit | YES |
| REQ-108 | free_and_reconciled | 2026-07-29 | Pointer-reactive texture accent | YES |
| REQ-109 | free_and_reconciled | 2026-07-30 | Document-relative (relocatable) URL emission | YES |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` fragment + colon cases (security) | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model; retire the 15-slot token palette | YES (retires) |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end (surfaced the nowrap width floor) | YES (partial) |
| REQ-125 | draft | 2026-08-08 | DOC-30 L1 control-surface API design | NO |
| REQ-126 | draft | 2026-08-08 | Build the L1 control surface API | NO |
| REQ-127 | draft | 2026-08-08 | L1 tooling over the control surface API | NO |

Intents deliberately **excluded** as belonging to neighbouring capabilities:
REQ-83 / REQ-92 / BUG-5 / BUG-13 (capture→L1 fold, CAP-71), REQ-86 / REQ-88
(reproduction pipeline & 3-probe gate, CAP-71 / CAP-73), REQ-101 (font provenance,
CAP-80), BUG-32 (builder rebranding, CAP-85).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-80 | REQ-79, REQ-84, REQ-85, REQ-114 | aligned — absolute base on L1 leaves plus the colour overlay; correctly records that "overlay parked in L2" was superseded for colour by REQ-114 |
| STORY-81 | REQ-79, REQ-84, REQ-104 | aligned — correctly records that its original per-breakpoint dials were deleted and that REQ-104 gave it distinct behaviour again |
| STORY-82 | REQ-79, REQ-84, REQ-85 | **drift: describes the pre-REQ-87 type name and the pre-REQ-96 `intro`/`submit` slot surfaces** (findings 2, 3) |
| STORY-83 | REQ-79, REQ-82, REQ-87, REQ-90, REQ-91, REQ-95, REQ-96, REQ-97, REQ-98, REQ-103, REQ-105, REQ-107, REQ-109, REQ-114, REQ-117, BUG-30 | mostly aligned and unusually well evidenced; **drift on the slot-render statement** (finding 1b) and a stale cross-reference to STORY-81 (finding 4) |
| STORY-85 | REQ-85, REQ-87, REQ-96, BUG-28, REQ-116/117 (settled-state carve-out) | aligned — the strongest body in the capability; explicitly records REQ-96's supersession of `config.view` and the `intro`/`submit` slots, the zero-CSS obligation and both carve-outs |
| STORY-90 | REQ-99, REQ-100, REQ-108 | aligned — all three axes, their fail-visible obligations and the focus-indicator floor are expressed (body cites no intent IDs, but the substance matches) |
| STORY-91 | REQ-106 | aligned — link role, DOM ids, allowlist, opener/referrer isolation; records both places the build went beyond the intent, in the safe direction |
| — (no story) | REQ-93 | **gap: page-level module↔slot binding is expressed nowhere in the capability** (finding 1a) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1a | violation | coverage | CAP-70 story tree (no owner) | story-body-edit | REQ-93 (free_and_reconciled, 2026-07-25) requires a page to bind a behavior-module instance to a `slot` in its L1 tree, replacing REQ-88's XOR with five validated rules. All five are live in `packages/site-schema/src/schema.ts:478-599` — `moduleInstanceSchema.slot`, duplicate slot name ("a mount point must be unambiguous"), unbound module ("must name the L1 slot it mounts into"), dangling seam ("no slot named …"), double-bound seam ("bound by more than one module"). No CAP-70 story body expresses any of it. STORY-84 (CAP-71) explicitly disclaims it ("what a behavior module declares and how it wires a bound control" → behavior-module contract), and STORY-85's own scope covers only per-instance config/slot/control validation, not the page↔tree binding | Add the page-level binding contract to STORY-85 (in-scope list + description): a module instance names the seam it mounts into, every module is bound, every seam is bound exactly once, and a seam name is unique within a tree — each a validation error, never a silent no-op |
| 1b | violation | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | STORY-83 states without qualification: "In L1, a `slot` renders as an inert labelled placeholder — a `div` carrying its slot name and, when declared, its target behavior-module id, **with no module code and no behaviour attached**." REQ-93 changed exactly this: `renderL1Document` now accepts a `mounts` map (`packages/framework/src/l1/render.ts:1714-1715`, doc'd "REQ-93 — pre-rendered behavior-module HTML, keyed by the slot name it binds to") and emits the mounted module's HTML inside the slot div (`render.ts:2011-2014`); `tools/generate/src/render/render.ts:140-145` builds that map and passes it in. The inert placeholder is now only the *unmounted* case | Restate as conditional: an unbound seam renders as the inert labelled placeholder; a bound seam renders the mounted behavior's HTML inside it. List the `mounts` seam alongside `controls` in the emitter's in-scope obligations (STORY-83 already owns the `controls` half) |
| 2 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | STORY-82 states the contact-form's current surfaces as "the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot". REQ-96 (free_and_reconciled, 2026-07-26) deleted both: its body names the `submit` slot as "the tell" of the design gap, and STORY-85 records the supersession explicitly — "`contact-form`'s `intro`/`submit` presentation slots (AC-701) are replaced by one required `form` slot carrying control leaves" (contact-form v4). Two stories in one capability now describe incompatible module surfaces | Repoint STORY-82 to the delivered surface: contact-form's whole presentation is one required `form` slot, with each field control and the submit button as L1 `control` leaves inside it; the vetted default look lives in an L2 preset |
| 3 | violation | consistency | STORY-82 (`story-46e3b3c7`) | story-body-edit | STORY-82 uses the pre-rename vocabulary in present tense throughout — "into a **capability module**" (¶REQ-85), "contact-form capability config + L1 slots" (in-scope), "the capability-module contract (see the Capability Modules story)" (out-of-scope), "validated … by the capability validators", "Depends on … the Capability Modules story". REQ-87 (free_and_reconciled, 2026-07-21) renamed the type to **behavior module** specifically to end the collision with the XGD capability matrix and forbids a back-compat alias; a grep for `CapabilityMeta`/`CapabilityModule`/`validateCapability` across `packages/framework/src` and `packages/site-schema/src` returns nothing, so the old names are dead in code. The cross-reference "the Capability Modules story" also names a story that no longer exists (it is STORY-85, "Behavior modules") | Replace every "capability module / capability config / capability validators / Capability Modules story" with the behavior-module vocabulary and a direct reference to STORY-85 |
| 4 | warning | consistency | STORY-83 (`story-d0a8cfad`) | story-body-edit | STORY-83's closing "Merged from STORY-81" note describes STORY-81 as "(CAP-68, now archived)". STORY-81 is active under CAP-70 (`fields.capability_uid=capability-ae9d65d6`, status `updated`) and REQ-104 (free_and_reconciled, 2026-07-27) restored distinct behaviour to it — STORY-81's own body says so: "REQ-104 gives it distinct behaviour again". A reader taking the note at face value concludes STORY-81 has no criteria of its own | Amend the note to past tense: STORY-81 *stood* archived with no criteria from 2026-07-23 until REQ-104 gave it the per-width layout-mode track; the geometry-keyframe supersession recorded here is unchanged |
| 5 | info | coverage | STORY-90 (`story-d2b5cb1c`) | — | STORY-90's body cites no intent IDs at all, unlike every other story in the capability. Its substance nonetheless matches REQ-99, REQ-100 and REQ-108 closely, including the fail-visible marker obligations and the retracted stacking-context measurement. Not a drift finding | none (optionally add the three intent IDs for provenance) |

## Notes for the Editor

**Two of the four violations are the same root cause with two symptoms.** REQ-93
landed the module↔slot mounting seam and no story absorbed it: the *validation*
half is unowned (1a) and the *render* half is actively contradicted by STORY-83's
inert-placeholder sentence (1b). Fixing 1b alone leaves the schema rules
undocumented; fixing 1a alone leaves STORY-83 asserting the opposite. Do both in
one pass. Ownership recommendation: the binding rules to STORY-85 (they are a
property of how a behavior instance attaches to a page), the `mounts` emitter seam
to STORY-83 (it is an obligation of the sole safe emitter, which STORY-83 already
owns, and it sits directly alongside the `controls` map STORY-83 already
documents). If the editor prefers, an alternative reading places the page-shape
rules on a site-schema/page capability — but no such capability exists in the
matrix today, and STORY-84 (CAP-71) has already disclaimed them, so leaving them
unowned is not an option.

**STORY-82 is the stalest body in the capability and both its violations are the
same shape:** it was written just after the REQ-79/REQ-84/REQ-85 pivot and never
re-touched for REQ-87 (rename, 2026-07-21) or REQ-96 (control inversion,
2026-07-26). Every other story in the capability absorbed both. It is also almost
pure cross-reference — it asserts that the card/footer/contact-form treatments are
*re-homed* into L1 axes and the behavior-module contract, and points at STORY-80,
STORY-83 and STORY-85 for the mechanisms. Once corrected, it is worth an
exclusivity look at the AC level: if its criteria restate STORY-80's or STORY-85's
rather than asserting a treatment-level guarantee of their own, the story may be a
merge candidate. Not raised as a finding here — that judgement needs the AC bodies,
which this level does not read.

**Ledger hygiene note (not a finding).** Every story in this capability carries a
**bundle** UID in `fields.intent_uid` / `fields.updated_by` (BUNDLE-6, 7, 11, 13,
14, 16), and those bundles group 3-15 unrelated intents each — BUNDLE-11 alone
spans BUG-27, REQ-94, REQ-96, REQ-97, REQ-98 and ten more. The field therefore
cannot answer "which intents does this story owe?" without reading the story body
and sweeping the request corpus, which is how this ledger was built. Future
alignment checks on this capability should expect the same, and the drift found
here (three intents' worth of supersession missed on one story) is the predictable
cost of that indirection.

**Draft intents deliberately excluded.** REQ-125 / REQ-126 / REQ-127 (the L1
control-surface API, all `draft` as of 2026-08-08) are the next substantial change
to this capability. They are correctly absent from every story body today. Flagged
so the next check does not read their arrival as new drift.
