---
uid: report-da0b6722
id: REPORT-4340
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:36:22.939581+00:00'
updated_at: '2026-09-18T07:36:22.939581+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — class **UU**, intent/bookkeeping ticket → **rule 2e**.
  Incoming commit: `e2ef5e9851` "xgd(ticket): update bug bug-23d1ec27" (2026-08-25).
  Path is outside the sparse-checkout cone, so staged with `git add --sparse`.

  Two conflict hunks, both resolved by the 2e **strict-superset** branch (no per-fact
  timeline tie-break was needed — the two sides never changed the same fact differently):

  1. **Frontmatter `fields:` block.** HEAD carries `commits` (working_sha
     `759cd87405a4…`), `version: 0.2.15`, `story_points: 3`, `bundled_in: bundle-8eef3846`;
     the incoming side has none of those keys. These are post-watermark bookkeeping fields
     that exist only on HEAD, and the incoming commit never touched them — HEAD is the
     strict superset for this region, so the whole block is kept. The incoming commit's one
     genuine frontmatter addition, `chat_comment: comment-72dd436d`, sits *above* the
     conflict region and merged cleanly; it is present in the resolved file at line 18.

  2. **End of the `## Reproduce` section.** HEAD carries the paragraph
     `Note: in a fresh worktree this first fails with 'Cannot find module
     ./generated/ai-workers.js' — a build artefact, not this bug. './bin/1c assets' emits
     it.`; the incoming side ends at the closing code fence. Inspecting the incoming diff
     hunk shows its only change here is *no-newline-at-end-of-file* — it removes the
     trailing newline and adds no prose. So HEAD's note is not something the incoming
     commit dropped, it is content HEAD gained later; HEAD is again the superset and the
     note is kept. The incoming side's actual edit (no trailing newline) WAS applied: the
     resolved file ends without a trailing newline, matching both sides.

  No content was invented that is not on one of the two sides; no field was added or
  removed beyond what the two sides' own commits declare. `fields.intent_uid`,
  `fields.story_uid` and `fields.capability_uid` were not touched.

## Incoming changes preserved

The incoming commit `e2ef5e9851` changes exactly two things in this file, and both are
present in the resolved, staged version:

- `+  chat_comment: comment-72dd436d` — present at line 18. Verified independently against
  the HEAD blob (`git show HEAD:.xgd/tickets/hot/bug-23d1ec27.md | grep -n chat_comment`
  → `18:  chat_comment: comment-72dd436d`), so this fact had **already landed on this
  branch** through a post-watermark route before the pick was attempted.
- the trailing-newline removal at EOF — present; the resolved file ends without a trailing
  newline.

Nothing from the incoming diff is absent from the resolution. No hunk was dropped, so the
BUG-1301 precedence exception does not apply here and is not invoked.

**Net effect: `git diff --cached HEAD` is empty** — the staged tree is byte-identical to
HEAD. Per STEP 4 this is the BUG-1109/BUG-1122 redundant-commit case, not a discard: STEP
3's discriminator confirms the incoming commit's key change is *present* in HEAD (verified
above), rather than merely missing from my resolution. The file therefore no longer appears
in `git status --porcelain` at all. I did not call `--skip`; `CHERRY_PICK_HEAD`
(`e2ef5e985174247cfce7b942aba381b904ff7f85`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit
itself.

No conflict markers remain in the worktree (`grep -c` for `<<<<<<<`/`>>>>>>>` → 0). No
tests were run: this conflict touches a ticket-metadata file only, with no code or UAT
content on either side.
