---
uid: report-c6529c65
id: REPORT-5320
type: report
title: 'resolve_conflicts: doc-14f256a7 add/add — keep ours (pick already on HEAD)'
created_by: xgd
created_at: '2026-09-28T07:36:08.906425+00:00'
updated_at: '2026-09-28T07:36:08.906425+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Conflict resolution — cherry-pick 6c7e26a0

**Result:** pass — 1 conflict resolved, staged, no markers remain.

## Picked commit

`6c7e26a00649f9390a4ee7c0814482404b28e0cd` — `xgd(ticket): update doc doc-14f256a7`
(body: `field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)`,
author date `Mon Aug 31 12:43:36 2026 -0700`)

## Conflict

`.xgd/tickets/hot/doc-14f256a7.md` — add/add (stages 2 and 3, no base). The incoming
side presents the file as a whole-file add (300 lines, new file mode), the usual
remapped-history artifact for a ticket path rather than a real creation.

## Resolution: keep ours (HEAD), verbatim

The picked commit is **already on this branch** as `48103a69eb` — identical subject,
identical body line, identical author date `Mon Aug 31 12:43:36 2026 -0700`. On top of
it HEAD carries `b55ee130b6` (`content edit: answer open item 4 — the Library tab and
the two upload routes (REQ-161)`, author date 14:47:36), a later refinement of the same
ticket.

Diff between the two sides is three lines, all of which favour ours:

| field | ours (HEAD, stage 2) | incoming (stage 3) |
|---|---|---|
| `updated_at` | `2026-08-31T21:47:36` | `2026-08-31T19:43:36` |
| `last_field_updated` | `body` | `system_kb` |
| open question 4 | answered via REQ-161 (Library tab, two upload routes) | unanswered original text |

The picked commit's actual intent — retire the `system_kb` boolean, carry membership on
`doc_kind` — is **already satisfied on ours**: `fields:` holds `doc_kind: architecture`
and no `system_kb` key on either side. So no incoming developer-authored change is
discarded by taking ours; the incoming side is strictly the older state of the same
ticket, and taking it would have reverted the REQ-161 body answer.

Resolved with `git checkout --ours` (restores the exact HEAD blob
`dade339726d74aac57eb34402bc8337cbe13b832`) and `git add --sparse`.

## Post-state

- `git status --short` — clean, no unmerged paths.
- `git diff --cached HEAD` — empty. The staged tree equals HEAD, so this cherry-pick is
  an empty pick; the finalize step is expected to skip it.
- No conflict markers remain anywhere in the worktree.

Per the stage-only contract, this session did not call `git cherry-pick --continue` or
`--skip`.
