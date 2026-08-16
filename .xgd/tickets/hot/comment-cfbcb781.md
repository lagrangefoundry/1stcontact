---
uid: comment-cfbcb781
id: COMMENT-1060
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T03:58:29.233793+00:00'
updated_at: '2026-08-16T03:58:29.233793+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-20d419a4
  kind: note
---

**REPORT-2061** (`report-20d419a4`) — **FAIL**: 2 violations, 3 warnings, 0 needs_review.

## The two violations

Both are on **STORY-101**'s ACs, and both have the same shape — an AC stating a behaviour is *absent* that a `free_and_reconciled` intent has since delivered, verifiably, in this branch.

**V1 — AC-1138** claims capitalisation never reaches the words and builds that into its evidence contract (*"assert the words' own capitalisation is **unchanged**"*). But REQ-138 (`free_and_reconciled`) names four parameters and lists `textTransform` → `--preview-text-transform` in its own field table; the blocking mechanism is repaired at `apps/control-app/src/builder/builder.css:281-284`; and the covering UAT asserts the opposite at `tests/reconciliation-copy-edit-live-preview.test.ts:515`. The AC's own escape clause — "the day the words are drawn in something that carries that property, this assertion fails and the criterion is rewritten" — has been triggered.

**V2 — AC-1028** states *"Framing (crop, scale, scrim, rotation, position) … are not offered."* REQ-136 delivers framing through this very dialog: `copyFieldsOf` returns `src`, `alt`, then `...framing.fields` for an image node (`packages/site-schema/src/l1/edit.ts:716-733`), supplying Fill mode, Pan across/down, Corner rounding, Rotate and Scale. Only crop and scrim genuinely remain out.

**STORY-98's 14 ACs are clean** — full coverage of its story body, no overlaps.

## Two things worth your attention

**The story level is unrepaired and this must be fixed with it.** REPORT-2060 (story level) failed on 2026-08-16 with 3 violations; STORY-101's body was last touched 2026-08-13. My violations are the AC-level twins of its violations. Because the `ac` cycle takes the story body as its working reference, repairing either layer alone re-derives the drift — a fixed AC-1138 against an unfixed story body just reads as the AC drifting. They need one pass.

**I could not run the tests.** Bash test execution is denied in this session's don't-ask mode, so I report the test assertion as it reads *in source*, not as an observed pass. It's additionally gated on `WEBUI_INSTALLED`, which I also couldn't check. That doesn't weaken either violation — both rest on AC prose contradicting a reconciled intent plus named file:line delivery — but it does mean the runtime evidence for capitalisation may be skipping here, which is a `uat`-level question. If you want that confirmed, I'd need permission to run vitest.

I also recorded three ACs (AC-1044, AC-1050, AC-1123) that were checked against REQ-136 and **correctly survive it** — AC-1050 especially, since framing is scoped to the `image` leaf only and a panel's background stays pinned. That's the one most likely to get over-corrected by someone applying V2 too broadly.
