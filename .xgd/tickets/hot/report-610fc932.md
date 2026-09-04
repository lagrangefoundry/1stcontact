---
uid: report-610fc932
id: REPORT-3450
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:22:07.042116+00:00'
updated_at: '2026-09-04T01:22:07.042116+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — UU, index-only (outside sparse-checkout
  cone, DOC-986 §2/§4.1). Class: intent/bookkeeping ticket (2e). Rule applied:
  per-fact composition; ours is a strict lifecycle superset, so ours taken whole
  via `git checkout --ours` + `git add --sparse`.

  Per-fact breakdown (incoming `f3c81c5df5c98d1991cacdd602f8b70ed30a8919`,
  "xgd(ticket): update request request-119dd4af", authored 2026-08-31 20:36 -0700
  vs HEAD-side `1856968a4308785084e30ac2e1b00f60a54023d6`,
  "xgd(ticket): seed_local_overlay request request-119dd4af", 2026-09-02 10:50 -0700):

  - `last_field_updated`: base `body` → `status` on BOTH sides. Identical value,
    not a conflict. Incoming's change is present in the resolution.
  - `status`: incoming `free_coded` → `ready_to_reconcile`; ours
    `free_coded` → `bundled`. Same field, different values — the one genuine
    intent conflict. Neither side's frontmatter carries an `intent_uid`, so
    `xgd working-timeline` does not apply; per the auto-enrichment rule
    ("Intent unknown on one or both sides. Take the more recent commit by
    timestamp"), the HEAD side is later (2026-09-02 vs 2026-08-31) and wins.
    `bundled` is also strictly downstream of `ready_to_reconcile` on the request
    lifecycle: HEAD already passed through the incoming's target state and
    advanced past it. Taking the incoming value would regress operator-owned
    status.
  - `fields.bundled_in: bundle-203b1dc2`: added by ours only, untouched by
    incoming — non-overlapping addition, kept.
  - `updated_at`: tracks the winning `status` fact; ours (2026-09-02T17:48:26Z)
    kept.
  - Trailing-newline removal at EOF: both sides made the identical change;
    present in the resolution.
  - Body (lines 25–232): byte-identical on both sides. No content composition
    needed.

  No fields invented; nothing present on either side was dropped except the
  superseded `status` scalar and its `updated_at` timestamp.

## Incoming changes preserved

The incoming commit touched exactly one file and changed exactly two frontmatter
facts plus the EOF newline. `last_field_updated: status` and the EOF newline
removal are byte-for-byte present in the staged result. The `status` transition
is present transitively: HEAD records `bundled`, which is reachable only by
first passing through `ready_to_reconcile` — the incoming commit's effect is
already in HEAD via the reconcile route, not discarded.

The staged diff against HEAD is therefore empty (`git diff --cached HEAD` returns
nothing). This is the redundant-commit case of BUG-1109/BUG-1122, not a STEP 3
discard: STEP 3's discriminator is whether the incoming commit's key changes are
present in HEAD or simply absent, and here they are present. `--skip` was NOT
called; the finalize step will detect the clean staged diff.

No code/implementation files were in conflict, so no BUG-1301 precedence
exception was invoked and no test function was deleted.

Cherry-pick sequencer state verified intact after staging: CHERRY_PICK_HEAD still
reads f3c81c5df5c98d1991cacdd602f8b70ed30a8919. `git ls-files -u` returns 0
unmerged entries.
