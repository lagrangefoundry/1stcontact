---
uid: report-f86d95ec
id: REPORT-2981
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:52:59.691958+00:00'
updated_at: '2026-08-31T15:52:59.691958+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e),
  resolved outside the sparse-checkout cone (`git checkout --ours` +
  `git add --sparse`). HEAD kept: it is a per-fact superset of the incoming side,
  every incoming fact being either byte-identical or superseded by a later value
  of the same field.

  Incoming commit `e74606d` ("xgd(ticket): update bug bug-db356ff8", 7 insertions
  / 2 deletions) is frontmatter-only. Fact-by-fact against ours (`3e66931`):

  | Fact | Incoming (`785e0a5`) | Ours (`3e66931`) | Resolution |
  |---|---|---|---|
  | `fields.commits[working_sha ea48502d0d90bb607ac528e34099e71eaab6df40, reconcile_sha null, main_sha null]` | added | identical | incoming applied |
  | `fields.version` | added `0.2.10` | `0.2.10` | identical — incoming applied |
  | `status` | `free_coding → free_coded` | `bundled` | same field, later position — ours |
  | `updated_at` | `2026-08-24T01:50:12Z` | `2026-08-26T17:36:27Z` | same field, later — ours |

  The two superseded facts are the same ticket further along one lifecycle:
  `bundled` is the state immediately downstream of `free_coded`, and HEAD carries
  the `fields.bundled_in: bundle-78f4e2fe` record that marks the transition into
  this very bundle. Taking `free_coded` back would rewind the ticket past its own
  bundling. Per 2e's per-fact timeline rule, HEAD's later value wins for those two
  facts; nothing from the incoming side is discarded.

## Incoming changes preserved

Bookkeeping ticket, not a code file — no implementation hunks in play. Both of
the incoming commit's content additions (`fields.commits` with
`working_sha ea48502…`, and `fields.version: 0.2.10`) are present byte-identically
in the resolved version; the remaining two facts (`status`, `updated_at`) are the
same fields advanced further by HEAD, per the table above.

No hunk was dropped under the BUG-1301 precedence exception; none applied.

Net result: the staged tree has no diff vs HEAD, because HEAD's
`seed_local_overlay` state already reflects this commit's effect and more. Per
STEP 4 this is not a failure and `--skip` was not called — the staged state is
left for `cherry_pick_finalize_resolution`. STEP 3's discard guard is satisfied:
the incoming commit's changes are present in HEAD, not absent.

This is the third commit against this one ticket to resolve this way in the
present cherry-pick sequence — `5af1ff9` (body addition, REPORT-2979),
`c1d2a2f` (`free_coding` + `story_points`, REPORT-2980), and now `e74606d`
(`free_coded` + `commits`/`version`). They are consecutive lifecycle updates to
the same bug ticket whose end state the HEAD-side overlay already carries; each
replays as a no-op against it. Flagged here for post-merge review as the
enrichment rule asks, but no developer action is implied — the surviving ticket
is a strict advance on all three.
