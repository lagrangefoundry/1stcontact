---
uid: report-6dbc885e
id: REPORT-3725
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-09-10T11:41:54.268044+00:00'
updated_at: '2026-09-10T11:41:54.268044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6
(CAP-70) · Previous attempts: 9

**Attempt 9 (REPORT-3724) is confirmed, and the three-cycle regression is closed.**
REPORT-3723's single violation — STORY-85's one-directional binding clause stated as
an unqualified absolute — is genuinely repaired. The body now reads:

> The rule is one-directional **on an L1 page**: every module mounted there must name
> a live, unique seam; a seam need not attract a module. A module on a page carrying
> no L1 document names no seam at all — that is the standalone shape `mountInL1`
> contrasts with.

I verified this from `packages/site-schema/src/schema.ts:569-624` directly rather than
from the fix report: the `if (!page.l1)` branch (`:570-580`) raises an issue **only**
when `m.slot !== undefined`, so a module with no `slot` on a page with no `l1` is
silent; the `else` branch raises on missing slot (`:594`), dangling name (`:604`),
double-bound seam (`:614`) and duplicate seam names (`:584`); and no branch anywhere
rejects an orphan seam. Both halves of the repaired sentence are now true of the code,
and the clause is scoped to the branch that actually holds it.

This cycle I did **not** confine myself to re-checking the last patch. Attempts 7-9
each repaired one clause and introduced the next, so a narrow re-read would keep the
loop alive without ever establishing that the rest of the tree is sound. I re-derived
the ledger, re-ran the coverage check across all seven stories, and independently
verified a broad sample of each body's falsifiable absolutes against the source. The
findings table records what that sweep found.

## Cumulative Intent Considered

The ledger is unchanged from REPORT-3719/3721/3723 and was re-derived rather than
carried: I re-listed every `request` and `bug` ticket and re-classified by capability
ownership. Nothing has moved in the window since REPORT-3723 (2026-09-10 11:32) except
the attempt-9 fix sequence itself.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules: typed config + named L1 presentation slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; no back-compat alias | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding; fold seams; `contact-form` config incl. `labelMode`; renderer mounts the fragment; `mountInL1` conformance mode | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Document resource table + `@font-face`; L1 axes cover captured pixel-movers | YES |
| REQ-96 | free_and_reconciled | 2026-08-06 | `control` leaf; delete `carousel.config.view`; replace contact-form `intro`/`submit` with one required `form` slot; zero-CSS obligation | YES |
| REQ-97 / REQ-98 / REQ-105 | free_and_reconciled | 2026-08-06 | Shared surface + node-level axis groups; text measure; slot sizing | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Typed interaction state, scroll reveal + stagger, pointer-tracked accent; renderer safety floor | YES |
| REQ-103 / REQ-104 / REQ-106 / REQ-107 | free_and_reconciled | 2026-08-06 | Pattern texture + radial gradients; per-width layout track + wrapping row; typed link role + DOM ids; `validateL1` on the authoring path | YES |
| BUG-28 | free_and_reconciled | 2026-08-06 | contact-form enhancement must not cancel a baseline it cannot complete | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Relocatable document-relative URL emission | YES |
| REQ-114 / REQ-117 | free_and_reconciled | 2026-08-07 | L1 palette colour model; retire the 15-slot theme group; nowrap captured width becomes a floor | YES |
| REQ-116 | free_and_reconciled | 2026-08-07 | Edit render channel — places the *settled-state* obligation on a behavior module | YES (obligation only; the channel is another capability) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape vocabulary / colour adjustment; deterministic, fixed-order emission | YES |
| REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-13 | Palette entry is one colour: `steps` deleted, continuous Oklab `shade` | YES |
| REQ-148 (BUNDLE-20) | free_and_reconciled | 2026-08-15 (rec. 08-31) | Behavior modules are plain-function components rendering in workerd; module chrome into the page stylesheet | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Editor colour from the palette — **and, incidentally, deleted `storage/sites/1stcontact` and `storage/sites/harbor-cafe`** (commit `25362247bf`) | Editor surface — NO; but see warning 1 |
| REQ-119, REQ-121, REQ-126…REQ-133, REQ-135, REQ-138, REQ-139, BUG-33/34/35 | free_and_reconciled | 2026-07-31…08-13 | Control-surface API, copy modal, palette popup, page editor | NO — L1 control-surface / editor capabilities |
| REQ-141…147, REQ-149, REQ-150 | free_and_reconciled | 2026-08-15…18 | workerd project, async SiteStore, build/deploy, control-app builder, AI host, cloud publish | NO — platform/builder surfaces |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Locale identity, money/time formatting, slug reservation | NO — owned by STORY-122 / STORY-123 (verified this cycle) |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store, TypePack, material types | NO — CAP-dfb0a4ff |
| BUG-36 / BUG-37 / BUG-38 | free_and_reconciled | 2026-08-23/24 | control-app deployment, preview render cache, builder chat | NO — builder surface |
| REQ-154 / BUG-39 | bundled | 2026-08-20/24 | Browser Rendering driver; node chat-host streaming contract | NO — capture & chat surfaces |
| REQ-155…166 (minus 162) | draft | 2026-08-20…31 | ReferenceStore port, KB work, Library tab, ingestion | NO — drafts |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |

