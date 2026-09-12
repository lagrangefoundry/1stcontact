---
uid: report-95aade28
id: REPORT-4115
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:19:43.911885+00:00'
updated_at: '2026-09-12T19:19:43.911885+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — class **AA** (both added), rule **2b/2e**
  (one side is a strict superset; intent/bookkeeping ticket, superset kept).
  Resolved to **ours** via `git checkout --ours` + `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Why ours, when incoming is a `free_coded` commit

The incoming commit `0d545fdd21` is `xgd(ticket): create bug bug-23d1ec27`.
The bundle branch was seeded by `0929135455 xgd(ticket): seed_local_overlay bug
bug-23d1ec27`, which imported the ticket's **final** state from xgd-working, so
git sees no merge base for this path and reports AA rather than UU.
`git log -- <path>` on the HEAD side shows the seed commit plus three developer
update commits (`abb50d4b38`, `6778773d88`, `6e8b3d5662`) and **no create
commit** — that absence is the tell that ours is the lineal descendant of the
very create being applied.

Superset confirmed by diffing `git show :3:<path>` against `git show :2:<path>`:

- Immutable fields byte-identical on both sides: `uid`, `id`, `title`,
  `created_by`, `created_at` (`2026-08-24T22:25:21.810676+00:00`).
- Theirs: `status: draft`, `updated_at == created_at`, four `fields` keys.
- Ours: `status: bundled`, `updated_at: 2026-08-31T05:05:09`, plus
  `chat_comment`, `commits`, `version`, `story_points`, `bundled_in`.
- Body: every section present on the incoming side (Symptom, Root cause,
  Acceptance criteria, Reproduce) is present on ours, expanded with the
  developer's own later "Fix — as landed", "Watch for — resolved", and
  "Out of scope" content. No incoming section was dropped; the incoming
  "## Fix" proposal was superseded in place by the developer's own update
  commits on the working timeline.
- `git show :2:<path>` is byte-identical to `git show HEAD:<path>`, so taking
  ours discarded nothing that had auto-merged into the index.

## Incoming changes preserved

No code/implementation files were conflicted — the sole conflict is a
bookkeeping ticket (rule 2e). The incoming commit's entire content (the ticket
creation) is present in HEAD via the seed overlay, so the staged diff against
HEAD is empty. Per STEP 4 / BUG-1109 / BUG-1122 this is **redundant, not
discarded** (STEP 3's discriminator: the incoming commit's key changes are
present in HEAD via a different route, not absent). `git cherry-pick --skip`
was NOT called; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.

No hunks were dropped under the BUG-1301 precedence exception.

## Final state

`git status --porcelain` is empty — no UU/AA/DU/UD lines remain; the
cherry-pick sequencer state is untouched.
