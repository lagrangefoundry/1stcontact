---
uid: report-c71ad3cd
id: REPORT-4128
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:24:51.056661+00:00'
updated_at: '2026-09-12T20:24:51.056661+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit `5a68fc8d` (`xgd(ticket): update bug bug-23d1ec27`,
  2026-08-26 16:21 PDT, 91 insertions / 95 deletions).

  Only the frontmatter block conflicted. Per-fact resolution:
  - `status`: ours `bundled` vs theirs `ready_to_reconcile` — kept ours. Later
    intent (HEAD side from `09291354` `seed_local_overlay`, 2026-08-31 vs
    incoming 2026-08-26) and the downstream lifecycle state; the
    non-conflicted `fields.bundled_in: bundle-8eef3846` in the same file is
    consistent only with `bundled`.
  - `updated_at`: kept ours (`2026-08-31T05:05:09Z` > `2026-08-26T23:21:08Z`).
  - `last_field_updated`: kept ours (`status`) — it is the breadcrumb of the
    LAST update, and the HEAD-side status change is the later one. Taking
    theirs (`body`) would have described an update that is no longer last.

  Resolution is byte-identical to the ours stage (verified with
  `git diff --no-index` against `git show :2:`). No markers remain. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone).

## Incoming changes preserved

No code/implementation files in this conflict — the single file is a bug
bookkeeping ticket, not matrix state or source.

The incoming commit's substantive change is the prose-body reflow (the wrapped
form unwrapped, the markdown table flattened, the ```ts fence untyped) — 91/95
of its changed lines. That change is ALREADY PRESENT IN HEAD verbatim:
`diff` of `git show :2:` against `git show :3:` shows the two stages' bodies are
byte-identical, the only remaining differences being the three frontmatter
bookkeeping facts above plus `bundled_in` (added on the HEAD side only, and not
removed by the incoming commit). This is STEP 3's "present via a different
route" case — the seeded local overlay carried the same body — not a discard.

No BUG-1301 precedence drops were needed.

The staged diff vs HEAD is therefore empty. Per STEP 4 this was staged and left
for the finalize step to skip; `--skip` was not called and CHERRY_PICK_HEAD is
intact.

## Post-merge review flag

Per the conflict-intent enrichment ("intent unknown on one or both sides"),
flagging this file for post-merge review — same file and same frontmatter facts
as the immediately preceding resolution (incoming `bffb6b34`): the ticket's
`status` reflects the reconcile bundle's seeded overlay rather than the
developer's `ready_to_reconcile` marker.
