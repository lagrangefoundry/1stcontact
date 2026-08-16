---
uid: comment-ececa940
id: COMMENT-1059
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T03:50:23.694518+00:00'
updated_at: '2026-08-16T03:50:23.694518+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1a53315d
  kind: note
---

**REPORT-2060** (`report-1a53315d`) — **FAIL**: 3 violations, 3 warnings, 0 needs_review.

## What drifted

All three violations sit on **STORY-101** (the click-to-edit gesture) and share one root cause. REQ-136 and REQ-138 both landed 2026-08-12; REQ-136 updated STORY-98 and STORY-100 (CAP-86) but **never STORY-101**, and REQ-138's later update touched only the live-preview bullet. So the gesture story is the one element still describing the pre-REQ-136 world.

1. **Capitalisation divergence is stale.** The body says capitalisation "is written like the others and does not arrive", and claims its covering test "asserts … that the words do not change". Both are false on this branch — BUG-35's fix is merged into main (`builder.css:281-284`), and `tests/reconciliation-copy-edit-live-preview.test.ts:515` asserts the opposite: `'and reaches the words'`. REQ-138 (free_and_reconciled) named four parameters; the matrix claims three.

2. **Image framing wrongly excluded.** The out-of-scope list bars "crop, scale, scrim, rotation, edge effects and free positioning". REQ-136 (free_and_reconciled) delivered scale, rotation, edge effects and free positioning into this dialog's parameter sheet — `edit.ts:586-604`. Only crop and scrim survive as genuine non-goals.

3. **Image region described as src + alt only.** REQ-136 explicitly supersedes that field list as an "intent conflict, not an implementation one" — the region now leads with picker + alt and then exposes a thirteen-control property sheet.

STORY-98 is aligned, and the two stories show no exclusivity overlap — the render/gesture split is stated in the same terms on both sides.

## Two things worth your attention

- **Violation 1 cascades to AC-1138**, which carries the identical claim in its title and body. The `ac`-level cycle uses the story body as its reference, so repairing one without the other will re-derive the drift.
- **This is very likely what `uat_coverage: fail` is reporting** on the capability — the matrix asserts the words don't change, the test asserts they do, and the code makes the test right. Worth confirming that's the failing evidence and not a second break.

The three warnings are imminent-intent flags (REQ-139 locked controls, REQ-140 palette colour) plus one stale rationale: STORY-101 justifies its stale-rendering criterion with "until request-time rendering replaces on-disk renderings", a condition REQ-119 already met for the builder. The criterion itself still stands — `1c render --edit` continues to write to disk (`commands.ts:145`) — so it's the reasoning, not the guard, that needs re-basing.

One note on process: the prescribed heredoc for `--body-file -` is blocked under this session's permission mode, so I wrote the body to `.xgd/tmp/cap87-story-alignment.md` (gitignored) and passed it by path.
