---
uid: report-774f7f0b
id: REPORT-2859
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:38:36.440305+00:00'
updated_at: '2026-08-31T08:38:36.440305+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **AA** (both added, no merge base),
  intent/bookkeeping ticket (`request-*`, rule **2e**, with **2b** superset rule
  for the both-added class). Resolved to the **ours/HEAD** side.
  Index-only conflict: `.xgd/tickets/` is explicitly outside the sparse-checkout
  cone (`!/.xgd/tickets/**`) and the file was absent from the working tree, so
  resolution used `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

### Why ours, not incoming

The two sides differ in exactly three frontmatter facts; the entire 182-line
document body is byte-identical. All available signals agree that HEAD carries
the later state of those same facts:

| Signal | Ours (HEAD) | Theirs (incoming) | Later |
| --- | --- | --- | --- |
| Last-touch commit date | Aug 30 22:06 (`e0ffd3bf`, `seed_local_overlay`) | Aug 23 13:30 (`7fb57728`, `update`) | ours |
| Ticket `updated_at` | `2026-08-24T02:10:41Z` | `2026-08-20T12:51:32Z` | ours |
| `status` | `bundled` | `reconciling` | ours (advanced) |
| `fields.bundled_in` | `bundle-b3b7c399` | absent | ours (superset) |

The auto-enrichment for this file recorded "intent unknown on one or both sides;
take the more recent commit by timestamp and flag for post-merge review" — that
rule selects ours (Aug 30 > Aug 23), and it converges with 2e's strict-superset
rule, since ours advanced `status` one step further and added a field the
incoming side never had.

Decisive corroboration: HEAD's `status: bundled` plus
`bundled_in: bundle-b3b7c399` is the bookkeeping for **this very reconcile
bundle**. Taking the incoming side would have reverted the ticket to
`reconciling` and dropped the linkage to the bundle currently being processed —
i.e. it would have undone in-flight state with a stale snapshot of it.

Per-fact resolution, per 2e — not a whole-file winner-takes-all pick. No field
was set to a value absent from both sides; no content was invented; no
`intent_uid`/`story_uid`/`capability_uid` was touched.

**Flagged for post-merge review** as the enrichment rule directs, though the
residual risk is nil here: the resolution is byte-identical to HEAD, so nothing
new entered the tree.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted file is
a bookkeeping ticket.

STEP 3 check, redundant vs. discarded: the incoming commit `7fb57728` is a pure
182-line add of this request ticket. Its substance — the complete document body,
title, `created_at`, `priority`, `story_points`, `version`, `chat_comment`, and
the commit-SHA list — **is present in HEAD verbatim**. The only three lines that
differ are *older values of facts HEAD subsequently advanced*
(`updated_at`, `status`, and the not-yet-added `bundled_in`). Nothing the
developer authored is absent; the incoming state is superseded, not discarded.
This is the "present via a different route" case STEP 3 describes, so it is not
a @fail.

No hunk was dropped under the BUG-1301 precedence exception; that exception was
not invoked.

## Staging state

Resolution nets to **no diff vs HEAD** (staged blob `196bd290` == `HEAD:` blob
for the path, collapsed to stage 0; `git status --porcelain` reports no tracked
entries). Per STEP 4 this is expected and is not a failure — the incoming commit
is genuinely redundant against HEAD for this path, as established above.
`git cherry-pick --skip/--continue/--quit/--abort` was **not** called;
`CHERRY_PICK_HEAD` (`7fb57728`) remains present for
`cherry_pick_finalize_resolution`, which will detect the clean staged diff and
skip the commit. Git writes were limited to `checkout --ours` and `add --sparse`
on the single path, each issued as the sole content of its own call (BUG-1294).
