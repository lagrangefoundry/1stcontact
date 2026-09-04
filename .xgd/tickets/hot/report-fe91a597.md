---
uid: report-fe91a597
id: REPORT-3407
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:40:15.749095+00:00'
updated_at: '2026-09-03T23:40:15.749095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**). Out of the sparse-checkout cone (DOC-986 §2/§4.1): the conflict
  existed only in the index, with no working-tree markers, so it was resolved via
  `git checkout --ours` + `git add --sparse`.

  **Resolution: take OURS (HEAD).** OURS is a strict superset of the incoming
  side — 2e's "one side is a strict superset of the other: keep the superset".
  The auto-enrichment fallback ("take the more recent commit by timestamp") points
  the same way, and the two agree, so no tie-break was needed:

  - OURS `a8ffae74c3bf` *xgd(ticket): seed_local_overlay request request-26dafd83*
    — Wed Sep 2 10:50:06 2026
  - THEIRS `287de9831a06` *xgd(ticket): update request request-26dafd83*
    — Mon Aug 31 14:51:24 2026

  Both sides independently added the identical `chat_comment` line to the same
  frontmatter region, which is what made the region conflict textually; there is
  no competing fact underneath it.

## Incoming changes preserved

The incoming commit `287de9831a06` touched this file and only this file
(1 file changed, 2 insertions, 1 deletion). Its complete diff against the merge
base `f461ffc494` is two changes, and **both are already present verbatim in
HEAD** — nothing was discarded:

1. `+  chat_comment: comment-cb7fa49c` under `fields:`.
   Confirmed present in the HEAD blob `746636c1c2` (frontmatter line 17), and
   confirmed as an addition made by the HEAD side too: the base→HEAD diff
   `f461ffc494..746636c1c2` contains the same `+  chat_comment: comment-cb7fa49c`
   line.
2. Removal of the trailing newline at end of file.
   Confirmed: the last 20 bytes of the HEAD blob `746636c1c2` and of the incoming
   blob `2a0ac1482f` are byte-identical (`...ter oddly beside it.`, no trailing
   `\n`).

Because HEAD already carries both, the staged result is byte-identical to HEAD
and `git diff --cached HEAD -- <path>` is empty. This is the redundant-commit
case (BUG-1109/BUG-1122), **not** a discard: STEP 3's discriminator is whether
the incoming commit's key changes are *present in HEAD* (redundant) or *absent*
(discarded) — here they are present, and verified individually above. Per STEP 4
the file was staged and this step exits normally; `--skip` was not called and the
cherry-pick sequencer state was left untouched (`CHERRY_PICK_HEAD` still
`287de9831a06`).

### Content on the incoming side that was not carried forward

Taking OURS also leaves behind three frontmatter values and one body bullet that
appear only on the incoming side. Each is **ambient base content that HEAD
deliberately moved past**, not authored intent from the incoming commit — the
incoming commit's own diff does not touch any of them:

- `status: draft` → HEAD `status: bundled`; `last_field_updated: created_at` →
  `status`; `updated_at` 2026-08-31 → 2026-09-02. These are HEAD's own later
  lifecycle advance, which also added `fields.commits` (3 working SHAs),
  `fields.version: 0.2.31` and `fields.bundled_in: bundle-203b1dc2` — i.e. the
  bundling bookkeeping for this very reconcile run. Reverting them would undo the
  bundle state the run depends on.
- The **"Granularity"** bullet under `## Open questions`. HEAD removed it in the
  same edit that appended the `## What landed` section, which answers it
  explicitly ("One catalogue per source, not one document per module. The
  granularity question above is answered by chunk retrieval…"). HEAD's `## What
  landed` section (~65 lines) exists only on the OURS side and would have been
  lost had THEIRS been taken.

No BUG-1301 precedence exception was invoked, no test function was touched, and
no `fields.intent_uid` / `story_uid` / `capability_uid` was modified.

## Verification

- `git status --porcelain` — no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines remain.
- `git status --porcelain -- .xgd/tickets/hot/request-26dafd83.md` — empty
  (staged result matches HEAD).
- `CHERRY_PICK_HEAD` still present at `287de9831a06b242fd9d4b46ddbd93c175956e33`,
  ready for `cherry_pick_finalize_resolution`.
