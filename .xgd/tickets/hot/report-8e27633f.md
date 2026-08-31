---
uid: report-8e27633f
id: REPORT-2996
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:23:08.525070+00:00'
updated_at: '2026-08-31T16:23:08.525070+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — class **AA** (both added), out of the
  sparse-checkout cone (no working-tree file; index-only conflict, DOC-986
  §2/§4.1). Rules applied: **2b** (both added → one side is a strict superset,
  keep the superset) reinforced by **2e** (intent/bookkeeping ticket, per-fact
  timeline rule) and the auto-enrichment note ("take the more recent commit by
  timestamp").

  Resolution: `git checkout --ours -- <path>` then `git add --sparse -- <path>`.
  Staged blob is `8645c567c937f8f593a517b585e79890d7682295` (ours) at stage 0.

  Why ours: the incoming commit `4e5a8b2b` (2026-08-24T15:12:54-07:00,
  _"xgd(ticket): create bug bug-a98fb3b0"_) is the ticket's **creation stub** —
  `title: Untitled`, `status: draft`, `last_field_updated: created_at`, body
  `(new ticket)`. The HEAD side, `cbdfed2e` (2026-08-31T07:24:25-07:00,
  _"xgd(ticket): seed_local_overlay bug bug-a98fb3b0"_), is that same ticket
  after its later lifecycle operations: real title (BUG-38, builder chat
  "conversation is no longer open"), `status: bundled`, `bundled_in:
  bundle-78f4e2fe`, plus Symptom / Root cause / Fix / Test plan sections and the
  `severity`, `commits`, `version`, `story_points`, `chat_comment` fields. HEAD
  is both the later timeline position and a content superset.

  No spec ticket (2d) involved — this is a `bug-*` intent/bookkeeping ticket, so
  no matrix fields were touched. No `fields.intent_uid` / `story_uid` /
  `capability_uid` were modified, and no content was invented.

## Incoming changes preserved

The incoming commit's only change is the 18-line creation of this ticket. Every
fact it asserts is present unchanged in the resolved (HEAD) version:

- `uid: bug-a98fb3b0`, `id: BUG-38`, `type: bug`, `created_by: xgd`,
  `created_at: '2026-08-24T22:12:54.350656+00:00'`, `completed_at: null` —
  identical byte-for-byte on both sides.
- `fields.auto_merge_back: true`, `fields.needs_review: false`,
  `fields.priority: medium` — identical on both sides.

The four fields that differ (`title`, `updated_at`, `last_field_updated`,
`status`) plus the body are exactly the placeholders the later HEAD-side
operations advanced: `Untitled → <real title>`, `draft → bundled`,
`created_at → status`, `(new ticket) → full bug writeup`. Keeping the incoming
values for those would roll the ticket backwards to its draft stub and discard
the bundling that this very reconcile bundle (`bundle-78f4e2fe`) depends on.

No developer code was discarded: this is a documentation/bookkeeping ticket, not
an implementation file, and the incoming commit touches no code. No hunk was
dropped under the BUG-1301 precedence exception; no UAT test function on either
side was deleted.

Note: because HEAD already contains the incoming commit's effect, the staged
tree nets to **no diff vs HEAD** (`git diff --cached HEAD --stat` is empty).
This is the redundant-commit case of STEP 4 (BUG-1109/BUG-1122), not a discard —
STEP 3's distinguishing check passes: the incoming commit's key changes are
*present in HEAD*, not absent. `--skip` was not called; finalize will detect the
clean staged diff. CHERRY_PICK_HEAD (`4e5a8b2b`) is left intact.