**Coverage result**: every reconciled/imminent intent in the YES rows is expressed in
the story tree, and no story describes behaviour the ledger is silent about. The one
row I added this cycle — REQ-116 — is already correctly carried by STORY-85 as an
*obligation on the contract* rather than as the channel itself, with the reasoning for
that placement stated in its Technical Context.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-85 (`story-179b8c06`) — Behavior modules: core + config + slots | REQ-85, REQ-87, REQ-93, REQ-96, REQ-116, BUG-28, REQ-148 | **aligned — repaired and verified.** Binding clause now scoped to the L1 page and true of `schema.ts:569-624`. Independently re-verified this cycle: contact-form v4 / carousel v3 with `kind: 'behavior'` (`meta.ts:25-28`, `:23-26`); required `form` slot + `field`/`submit` controls + `label`/`honeypot`/`turnstile` marked `invariant: true` (`contact-form/meta.ts:58-77`); `config.view` deleted with the reason recorded in-source (`carousel/meta.ts:12-13`); repeated `slide` slot + `dot` control `perSubtreeOf: 'slide'` (`:34-45`); the module escaping boundary with **no `raw()` helper** exactly as claimed (`modules/html.ts:14-16`); both zero-CSS carve-outs live as real `styles.css` files folded into `module-assets.ts`, with the settled state gated on `[data-fc-edit]` and setting only flow/scroll-release properties (`carousel/styles.css:30-46`); `capabilities.js` still the emitted filename (`render.ts:195, 281`); the L2 default-look preset present (`packages/framework/src/l2/contact-form.ts`, `l2/presets.ts`). |
| STORY-83 (`story-d0a8cfad`) — L1 substrate rendered safe by construction | REQ-79/82/84, REQ-87, REQ-90/91, REQ-93, REQ-96, REQ-97/98, REQ-103, REQ-105, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136 | **aligned** (re-verified, not carried). Shared groups are genuinely shared: `nodeAxisGroupsShape` is spread into all six box-rendering kinds (`l1/schema.ts:1113, 1127, 1163, 1186, 1260, 1284`) and `surfaceAxesShape` reaches text/image via their axis schemas and slot/box/container via `l1SurfaceAxesSchema`. All three control-emitter obligations hold verbatim (`l1/render.ts:2091-2130`): unbound name → `html = ''`, zero-look baseline `unshift`ed ahead of the authored axes, `::placeholder { color: inherit }`. Flat-snapshot invariant throws before writing (`render/render.ts:292-301`). One-colour-system holds — `--color-` survives in `packages/framework/src` only inside comments explaining the retirement. Slot leaf carries required `name` + optional `behavior` (`schema.ts:1179-1180`). STORY-81 merge note still correctly describes STORY-81 as live; `tests/reconciliation-responsive-keyframes.test.ts` is confirmed retired. |
| STORY-82 (`story-46e3b3c7`) — Reproduction treatments | REQ-85, REQ-87, REQ-93, REQ-96 (+ pivot supersession) | aligned. REQ-87 vocabulary is clean throughout; `labelMode` framed as REQ-93 frames it and confirmed at `contact-form/meta.ts:41-47`; the `form`-slot repoint matches `meta.ts:58-61` with `submit` as a control at `:68`. |
| STORY-80 (`story-c490f1cf`) — Absolute values re-homed in L1 | REQ-79/84, REQ-114, REQ-137 | aligned on behaviour; **one stale corpus claim** (warning 1). The palette model verifies: `palette: l1PaletteSchema.optional()` (`schema.ts:989`) is the "palette is optional" guarantee, and the stated retrofit counts are still exactly right — `gigabytealchemy` carries 15 entries and `xgd` 7, with no `theme.palette` on either draft. |
| STORY-81 (`story-3569e1a4`) — Responsive layout mode per breakpoint | REQ-104 (+ pivot supersession) | aligned (verified this cycle, not carried): `l1LayoutKeyframeSchema.at` is a free `finite.nonnegative()` unchecked against the document's widths, `container.layout` is documented as the representative widest value the envelope holds to agreement, and `wrap` is a container-level boolean (`l1/schema.ts:278-316, 1273-1280`). |
| STORY-90 (`story-d2b5cb1c`) — Interaction state, scroll motion, pointer accent | REQ-99, REQ-100, REQ-108 | aligned (verified this cycle): the focus ring's `widthPx` is `finite.positive()` with no `none` variant, so "a focus indicator can never be authored away" is true of the vocabulary itself (`:804-811`); the reveal axis carries no horizontal travel and no entry scale, with the reason in-source (`:918-921`); an interaction state's paint delta is literally `...surfaceAxesShape`, which is what makes the shared envelope bounds apply to a hover-only texture or adjustment (`:819-826`). |
| STORY-91 (`story-2e4e2c45`) — L1 navigation / link role | REQ-106 | aligned (verified this cycle): `l1LinkSchema` has no way to request a new tab without its `rel` — the renderer always pairs it — and `href` goes through the same `isSafeUrl` allowlist as `image.src` (`:874-893`). The story's two documented intent/implementation divergences hold: `link` is absent from **both** `l1ControlSchema` and `l1SlotSchema` while present on text/image/box/container, which is exactly the "a module mount seam is excluded as well" claim. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-80 (`story-c490f1cf`) + STORY-83 (`story-d0a8cfad`) | story-body-edit | Both bodies describe a **four-site** corpus in the present tense, and two of those sites no longer exist. STORY-80's "Retrofit reach, as built": *"Of the four stored sites … The other two carry pre-L1 module-based pages with no L1 colour axes to convert; **they remain valid with no palette at all**, which is the 'palette is optional' guarantee in action."* STORY-83's second footprint fact: *"**Two of the four sites carry no palette**, and that is the model working. `1stcontact` and `harbor-cafe` hold pre-L1 module pages…"* `storage/sites` now holds exactly `gigabytealchemy` and `xgd`; `1stcontact` and `harbor-cafe` were deleted in `25362247bf` (REQ-140, free_and_reconciled, 2026-08-15) — confirmed with `git log --diff-filter=D`. Deliberately **not** a violation: no intent is contradicted, no behaviour claim is false, and the guarantee both bullets illustrate is independently true and verified (`packages/site-schema/src/schema.ts:989`, `palette: l1PaletteSchema.optional()`). It is measured evidence that has gone stale, and both stories explicitly disclaim site-definition data as capability surface, so it cannot cascade into an AC — an AC written against this corpus would violate that disclaimer rather than follow from it. The other half of STORY-80's bullet is still exactly correct: `gigabytealchemy` carries 15 palette entries and `xgd` 7, with no `theme.palette` on either. | In STORY-80, replace "Of the four stored sites, the two carrying L1 pages…" with the two that remain, and re-tense the deleted pair as history (e.g. "the two module-based sites that were in storage at the time carried no L1 colour axes and remained valid with no palette at all"). In STORY-83, re-tense the second footprint fact the same way. Keep both bullets — the "palette is optional" argument they carry is sound and worth keeping; only the corpus tense is wrong. Change nothing else in either body. |
| 2 | info | consistency | STORY-85 (`story-179b8c06`) | — | REPORT-3723 finding 1 is **closed**, verified against `schema.ts:569-624` rather than against the fix report. Both halves of the replacement sentence are true: the L1-page branch rejects unbound/dangling/double-bound/duplicate, and the no-`l1` branch is silent for a module carrying no `slot`. The five rejection rows above it and the orphan-seam legality sentence are unchanged and still correct. | none |
| 3 | info | consistency | STORY-82 + STORY-83 + STORY-85 | — | REPORT-3719 findings 1-6 all remain closed. Re-checked against source this cycle rather than accepted from the prior ledger: the `form`-slot repoint, `labelMode`, the REQ-87 vocabulary, STORY-83's `mounts` carve-out and its two stated pre-conditions (`l1/render.ts:2150-2168`), and the STORY-81 merge note. | none |
| 4 | info | exclusivity | STORY-83 + STORY-85 | — | The slot mount is described in both stories, with ownership partitioned explicitly in both directions ("This story owns the rule; STORY-83 owns the emission" / "The module *contract* … belongs to STORY-85"). Not a duplicate. The same holds for STORY-83 ↔ STORY-80 on colour (page-level document fields vs the value model) and STORY-83 ↔ STORY-90/91 on the axis groups (uniformity vs meaning), each disclaimed in both directions. | none |
| 5 | info | exclusivity | STORY-82 (`story-46e3b3c7`) | — | REPORT-3719 finding 8 carries forward unchanged: STORY-82 is provenance rather than capability surface, so duplication would bite at its ACs, not its body. Still correctly deferred to the AC-level cycle. | none — flagged for the AC-level cycle |
| 6 | info | — | STORY-82 (`story-46e3b3c7`) | — | The body's closing "Story Points: 2" still disagrees with `fields.story_points: 3`. Not intent drift and out of this check's scope; repeated only so a later editor does not mistake it for a finding. | none |

