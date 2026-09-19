---
uid: report-549ed77a
id: REPORT-4366
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:50:18.779410+00:00'
updated_at: '2026-09-19T09:50:18.779410+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **AA** (both added), intent/bookkeeping
  ticket (2e) resolved under the 2b superset rule. Path is outside the
  sparse-checkout cone, so it was resolved with `git checkout --ours` +
  `git add --sparse` (DOC-986 §2/§4.1).

  Both sides are the same ticket (REQ-162, "The product ticket store: D1 schema,
  the TypePack, and the material types"). The incoming side (`c2c4b393c8`,
  `xgd(ticket): create request request-13a5e206`, committed 2026-08-31 13:32:40
  -0700) is the original 105-line **create** at `status: draft`. The HEAD side is
  the same ticket at 835 lines, `status: free_and_reconciled`, `completed_at`
  set, carrying `fields.commits`, `fields.orphan_commits`, `fields.version:
  0.2.20`, a `chat_comment` ref, and the full "What landed (free-coded,
  2026-08-31)" implementation record. HEAD's tip for this file is `801f03a0ab`,
  committed 2026-09-14 03:15:51 -0700 — two weeks after the incoming create.

  HEAD is therefore both the strictly later side and a strict content superset,
  so 2b ("keep the superset") and 2e's timeline rule agree. Resolved wholesale to
  ours rather than hand-composed: this ticket's frontmatter carries
  operator-owned lifecycle state (`status: free_and_reconciled`, `completed_at`,
  `version`), and hand-merging a ticket body risks writing stale frontmatter back
  over it.

## Incoming changes preserved

The incoming create's content is present in HEAD in full, reaching it by a
different route than this commit: HEAD acquired the ticket via
`8b5aa7c1ec xgd(ticket): seed_local_overlay request request-13a5e206`
(2026-08-31 17:01:32 -0700), already at 324 lines, and then through ~20 further
update commits to its current 835.

Every section of the incoming create survives in HEAD — "The gap is larger than
'add three types'", "What it delivers", "What this unblocks", "Out of scope",
"Acceptance" — as does the verbatim [[DOC-38]] §9 field block (`rights`,
`republishable`, `exportable`, `origin`, `kind`, `source_url`) and the
`republishable`/`exportable`-stay-explicit rationale.

The line-level diff shows a handful of incoming lines with no exact match in
HEAD. Each is a place where HEAD **refines** that same content, not one where it
is lost:

- `**1. The schema.**` — HEAD expands the same paragraph to name
  `0003_ticket_store.sql` and to add the `ALTER TABLE tenants ADD COLUMN config`
  reconciliation.
- `**3. The TypePack**` — renumbered to `**4. The TypePack**` in HEAD, because a
  new deliverable 3 (the blob store in its own `1stcontact-material` bucket) was
  inserted ahead of it. The TypePack bullet list itself is unchanged.
- `- A ticket created through the Worker is readable back through it.` — retained
  in HEAD's Acceptance list, extended with the `.workers.test.ts` / real-D1 /
  real-R2 detail.
- `## Open questions` and its two bullets — retained in HEAD as `## Both open
  questions are now settled`, with both questions answered the way the create
  proposed (`reference` keeps its own type; `brief` keeps its own type with
  `fields.site_slug`).

No hunk was dropped under the BUG-1301 precedence exception, and no test function
was touched — this conflict involves no code or UAT files.

## Staging outcome

`git status --porcelain` is clean and `CHERRY_PICK_HEAD` is intact. The staged
diff against HEAD is empty: this cherry-pick is redundant, because the create it
carries already reached this branch through `seed_local_overlay` and was then
refined past it.

Per STEP 4 this is not a failure and `--skip` was not called — the tree is staged
and left for `cherry_pick_finalize_resolution` to detect the clean staged diff and
skip the commit itself. Per STEP 3 this is the "present via a different route"
case, distinguished from a discard by the section-by-section check above: the
incoming commit's content is in HEAD, not absent from it.
