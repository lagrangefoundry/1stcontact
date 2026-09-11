---
uid: report-0946de36
id: REPORT-4073
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:39:03.109733+00:00'
updated_at: '2026-09-11T22:39:03.109733+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **AA** (both added), intent/bookkeeping ticket
  (REQ-154, a `request-*`). Rules **2b** ("one side is strictly a superset: keep the
  superset") and **2e** (same per-fact judgment for intent tickets). Resolved to the
  **ours/HEAD** side via `git checkout --ours` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  Both sides carry the same ticket. The incoming commit `97327f55` is the *original body
  authoring* of REQ-154 (`updated_at: 2026-08-20T23:16:27`, `status: draft`,
  `last_field_updated: body`, 98 lines). HEAD carries the *later* state of the same ticket
  (`updated_at: 2026-08-31T05:05:09`, `status: bundled`), which already contains that body
  — re-serialized by a later `xgd` write (line reflow, `*emph*` → `_emph_`) — plus the
  entire `# What was built` section, the AC status table, the file/test inventory, and
  three added fields (`commits`, `version: 0.2.16`, `bundled_in: bundle-8eef3846`).

  Incoming is *not* the larger version here, so 2b's "incoming wins if incoming is the
  larger version" clause does not fire; the superset clause governs. Per-fact check on
  frontmatter: every field present on the incoming side is present on HEAD with an
  identical value; the only differing facts are `status` / `updated_at` /
  `last_field_updated`, where HEAD is the later-positioned state (2026-08-31 vs
  2026-08-20) and so wins under 2e's timeline rule. No field was invented, and no
  `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b88b79fe.md` — **preserved in full.** Verified mechanically,
  not by eye: both blobs were normalized (frontmatter stripped, blockquote markers and
  `*`/`_`/`` ` `` removed, whitespace collapsed) and compared word-by-word with
  `difflib.SequenceMatcher`. Result: the incoming body is 687 words, the resolved body is
  2034 words, the incoming body is an exact **substring** of the resolved body, and the
  opcode scan reports **zero** `delete` or `replace` regions — i.e. there is no word of the
  incoming version that is absent from the resolution. Every AC (1–6), the three Access
  candidates, the "Sessions are billed and capped" section and the `[[CHAT-27]]` origin
  note all survive verbatim.

No hunks were dropped; the BUG-1301 precedence exception was not invoked and no test
function was deleted.

## Note for finalize

The staged tree has **no net diff vs HEAD** (`git status --porcelain` and `git ls-files -u`
both empty). This is the *redundant*, not the *discarded*, case: the incoming commit's
content demonstrably reached HEAD by another route (the post-watermark sync of
xgd-working), as the substring check above establishes. Per BUG-1109/BUG-1122 this is not a
failure — `cherry_pick_finalize_resolution` will detect the clean staged diff and skip the
commit. `CHERRY_PICK_HEAD` (`97327f55c1d75dfef7bf44d407e7b73949eef6e6`) was deliberately
left intact; no `--continue` / `--skip` / `--abort` / `reset` was run.
