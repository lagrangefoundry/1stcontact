---
uid: report-6824d0bc
id: REPORT-4050
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:54:50.795798+00:00'
updated_at: '2026-09-11T21:54:50.795798+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` (REQ-143) — class **AA** (both added; incoming
  `fb1d4d621e` adds the file as new, ours exists from `ecd40fbcbd`). Rule **2e** (intent/
  bookkeeping ticket — `request-*`, not matrix-defining spec state), cross-checked against
  the auto-enrichment rule ("intent unknown on one or both sides — take the more recent
  commit by timestamp"). Resolved to **ours** on both conflicting facts.

`git diff :2: :3:` confirmed the two sides differ **only** in frontmatter — the entire
ticket body (268 lines, §1–§14 and Origin) is byte-identical, so choosing ours discards no
incoming prose.

Fact-by-fact:

1. **`status` / `updated_at` / `completed_at`** — ours `free_and_reconciled`,
   `updated_at` / `completed_at` `2026-08-31T14:22:42`; incoming `ready_to_reconcile`,
   `updated_at 2026-08-17T20:06:08`, `completed_at: null`. Same field changed differently →
   timeline rule → **ours** (later on both axes: commit date Aug 31 07:22 vs Aug 23 12:41,
   and `updated_at` Aug 31 vs Aug 17). `ready_to_reconcile` is the state ours already
   advanced *out of*; taking incoming would have reverted an already-reconciled request back
   into the reconcile queue.
2. **`fields.commits` shape + `fields.bundled_in`** — ours records `7ebc721b83` inside the
   first entry's `working_sha_history` (3 shas) and carries
   `bundled_in: bundle-b3b7c399`; incoming records `7ebc721b83` as a separate `commits`
   entry with empty history and has no `bundled_in`. Ours is a superset of the *facts*: all
   three working shas (`b71a8641`, `7ebc721b`, `761b7fbd`) are present, plus the bundle
   linkage. No sha is lost. → **ours**.

No fields were invented, and `fields.intent_uid` / `story_uid` / `capability_uid` were not
touched.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
ticket, so there is no developer-authored source to discard.

STEP 3 check against `git show fb1d4d621e -- .xgd/tickets/hot/request-18a48d63.md`: the
incoming commit's content is a whole-file add. Its substance is present in the resolution:

- Body: byte-identical, verified by the stage-2/stage-3 diff showing zero body hunks.
- `working_sha 7ebc721b83`: present in ours, as a `working_sha_history` entry rather than a
  top-level `commits` entry.
- `status: ready_to_reconcile` and `completed_at: null`: **superseded, not discarded** —
  ours passed through that state and advanced to `free_and_reconciled` on Aug 31, eight days
  after the incoming commit. This is STEP 4's "present via a different route (redundant)"
  case, not STEP 3's discard case.

No hunk was dropped under the BUG-1301 precedence exception; no test functions were involved.

## Staging state

`git status --porcelain` is empty, `git diff --diff-filter=U` is empty, and zero conflict
markers remain in the file. The staged diff vs HEAD is **empty** — the resolution nets to no
change, since ours already carries the incoming commit's effect in a later form. Per STEP 4
this is not a failure and `--skip` was **not** called; `CHERRY_PICK_HEAD`
(`fb1d4d621e89fd00a44a8a73e114b2bf7de35bb2`) is left in place for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit itself.
