---
uid: comment-d21ce567
id: COMMENT-2496
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T08:14:36.656097+00:00'
updated_at: '2026-09-10T08:14:36.656097+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1359729f
  kind: note
---

Both story-level findings resolved in one ticket mutation. Report: **REPORT-3697** (`report-1359729f`), `needs_more_work: false`, `progress_made: true`, `violations_remaining: 0`.

**What I changed on STORY-115 (`story-6cd17452`)** — one `xgd ticket update --body-file`, additive only, fields and `status: completed` verified intact afterward:

1. **Finding 1 (violation, coverage)** — new sixth **In scope** bullet placed right after "The push signal," naming the two REQ-131 Part 2 deliverables that appeared nowhere in the story tree: the manual's **overview** paragraph carrying the cross-cutting rule, and the named **sequence** (signal → read the changes → act).
2. **Companion to finding 1** — a Technical Context bullet recording *why* that rule lives in the overview rather than being repeated per-operation. Without it the new in-scope bullet reads as an arbitrary placement choice rather than the deliberate DOC-30 rationale REQ-131 cites.
3. **Finding 2 (warning, consistency)** — "A no-op advances nothing" added directly beside "Records are written at the *return* of a mutating command," per the finding's suggested wording.

Findings 3–5 are `info`/resolution `none` and were left alone; the "Divergence from the intent, recorded not absorbed" bullet is preserved verbatim.

**Verified this is matrix drift, not code drift** before editing — all three Part 2 artifacts are live in `tools/generate/src/cli/ai/l1-surface.json`: the overview paragraph ("Your user can change the site themselves, while you are working on it…"), the `sequences` entry "Pick up after your user has been editing" (`list_changes` → `describe_page` → `get_l1`), and the adjusted undo `absences` note. No code edited.

**Two things handed forward to the `ac` level** (deliberately not done here — the assessor scoped the `ac-add` downstream, and level priority at `story` is story-body-edit):

- The AC gap is real: AC-1266 covers the reminder line only; AC-1264/AC-1265 cover the operation's projection and `untrusted` marking. Nothing covers the overview or sequence.
- It will need a paired `uat-add`, not a `uat-edit` — I scanned all 13 UATs in `tests/test_UAT_FC_REQ-131_change_journal.test.ts` and none asserts the overview paragraph or the sequence entry. `test_UAT_FC_REQ_131_the_operation_is_in_the_manual_of_a_session_granted_ReadSite` already projects the manual for a granted session, so it's the natural template.

No `needs_review` items — neither finding was ambiguous. I ran no test suite this call, since nothing but ticket bodies changed.
