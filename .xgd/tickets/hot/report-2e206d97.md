---
uid: report-2e206d97
id: REPORT-2951
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:56:19.887232+00:00'
updated_at: '2026-08-31T14:56:19.887232+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **AA (both added)**, intent/bookkeeping
  ticket (rule 2e, with 2b superset clause). Index-only conflict: the path is
  outside the sparse-checkout cone on this reconcile branch (DOC-986 §2/§4.1),
  so no conflict markers were ever written to the working tree. Resolved with
  `git checkout --ours` + `git add --sparse`.

  Both sides carry a byte-identical body (`# Reserve locale-shaped page slugs`,
  Why/What sections) and an identical `fields.commits` list (working_sha
  `31a4ca7d…`, `b404103f…`). The entire conflict is four frontmatter facts:

  | fact | ours (HEAD, `cf4b475c` seed_local_overlay, 2026-08-30 22:06) | theirs (incoming free_coded `83973a5e`, 2026-08-22 20:29) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-23T03:29:52` |
  | `fields.chat_comment` | `comment-18e5a285` | *(absent)* |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Ours is a **strict superset** per 2e: it advances the lifecycle status
  (`ready_to_reconcile` → `bundled`, a strictly later state on the same
  ticket) and adds two fields the incoming side never touched. Incoming
  contributes no fact that ours lacks. On the two contested scalars
  (`status`, `updated_at`) ours is also the later-positioned side by both
  the ticket's own `updated_at` and the commit timestamp — which matches the
  auto-enrichment rule for this file ("take the more recent commit by
  timestamp"). No content was invented; no field was edited beyond what one
  side already declared.

  Net effect: the resolution equals HEAD, so the staged tree shows no diff.
  Per STEP 4 this is left for `cherry_pick_finalize_resolution` to detect —
  `--skip` was not called, and CHERRY_PICK_HEAD is intact.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md` — the incoming commit `83973a5e`
  is a 127-line pure file creation on the working branch. Its content is
  present in the resolved version in full: identical body text, identical
  `fields.commits` entries, identical `uid`/`id`/`type`/`title`/`created_by`/
  `created_at`/`version` (0.2.5) frontmatter. The only incoming values not
  present are `status: ready_to_reconcile` and `updated_at: 2026-08-23`, both
  of which HEAD supersedes with a later value for the same fact — this is
  supersession under the 2e timeline rule, not a discard. No code file was
  involved in this conflict, and no BUG-1301 precedence drop was needed.

## Flagged for post-merge review

Per the auto-enrichment note ("intent unknown on one or both sides … flag
this file for post-merge review"): `request-94e93caa` (REQ-153) carries
`bundled_in: bundle-b3b7c399` from the HEAD side while being cherry-picked
under reconcile bundle `bundle-78f4e2fe`. Worth a glance that the request's
bundle attribution is the intended one before merge-back.
