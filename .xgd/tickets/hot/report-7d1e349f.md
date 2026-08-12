---
uid: report-7d1e349f
id: REPORT-1902
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T21:31:02.499429+00:00'
updated_at: '2026-08-12T21:31:02.499429+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-8a132869
  plan_item_index: '2'
---

Plan item 2 is applied. Summary of what I did and the judgment calls behind it:

**Read first (chain of authority):** REQ-136's body (phase 1 marked DELIVERED, no comments on the ticket), then `packages/site-schema/src/l1/edit.ts` — `imageFramingFields`, `shapeChoices`, `FILTER_CONTROLS`, `copyFieldsOf`, `IMAGE_FRAMING_FIELDS`, `writeImageFraming`/`applyFraming`, `rangeError`, `applyCopyFields` — plus the 9 FC UATs as evidence of the observable boundary. Code and intent agree; no divergence needed absorbing.

**STORY-100 body:** retired the stale `**Image framing** — crop, scale, scrim, rotation…` deferral (the condition it was deferred under — write the fold's own fields, not a parallel vocabulary — is now satisfied), and replaced it with the *narrower* deferrals that are actually still true (zoom/source-rect crop, tint over a picture, background-surface framing, drag handles, sepia/invert). Split the colour deferral into "choosing a colour" (still blocked on the palette) vs "adjusting a picture's colour" (bounded numbers, needs no palette). Added the framing paragraph, the bakes-nothing paragraph, the field-order claim, and a "leaves no trace" in-scope bullet. Title extended to name the new surface.

**Two things I added beyond the plan, both from the code rather than the plan text:**
- A Technical Context entry recording that the vocabulary did **not** grow a third time — thirteen controls, zero new field shapes — which is the evidence the narrowing axis was the right one.
- An honest limitation the plan didn't name: framing controls report whole numbers, so a value the AI set between two of them (`scale: 1.075`) reads back rounded and a full-form re-save writes the rounded value and reports it changed. That is the one place the general "a no-op save changes nothing" rule is a claim about *expressible* values. Recorded as Technical Context, not as an AC, and not asserted in the ACs I wrote.

**ACs** — 4 generalised (1024 order + framing controls; 1027 choosing → choosing *or adjusting*; 1121 size bound → every bounded control, with the pill-radius case named; 1122 typography → any parameter edit, plus the empty-container half), 4 added (typed pan pair, colour-adjustment identities, union shape list, browser-default read-back). All behavioural — no function or file names in AC text.

Note: `xgd ticket children` lists each *modified* AC twice (old and new title). That is pre-existing listing behaviour — item 1's AC-725/AC-802 show the same doubling — not a duplicate ticket; `xgd ticket get` returns one active ticket per UID.

```
Upgrade mutations applied for plan item 2 of 4

Target Stories: story-37a3921b
Primary Story UID: story-37a3921b
Stories Modified: 1
ACs Modified: 4
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-37a3921b"
  acceptance_criteria:
    modified: ["acceptance_criterion-8b6792de", "acceptance_criterion-0bc092af", "acceptance_criterion-db9faa7b", "acceptance_criterion-66f57a24"]
    added: ["acceptance_criterion-d6db5412", "acceptance_criterion-0e2f38fa", "acceptance_criterion-3648a0a0", "acceptance_criterion-f8ea23cf"]
    removed: []

Progress: 2 of 4 plan items complete
```

No new story tickets were created and no runtime code was touched (`git status` clean; the only commits are the ticket mutations above). STORY-101's AC-1028/AC-1044 were left alone, per the plan's step 3b.
