---
uid: report-7fe228cd
id: REPORT-5515
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:22:43.476236+00:00'
updated_at: '2026-09-29T08:22:43.476236+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — class **UU**, intent/bookkeeping ticket (rule **2e**), resolved **per fact** as *later-positioned intent wins*; net effect is keep-ours.
  - The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the index with no working-tree markers. Resolved with `git checkout --ours -- <path>` then `git add --sparse -- <path>`, each issued as the sole content of its own call (BUG-1294).
  - Incoming commit `7123292250` (`xgd(ticket): update request request-909e42f8`, 2026-09-02 10:48 -0700). Its **entire** diff is four frontmatter lines — verified mechanically by diffing stage 1 against stage 3, which produces no body hunks at all:
    - `updated_at`: `2026-09-01T18:14:18` → `2026-09-02T17:48:26`
    - `last_field_updated`: `body` → `status`
    - `status`: `ready_to_reconcile` → `bundled`
    - `fields.bundled_in`: (absent) → `bundle-203b1dc2`
  - Per-fact resolution:
    - `last_field_updated: status` and `status: bundled` — **identical on both sides**. No competing fact; 2e's timeline rule never had to fire for these.
    - `updated_at` — ours `2026-09-09T21:32:49` is later than incoming's `2026-09-02T17:48:26`. Ours kept.
    - `fields.bundled_in` — the **only genuine disagreement**: ours `bundle-87be4669` vs incoming `bundle-203b1dc2`. Ours kept; see below.
    - body — incoming changed nothing, so taking ours discards nothing. (Ours is the reflowed `seed_local_overlay` body; incoming's body is byte-identical to the merge base.)
  - Evidence for the `bundled_in` decision, read from the bundle tickets themselves rather than from timestamps alone:
    - `bundle-203b1dc2` (BUNDLE-23, created 2026-09-02) — `status: ready_to_reconcile`, `completed_at: null`, every entry in `fields.commits` still at `main_sha: null`. **Never reconciled.**
    - `bundle-87be4669` (BUNDLE-26, created 2026-09-09, completed 2026-09-11) — `status: free_and_reconciled`, landed on main as `66e172dd4c`, carrying the full `orphan_commits` rewrite map from the resync.
    - Both bundles carry the **identical** title (`REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more`): BUNDLE-26 is the re-bundling of the same seven requests after the resync, and it is the one that landed.
    - Corroborating consistency check: at HEAD, **all seven** request tickets carry `bundled_in: bundle-87be4669` and **zero** carry `bundle-203b1dc2` (`git grep` over `HEAD:.xgd/tickets/`). Taking incoming would have pointed REQ-164 alone at an abandoned bundle, contradicting its six siblings and leaving `bundled_in` inconsistent with the `commits`/`version` artifacts sitting unconflicted in the same frontmatter.

## Incoming changes preserved

- `.xgd/tickets/hot/request-909e42f8.md` — not a code file; no code, test, or UAT file was in conflict, so the BUG-1301 precedence exception was neither needed nor invoked and no hunk was dropped under it.
- The incoming commit's intent — *"this request is now bundled"* — **is present in the resolved file**, not discarded: the resolved ticket reads `status: bundled` with `last_field_updated: status`, the same two facts the incoming commit set, at identical values. What differs is only *which* bundle, and the resolved file names the bundle that actually reconciled to main.
- The one incoming value absent from the result (`bundled_in: bundle-203b1dc2`) is **superseded, not lost**. It points at a bundle that never reconciled and that no other ticket in the tree references; the HEAD side records the same ticket in the successor bundle that completed. This is STEP 3's "present via a different route" case, and 2e's per-fact timeline rule selects the same side independently (2026-09-09 vs 2026-09-02).
- The body was never at stake: `diff` of the merge base against the incoming blob yields only the four frontmatter lines above and no body hunk, so keeping ours preserved 100% of incoming's content.

## Note for the finalize step

The staged tree is byte-identical to HEAD — stage-2 blob `c9bd09b51db519b215a7b0b1dfe252068ade8fa5` equals `HEAD:.xgd/tickets/hot/request-909e42f8.md`, and `git diff --cached HEAD` is empty — because HEAD's later state already subsumes this commit's effect. This is the redundant-commit case of BUG-1109/BUG-1122.

Per STEP 4, **no `--skip` was issued** and no command was run that would end, reset, or forget the cherry-pick. `CHERRY_PICK_HEAD` (`7123292250`) is intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit. `git status --porcelain` is empty; no conflict-class entries remain.
