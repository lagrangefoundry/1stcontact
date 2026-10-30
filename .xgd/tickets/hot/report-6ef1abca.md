---
uid: report-6ef1abca
id: REPORT-5518
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:37:02.554057+00:00'
updated_at: '2026-09-29T08:37:02.554057+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` (REQ-163) — **UU**, class **2e**
  (intent/bookkeeping ticket, `request-*`). Resolved to the **ours / HEAD**
  blob `a8c14c1e9b0a39ba3b2218d64a4515bd38a951a9`.

  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1) — the conflict
  existed only in the index, with no working-tree markers. `git checkout
  --ours` refused it (`paths ... outside of your sparse-checkout definition`),
  so it was staged with `git restore --ignore-skip-worktree-bits --staged
  --source=HEAD -- <path>`, which sets index stage 0 to HEAD's blob and clears
  stages 1/2/3 without touching the (absent) working tree.

  **Conflicting facts — both sides changed the same two fields differently:**

  | field | ours (HEAD) | theirs (`0e90542c74`) |
  |---|---|---|
  | `updated_at` | `2026-09-09T21:32:49.997177+00:00` | `2026-09-02T17:48:27.176999+00:00` |
  | `fields.bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` |

  `status: bundled` and the entire 350-line body are identical on both sides;
  the only other difference is a trailing newline (present on ours, absent on
  theirs).

  **Rule applied — 2e genuine same-field conflict → later-positioned intent
  wins, per fact.** Ours is later on every axis:

  - Ledger narratives (`xgd ticket history request-439cd0c8` vs
    `--rev 0e90542c74`): theirs is `ready_to_reconcile → bundled` into
    BUNDLE-23 at 2026-09-02; ours is a `seed_local_overlay` carrying
    `bundled` / `bundle-87be4669` at 2026-09-09.
  - Bundle lifecycle: `bundle-203b1dc2` (BUNDLE-23) is still
    `status: ready_to_reconcile` and never completed. `bundle-87be4669`
    (BUNDLE-26) carries the identical seven-request title
    (`REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more`), is
    `status: free_and_reconciled`, and completed 2026-09-11 — it is the
    re-bundle that actually landed.
  - Sibling consistency: all six co-bundled requests already read
    `bundled_in: bundle-87be4669` at HEAD (`request-119dd4af`, `-26dafd83`,
    `-3bc4b835`, `-6893f6ea`, `-78370159`, `-909e42f8`). Taking theirs would
    have left REQ-163 alone pointing at the abandoned bundle.
  - This also matches the auto-enrichment directive for this file ("take the
    more recent commit by timestamp and flag for post-merge review").

  **Flagged for post-merge review** per the enrichment rule: the incoming
  commit's intent (record REQ-163 as bundled into BUNDLE-23) is deliberately
  not represented in the resolved tree. If BUNDLE-23's provenance needs to be
  retained anywhere, it belongs on the bundle ticket, not as a regression of
  REQ-163's `bundled_in` pointer.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, resolved under 2e (not 2c), so STEP 3's
"incoming-must-appear" check does not apply and the BUG-1301 PRECEDENCE
exception was not invoked.

For completeness, the incoming frontmatter edit (`updated_at` →
`2026-09-02T17:48:27`, `bundled_in` → `bundle-203b1dc2`) is intentionally
absent from the resolved blob: it is the losing side of a genuine same-fact
conflict, superseded by the later 2026-09-09 state that every sibling ticket
in the same bundle group already agrees with. No incoming developer code was
discarded.

## Staging state

- `git ls-files -u` → empty (no unmerged entries).
- `git status --porcelain` → empty. The resolved tree is byte-identical to
  HEAD because the cherry-picked commit touched only this one file, so the
  staged diff is empty; per STEP 4 this is left for Python's finalize step to
  detect and skip. No `--continue` / `--skip` / `--quit` / `--abort` was run.
- `CHERRY_PICK_HEAD` still present and intact
  (`0e90542c748f41566276b4260f9aa46c45a41454`).
