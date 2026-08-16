---
uid: comment-95b6de94
id: COMMENT-1080
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T06:36:39.014563+00:00'
updated_at: '2026-08-16T06:36:39.014563+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0a2d49ad
  kind: note
---

**Result: FAIL** — 2 violations, 5 warnings, 0 needs_review. Report **REPORT-2081** (`report-0a2d49ad`), schema verified against the workflow's exit conditions.

## What drove the verdict

Both violations are the *same sentence*, and it is the one this cycle's story-level check (REPORT-2080, FAIL) had already caught in the story body:

- **AC-1120** and **AC-988** both say a value posted for a read-only field is refused — refusal on **presence**.
- The shipped rule is refusal on **change**: `edit.ts:1159` guards `field.locked && value !== derived.values[name]`.
- The rationale at `:1134-1142` explains why presence-based refusal was rejected: the modal posts every staged field, so the locked value arrives on *every* save. Under the ACs as written, a run whose family declares faces but no italic one could never be saved at all — including an edit that only changed the words.
- REQ-139 states it flatly: *"A lock refuses a CHANGE, never the status quo."*

I verified this in the code and the intent rather than inheriting it from the upstream report, because the level cascade told me the story body was untrustworthy in exactly this spot. That verification also settled the classification: the refuse-on-change behavior is **already on `main`** (attributed to REQ-135), so these ACs are wrong about the code today — not merely ahead of the two pending intents. That makes them a clean `ac-edit`, not a "defer until reconcile" note.

Worth flagging: **AC-988 is the more load-bearing of the two**, since it's the AC enumerating all four refusal classes. The upstream report anticipated only AC-1120; AC-988 carries the identical defect and needs the same edit, plus a verification tightening (it currently says only "submit a value", which doesn't pin whether the value differs).

## Two things I'd draw your attention to

**A warning is compounding.** The origin-parity duplication against AC-992 has gone unrepaired through three cycles (REPORT-1614 → REPORT-1742 → now) and has *spread from two ACs to five* — each new AC batch copies the clause from its neighbours. It doesn't block the level, but it's getting more expensive to fix, not less. If one warning gets repaired this pass, that's the one.

**A gap this cycle's story check missed.** AC-980 and AC-990 assert the overflow/multi-line-control behavior REQ-117 asked for, but the story body has no parent bullet for it — I read all 525 lines and found no mention of overflow, truncation, legibility, or a multi-line control. REPORT-1742 caught this; REPORT-2080 did not re-detect it. The ACs are correct; the gap is upward, so it's a `story-body-edit`.

No finding here is a `code-issue` — the implementation is right and well-commented throughout. It's the prose that drifted from it.

One note on process: the story-level check for this capability failed this cycle with the very finding the AC layer inherited. Repairing the story body, AC-988, and AC-1120 in a single pass — before REQ-139 reconciles — avoids layering REQ-139's own edit onto three statements that are already wrong.
