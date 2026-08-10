---
uid: comment-99b5ec22
id: COMMENT-890
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-10T07:21:05.163221+00:00'
updated_at: '2026-08-10T07:21:05.163221+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4e3ef72e
  kind: note
---

Report schema verified — `report_kind`, `subject_uid`, `level`, and the three integer counts all landed correctly.

## Result: **FAIL** — REPORT-1738 (`report-4e3ef72e`)

1 violation, 2 warnings, 0 needs_review.

### Intent ledger
CAP-86 carries no intent fields of its own. The chain runs through STORY-100 (`story-37a3921b`, `upgrade`): `intent_uid = bundle-15c1f647` (BUNDLE-16 = REQ-117 + REQ-115 + REQ-44) and `updated_by = REQ-118`. REQ-117 is the founding ask (the `1c copy get|set` write path, shared validator, atomicity, legible refusal); REQ-118 added image selection as the second half of the *same* surface. REQ-115 and REQ-44 count but land outside this capability.

### The violation
**CAP-86's own body is still pre-REQ-118.** Bullet 2 reads "which fields a region exposes — **plain words and nothing else**". REQ-118 (`free_and_reconciled`, merged `b2b9208c`) widened `L1FieldDescriptor.type` from `'string'` to `'string' | 'enum'` — verified on this branch at `packages/site-schema/src/l1/edit.ts:138` and `:240`. The body never mentions images, while its sole story is titled "Change the words **and choose the images** on my page".

What makes this a clean, cheap repair: STORY-100 and all 17 ACs *were* reconciled for REQ-118 — AC-991 already carries the "plain text or a pick from a closed list" wording, and AC-1024–1027 cover the image half. The drift is one layer thick and it is the top one.

### The warnings
- The capability title and `fields.name` ("Structured Copy Editing") carry the same drift — split out because a rename ripples into report titles and `name`-keyed lookups.
- **REQ-128** (`bundled`, imminent) inverts STORY-100's "a container… answers with an empty list". Confirmed *not* landed here (no `backgroundImageUrl` in `edit.ts`), so it is a warning today rather than a violation — with the two constraints that tend to vanish in a body rewrite noted for the editor: selection-only (no "none" option) and change-never-add.

### Two things I checked rather than assumed
- **The asset-listing deferral resolves.** STORY-100 sends REQ-118's AC-7 to "a separate capability" — that is CAP-88, which is `superseded` by CAP-89, where STORY-102 expresses it. No dropped ask, though the chain is only followable by title since no UID is named.
- **No exclusivity overlap.** STORY-101 (CAP-87) shares the same intent chain but states the boundary explicitly and describes the fields only from the gesture's side.

I recorded no `needs_review` — every claim in the story body traced to a ledger intent, including the ones that read like orphans (the both-channels re-render, the dismissible "nothing to edit here" divergence, the unicode-escaping defect). Three inbound `bundled` intents (REQ-126, REQ-129, REQ-128) are flagged in the editor notes rather than as findings, since their capability assignment isn't settled and guessing it would manufacture the drift this check exists to catch — REQ-129 in particular is worth a deliberate re-read against CAP-86's "neither has a private route to the draft" when it reconciles.
