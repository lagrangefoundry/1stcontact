---
uid: comment-a23ecd29
id: COMMENT-2577
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T18:20:37.101009+00:00'
updated_at: '2026-09-10T18:20:37.101009+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-37cdff44
  kind: note
---

Attempt 7 complete. Both findings closed with two AC-body edits; report is REPORT-3774 (`report-37cdff44`).

**Finding 1 (violation) — AC-1130.** Attempt 6's repair had pinned "the four **scaling** adjustments" to the percent-carrying set (which includes black-and-white), while the untouched identity paragraph used the same phrase for the identity-100 set — making the AC assert black-and-white's identity is 100%. It's 0. I verified this directly rather than trusting the report: `FILTER_CONTROLS` at `packages/site-schema/src/l1/edit.ts:794-800` gives `grayscalePct { identity: 0, scale: 100 }` beside three controls at `identity: 100`, so the percent set is 4 and the identity-100 set is 3 — the partitions genuinely differ. REQ-136 (lines 61, 106, 141) has already spent "scaling" on the identity-1 set, which is why the word had to go rather than be redefined.

Both partitions are now named explicitly and separately, plus a sentence stating they deliberately don't coincide. I also changed "each **scaling** adjustment" → "each **percentage** adjustment" in the Verification and named the per-control identities there — the report said the verification "must not move", but leaving the ambiguous word two paragraphs after the fix would have re-seeded the defect. Both are form-only; no assertion changed.

**Finding 2 (warning) — AC-1117.** "The values reported are the run's own as they stand in the draft" is false for a run declaring no weight — `edit.ts:564` seeds `weights[0]`, and `weightChoices` sorts ascending so that's the lowest declared face. Qualified per the assessor's clause, plus one sentence reconciling it against the size bullet, which justifies *withholding* size on the ground that a fabricated number is worse than an absent control.

**Cross-AC sweep** (the successor rule the report asked for): all 43 active ACs checked for `scaling`/`percentage`/`identit`. "Scaling" survives in one sibling, AC-1027, as the plain verb for resizing, explicitly contrasted against colour adjustment — no collision.

`npm test` on both affected suites: **2 files, 15 tests passed**. The `wrangler` EPERM output is the sandbox denying a log write, not a failure.

Two things worth flagging:

- I **did not** touch `tests/reconciliation-copy-edit-image-framing.test.ts:383-385`, which carries the old AC prose as a comment. The assessor scoped it to the uat pass, and within that file line 81 already defines the phrase REQ-136's way, so it's ambiguous rather than false. The report records the exact shape it should take.
- `edit.ts:786`, `edit.ts:1404`, and two test comments use "scaling" in REQ-136's *correct* sense. Those are right and must not be swept along — I called that out explicitly so a later pass doesn't "fix" them into being wrong.