## Notes for the Editor

**The loop can exit here.** Attempts 7-9 each fixed one clause and introduced the
next, so the honest question this cycle was not "is the last patch right" but "is the
tree right". I re-derived the ledger from the ticket store, re-ran the coverage check
over all seven stories, and verified a broad sample of each body's falsifiable
absolutes against the source — roughly two dozen distinct claims across
`packages/site-schema/src/l1/schema.ts`, `packages/site-schema/src/schema.ts`,
`packages/framework/src/l1/render.ts`, both module `meta.ts` / `styles.css` /
`client.js`, `modules/html.ts`, `l2/contact-form.ts` and
`tools/generate/src/render/render.ts`. Every one held. The single warning is a stale
corpus count, not a behaviour claim.

**The one warning does not need a fix pass of its own.** It is safe to repair
opportunistically alongside any later edit to either story, and safe to leave as-is
until then. If it is repaired, the edit is a re-tensing of two bullets — resist
deleting them, because the "palette is optional" argument they carry is the reasoning
behind a live schema decision (`palette` being `.optional()`) and is not recorded
anywhere else in the tree.

**Two things worth knowing for the AC-level cycle.** (i) REPORT-3720's forwarded
`ac-add` for "the page-level binding rejections and `mountInL1`" should be authored
from the *corrected* clause: an AC asserting that a module must always name a seam
would fail against correct code, and specifically against the conformance harness's
default `oneModulePage` shape, which every module's five universal ACs run through.
(ii) The modules-only page is legal and deliberately preserved, but it is legacy — no
page under `storage/sites` uses it, scaffolding steers away from it, and the edit
channel refuses it. An AC should pin that it *validates*, not that it is recommended.

**Nothing needed escalation.** Every claim I checked was settled by the code on this
branch; no story body describes behaviour the intent ledger is silent about, and no
citation in any body names an abandoned vehicle ticket, so Step 2.5's escalation
carve-out was never reached.
