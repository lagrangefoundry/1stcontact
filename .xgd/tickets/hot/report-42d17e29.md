---
uid: report-42d17e29
id: REPORT-3723
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-09-10T11:32:52.288046+00:00'
updated_at: '2026-09-10T11:32:52.288046+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: story
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a (regression 800a17f7) · Capability: capability-ae9d65d6
(CAP-70) · Previous attempts: 8

**Attempt 8 (REPORT-3722) is confirmed.** REPORT-3721's single violation — the
sixth **orphan seam** row in STORY-85's rejection table — is genuinely repaired.
The table now carries exactly five rows, each of which I re-checked against
`packages/site-schema/src/schema.ts:568-635` rather than against the fix report's
assertion, and `grep -rn "orphan" packages/site-schema/src packages/framework/src`
still returns nothing. The row was moved into the sentence that records legal
states, as instructed, and nothing else in the section was rewritten.

The finding below is **new drift introduced by that same one-sentence repair**,
not a carried-forward failure. The replacement sentence closes with an absolute
that the code does not hold and that STORY-85's own adjacent text contradicts.

## Cumulative Intent Considered

The ledger is unchanged from REPORT-3719/3721. The window since REPORT-3721
(2026-09-10 11:24) contains no ticket movement at all — `git log` over
`.xgd/tickets/hot` since that report shows only the attempt-8 sequence itself
(`f7479c4ba5` story update, `cef5b8fdba` report, `b9384dc428` comment). The
coverage baseline established two cycles ago therefore stands unchanged, and this
cycle's delta is confined to what the fix pass edited.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules: typed config + named L1 presentation slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; no back-compat alias | YES |
| **REQ-93** (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding; fold seams; `contact-form` config incl. `labelMode`; renderer mounts the fragment; `mountInL1` conformance mode | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Document resource table + `@font-face`; L1 axes cover captured pixel-movers | YES |
| REQ-96 | free_and_reconciled | 2026-08-06 | `control` leaf; delete `carousel.config.view`; replace contact-form `intro`/`submit` with one required `form` slot; zero-CSS obligation | YES |
| REQ-97 / REQ-98 / REQ-105 | free_and_reconciled | 2026-08-06 | Shared surface + node-level axis groups; text measure; slot sizing | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Typed interaction state, scroll reveal + stagger, pointer-tracked accent; renderer safety floor | YES |
| REQ-103 / REQ-104 / REQ-106 / REQ-107 | free_and_reconciled | 2026-08-06 | Pattern texture + radial gradients; per-width layout track + wrapping row; typed link role + DOM ids; `validateL1` on the authoring path | YES |
| BUG-28 | free_and_reconciled | 2026-08-06 | contact-form enhancement must not cancel a baseline it cannot complete | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Relocatable document-relative URL emission | YES |
| REQ-114 / REQ-117 | free_and_reconciled | 2026-08-07 | L1 palette colour model; retire the 15-slot theme group; nowrap captured width becomes a floor | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape vocabulary / colour adjustment; deterministic emission | YES |
| REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-13 | Palette entry is one colour: `steps` deleted, continuous Oklab `shade` | YES |
| REQ-148 (BUNDLE-20) | free_and_reconciled | 2026-08-15 (rec. 08-31) | Behavior modules are plain-function components rendering in workerd; module chrome into the page stylesheet | YES |
| REQ-141…147, REQ-149, REQ-150 | free_and_reconciled | 2026-08-15…18 | workerd project, async SiteStore, build/deploy, control-app builder, AI host, cloud publish | NO — platform/builder surfaces |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-31 | Locale identity, formatting, slug reservation | NO — CAP-bcbcdaf1 / CAP-40a5527e |
| REQ-162 | free_and_reconciled | 2026-09-02 | Product ticket store, TypePack, material types | NO — CAP-dfb0a4ff |
| BUG-36 / BUG-37 / BUG-38 | free_and_reconciled | 2026-08-31 | control-app deployment, preview render cache, builder chat | NO — builder surface |
| REQ-154 / BUG-39 | bundled | 2026-08-31 | Browser Rendering driver; node chat-host streaming contract | NO — capture & chat surfaces |
| REQ-155…166 (minus 162) | draft | 2026-08-30…31 | ReferenceStore port, KB work, Library tab, ingestion | NO — drafts |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-85 (`story-179b8c06`) — Behavior modules: core + config + slots | REQ-85, REQ-87, REQ-96, BUG-28, REQ-148, REQ-93 | **repaired, with one new defect.** The orphan-seam row is out of the rejection table and the five survivors are verified against `schema.ts:566-618`. `mountInL1` matches `tools/generate/src/conformance/harness.ts:92-145` verbatim. **Finding 1**: the sentence that replaced the row closes with a one-directional absolute the page schema does not hold. |
| STORY-83 (`story-d0a8cfad`) — L1 substrate rendered safe by construction | REQ-79/82/84, REQ-87, REQ-90/91, REQ-96, REQ-97/98, REQ-103, REQ-105, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136, REQ-93 | aligned (re-verified, not carried). *What a `slot` emits* matches `packages/framework/src/l1/render.ts:2150-2168` — `state.mounts?.[node.name] ?? ''`, the verbatim insertion, and both stated pre-conditions are in the emitter's own comment. The STORY-81 merge note correctly describes STORY-81 as live with the pre-REQ-104 state archived. |
| STORY-82 (`story-46e3b3c7`) — Reproduction treatments | REQ-85, REQ-93, REQ-96, REQ-87 (+ pivot supersession of REQ-26/28/32/45) | aligned (re-verified against `packages/framework/src/modules/contact-form/meta.ts:30-78`): required `form` slot, `field` control `perItemOf: 'fields'`, optional `submit`, and `label`/`honeypot`/`turnstile` each `invariant: true`. `labelMode` is present as a captured a11y fact with the same framing REQ-93 gives it. |
| STORY-80 (`story-c490f1cf`) — Absolute values re-homed in L1 | REQ-79/84, REQ-114, REQ-137 | aligned (re-verified — `packages/site-schema/src/l1/palette.ts:96-107, 223-224`: `shade` is a continuous `[-1,+1]` scalar and "there are no steps") |
| STORY-81 (`story-3569e1a4`) — Responsive layout mode per breakpoint | REQ-104 (+ pivot supersession) | aligned (unchanged; the REQ-104 distinct-behaviour note is intact and agrees with STORY-83's merge note) |
| STORY-90 (`story-d2b5cb1c`) — Interaction state, scroll motion, pointer accent | REQ-99, REQ-100, REQ-108 | aligned (unchanged) |
| STORY-91 (`story-2e4e2c45`) — L1 navigation / link role | REQ-106 | aligned (unchanged) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-85 (`story-179b8c06`) | story-body-edit | The sentence attempt 8 added in place of the orphan-seam row ends: "The rule is one-directional: **every module must name a live, unique seam**; a seam need not attract a module." The first clause is false as an absolute — it forbids a page shape the schema deliberately preserves. `pageSchema.superRefine` (`packages/site-schema/src/schema.ts:570-582`) takes the `if (!page.l1)` branch first, and there it raises an issue **only** when `m.slot !== undefined`; a module with no `slot` on a page with no `l1` produces no issue. That is by design, not by omission — the schema's own doc comment (`schema.ts:524-545`) frames the page as **two shapes**, "a **behavior-module stack** … or an **L1 page**", plus REQ-93's composition of both. Four independent witnesses: (i) a **green UAT asserts it** — `tests/site-schema.test.ts:69-93` builds a page with `modules` non-empty, no `l1`, no `slot`, and `test_UAT_FC_REQ-3_valid_minimal_site_validates` (`:155-158`) asserts `ok === true`; (ii) the REQ-93 negative test `tests/req93-l1-slot-mounted-behaviors.test.ts:205-208` uses a page with non-empty `modules` and no `l1`, and it is invalid *only* because a `slot` is present — the controlled comparison; (iii) the renderer has a live branch for it, `tools/generate/src/render/render.ts:160` (`const body = l1 ? l1.html : rendered.join('\n')`), with `:186` noting the edit stylesheet rides at page level "so it covers a module-only page too"; (iv) it is the conformance harness's **default** shape — `oneModulePage` (`tools/generate/src/conformance/harness.ts:113-147`) emits `{ id, slug, title, modules: [instance] }` with neither `page.l1` nor `instance.slot` and adds both only when `opts.mountInL1` is set, after which `serveOneModulePage` validates via `loadSite` and **throws** on invalid (`:173-181`; `siteSchema.pages: z.array(pageSchema)`, `schema.ts:991`). The story also contradicts itself twice: the table row directly above correctly scopes the rejection to "a module **on an L1 page** that names no slot", and the `mountInL1` paragraph eight lines below names the very shape at issue — "conformance obligations are not weaker inside a seam than **standing alone**". A module standing alone names no seam. | Qualify the clause to the L1 page it belongs to and name the standalone shape as its complement, e.g.: "The rule is one-directional **on an L1 page**: every module mounted there must name a live, unique seam; a seam need not attract a module. A module on a page carrying no L1 document names no seam at all — that is the standalone shape `mountInL1` contrasts with." Change nothing else: the five rejection rows, the orphan-seam legality, the STORY-83 cross-reference and the `mountInL1` paragraph are all correct as written. |
| 2 | info | consistency | STORY-85 (`story-179b8c06`) | — | REPORT-3721 finding 1 is **closed**, verified against the live body rather than the fix report. The rejection table carries five rows; orphan-seam legality is stated in the legal-states sentence; the "each of these is an error" framing is intact and now true of every row it governs. | none |
| 3 | info | consistency | STORY-83 + STORY-82 | — | REPORT-3719 findings 1, 2, 3, 5 and 6 remain closed. Re-checked against code this cycle (`render.ts:2150-2168`, `contact-form/meta.ts:30-78`) rather than accepted from the prior ledger, since attempt 8 touched a story that cross-references both. | none |
| 4 | info | exclusivity | STORY-83 + STORY-85 | — | The mount is described in both stories, but ownership is partitioned explicitly in both directions (STORY-83: "The module *contract* … and the page-level rule that enforces it, belong to STORY-85"; STORY-85: "This story owns the rule; STORY-83 owns the emission"). No exclusivity violation. | none |
| 5 | info | exclusivity | STORY-82 (`story-46e3b3c7`) | — | REPORT-3719 finding 8 carries forward unchanged: STORY-82 is provenance rather than capability surface, so duplication would bite at its ACs, not its body. Still correctly deferred to the AC-level cycle. | none — flagged for the AC-level cycle |
| 6 | info | — | STORY-82 (`story-46e3b3c7`) | — | The body's closing "Story Points: 2" disagrees with `fields.story_points: 3`. Not intent drift and not in this check's scope; noted only so a later editor does not read it as a finding. | none |

## Notes for the Editor

**This is the same failure mode as last cycle, one clause further along.** Both
attempts 7 and 8 introduced an over-broad statement of what the page validator
rejects — attempt 7 as a table row, attempt 8 as the summary clause that replaced
it. The underlying pull is REQ-93's appended "Implementation (delivered)"
narrative, which describes the binding rule more absolutely than either REQ-93's
planning half or the code does. REPORT-3721 already warned that this section is
the source of the error; the warning holds for this repair too. **Fix the clause
from `schema.ts:568-576` and `harness.ts:113-147`, not from REQ-93's delivered
record.**

**Do not over-correct in the other direction.** The modules-only page is legal and
deliberately preserved, but it is *legacy*: no page under `storage/sites` uses it
with non-empty `modules` (the last two, `1stcontact` and `harbor-cafe`, were
deleted in `25362247bf` and were already unrenderable), scaffolding steers away
from it (`tools/generate/src/cli/scaffold.ts:10-21` — "L1 is *the* way to author a
page"), and the edit channel refuses it outright (`edit.ts:410`). So the repair is
a scope qualifier plus one complementary sentence — **not** a new paragraph
promoting the module stack as an authoring shape this story recommends. STORY-85's
existing framing ("a behaviour does not float alongside an L1 document, it mounts
*inside* one") is the right emphasis and should survive the edit intact.

**Scope the edit to one sentence.** I re-verified every other claim the last two
repairs added — the five rejections, the `mountInL1` paragraph, STORY-83's slot
carve-out and its two pre-conditions, STORY-82's contact-form paragraph — against
the code named in each ledger row. All hold. The section does not need rewriting;
it needs "on an L1 page" and one complementary sentence.

**Why this is a violation and not a warning.** REPORT-3720 forwarded an `ac-add`
to the AC cycle for "the page-level binding rejections and `mountInL1`". An AC
authored from the clause as it stands would assert that a module must always name
a seam, and the UAT proving it would fail against correct code — and would fail
specifically against the conformance harness's default mode, which is the path
every module's five universal ACs run through. That is the same cascade the last
cycle stopped one step earlier, and it is cheapest to stop here again.

**Nothing needed escalation.** The one finding was settled by the Step 2.5 tier-3
implementation check — code, REQ-93's planning half, and the story's own adjacent
text all agree against the single clause — so no `needs_review` was raised.
