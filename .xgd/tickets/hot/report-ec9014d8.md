---
uid: report-ec9014d8
id: REPORT-5519
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:42:15.071923+00:00'
updated_at: '2026-09-29T08:43:27.569713+00:00'
completed_at: null
last_field_updated: subject_uid
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — intent/bookkeeping ticket
  (`request`, REQ-161), rule §2e (per-fact timeline). Path is outside the
  sparse-checkout cone, so the conflict existed in the index only with no
  working-tree markers; resolved with `git checkout --ours --` +
  `git add --sparse --`.

### Per-fact analysis

Merge base (stage 1) had `status: ready_to_reconcile`, `updated_at:
2026-09-01T18:09:24`, and no `bundled_in`. Both sides then edited exactly
three facts — no disjoint additions on either side, so nothing to combine:

| fact | OURS (HEAD, main-rooted) | INCOMING (bc1af120f1) | winner |
|---|---|---|---|
| `status` | `bundled` | `bundled` | identical — not a conflict |
| `bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` | OURS (later) |
| `updated_at` | `2026-09-09T21:32:50` | `2026-09-02T17:48:27` | OURS (later) |

Body text is byte-identical apart from OURS having a trailing newline at
EOF that INCOMING lacks; kept OURS (strict superset, no content lost).

`bundled_in` is the only substantive fact in dispute. Both bundles carry
the identical title `REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 +
2 more`, i.e. the same ticket set was bundled twice — BUNDLE-23
(`bundle-203b1dc2`, created 2026-09-02T17:48:26) and BUNDLE-26
(`bundle-87be4669`, created 2026-09-09T21:32:49). The timeline lookup
required by §2e is unambiguous:

    $ xgd working-timeline bundle-87be4669 bundle-203b1dc2
    bundle-87be4669 -> intent @ 2026-09-11T10:28:15+00:00,
                       anchor_sha 66e172dd4c0dc0ac26775c9b8aacf520bb5e7505
    bundle-203b1dc2 -> error: "ticket lookup failed: Ticket
                       bundle-203b1dc2 not found in branch store or canonical"

`bundle-87be4669` is live, later-positioned, and terminal
(`status: free_and_reconciled`, `completed_at: 2026-09-11T10:28:16`,
`main_sha: 66e172dd4c`) — confirmed reconciled by ancestor commits
`5cb732c518` / `b5b8f4c7af` (`xgd(reconciliation): terminal state
complete`) already integrated into HEAD. `bundle-203b1dc2` was archived
out of the live store (`64a726eda0 xgd(ticket): archive bundle
bundle-203b1dc2`, not an ancestor of HEAD) and its BUNDLE-23 lifecycle
is what this resync queue is replaying. Taking INCOMING would have
repointed a reconciled ticket at a bundle the live store no longer
knows, and rolled `updated_at` back nine days.

## Incoming changes preserved

No code or implementation files were in this conflict — the sole
conflicting path is a bookkeeping ticket, so §2c/§2f (incoming-wins,
never-delete-a-test) do not apply and no BUG-1301 precedence exception
was invoked.

INCOMING's intent was `status: ready_to_reconcile -> bundled`. That
transition **is** present in the resolved version: `status: bundled` is
byte-identical on both sides, so the developer-authored state change
survives intact. Only the bundle *identity* was superseded, and it was
superseded by a later, already-reconciled fact on the HEAD side — which
is precisely the per-fact timeline outcome §2e prescribes, not data loss.

## Staging state

`git status --porcelain` is empty: no `UU`/`AA`/`DU`/`UD` lines remain,
and the index entry is resolved at stage 0
(`100644 9c6d321c8b ... request-78370159.md`). Because the winning side
was HEAD on every fact, the staged diff is empty — per STEP 4 this is
reported, not skipped: `--skip` was NOT called. `CHERRY_PICK_HEAD` is
still present at
`.git/worktrees/resync-377b581e/CHERRY_PICK_HEAD` for
`resync_cherry_pick_finalize_resolution` to consume.