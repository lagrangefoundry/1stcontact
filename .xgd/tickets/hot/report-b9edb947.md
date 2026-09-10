---
uid: report-b9edb947
id: REPORT-3721
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=story)'
created_by: xgd
created_at: '2026-09-10T11:24:51.328574+00:00'
updated_at: '2026-09-10T11:24:51.328574+00:00'
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
(CAP-70) · Previous attempts: 7

**Attempt 7 (REPORT-3720) is substantially confirmed.** All four violations and both
warnings from REPORT-3719 were re-checked element by element against the current
ticket bodies and against the code on this branch; every one is genuinely repaired,
and every code citation the fix report leaned on holds. The single finding below is
**new drift introduced by that repair**, not a carried-forward failure: the table
added to STORY-85 lists a sixth rejection the validator does not implement and the
intent never asked for.

## Cumulative Intent Considered

The ledger is unchanged from REPORT-3719 (2026-09-10). It is reproduced in condensed
form below; the full chronological table with per-intent asks is in that report and
was re-checked rather than re-derived. The window since is empty of substrate intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-84 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: L1 typed substrate + envelope + sole renderer; delete semantic layout modules and their ~20 dials | YES |
| REQ-85 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Reframe carousel / contact-form as vetted modules: typed config + named L1 presentation slots | YES |
| REQ-87 | free_and_reconciled | 2026-07-24 | `capability module` → **behavior module**; `slot.capability` → `slot.behavior`; no back-compat alias | YES |
| **REQ-93** (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-schema slot binding; fold seams; `contact-form` config from capture incl. `labelMode`; renderer mounts the fragment into the slot; `mountInL1` conformance mode | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-29 | Document resource table + `@font-face`; L1 axes cover captured pixel-movers | YES |
| REQ-96 | free_and_reconciled | 2026-08-06 | `control` leaf; delete `carousel.config.view`; replace contact-form `intro`/`submit` with one required `form` slot; zero-CSS obligation | YES |
| REQ-97 / REQ-98 / REQ-105 | free_and_reconciled | 2026-08-06 | Shared surface + node-level axis groups; text measure; slot sizing | YES |
| REQ-99 / REQ-100 / REQ-108 | free_and_reconciled | 2026-08-06 | Typed interaction state, scroll reveal + stagger, pointer-tracked accent; renderer safety floor | YES |
| REQ-103 / REQ-104 / REQ-106 / REQ-107 | free_and_reconciled | 2026-08-06 | Pattern texture + radial gradients; per-width layout track + wrapping row; typed link role + DOM ids; `validateL1` on the authoring path | YES |
| BUG-28 | free_and_reconciled | 2026-08-06 | contact-form enhancement must not cancel a baseline it cannot complete | YES |
| REQ-109 / BUG-30 | free_and_reconciled | 2026-08-06 | Relocatable document-relative URL emission | YES |
| REQ-114 / REQ-117 | free_and_reconciled | 2026-08-07 | L1 palette colour model; retire the 15-slot theme group; nowrap captured width becomes a floor | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape vocabulary / colour adjustment; deterministic emission | YES |
| REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-13 | Palette entry is one colour: `steps` deleted, continuous Oklab `shade`; supersedes REQ-114 AC3 byte-identity | YES |
| REQ-148 (BUNDLE-20) | free_and_reconciled | 2026-08-15 (rec. 08-31) | Behavior modules are plain-function components rendering in workerd; module chrome into the page stylesheet | YES |
| REQ-141…147, REQ-149, REQ-150 | free_and_reconciled | 2026-08-15…18 | workerd project, async SiteStore, Cloudflare store, build/deploy, control-app builder, AI host, Access gate, cloud publish, Vite SSR | NO — platform/builder surfaces |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-31 | Locale identity + `lang`/`dir`; money/time formatting; locale-shaped slug reservation | NO — CAP-bcbcdaf1 / CAP-40a5527e |
| REQ-162 | free_and_reconciled | 2026-09-02 | Product ticket store, TypePack, material types | NO — CAP-dfb0a4ff |
| BUG-36 / BUG-37 / BUG-38 | free_and_reconciled | 2026-08-31 | control-app deployment, preview render cache, builder chat | NO — builder surface |
| REQ-154 / BUG-39 | bundled | 2026-08-31 | Browser Rendering driver; node chat-host streaming contract | NO — capture & chat surfaces |
| REQ-155…166 (minus 162) | draft | 2026-08-30…31 | ReferenceStore port, KB work, Library tab, ingestion | NO — drafts |
| REQ-134 | abandoned | 2026-08-13 | Image-generation component | NO |

**Change since REPORT-3719**: none. Every `request`/`bug` ticket updated after
2026-08-25 was re-listed this cycle; the only movement is REQ-162 (2026-09-02,
CAP-dfb0a4ff) and a set of drafts. No substrate intent entered or left the ledger,
so the coverage baseline established last cycle stands and the delta is confined to
what the fix pass changed.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-82 (`story-46e3b3c7`) — Reproduction treatments | REQ-85, REQ-93, REQ-96, REQ-87 (+ pivot supersession of REQ-26/28/32/45) | **repaired — aligned.** The contact-form paragraph now names the required `form` slot with a `control` leaf per element and the never-bound `label`/`honeypot`/`turnstile` invariants; `intro`/`submit` survive only as a named REQ-96 v3→v4 supersession. `labelMode` is restored and framed as REQ-93 frames it (a captured a11y fact, not a dial). Post-REQ-87 vocabulary throughout — the sole remaining "capability module" string is the historical citation in the new Vocabulary note. All three claims verified against `packages/framework/src/modules/contact-form/meta.ts:41-47, 57-61, 66-78`. |
| STORY-83 (`story-d0a8cfad`) — L1 substrate rendered safe by construction | REQ-79/82/84, REQ-87, REQ-90/91, REQ-96, REQ-97/98, REQ-103, REQ-105, REQ-107, REQ-108, REQ-109/BUG-30, REQ-114, REQ-117, REQ-136, REQ-93 | **repaired — aligned.** The negated renderer clause is replaced by "What a `slot` emits: placeholder, or a mounted fragment", which states the mount and puts the carve-out's two pre-conditions on record rather than restoring the false absolute — matching `packages/framework/src/l1/render.ts:2150-2168` (`state.mounts?.[node.name] ?? ''`) and its comment. The STORY-81 merge note now describes STORY-81 as live with the *pre-REQ-104* state archived. |
| STORY-85 (`story-179b8c06`) — Behavior modules: core + config + slots | REQ-85, REQ-87, REQ-96, BUG-28, REQ-148, REQ-93 | **repaired, with one new defect.** REQ-93's page-level rule and `mountInL1` are now expressed in-place after the two-directional control check, and the `mountInL1` description matches `tools/generate/src/conformance/harness.ts:92-145` verbatim (single full-width unstyled `slot`, keyframe at every probed width). The REQ-148 half remains aligned. **Finding 1**: the rejection table added by the repair lists a sixth row the validator does not implement. |
| STORY-80 (`story-c490f1cf`) — Absolute values re-homed in L1 | REQ-79/84, REQ-114, REQ-137 | aligned (unchanged since last cycle; re-checked — `steps`/`step` stated as gone, matching `packages/site-schema/src/l1/palette.ts:33-36, 224`) |
| STORY-81 (`story-3569e1a4`) — Responsive layout mode per breakpoint | REQ-104 (+ pivot supersession) | aligned (unchanged; the REQ-104 distinct-behaviour note is intact and now agrees with STORY-83's corrected merge note) |
| STORY-90 (`story-d2b5cb1c`) — Interaction state, scroll motion, pointer accent | REQ-99, REQ-100, REQ-108 | aligned (unchanged) |
| STORY-91 (`story-2e4e2c45`) — L1 navigation / link role | REQ-106 | aligned (unchanged) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-85 (`story-179b8c06`) | story-body-edit | The section "Where a behaviour sits on a page" introduces its table with "Binding is validated, never best-effort. **Each of these is an error with a machine-readable path, not a silent no-op**", then lists six rows — including **orphan seam** ("a `slot` in the tree no module binds"). An orphan seam is **not** an error. `pageSchema`'s `superRefine` (`packages/site-schema/src/schema.ts:568-635`) raises issues for exactly five conditions — `slot`-with-no-`l1`, duplicate slot names, unbound module, dangling slot name, double-bound seam — and then falls through; nothing anywhere iterates unbound seam names (`grep -rn "orphan" packages/site-schema/src packages/framework/src` returns no hit, and `l1/slots.ts` only collects names). The schema's own doc comment at `schema.ts:540-544` enumerates four rejections and omits orphan. REQ-93's own Scope §1 and Acceptance bullets ask only for dangling-name and unbound-module rejection; they never ask for orphan rejection. The row's `why` column contradicts its own table header ("the seam stays the inert placeholder (**legal**, but the mount is absent)"), and STORY-83's repaired slot section states the same legality as a positive claim ("With no mount supplied it is the inert labelled placeholder … which is what this story owns and what the round-trip gate sees"). So the two stories now disagree, and one of them disagrees with the code. | Move the orphan-seam row out of the rejection table into the sentence that already records legal states ("Both empty is legal"): an unbound seam is legal and renders as the inert placeholder. Leave the other five rows and the "each of these is an error" framing intact — they are all correct as written. |
| 2 | info | consistency | STORY-82 (`story-46e3b3c7`) | — | REPORT-3719 findings 1, 2 and 5 are **closed**. Verified against the live body, not the fix report's assertion: the required `form` slot and per-element `control` leaves are present, `labelMode` is described as a captured fact with the a11y tree as its only witness, and the retired vocabulary is gone from every use position. | none |
| 3 | info | consistency | STORY-83 (`story-d0a8cfad`) | — | REPORT-3719 findings 3 and 6 are **closed**. The security dimension the prior report asked to be put on record is present and correctly scoped: the surviving absolute is stated as "no value originating in instance data reaches the browser except through a typed sink", which is the form that is actually true of the emitter. | none |
| 4 | info | exclusivity | STORY-83 + STORY-85 | — | Both stories gained a section about the same mount this cycle, but ownership is explicitly partitioned in both directions — STORY-83: "The module *contract* that defines a valid binding, and the page-level rule that enforces it, belong to STORY-85"; STORY-85: "This story owns the rule; STORY-83 owns the emission." No exclusivity violation. | none |
| 5 | info | exclusivity | STORY-82 (`story-46e3b3c7`) | — | REPORT-3719 finding 8 carries forward unchanged: STORY-82 remains provenance rather than capability surface, and duplication would bite at its ACs rather than its body. Still correctly deferred to the AC-level cycle. | none — flagged for the AC-level cycle |

## Notes for the Editor

**Do not repair finding 1 by consulting REQ-93's "Implementation (delivered)"
section — it is the source of the error.** That appended section claims the page
refine rejects "a seam present in the tree that no module binds (orphan)". It does
not, and never did on this branch. REQ-93's *planning* half (Scope §1, Acceptance)
asks only for the dangling-name and unbound-module rejections, and the code
implements exactly what the planning half asks plus double-binding and duplicate
names. Where an intent's planning half, its acceptance bullets and the implementation
all agree against a single line in the delivered-record narrative, the narrative is
what is wrong. REPORT-3719's finding 4 repeated that line ("its five rejections …
orphan seam"), and attempt 7 faithfully carried it into STORY-85 — with the row's
own `why` column silently correcting it back to "legal". The fix is a one-row move,
not a re-litigation of REQ-93.

**This is a one-line edit, and the rest of STORY-85's new section is correct.** The
other five rejections, the "both empty is legal" sentence, the cross-reference to
STORY-83, and the entire `mountInL1` paragraph were each checked against
`schema.ts:568-635` and `conformance/harness.ts:92-145` and match. Resist the urge
to rewrite the section.

**The AC-level cycle inherits a corrected list.** REPORT-3720 explicitly forwarded
"the page-level binding rejections and `mountInL1` have no acceptance criterion" as
an `ac-add` for the AC cycle. That is why finding 1 is a violation rather than a
warning: an AC authored from the table as it currently stands would demand an
orphan-seam rejection, and the UAT proving it would fail against correct code —
converting a one-row story defect into a false `code-issue`. Repairing it here stops
the cascade at the cheapest point.

**Attempt 7 did what the previous six did not.** REPORT-3719 recorded that STORY-82's
body was byte-for-byte unrepaired since `bundle-31e474b9` and that six attempts had
never reached these bodies. This cycle all three targeted bodies show real edits
(commits `0bb112173a`/`08fe1377dd`, `8b2ad38d75`/`a0847539eb`, `68e9040d3c`/`87b42bf4fe`),
`updated_by` is `request-f26cbe32` on all three, and `uat_coverage` was correctly
left alone. The repair path is working; the remaining finding is a transcription
error inside an otherwise sound pass, not a repeat of the stall.

**Nothing needed escalation.** Every finding cites a `free_and_reconciled` intent,
and the one violation was settled by Step 2.5's tier-3 implementation check rather
than escalated — the code and the intent's planning half agree, so the ambiguity in
the delivered-record narrative is resolvable without the operator.
