---
uid: report-bf64e711
id: REPORT-1589
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=story)'
created_by: xgd
created_at: '2026-08-07T16:59:45.887511+00:00'
updated_at: '2026-08-07T16:59:45.887511+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 3
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability carries no `intent_uid` of its own; the ledger is built from its
two stories' `intent_uid` / `updated_by` chains, widened to every reconciled
intent whose asked behaviour lands between the pointer and the write path.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, via BUNDLE-14 `bundle-0385746c`) | free_and_reconciled | 2026-07-31 (merged `cd8f98c8`) | The edit render: third non-functional channel, settled state, derived segmentation, render-scoped L1 addresses, renderer-drawn outlines, no leakage into shipped channels | YES |
| REQ-117 (`request-395b67e6`, via BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | 2026-07-31 (merged `1741ee5d`) | The gesture: click→target (innermost-wins, module/slot scoping), `mountFields` modal in buffered commit, one Save = one diff, re-render + refresh, refusal keeps the words, View mode unaffected. Also moved the stamp vocabulary to `site-schema`, added the `data-fc-page` page stamp, homed the hover treatment in `L1_EDIT_CSS`, and made `contact-form` mark its seam | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 (merged `b2b9208c`) | Image selection as the **second half of the same loop**: clicking an image segment offers a picker of the site's assets; `L1FieldDescriptor.type` widened to `'string' \| 'enum'`; explicitly **no editor change** — the loop is kind-agnostic | YES |
| REQ-115 (`request-a6740b4a`, via BUNDLE-16) | free_and_reconciled | 2026-07-31 | Builder shell, origin, View/Edit modes — CAP-85, not this capability | YES (adjacent) |
| BUG-32 (`bug-5cabb340`) | free_coded | 2026-08-05 | `@gendevlabs` → `@lagrangefoundry` webui scope rename; touches only docstrings in this capability's tests | not yet reconciled; no behavioural ask here |
| REQ-119 (`request-64864801`) | draft | 2026-07-31 | Request-time draft/edit renders inside control-app (would retire the stale-rendering failure mode) | NO — draft |
| REQ-44 (via BUNDLE-16) | free_and_reconciled | 2026-07-03 | Tooling hygiene — unrelated | NO (out of capability) |

Walking chronologically: REQ-116 establishes the render, REQ-117 adds the
gesture and back-fills the render (page stamp, vocabulary, seam marker, hover
CSS), and **REQ-118 retires REQ-117's "Images — T4" non-goal** by making an
image segment expose fields through the identical gesture. The current
cumulative intent is therefore copy **and** image selection through one
kind-agnostic click→form→save→re-render loop over one edit render.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 (`story-af36c2cb`, upgrade) | REQ-116 (intent), REQ-117 (updated_by BUNDLE-16) | aligned — every REQ-116 AC and every REQ-117 renderer-side addition is expressed in the body (page stamp, published vocabulary, seam-marking obligation, renderer-drawn hover). Its "placement note (resolved)" is verifiably true: STORY-85 (`story-179b8c06`, CAP-70) now carries the settled state as its second declared zero-CSS carve-out. One downstream AC (AC-956) contradicts the body — finding 3 |
| STORY-101 (`story-3bf94bd4`, feature) | REQ-117 (intent) | **drift: REQ-118 (free_and_reconciled) retired the images non-goal and reached the operator through this gesture, but never touched this story** — it carries no `updated_by`, while STORY-100 (CAP-86) and STORY-102 (CAP-88) both do. Findings 1, 2, 4 |
| capability body (CAP-87) | REQ-116 + REQ-117 | aligned as far as it goes; its gesture scope ("the form that opens over that region's exposed fields") is already kind-neutral and so does not itself need the REQ-118 edit |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | Body's **Out of scope** reads "(the intent's declared non-goals): … images", quoting REQ-117's "Images — T4". T4 **is** REQ-118 (`request-66e4c630`, free_and_reconciled, merged `b2b9208c`), which retired that non-goal: `copyFieldsOf` now returns `src` (enum) + `alt` for `kind: 'image'` (`packages/site-schema/src/l1/edit.ts:233-247`), and REQ-118 §5 records that **no editor change was needed** — clicking an image segment opens the same modal. The story therefore excludes behaviour that reaches the operator through the very gesture it owns | Drop `images` from the out-of-scope list; state in **A form over that region's fields** that the form is built from whatever fields the region exposes — a copy run's words, or an image region's closed picker plus its alt text — and that image selection arrived through this loop unchanged. Keep framing controls (crop/scale/scrim) out of scope, which REQ-118 does still defer |
| 2 | violation | coverage | CAP-87 story tree (gap surfaces at STORY-101) | story-body-edit | REQ-118's operator-facing ask — *"clicking an image segment offers a picker of the site's assets"* (its AC-1) — is expressed nowhere in this capability. STORY-100 (CAP-86) covers only the derivation/write half (AC-1024–AC-1027) and explicitly puts out of scope "the browser gesture that turns a click into an address, the modal it opens and the frame refresh that follows"; STORY-102 (CAP-88) covers only the asset listing. The gesture half is unowned, so the matrix has no element asserting that the modal opens on a non-copy segment at all | Extend STORY-101's in-scope prose so the gesture is stated kind-agnostically (a click resolves to a region and opens a form over whatever that region exposes), giving the ac level a place to hang an AC for "clicking an image segment opens its picker". Do not create a parallel image-gesture story — REQ-118's whole claim is that this is one loop, not two |
| 3 | violation | consistency | AC-956 (`acceptance_criterion-96e171f3`, under STORY-98) | ac-edit | STORY-98's Technical Context states the leakage criterion "is about *edit-channel artefacts* and says so explicitly rather than resting on a byte-identity claim the marker would falsify". AC-956 rests on exactly that claim: *"The bytes those two channels produce for a given definition are unchanged by the existence of the edit channel"*, verified by *"Compare the bytes … against the bytes produced for the same definition without the edit channel"*. The seam marker is emitted in **every** channel — `packages/framework/src/modules/contact-form/index.astro:88` and `carousel/index.astro:77` emit `data-l1-slot` ungated — and REQ-117 added the contact-form one, so a page with a contact form is not byte-identical to its pre-edit-channel output. The implemented UAT (`tests/reconciliation-edit-render-channel.test.ts:710`) asserts the weaker, true property (preview bytes unchanged across *invoking* the edit render), so it is the AC text that is out of step with both the story and the code | Restate AC-956's second paragraph and its Verification in terms of edit-channel artefacts plus the idempotence the test actually proves (rendering the edit channel leaves the shipped channels' bytes untouched), dropping the "without the edit channel" baseline that the seam marker falsifies |
| 4 | warning | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | Technical Context says "**Depends on the edit rendering (CAP-84)** for the region addresses, the page coordinate …". CAP-84 (`capability-25f7e486`) is `superseded`; its sole story STORY-98 was moved into CAP-87, and CAP-87's own body records the consolidation. The story presents an intra-capability relationship as a dependency on a retired capability | Point the reference at STORY-98 within this capability (or drop the parenthetical), leaving the CAP-85 / CAP-86 references — which are still correct — alone |
| 5 | info | consistency | STORY-98 | — | The "placement note … (resolved)" is accurate: STORY-85 (CAP-70) carries the settled state as a second declared carve-out, bounded to the edit channel by the document-level edit marker. The matrix no longer holds a proposition and its negation | none |
| 6 | info | exclusivity | STORY-101 (AC-997) vs STORY-100 (AC-983) | — | "One confirmed form is one change" appears on both sides of the capability boundary, but from different mechanisms — buffered modal commit (the gesture) vs whole-or-nothing application of a change map (the write path). Complementary, not duplicate | none |
| 7 | info | coverage | STORY-101 | — | The stale-rendering guard is framed as "a standing failure mode … until request-time rendering replaces on-disk renderings". REQ-119 is still `draft`, so the framing is correct today; revisit when REQ-119 reconciles | none |

## Notes for the Editor

**One root cause behind findings 1, 2 and 4.** REQ-118 reconciled into CAP-86
(STORY-100, via `updated_by`) and CAP-88 (STORY-102, new) but never into CAP-87,
even though its headline user-facing sentence — *click an image, pick a
different one* — is a gesture, and this capability owns gestures. The repair is
one edit to STORY-101's body; the ac level will then need an AC for the image
click, which is why finding 2 is filed at story level rather than left for the
ac cycle to discover with no story text to hang it on.

**Finding 3 is filed here rather than deferred to the ac level** because the
contradiction is *with the story body I was validating* — STORY-98 asserts what
its own AC says, and the AC says the opposite. The ac cycle takes the story body
as its working reference and would reach the same conclusion; flagging it now
keeps the cycles from disagreeing.

**REQ-118 also moved a REQ-117 test's exemplar** ("a segment with nothing to
edit" changed from an image to a painted container, because T4 gave images
fields). AC-1001 / AC-1002 are worded kind-agnostically and survive that, but
the uat-level cycle should confirm `req117-copy-editing`'s AC1 test still reads
as evidence for the AC it names.

**Tooling observation, not a finding.** `xgd ticket list --type story --filter
fields.capability_uid=capability-25f7e486` still returns STORY-98, whose
authoritative `fields.capability_uid` is `capability-12fee326` (its
`last_field_updated` is that very field). The index appears to retain the
pre-consolidation entry. Harmless for this check — every conclusion above was
taken from `ticket get`, not from the filter — but it will mislead anyone
auditing CAP-84's emptiness by list alone.
