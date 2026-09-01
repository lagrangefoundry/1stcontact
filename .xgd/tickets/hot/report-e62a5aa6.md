---
uid: report-e62a5aa6
id: REPORT-3186
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:36:03.245686+00:00'
updated_at: '2026-09-01T02:36:03.245686+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, index-only conflict (outside the
  sparse-checkout cone, DOC-986 §2/§4.1; sides read via `git show :1:/:2:/:3:`).
  Intent/bookkeeping ticket, rule **2e**, resolved per-fact to the HEAD (ours)
  content via `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse`.

  Incoming commit `0909c3f1` (2026-08-24T14:32:02-0700, `free_coded`) is 4
  insertions / 4 deletions — a lifecycle transition, 14 seconds after the body
  rewrite of the previous bundle commit `2759e5b5`:

  | fact | base (:1) | ours (:2, HEAD) | theirs (:3, incoming) | resolution |
  |---|---|---|---|---|
  | `status` | `draft` | **`bundled`** | `free_coding` | **HEAD** — the one genuinely competing fact |
  | `last_field_updated` | `body` | `status` | `status` | identical on both sides — no conflict |
  | `updated_at` | 2026-08-24T21:31:48Z | **2026-08-26T17:36:27Z** | 2026-08-24T21:32:02Z | HEAD (later) |
  | trailing newline | present | already absent | removed | identical outcome — incoming's intent already satisfied |
  | `fields.{commits,version,bundled_in}` | absent | **present** | absent | HEAD |
  | observability section / body | draft-era | `## Observability — added here` + `## Deployment` | `## Still outstanding` | HEAD (as established for `2759e5b5`, REPORT-3185) |

  On the `status` fact, HEAD wins on two independent grounds:

  1. **Timeline** — 2e's per-fact rule: HEAD's intent is positioned later
     (2026-08-26 vs 2026-08-24).
  2. **Lifecycle direction** — `bundled` is downstream of `free_coding`, not a
     competing alternative to it. HEAD carries `bundled_in: bundle-78f4e2fe`
     and three `commits[].working_sha` entries, which are the recorded evidence
     that this very free-coding phase ran and its output was bundled. Adopting
     incoming's `free_coding` would regress the ticket to a state that
     contradicts its own `bundled_in` and `commits` fields — an internally
     inconsistent document.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md`: of incoming's 4 changed lines, **2 are
  already satisfied by HEAD identically** — `last_field_updated: status` (same
  value on both sides) and the trailing-newline removal (HEAD already has no
  terminating newline). The other 2 (`updated_at`, `status`) are superseded by
  HEAD's strictly later state, per the per-fact analysis above.

  Nothing was discarded. The developer's intent recorded by this commit — "this
  ticket has entered free-coding" — is not lost but *fulfilled* in HEAD, which
  records the completed outcome of that phase (`bundled`, with the resulting
  working SHAs and bundle reference). This is STEP 3's "present in HEAD via a
  different route" case, not the "simply absent" case.

  The staged diff vs HEAD is consequently empty; per STEP 4 the resolution was
  staged and left for `cherry_pick_finalize_resolution` to skip. No
  `--skip`/`--continue`/`--abort` issued; `CHERRY_PICK_HEAD`
  (0909c3f158b9c5d06401fdca9b08d1314cb9905d) is intact.

No code, UAT or config files were in conflict, so the BUG-1301 precedence
exception did not arise and no hunk was dropped under it.
