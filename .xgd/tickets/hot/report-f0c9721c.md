---
uid: report-f0c9721c
id: REPORT-3213
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T05:04:57.093525+00:00'
updated_at: '2026-09-01T05:04:57.093525+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, index-only conflict (the path is
  sparse-excluded on the reconcile branch, so no working-tree markers existed).
  Class 2e (intent/bookkeeping ticket), resolved **per-fact**, not whole-file.
  Resolved to the ours blob `52bab41fee`; verified with `git hash-object` and a
  marker scan.

  Incoming is `5a68fc8d` `xgd(ticket): update bug bug-23d1ec27` (author date
  2026-08-26 16:21:08 -0700), `last_field_updated: body`. Ours is HEAD, whose
  tip commit for this path is `fe03200d6` (subject `Merge branch 'free-BUG-39'
  into xgd-working`; single-parent, so a replayed commit rather than a true
  merge).

  | fact | base `ad25504e` | incoming `df68f1cf` | ours `52bab41f` | kept | why |
  |---|---|---|---|---|---|
  | `updated_at` | 08-26T18:31:09 | 08-26T23:21:08 | 08-31T05:05:09 | **ours** | later-positioned intent |
  | `status` | `ready_to_reconcile` | `ready_to_reconcile` (untouched) | `bundled` | **ours** | only ours changed this fact |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | **ours** | ours-only addition, non-overlapping |
  | `last_field_updated` | `status` | `body` | `status` | **ours** | in the composed result the most recent field update is the 08-31 status change, so `status` is the accurate value |
  | body | wrapped, table intact | reflowed, structure stripped | wrapped, table intact | **ours** | ours is the strict superset — see below |
  | trailing newline | absent | absent | present | **ours** | ours-only |

  No content was invented; `intent_uid` / `story_uid` / `capability_uid` were
  not touched.

  **On the body fact.** `git diff --word-diff --ignore-all-space` between the
  ours and incoming stages shows **zero prose words added or removed** — every
  sentence of the incoming body is present verbatim in ours. The incoming
  change is a lossy reflow that only *subtracts* markdown structure: it deletes
  the `| suite | before | after |` table's pipes and separator row (flattening
  8 rows into 27 bare paragraphs), drops the `ts` language tag from the
  root-cause code fence, and displaces the bold markers in "**One double, in
  **\`tests/support/scripted-model-client.ts\`". Under 2e's "one side is a
  strict superset of the other, keep the superset", ours is the superset.

  **Why the 3-way base is misleading here, and the decisive evidence.** Git's
  base makes this look like "incoming edited the body, ours did not". It is
  actually a revert-resurrection: HEAD's ancestry already contains this exact
  edit. Commit `6778773d8` on HEAD (same author date, same subject as the
  incoming commit) produced blob `01eb488de` — and `git diff --ignore-all-space
  01eb488de df68f1cf47` shows the two post-images differ **only in frontmatter,
  with byte-identical bodies**. HEAD's next commit on this path, `fe03200d6`
  (`01eb488de` -> `52bab41fee`), restored the structured body. So HEAD is
  downstream of the incoming body edit, not ignorant of it, and re-applying it
  would resurrect a change HEAD's tip already superseded.

  Resolution nets to no diff vs HEAD (empty staged diff). Per STEP 4 it was
  staged and left for `cherry_pick_finalize_resolution`; no `--skip` /
  `--continue` / `--abort` / `reset` was issued, and `CHERRY_PICK_HEAD`
  (`5a68fc8d`) is still present.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit touches
exactly one file, this bookkeeping ticket.

Its two changes are both present in the resolved file rather than discarded:

1. **Body text** — present verbatim. The whitespace-insensitive word diff
   confirms the incoming body contains no word that ours lacks; only markdown
   scaffolding differs, and ours retains strictly more of it.
2. **Status/bookkeeping** — the incoming commit left `status` at
   `ready_to_reconcile` and only stamped `updated_at` / `last_field_updated:
   body`. HEAD carries `status: bundled` plus `fields.bundled_in:
   bundle-8eef3846`, i.e. this very reconcile bundle already consumed the
   ticket, which is strictly downstream. Taking incoming's frontmatter would
   have regressed the bundle bookkeeping.

This is STEP 4's redundant case, not STEP 3's discard case: the incoming
commit's key change is present in HEAD via a different route (`6778773d8`,
whose body output is byte-identical to the incoming commit's). No BUG-1301
precedence exception was invoked; no test function was deleted or dropped.
