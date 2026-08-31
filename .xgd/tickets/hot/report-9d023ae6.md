---
uid: report-9d023ae6
id: REPORT-2796
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:20:52.009882+00:00'
updated_at: '2026-08-31T07:20:52.009882+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-691681c1.md` — class **AA** (both added; no merge base stage in the index). Intent/bookkeeping ticket (`request-*`), so **rule 2e** applies, with 2b's superset test.
  - **Ours (HEAD)**: blob `73f32bb2c7c10047de651865d5a96ee846d37f10`, from the `sync_working_to_main` commit _"xgd: sync from xgd-working 519bc24c878f (post-watermark)"_.
  - **Theirs (incoming)**: blob `532ee8347b8b3bb519f1642997b27dea9cc28272`, from `de0244307e16882753194c578feb1c8c8888b7a7` _"xgd(ticket): update request request-691681c1"_.
  - **Diff between the two sides is a single added frontmatter field** — `fields.chat_comment: comment-11aa640c`. Every other byte of the ticket (title, status `legacy_done`, all `fields`, and the whole body including all five Progress/Fidelity/Pixel-diff/Cross-browser sections) is identical on both sides.
  - **Rule applied**: incoming is a *strict superset* — it only adds a field the HEAD side never touched. Per 2e ("keep the superset") this is not a genuine same-fact conflict, so no `xgd working-timeline` per-fact tiebreak was needed. Resolved with `git checkout --theirs` + `git add --sparse` (`.xgd/tickets/` is outside the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).
  - The auto-enrichment's fallback rule ("intent unknown on one side, take the more recent commit and flag for post-merge review") would select the same content here: the incoming side is both the superset and the developer-authored `free_coded` side. **Flagged for post-merge review** per that rule, though the delta is a single bookkeeping field with no competing edit on the other side.

No code, spec-ticket, UAT, or config files were conflicted in this cherry-pick.

## Incoming changes preserved

Verified: the staged index entry for `.xgd/tickets/hot/request-691681c1.md` is blob `532ee8347b8b3bb519f1642997b27dea9cc28272` — byte-identical to the incoming commit's version of the file. `git diff --cached de0244307e16882753194c578feb1c8c8888b7a7 -- .xgd/tickets/hot/request-691681c1.md` returns **empty**, confirming the resolution reproduces the incoming commit's content for this path exactly.

The incoming commit `de02443` touches only this one file (108 insertions, 1 file changed), so its entire diff is accounted for. Nothing from the HEAD side was lost either, since HEAD's content is a subset of the incoming content.

No hunks were dropped; the BUG-1301 precedence exception was not invoked and no deletions were performed.

`git status --porcelain` shows no remaining conflict-class entries; the path is staged as `M`. The in-progress cherry-pick was left untouched — `CHERRY_PICK_HEAD` is still present for `cherry_pick_finalize_resolution`.
