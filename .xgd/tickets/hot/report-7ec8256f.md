---
uid: report-7ec8256f
id: REPORT-4060
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:16:49.116245+00:00'
updated_at: '2026-09-11T22:16:49.116245+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **AA** (both added), intent/bookkeeping
  ticket (REQ-147). Resolved under rule **2e** (intent/bookkeeping ticket,
  per-fact timeline). Path is outside the sparse-checkout cone, so resolved with
  `git checkout --ours` + `git add --sparse`.

  The two sides' **bodies are byte-identical**; the entire conflict is four
  frontmatter facts:

  | fact | ours (HEAD) | theirs (incoming 7fb5772) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `reconciling` |
  | `updated_at` | `2026-08-31T14:22:44Z` | `2026-08-20T12:51:32Z` |
  | `completed_at` | `2026-08-31T14:22:44Z` | `null` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Per-fact resolution:
  - `status` / `updated_at` / `completed_at` — same fact, different values.
    HEAD is the later-positioned side on every one: `free_and_reconciled` is the
    downstream lifecycle state of `reconciling`, and HEAD's timestamps are 11
    days later. HEAD kept.
  - `fields.bundled_in` — an addition the incoming side never touched, so there
    is nothing to combine against. HEAD kept.

  Result: ours is a strict superset per-fact, and taking it discards no fact the
  incoming side holds that HEAD does not already supersede.

## Incoming changes preserved

The incoming commit `7fb5772` ("xgd(ticket): update request request-23fd6e61",
Aug 23) is a 182-line file *creation* — the file did not exist at its parent, so
its whole payload is the REQ-147 ticket at the `reconciling` state.

That payload is present in HEAD, by a different route:

- the **body** (all 182 lines of narrative, implementation record, ACs, open
  questions) is byte-identical between the two sides — `git diff` between the two
  blobs reports frontmatter changes only;
- the **exact frontmatter state** the incoming commit carries already exists in
  HEAD's own history at commit `80cdf17160` (2026-08-20 05:51:32 -0700 =
  12:51:32 UTC — the same `updated_at` to the microsecond), after which HEAD
  advanced it through `e0ffd3bfb4` (seed_local_overlay, Aug 30) and `02c0d39001`
  (status → `free_and_reconciled` + `bundled_in`, Aug 31).

So this is STEP 4's redundant-commit case, not STEP 3's discarded-commit case:
the incoming commit's content is in HEAD and was subsequently advanced, rather
than being absent. The staged tree consequently shows no diff vs HEAD
(`git diff --cached HEAD` is empty); per STEP 4 this is staged and exited @done
without calling `--skip`, leaving the commit-skip decision to
`cherry_pick_finalize_resolution`.

No code/implementation files were in conflict. No test functions were deleted,
and the BUG-1301 precedence exception was not invoked.
