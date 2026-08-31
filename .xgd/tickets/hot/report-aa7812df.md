---
uid: report-aa7812df
id: REPORT-2969
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:32:08.912734+00:00'
updated_at: '2026-08-31T15:32:08.912734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — class **AA** (both added; no stage-1 base).
  Intent/bookkeeping ticket (2e) resolved under **2b: one side is a strict superset →
  keep the superset**, which here is the incoming (`free_coded`) side.

  Both sides were byte-identical across the entire 98-line body and all other
  frontmatter. The only content difference: incoming adds one frontmatter field,
  `fields.chat_comment: comment-ec45248c`. The sole other delta was a missing trailing
  newline on the incoming blob; HEAD's terminator was kept (no content implication,
  and the newline is present on the HEAD side — nothing invented).

  Resolution = HEAD's file + the incoming `chat_comment` field. No timeline lookup was
  needed: the sides do not disagree about any fact, so the `updated_by`-unknown
  fallback in the enrichment metadata ("take the more recent commit by timestamp")
  never came into play — the superset rule settles it without discarding anything from
  either side.

  Staged with `git add --sparse` (`.xgd/tickets/` is outside the sparse-checkout cone
  on this reconcile branch, DOC-986 §2/§4.1 — the conflict existed in the index only,
  with no working-tree markers and the worktree copy sitting at the OURS blob).

No other conflicted paths. The remaining `??` entries under `.xgd/tickets/hot/` are
untracked and unrelated to this cherry-pick.

## Incoming changes preserved

Incoming commit `97327f55c1d75dfef7bf44d407e7b73949eef6e6` ("xgd(ticket): update
request request-b88b79fe", 2026-08-23) presents as a whole-file add of 98 lines.
Every one of those lines is present in the resolved file:

- The 97 lines shared with the HEAD side were already identical byte-for-byte
  (verified by `git diff` between the two index blobs `1a247142` and `e73c0ef8` — the
  diff is exactly the one added field plus the EOF-newline marker).
- The one line unique to the incoming side, `  chat_comment: comment-ec45248c`, was
  explicitly applied and verified present at line 20 of the resolved file.

Nothing was dropped, so the BUG-1301 precedence exception does not apply and no hunk
was discarded. No code/implementation files were involved in this conflict.

Note for post-merge review (flagged per the enrichment rule, since xgd-kind/intent was
unresolved on one or both sides): the HEAD-side tip commit `ebba4a63ca` is
"xgd(ticket): create comment comment-ec45248c" — HEAD created the very comment ticket
that the incoming commit's `chat_comment` field points at. The two sides are
complementary halves of the same operation, which corroborates the superset
resolution rather than contradicting it.
