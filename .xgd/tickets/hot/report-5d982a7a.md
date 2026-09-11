---
uid: report-5d982a7a
id: REPORT-3624
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:20:41.431490+00:00'
updated_at: '2026-09-10T01:20:41.431490+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, index-only (the path is outside the
  sparse-checkout cone, so there were no working-tree conflict markers).
  Class: intent/bookkeeping ticket (STEP 2 §2e). Rule applied: **non-overlapping
  sections changed on each side → apply BOTH**. Composed, not picked.

  Incoming commit: `5a68fc8db7f64271fd4bb2068eef3775e138cf0d`
  ("xgd(ticket): update bug bug-23d1ec27", 2026-08-26 16:21 -0700,
  `last_field_updated: body`).

  Three-way blobs — base `ad25504`, ours `ffdcef9`, theirs `df68f1c`. The two
  sides touched strictly disjoint parts of the file:

  | side | what it changed vs base |
  |---|---|
  | ours (HEAD) | `status: ready_to_reconcile → bundled`; `updated_at → 2026-08-31T05:05:09Z`; added `fields.bundled_in: bundle-8eef3846`. **Body untouched.** |
  | theirs (incoming) | reflowed the entire markdown body (hard-wrapped → long lines); `last_field_updated: status → body`; `updated_at → 2026-08-26T23:21:08Z`. **Lifecycle fields untouched.** |

  Resolution = ours' lifecycle frontmatter + theirs' body, verbatim on both
  sides. Nothing was invented and nothing from either side was dropped except
  on the one genuinely contested fact below.

  The single contested fact is the `(updated_at, last_field_updated)` pair —
  both sides moved it, and it is one fact, not two: `last_field_updated` names
  which field the update recorded in `updated_at` touched. Ours is the
  later-positioned side (2026-08-31 vs 2026-08-26), so ours' half of the pair
  is kept: `updated_at: 2026-08-31T05:05:09Z` with `last_field_updated:
  status`, which correctly describes the most recent update in the composed
  record (the bundling transition). Taking theirs' `last_field_updated: body`
  alongside ours' later `updated_at` would have asserted a body edit at
  2026-08-31 that never happened.

  Note this is the SECOND conflict on this same path in this bundle. The
  previous one (scope 70/0, incoming `bffb6b3`, REPORT-3623) resolved to ours
  because that commit's only intent — advancing the bug off `free_coded` — was
  already present in HEAD via the later `bundled` state. That is not the
  situation here: this commit carries a real body edit that HEAD has never
  seen, so resolving to ours again would have discarded it.

## Incoming changes preserved

No code/implementation files were in this conflict set — the only conflicted
path is a bookkeeping ticket. STEP 3 was nonetheless run against it explicitly,
by diffing the resolved file against each side's blob:

- **vs theirs (`df68f1c`)** — the ONLY differences are the three lifecycle
  frontmatter lines that are ours' contribution (`updated_at`,
  `last_field_updated`, `status`) plus the added `fields.bundled_in`. The
  incoming commit's entire body rewrite (93 insertions / 97 deletions across
  every section: Symptom, Root cause, Fix — as landed, Watch for — resolved,
  Out of scope, Acceptance criteria, Reproduce) is present byte-for-byte,
  including the trailing "no newline at end of file".
- **vs ours (`ffdcef9`)** — the ONLY difference is the body, i.e. precisely the
  incoming commit's change and nothing else.

The staged diff against HEAD is 93 insertions / 97 deletions, confirming the
incoming edit really landed rather than netting to nothing.

No hunks were dropped under the BUG-1301 precedence exception. No test
functions were touched or deleted; no code file was modified.

## Staging state

`git status --porcelain` shows no UU/AA/DU/UD/AU/UA lines; the path is staged
as `M`. `CHERRY_PICK_HEAD` (`5a68fc8db7f64271fd4bb2068eef3775e138cf0d`) is
still in place — no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
Git writes were limited to `checkout --theirs` and `add --sparse`, each issued
as the sole content of its own call.
