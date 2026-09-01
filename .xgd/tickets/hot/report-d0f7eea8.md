---
uid: report-d0f7eea8
id: REPORT-3188
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:41:50.782758+00:00'
updated_at: '2026-09-01T02:41:50.782758+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`), but git had
  materialized the file with markers, so it was resolved in the worktree and
  staged with `git add --sparse`.
  **Rule applied: 2e "one side is a strict superset" — kept OURS (HEAD).**

  Per-fact comparison of the two sides against the merge base (base = state at
  `2026-08-24T21:32`, `status: free_coding`, no `commits`/`version`):

  | fact | incoming (1eb1dd1586, free_coded, 2026-08-24T21:42) | ours / HEAD (seeded overlay, 2026-08-26T17:36) | kept |
  |---|---|---|---|
  | `status` | `free_coding` → `free_coded` | `free_coding` → `bundled` | ours |
  | `fields.commits` | adds `[{2058a164…, null, null}]` | has that same entry as `commits[0]` (plus `working_sha_history: []`) **plus** `0fe586d1…` and `999579b3…` | ours |
  | `fields.version` | `0.2.11` | `0.2.13` | ours |
  | `fields.bundled_in` | not set | `bundle-78f4e2fe` | ours |
  | `updated_at` | `2026-08-24T21:42:43` | `2026-08-26T17:36:27` | ours |
  | body prose | **no change vs base** | rewrote "Still outstanding" → "Observability — added here" + "Deployment" | ours |

  Ours is a superset on every fact the incoming commit touched, and is also the
  later-positioned side by timestamp — which is what the auto-enriched
  resolution rule for this file ("take the more recent commit by timestamp")
  independently prescribes. The two agree, so no `working-timeline` tiebreak was
  needed.

  `bundled_in: bundle-78f4e2fe` is *this* reconcile bundle, so HEAD's `bundled`
  is the same ticket's own later lifecycle state recorded by xgd-working — it
  presupposes the `free_coded` transition the incoming commit is making, rather
  than competing with it.

  Losslessness of `--ours` was proved before taking it (not assumed): `git diff
  HEAD` on the conflicted worktree file showed **marker-only** hunks — every `+`
  line was either a conflict marker or a duplicate of the theirs-side content
  inside the markers. No incoming content had been auto-merged outside the
  markers, so taking HEAD's blob discarded nothing git had already integrated.
  In particular the body sections auto-merged to HEAD's version because the
  incoming commit made no body change at all.

## Incoming changes preserved

Verified via `git show 1eb1dd1586 -- .xgd/tickets/hot/bug-6612c4b7.md`. The
incoming commit is a ticket-bookkeeping update only — it touches no code file.
Each of its changes is present in HEAD via a later route:

- `status: free_coded` — present, advanced past to `bundled` by xgd-working's own
  later transition into this bundle.
- `commits[] += {working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc}` —
  present verbatim as `commits[0]` in HEAD, alongside two later working SHAs.
- `version: 0.2.11` — present, advanced past to `0.2.13`.
- `updated_at` bump — HEAD's timestamp is strictly later.
- No body/prose changes on the incoming side, so none could be lost.

This is STEP 3's *redundant*, not *discarded*, case: the incoming commit's key
changes are present in HEAD rather than absent. Consequently the staged tree
nets to **no diff vs HEAD** (`git diff --cached HEAD` is empty) — the
BUG-1109/BUG-1122 situation. Per STEP 4 this is not a @fail and `--skip` was not
called; the finalize step will detect the clean staged diff and skip the commit.

No code, UAT, or spec-ticket files were involved, so the BUG-1301 precedence
exception was not invoked and no hunk was dropped under it.

`CHERRY_PICK_HEAD` (1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5) is still present;
no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run. Git writes were
limited to `checkout --ours` and `add --sparse` on the single conflicted path.
