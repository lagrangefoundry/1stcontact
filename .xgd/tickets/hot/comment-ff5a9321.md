---
uid: comment-ff5a9321
id: COMMENT-897
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-10T07:59:26.130809+00:00'
updated_at: '2026-08-10T07:59:26.130809+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-34f54ad3
  kind: note
---

AC-level alignment check complete. **REPORT-1750 (report-34f54ad3) — FAIL**: 1 violation, 1 warning, 0 needs_review.

## What I checked

Four `feature` stories, 36 active ACs, against an intent ledger of four reconciled intents (REQ-101, REQ-102 via BUNDLE-11; REQ-114 via BUNDLE-14; REQ-118).

**Three stories are clean.** STORY-93 (scaffold), STORY-92 (font provenance) and STORY-102 (asset store) each map their story body's behavioural surface onto ACs 1:1, and — notably — each body explicitly names behaviours it deliberately does *not* assert (no thumbnail/label on the asset listing; invalid definitions skipped by the font reference join; commercial-use and self-hosting recorded but ungated). In every case no AC asserts them, so those are honoured omissions rather than coverage gaps.

## The finding

**AC-932 under STORY-97 is substantially redundant** (exclusivity violation, `ac-edit`):

- Its claim *"entry count materially smaller than distinct colour count"* is verbatim the same criterion — and the same verification shape — as **AC-941** bullet 1.
- Its claim *"no colour lost"* is a strictly weaker form of **AC-944**, which asserts byte-identical render plus exact per-reference round-trip including opacity.
- Only one clause is unique: *"sites with no L1 colour axes carry no palette at all and remain valid"* — the vacuous-retrofit case STORY-97's body records for `1stcontact` and `harbor-cafe`. No other AC covers it (AC-939 covers zero-colour *census*, AC-945 covers refuse-on-failure). So the fix is to **narrow** AC-932 to that clause, not deprecate it.

**Warning on the same element**: AC-932 freezes repo state into a criterion — *"6 entries from 16 distinct RGB and 8 entries from 30"*. STORY-97's Technical Context rules this out directly ("the durable property is the method and the collapse … not the frozen counts") and records that this exact drift already happened once, when REQ-114's AC7 froze DOC-23 §5.3's 17/15 and the site moved to 18/16.

Provenance worth passing on: AC-932 was authored under STORY-80 (the palette *model* story, a different capability) on 2026-08-06 and moved to STORY-97 on 2026-08-09. It was the model's end-to-end assertion; landing beside purpose-built retrofit criteria is what made it redundant. Any other AC moved in that operation may carry the same problem — outside the four stories I could see.

One incidental: the ticket index still returns AC-932 under the old `story_uid=story-c490f1cf` filter. The ticket's own field says `story-5e7eb0c5`, so that's stale indexing in XGD, not matrix drift — recorded as info so a downstream editor doesn't read it as dual-parenting.
