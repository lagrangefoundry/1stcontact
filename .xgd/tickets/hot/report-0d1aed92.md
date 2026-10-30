---
uid: report-0d1aed92
id: REPORT-5257
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:27:32.752168+00:00'
updated_at: '2026-09-28T02:27:32.752168+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — **AA**, intent/bookkeeping
  ticket (STEP 2e). Resolved by taking the **HEAD (ours)** side wholesale
  because it is a strict superset; staged with
  `git checkout --ours` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1, but the conflict did materialize
  on disk with real markers — 5 hunks).

  Evidence that the incoming side is the *creation state*, not a competing
  later intent (frontmatter, not body length — the incoming blob is still
  144 lines):

  | field | incoming (`4677b816` `xgd(ticket): create bug bug-6612c4b7`) | HEAD |
  |---|---|---|
  | `status` | `draft` | `free_and_reconciled` |
  | `updated_at` | `2026-08-24T21:06:08` (== `created_at`) | `2026-08-31T19:19:36` |
  | `completed_at` | `null` | `2026-08-31T19:19:36` |
  | `last_field_updated` | `created_at` | `status` |
  | `fields.commits` | absent | 3 entries |
  | `fields.version` | absent | `0.2.13` |
  | `fields.bundled_in` | absent | `bundle-78f4e2fe` |
  | `fields.chat_comment` | absent | `comment-a4e77428` |

  Taking incoming would have regressed `free_and_reconciled` → `draft` and
  dropped the commits list, version claim and bundle membership. No fact is
  edited differently on the two sides — the incoming side simply predates
  every HEAD-side edit — so 2e's per-fact "later intent wins" tie-break
  never fires.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted path is
an intent ticket, so there is no incoming source hunk to verify.

The incoming side's *content* is nonetheless not lost. HEAD's body carries the
incoming draft's entire diagnosis forward verbatim-in-substance under a
dedicated section, `## Superseded — the original hypothesis, recorded because
it was wrong`, which restates and then falsifies each claim the creation-state
body made (the dead `PREVIEWS` WeakMap as cost centre, isolate-memory
exhaustion as mechanism, "Edit is the larger render"), plus
`## Observability — added here` superseding the creation-state
`## Prerequisite — there is no telemetry to confirm any of this`, and
`## Reproduction (historical)` retaining the original repro command. The
HEAD body is therefore a superset of the incoming body in information terms,
not a replacement that discards it.

No BUG-1301 precedence exception was invoked; no test function was deleted.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` is empty: the
resolution equals HEAD, so the staged diff is clean. Per STEP 4 this is left
for Python's finalize step to detect and skip — `--skip`/`--continue` were not
called, and `CHERRY_PICK_HEAD` is still `4677b816199d596f493093d78959d5e6c778d6a3`.
