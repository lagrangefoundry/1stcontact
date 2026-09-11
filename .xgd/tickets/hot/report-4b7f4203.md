---
uid: report-4b7f4203
id: REPORT-4099
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:40:59.757375+00:00'
updated_at: '2026-09-11T23:40:59.757375+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: a `bug-*` ticket, user-authored content, not
  matrix state). Resolved per-fact. Staged with `git add --sparse` (path is
  outside the sparse-checkout cone on this reconcile branch, DOC-986
  §2/§4.1).

  Incoming commit: `9255f773b5` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24 14:06:30).

  **Context — this is the third and final commit of a retitle triple**, all
  three sharing the identical generic subject `xgd(ticket): update bug
  bug-6612c4b7`, all resolved in this bundle across consecutive attempts:

  1. `fe97d3bc34` (14:06:15) — recorded the retitle as a transient
     `fields.title` bookkeeping entry.
  2. `b0af50e157` (14:06:24) — applied it to the canonical top-level
     `title:`.
  3. `9255f773b5` (14:06:30, **this one**) — removes the now-redundant
     `fields.title` entry, completing the cleanup.

  Two conflict hunks:

  1. **Frontmatter lifecycle scalars** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`). Same fact changed differently on both
     sides → later-positioned side wins. HEAD carries
     `updated_at: 2026-08-31T19:19:36`, a non-null `completed_at`, and
     `status: free_and_reconciled`; incoming carries
     `2026-08-24T21:06:30`, `completed_at: null`, `status: draft`.
     **Kept HEAD** — it is the later position by a week and reflects work
     since coded, reconciled and bundled. Taking incoming would have
     demoted a `free_and_reconciled` ticket back to `draft`.

  2. **`fields:` block — the incoming side of this hunk is EMPTY.** This
     needs care and is the one non-mechanical judgement in this
     resolution. The emptiness is an artifact of how the deletion lines up,
     not an instruction to empty the block: the incoming commit's only
     change here is to *delete* the two `fields.title` lines, and HEAD's
     version of the same region holds an entirely different, disjoint set
     of keys — `chat_comment: comment-a4e77428`, a three-entry `commits`
     list, `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`. **Kept HEAD's
     block.** Naively taking "theirs" for this hunk would have silently
     destroyed all of HEAD's reconcile bookkeeping — none of which the
     incoming commit ever touched or intended to remove.

## Incoming changes preserved

Verified against `git show 9255f773b5 -- .xgd/tickets/hot/bug-6612c4b7.md`.
The commit contains exactly two changes; both are accounted for:

- **Deletion of `fields.title` — SATISFIED.** This is the commit's
  substantive intent, and the resolved file honours it: `grep '^  title:'`
  returns nothing, i.e. the indented `fields.title` key is absent. HEAD had
  already converged on the same end state (it never carried the transient
  key), so the deletion's goal holds in the result. Meanwhile the canonical
  top-level `title:` at line 5 still reads `'control-app: Edit mode dies
  with Cloudflare 1102 — the preview render cache never hits in the
  Worker'` — the retitled wording this three-commit sequence existed to
  produce. The sequence's net effect is fully present.
- **`updated_at` bump to `2026-08-24T21:06:30`** — deliberately superseded
  by HEAD's `2026-08-31T19:19:36` per the per-fact timeline rule. A
  mechanical mtime scalar, not developer content.

HEAD-side fields confirmed preserved in the resolution: `chat_comment`
(line 18), `version: 0.2.13` (line 30), `bundled_in: bundle-78f4e2fe`
(line 31), plus the full `commits` list.

The resolved file is byte-identical to `HEAD:.xgd/tickets/hot/bug-6612c4b7.md`
(confirmed with `git diff --no-index` against the HEAD blob — empty output),
so the staged diff is empty. This is BUG-1109/BUG-1122's **redundant** case,
not a discard: STEP 3's distinguishing check passes because the commit's key
change is *present in HEAD* — HEAD arrived at the same post-cleanup state by
its own later lineage — rather than simply absent. Per STEP 4 I did **not**
call `--skip`; the staged tree is left for `cherry_pick_finalize_resolution`
to detect and skip.

No hunks were dropped under the BUG-1301 precedence exception. No test files
were involved, so 2f did not apply.

## Post-merge review flag

Per the enrichment's "flag this file for post-merge review" directive: both
sides' commit subjects are the generic `xgd(ticket): update bug
bug-6612c4b7`, so xgd-kind could not be inferred from either side — and in
this bundle that same subject is reused across at least three distinct
commits (`fe97d3bc34`, `b0af50e157`, `9255f773b5`) performing one logical
edit in three steps. The resolution above therefore rests on in-file
evidence (timestamps, status lifecycle, actual diff contents, which keys
each side holds) rather than on commit-kind or commit-subject metadata.

Worth a reviewer's eye: hunk 2's empty incoming side is a shape where an
automated or hurried resolution could plausibly have taken "theirs" and
dropped `chat_comment`/`commits`/`version`/`bundled_in`. The staged result
retains them.
