---
uid: report-5e594acb
id: REPORT-4384
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:33:55.727570+00:00'
updated_at: '2026-09-19T10:33:55.727570+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/comment-c74424ff.md` — class **UU**, bookkeeping/intent ticket
  (a `comment` ticket carrying the CHAT-23 transcript; rule **2e**, "one side is a
  strict superset of the other — keep the superset"). Resolved to **ours (HEAD)**.

  The enrichment metadata classed this as "intent unknown on both sides, take the
  more recent commit by timestamp." That rule and the superset rule agree here, and
  the superset relation is the stronger evidence:

  - Incoming `bed856f4` (Tue Sep 1 11:22:57 -0700) rewrites the blob
    `6fc069081a -> 5903b6b07b`.
  - HEAD-side `35887fbf` (Tue Sep 1 11:25:38 -0700) rewrites the blob
    `5903b6b07b -> e463de6c03`.

  HEAD's pre-image blob is byte-identical to the incoming commit's post-image blob,
  so HEAD's version is a direct textual descendant of the incoming version — not a
  competing edit. HEAD is also the later commit, so both tests point the same way.

  Resolution performed with `git checkout --ours` followed by `git add --sparse`
  (`.xgd/tickets/` is outside the sparse-checkout cone on reconcile branches,
  DOC-986 §2/§4.1). The resolved working-tree file was verified byte-identical to
  HEAD's blob and free of conflict markers before staging.

## Incoming changes preserved

Fully preserved — nothing discarded. The incoming commit made exactly two changes,
and both are present in the resolved file:

1. **Appended chat turn** `xgd-turn id="9d626d00-a73a-4a80-bd6d-e58109797ae0-user"`
   — the user message beginning "lets not change anything for this super-chat role".
   Present in the resolved file at line 836 (marker) / line 840 (body text),
   verbatim.

2. **`updated_at` bump** to `2026-09-01T18:22:57.740802+00:00` — superseded in the
   resolved file by `2026-09-01T18:25:38.361760+00:00`. That is the correct outcome:
   the later value was written by the very next append to the same transcript, which
   is the commit that already contains the incoming turn. Carrying the incoming's
   older timestamp forward would contradict the body content it sits above.

On top of the incoming content, HEAD additionally carries the assistant reply to
that turn (`...-assistant`, line 844), which the incoming commit predates.

**Net effect: no diff vs HEAD.** This is a genuinely redundant cherry-pick
(BUG-1109 / BUG-1122), not a discard — the incoming commit's payload already reached
this branch through the later transcript-append commit `35887fbf`, which contains it
as a literal prefix. STEP 3's discard guard is satisfied by direct verification that
the incoming turn is present in HEAD, not merely by the absence of a diff. Per
STEP 4, no `--skip` was issued; the tree is staged and the cherry-pick sequencer
state (`CHERRY_PICK_HEAD` = `bed856f4`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.

No post-merge review flag is warranted: the "flag for review" clause of the
enrichment rule exists for the ambiguous timestamp-only case, and the ancestor
relation between the two blobs removes that ambiguity.
