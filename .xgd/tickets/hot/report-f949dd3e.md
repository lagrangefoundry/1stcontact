---
uid: report-f949dd3e
id: REPORT-4139
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:28:10.848669+00:00'
updated_at: '2026-09-13T21:28:10.848669+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**; `type: bundle`, lives in `hot/` but is not a matrix-defining spec ticket). One conflict region only (frontmatter lines 8–18); `git diff --check` confirmed no other marker in the file. Resolved **per fact**, all four facts landing on the HEAD side. Staged with `git add --sparse` (path is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

### Per-fact resolution

Merge base read from `git show :1:`; incoming = `aaf472a06e` (`xgd(ticket): update bundle bundle-b3b7c399`, 2026-08-30 22:04:25 -0700).

| field | base | HEAD (ours) | incoming (theirs) | taken | why |
|---|---|---|---|---|---|
| `updated_at` | `2026-08-30T04:33:05` | `2026-08-31T14:23:04` | `2026-08-31T05:04:25` | HEAD | same fact, HEAD later on both the ticket clock and the commit clock |
| `completed_at` | `null` | `2026-08-31T14:22:24` | `null` | HEAD | incoming never touched it — base value carried as context; HEAD is the only side that changed it |
| `last_field_updated` | `status` | `result` | `status` | HEAD | same: untouched by incoming, changed only by HEAD |
| `status` | `reconciling` | `free_and_reconciled` | `ready_to_reconcile` | HEAD | genuine same-fact conflict → later-positioned intent wins |

Only `status` and `updated_at` were genuinely contested. The other two lines appeared in the conflict hunk purely because git widened the region; incoming left them at their base values.

### Timeline evidence for the contested fact

`xgd ticket history bundle-b3b7c399` (HEAD side) vs `--rev aaf472a06e` (incoming side):

- incoming lineage: `ready_to_reconcile` (2026-08-30T04:32:26Z) → `reconciling` (04:33:05Z, = merge base) → **`ready_to_reconcile`** (2026-08-31T05:04:25Z, commit `aaf472a06e`)
- HEAD lineage: `reconciling` (2026-08-31T05:05:42Z) → **`free_and_reconciled`** (14:22:24Z, commit `a0b52c93`) → `result: pass` (14:23:04Z, commit `8e07e601`)

HEAD's intent is ~9h later than incoming's on the wall clock and later on the ticket's own `updated_at`, which is the rule the auto-enrichment prescribed for this file ("Intent unknown on one or both sides. Take the more recent commit by timestamp"). It is also the only internally consistent outcome: `fields.result: pass` and `fields.merged_at_commit: eef7a8b48b` are already in HEAD and were *not* in conflict (incoming does not touch `fields`), so taking incoming's `status: ready_to_reconcile` / `completed_at: null` would have left a bundle recording a passed, merged reconcile while claiming it had not started.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's code-preservation check does not apply to it. Recording the disposition anyway:

- `git show aaf472a06e -- .xgd/tickets/hot/bundle-b3b7c399.md` is a single 2-line hunk: `status: reconciling` → `ready_to_reconcile` and the matching `updated_at` bump. Both lines fall entirely inside the one conflict region.
- Neither line survives into the resolution. This is **supersession, not discard**: the incoming value is an *earlier* position of the same lifecycle field, and HEAD already carries the later positions of that field (`free_and_reconciled`, `completed_at`, `result: pass`, `merged_at_commit`) reached after the incoming write. Re-applying incoming would move the bundle's state backwards. Per 2e this is the timeline rule operating as intended, not STEP 3's "incoming changes are genuinely absent" failure.
- No BUG-1301 precedence exception was invoked; no test function on either side was deleted.

## Staging state

`git status --porcelain` is empty and `git diff --cached --stat HEAD` is empty — the resolution nets to no diff vs HEAD, expected here since every contested fact resolved to HEAD. Per STEP 4 this is not a failure and `--skip` was **not** called; `cherry_pick_finalize_resolution` will detect the clean staged diff. `git rev-parse --verify CHERRY_PICK_HEAD` still returns `aaf472a06e2b847276c29143c57d8c854142bc21`, so the sequencer state is intact for the next step.
