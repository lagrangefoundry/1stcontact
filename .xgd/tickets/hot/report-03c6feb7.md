---
uid: report-03c6feb7
id: REPORT-3360
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:10:43.025439+00:00'
updated_at: '2026-09-02T21:10:43.025439+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, index-only (path is outside the
  sparse-checkout cone, so no working-tree markers existed). Rule 2e
  (intent/bookkeeping ticket, `bug-*`), per-fact timeline resolution.
  Resolved to the HEAD (ours) side via
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`.

### Per-fact analysis

Both sides touch exactly the same three facts, plus one field only ours adds:

| fact | base | ours (HEAD) | theirs (incoming `486ef694`) |
|---|---|---|---|
| `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` |
| `updated_at` | 2026-08-24T01:50 | 2026-08-31T19:19 | 2026-08-25T22:52 |
| `completed_at` | `null` | 2026-08-31T19:19 | `null` |
| `fields.bundled_in` | absent | `bundle-78f4e2fe` | absent |

No disjoint edits on the incoming side — there is nothing to compose. Every
field the incoming commit writes, ours writes later to the same field, so this
is the "same field changed differently" case and the timeline rule decides it
per fact; all four facts resolve the same way.

**Timeline determination.** The auto-enrichment reported intent unknown on both
sides and prescribed "more recent commit by timestamp". The raw commit dates are
misleading here and were not used naively:

- ours `fefe99569a` — author 2026-08-23 16:42, **committer 2026-09-02 12:22**
- theirs `486ef694e0` — author = committer 2026-08-25 15:52

The HEAD-side commit is a rewritten/replayed commit (bundle branch history
remap): its author date is preserved from an earlier operation while its
committer date is today, and its *content* is stamped `updated_at`
2026-08-31T19:19 — content that cannot have existed at its Aug 23 author date.
The ticket's own `updated_at` is therefore the reliable operation timestamp.
By that measure ours (2026-08-31) is later-positioned than theirs (2026-08-25),
so ours wins each contested fact.

This agrees with the lifecycle semantics: `free_and_reconciled` is downstream of
`ready_to_reconcile`. Taking theirs would have demoted operator-owned lifecycle
status and dropped `completed_at` and `fields.bundled_in`.

## Incoming changes preserved

Not a code/implementation file, so STEP 3's code-discard guard does not apply;
the equivalent check was still run.

The incoming commit's entire diff is the two-line advance
`status: free_coded → ready_to_reconcile` with a matching `updated_at` bump. Its
intent — move this bug off `free_coded` — **is present in HEAD, via a later
route**: HEAD carries the same ticket further along the same lifecycle to
`free_and_reconciled`, with `completed_at` set and `fields.bundled_in:
bundle-78f4e2fe` recorded. Nothing the developer wrote is absent; it is
superseded by a strictly later operation on the identical fields. This is the
redundant case STEP 3/STEP 4 distinguish from a discard, not the discard case.

No BUG-1301 precedence exception was invoked; no hunk was dropped as obsolete.

## Staging state

`git status --porcelain` shows no conflict-class entries (only pre-existing
untracked `comment-*.md` files, untouched by this resolution). The staged diff
against HEAD is empty, which is expected: HEAD already contains this commit's
effect through the later reconcile operation. Per STEP 4 this is not a failure
and `--skip` was NOT called — the cherry-pick sequencer state is left intact for
`cherry_pick_finalize_resolution`.
