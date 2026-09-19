---
uid: report-b7413cc2
id: REPORT-4392
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:58:50.424508+00:00'
updated_at: '2026-09-19T10:58:50.424508+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (rule 2e). Resolved per-fact in favour of the HEAD side.

Incoming commit `58d4f8ec81` (`xgd(ticket): update request request-6893f6ea`, 2026-09-01) changed exactly two frontmatter lines and nothing else:

```
-updated_at: '2026-09-01T18:09:26.153618+00:00'
+updated_at: '2026-09-01T18:53:35.532141+00:00'
-status: ready_to_reconcile
+status: free_coded
```

Both lines are one fact — a status transition and its stamp. The HEAD side carries the same fact set differently:

| fact | HEAD | incoming |
|---|---|---|
| `status` | `bundled` | `free_coded` |
| `updated_at` | `2026-09-09T21:32:50` | `2026-09-01T18:53:35` |

This is 2e's "same field changed differently on each side" case, so the later-positioned side wins **for that fact**. HEAD is later on both available measures:

- **Timestamp** — HEAD's `seed_local_overlay` commit `c94654a355` is dated 2026-09-09, eight days after the incoming commit. This also matches the auto-enrichment's stated rule for this file ("take the more recent commit by timestamp").
- **Lifecycle position** — the ticket status ladder is monotonic: `free_coded` → `ready_to_reconcile` → `bundled`. HEAD sits two steps downstream of the incoming value, so taking incoming would move the ticket *backwards*.

A corroborating consistency check: the unconflicted part of the same frontmatter (HEAD side, merged clean) already carries `fields.bundled_in: bundle-87be4669`. Writing `status: free_coded` while `bundled_in` stays populated would leave the ticket internally inconsistent.

Because the incoming commit's whole diff is confined to this single hunk, HEAD's file is byte-for-byte the correct resolution; it was taken with `git checkout --ours` rather than a hand-edit, so no frontmatter drift could be introduced. Staged with `git add --sparse`.

No spec tickets (2d), code files (2c), UAT files (2f) or config files (2g) were in conflict. No UAT function was deleted; the BUG-1301 precedence exception was not invoked anywhere.

## Incoming changes preserved

No code/implementation files were conflicted, so there is no developer source to preserve. For the one bookkeeping ticket:

The incoming commit's intent — advance `request-6893f6ea` out of `ready_to_reconcile` into `free_coded` — is **present in HEAD via a different route, not discarded**. HEAD records the ticket at `bundled`, which is reachable only by passing *through* `free_coded`; `fields.bundled_in: bundle-87be4669` and `fields.version: 0.2.27` are the downstream artefacts of that same progression. The incoming value is superseded by a later transition of the identical field, which is precisely the per-fact timeline outcome rule 2e prescribes — not the STEP 3 failure case, where the incoming commit's key change is genuinely absent from HEAD.

Consequently this resolution nets to **no diff vs HEAD** (`git status --porcelain` is empty; the file shows neither a conflict class nor `M`). Per STEP 4 this is expected and is not a failure: the commit is redundant because its effect already landed through the later `seed_local_overlay`. `--skip` was **not** called; `CHERRY_PICK_HEAD` (`58d4f8ec817935ef4df4897571ea6bba0c243e2a`) is left in place for `cherry_pick_finalize_resolution`, which will detect the clean staged diff and skip the commit itself.

## Post-merge review flag

The auto-enrichment classified the ours-side intent as unknown and asked that this file be flagged for post-merge review. Flagging it here: `request-6893f6ea` frontmatter took the HEAD (`bundled`) status over the incoming (`free_coded`). No action is expected — the two sides disagree only on a superseded lifecycle value — but the divergence is recorded for the reviewer.
