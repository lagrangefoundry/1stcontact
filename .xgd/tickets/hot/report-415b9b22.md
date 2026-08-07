---
uid: report-415b9b22
id: REPORT-1590
type: report
title: Fix In-Page Copy Editing (story) — attempt 1
created_by: xgd
created_at: '2026-08-07T17:04:38.084845+00:00'
updated_at: '2026-08-07T17:04:38.084845+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — In-Page Copy Editing (story)

**Attempt**: 1
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All three violations and the one warning from report-bf64e711 were applied this
call. Findings 1, 2 and 4 share the single root cause the assessor named — REQ-118
reconciled into CAP-86 and CAP-88 but never into CAP-87 — so they were repaired
together in one STORY-101 body rewrite, with the lineage recorded on the ticket.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-101 (`story-3bf94bd4`) | Findings 1+2+4 applied in one rewrite (below) |
| 2 | field-edit (lineage) | STORY-101 | `updated_by: request-66e4c630`, matching STORY-100's record of the same intent |
| 3 | ac-edit | AC-956 (`acceptance_criterion-96e171f3`) | Finding 3: criterion + verification restated in terms of edit-channel artefacts and idempotence |
| 4 | ac-edit (title) | AC-956 | Title carried the same falsified byte-identity claim; retitled to match the corrected criterion |
| 5 | ac-add | AC-1028 (`acceptance_criterion-26ffac6d`) | Finding 2's coverage gap: the image click now has an AC to hang on the story prose added in #1 |

### #1 — STORY-101 body (findings 1, 2, 4)

- **Out of scope**: dropped `images`; replaced with image **framing** (crop,
  scale, scrim, rotation, edge effects, free positioning) plus asset upload and
  image processing — the non-goals REQ-118 §"Non-goals" does still defer. All
  other declared non-goals preserved verbatim.
- **In scope → "A form over that region's fields"**: restated kind-agnostically
  per the assessor's suggested edit — the form is built from whatever fields the
  region exposes (a copy run's words; an image region's closed picker plus alt
  text), and a region kind that gains fields reaches the operator through this
  loop with nothing in the gesture to change, "which is exactly how image
  selection arrived". This is the story text finding 2 asked for so the ac level
  has somewhere to hang the image-click criterion. **No parallel image-gesture
  story was created** — REQ-118's claim is one loop, not two.
- **Description** loop sentence and **"The page updating"** widened from "the
  words" to what the region exposes, so the body does not re-narrow one line
  below the bullet that widened it.
- **Technical Context**: `Depends on the edit rendering (CAP-84)` → `(STORY-98,
  in this capability)` — finding 4. CAP-85 / CAP-86 references left alone, as
  instructed.
- Added two Technical Context notes carrying REQ-118's recorded evidence: that
  kind-agnosticism was *proved* (no editor change; enum membership re-checked
  server-side so the closed picker is a property of the surface, not the UI), and
  the upstream enum-control limitation (options show the handle, no label or
  thumbnail; closed upstream per component policy, never wrapped here).
- Recorded the exemplar move the assessor flagged in "Notes for the Editor": the
  worked example of "a region with nothing to edit" is now the painted container,
  not the image, with the property itself unchanged.

### #3 — AC-956

The falsified sentence ("The bytes those two channels produce for a given
definition are unchanged by the **existence** of the edit channel", verified
against "the bytes produced for the same definition **without** the edit
channel") is replaced by the property the code actually holds and the UAT
actually proves: invoking the edit render — once or repeatedly — leaves the
shipped channels' bytes untouched, and neither channel picks up an edit-channel
artefact. The AC now states explicitly that byte-identity with a pre-edit-channel
build is *not* claimed, because the presentation-seam marker is emitted in every
channel by design (`packages/framework/src/modules/contact-form/index.astro:88`,
`carousel/index.astro:77`). This matches STORY-98's Technical Context ("the
criterion on leakage is about edit-channel artefacts … rather than resting on a
byte-identity claim the marker would falsify") and
`tests/reconciliation-edit-render-channel.test.ts:710`, which was already
asserting the weaker true property.

### #5 — AC-1028

Covers REQ-118's AC-1 on the gesture side: a click resolving to an image region
opens the same single form, offering a closed picker of the site's images (images
only; including ones the page does not use and ones the registry never declared)
plus alt text, with the current handle always among its own options — the
non-obvious correctness detail REQ-118 §1 calls out, since a `<select>` omitting
its own value silently swaps the image. Framing/upload explicitly not offered.

Existing evidence already in the tree for this AC (for the uat-level cycle to
link rather than author fresh):
`tests/req118-image-selection.test.ts::test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets`
and `::test_UAT_FC_REQ-118_the_modal_reads_its_picker_from_the_same_copy_transport`
(origin half, WEBUI-gated). `uat_coverage` was left unset — no AC on this story
carries that field today; the uat cycle owns it.

## Code Edits (if any)

None this call. All findings resolved in the matrix.

## Verification

```
npx vitest run tests/req118-image-selection.test.ts tests/reconciliation-edit-render-channel.test.ts
Test Files  2 passed (2)
     Tests  20 passed | 4 skipped (24)
```

The 4 skips are the `skipIf(!WEBUI_INSTALLED)` origin half of the REQ-118 suite —
the known, loudly-reported coverage caveat recorded in STORY-101's Technical
Context, not a new gap. Note that the "pre-existing failure" REQ-118 recorded at
`reconciliation-edit-render-channel.test.ts:316` (the `data-fc-page` regex) no
longer reproduces; that suite is fully green.

## needs_review Items Forwarded

None. No finding was categorized `needs_review`.

## Observations Forwarded (not findings)

| Item | Detail |
|---|---|
| Stale index entry (assessor's tooling observation) | `xgd ticket list --type story --filter fields.capability_uid=capability-25f7e486` still returns STORY-98, whose authoritative `fields.capability_uid` is `capability-12fee326`. Not touched — deliberately out of scope for a matrix-content fix, and correcting it by rewriting a field that is already correct would be a no-op edit made only to poke the index. Worth a tooling ticket. |
| uat-level follow-up | Per the assessor's note, `req117-copy-editing`'s AC1 test should be confirmed as evidence for the AC it names, now that its "nothing to edit" exemplar moved from the image to the painted container. STORY-101's body now records the move; the check itself belongs to the uat cycle. |
