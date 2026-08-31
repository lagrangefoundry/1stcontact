---
uid: report-0a42c186
id: REPORT-2955
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:04:37.153704+00:00'
updated_at: '2026-08-31T15:04:37.153704+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — AA (both added), index-only conflict outside the sparse-checkout cone (DOC-986 §2/§4.1). Rule 2e (intent/bookkeeping ticket, `request-*`), resolved per-fact by later-positioned intent. Resolved with `git checkout --ours` + `git add --sparse`.

  The two sides are byte-identical except for three frontmatter facts:

  | fact | ours (HEAD) | theirs (incoming `9ef799f91`) |
  |---|---|---|
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-20T21:15:50` |
  | `status` | `bundled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent |

  All three differing facts are later on the HEAD side, and HEAD is a strict superset (it adds `bundled_in`, never removes anything the incoming side has). `status` moved forward along its own lifecycle (`ready_to_reconcile` → `bundled`) — taking the incoming side would roll the ticket backwards and drop the bundle linkage. Commit timestamps agree: HEAD-side `8a09ff921` (2026-08-30) is more recent than incoming `9ef799f91` (2026-08-23), which is also what the auto-enrichment rule prescribes.

## Incoming changes preserved

The incoming commit is a single 296-line addition of this one ticket file — no code files in the bundle commit. Its entire body (ticket description, phases, decisions, acceptance criteria, the 2026-08-17 progress/completion sections, and the 2026-08-20 "Free-coding closed" section including the post-resync SHA table and `version: 0.1.59`) is present verbatim in the resolved file; `diff` between the two stages shows differences only in the three frontmatter facts tabled above.

No hunk was dropped under the BUG-1301 precedence exception; no test functions involved.

Net result: the staged tree is identical to HEAD, because HEAD already carries the incoming ticket content plus the later status advance. This is the redundant case, not a discard (STEP 4 / BUG-1109-BUG-1122): the incoming commit's key content is present in HEAD via the later `seed_local_overlay` route, not absent. `--skip` was not called; `CHERRY_PICK_HEAD` is left intact for `cherry_pick_finalize_resolution`.

## Post-merge review flag

The enrichment rule asked for a post-merge review flag on this file (intent unknown on one or both sides). Flagged: `.xgd/tickets/hot/request-b474390f.md` — `status`/`bundled_in` taken from HEAD, incoming `ready_to_reconcile` deliberately discarded as superseded.
