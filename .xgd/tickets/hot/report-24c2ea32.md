---
uid: report-24c2ea32
id: REPORT-3037
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:45:24.823424+00:00'
updated_at: '2026-08-31T19:45:24.823424+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — class **AA** (both added), intent/bookkeeping
  ticket (REQ-149, `request-*`) → rule **2e** (intent/bookkeeping ticket), strict-superset
  branch, corroborated by the 2e per-fact timeline rule and by the conflict-enrichment
  metadata's "take the more recent commit by timestamp" instruction. Resolved to the
  **HEAD (ours)** side.
  - Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so
    resolution used `git checkout --ours --` followed by `git add --sparse --`.

### Why ours

Ours (stage 2, `6546223f1d`, 534 lines) is a **strict superset** of theirs (stage 3,
`735995e479`, 383 lines). Diffing theirs → ours yields additions only. The complete set
of content unique to the incoming side is four lines:

```
updated_at: '2026-08-22T23:55:22.575466+00:00'
status: free_coding
  version: 0.2.1
    missing tenant and for a missing asset alike.
```

The fourth is not in fact unique — it exists verbatim in ours at line 401 and appears in
the diff only as a `\ No newline at end of file` boundary artifact (it is theirs' last
line; in ours it is followed by further sections). The other three are **older values of
facts ours has since advanced**, not competing edits:

| Fact | Incoming (theirs) | HEAD (ours) |
|---|---|---|
| `updated_at` | 2026-08-22T23:55:22 | 2026-08-24T02:10:41 |
| `status` | `free_coding` | `bundled` |
| `fields.version` | 0.2.1 | 0.2.9 |

Ours additionally carries five further `commits[].working_sha` entries, `bundled_in:
bundle-b3b7c399`, `chat_comment: comment-98e86f10`, and ~137 lines of body the incoming
side predates (the `bin/build` type-only-import follow-up with AC 12, and the deploy
secret guard follow-up with ACs 13–16).

Both timeline signals agree that HEAD is later: the HEAD-side commit `b6ac2faae6`
(`seed_local_overlay request request-554ac441`) is dated 2026-08-30 22:06:21 -0700 versus
the incoming `9e5327cff0` at 2026-08-22 16:55:23 -0700, and the tickets' own `updated_at`
fields order the same way. Taking theirs would have regressed the ticket's lifecycle
state from `bundled` back to `free_coding`, dropped its version claim from 0.2.9 to
0.2.1, discarded its bundle membership, and deleted two documented follow-up sections —
i.e. it would have destroyed bookkeeping, not preserved developer intent.

No fields were invented, and `fields.intent_uid` / `story_uid` / `capability_uid` were
not touched.

## Incoming changes preserved

The incoming commit `9e5327cff0` (`xgd(ticket): update request request-554ac441`) touches
exactly one file — this ticket — adding 384 lines. It contains no code, no test, and no
UAT function; the BUG-1301 precedence exception was not needed and no hunk was dropped
under it.

Every line of the incoming version is present in the resolved file: `git diff theirs ours`
is additions-only apart from the three superseded scalars tabulated above. The incoming
commit's substance is therefore **already in HEAD via a different route** — the later
`seed_local_overlay` commit `b6ac2faae6` carries the incoming body verbatim plus the
subsequent follow-ups.

Accordingly the resolution stages to **no net diff vs HEAD**
(`git diff --cached HEAD -- <path>` is empty). Per STEP 4 this is the redundant-commit
case (BUG-1109/BUG-1122), not the STEP 3 discard case: STEP 3's discriminator is whether
the incoming commit's key changes are *present in HEAD* (redundant) or *simply absent*
(discarded), and here they are demonstrably present. `git cherry-pick --skip` was not
called; the finalize step will detect the clean staged diff. `CHERRY_PICK_HEAD`
(`9e5327cff0`) remains in place.

The 14 untracked `comment-*` / `report-*` files under `.xgd/tickets/hot/` are pre-existing
worktree residue unrelated to this cherry-pick and were left untouched.
