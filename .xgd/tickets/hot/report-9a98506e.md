---
uid: report-9a98506e
id: REPORT-5589
type: report
title: 'Resolve conflict: request-119dd4af (REQ-159) @ a077c28171 — ours'
created_by: xgd
created_at: '2026-09-29T18:29:42.649423+00:00'
updated_at: '2026-09-29T18:29:42.649423+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` (REQ-159) — class **2e intent/bookkeeping ticket** (`request-*`). Rule applied: per-fact later-positioned intent, reinforced by the BUG-1301 precedence reasoning. Resolved **`--ours`**. Conflicting commit `a077c28171` touches only this path, so only this path was staged.

Incoming commit `a077c2817191c0a99162d447d0768a3936d0dd2c` (`xgd(ticket): update request request-119dd4af`, 2026-09-09 10:03:08 -0700 = 17:03:08 UTC) flips `status` from `bundled` to `ready_to_reconcile` while the ticket is still a member of `bundle-203b1dc2`. Two commits and 4.5 hours later, xgd-working itself moved the ticket to a different bundle.

| fact | base (`:1:`, = `ed7b3cc779`) | ours (HEAD `c14f78d6d2`) | theirs (`a077c28171`) | taken |
|---|---|---|---|---|
| `updated_at` | `2026-09-02T17:48:26.958141` | `2026-09-09T21:32:49.729942` | `2026-09-09T17:03:08.628765` | **ours** (later) |
| `status` | `bundled` | `bundled` *(unchanged)* | `ready_to_reconcile` | **ours** |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | `bundle-203b1dc2` *(unchanged)* | **ours** |

Body is byte-identical on all three sides; no content was composed or dropped. Only `updated_at` is a true three-way divergence — `status` changed on theirs alone and `bundled_in` on ours alone, so the naive 3-way merge auto-resolved them in *opposite directions* and produced the incoherent pairing `status: ready_to_reconcile` **under** `bundle-87be4669`, a bundle that is already `free_and_reconciled`. Per the recorded guidance for this bundle pair, all three facts were adjudicated as **one** decision ("which bundle owns REQ-159") rather than left to the naive per-hunk outcome.

### Why ours — incoming is a transient waypoint xgd-working itself superseded

Full ledger tip on `xgd-working` for this path (author times, -0700):

```
b354b050e7  2026-09-11 03:28:28  update request request-119dd4af
294d87111c  2026-09-09 14:32:49  update request request-119dd4af
c09f4e8438  2026-09-09 10:03:09  update request request-119dd4af
a077c28171  2026-09-09 10:03:08  update request request-119dd4af   <- being picked
ed7b3cc779  2026-09-02 10:48:27  update request request-119dd4af   <- base (:1:)
```

The two commits immediately after the pick undo and replace its target:

- `c09f4e8438` (**1 second** later, `updated_at 17:03:09.502052`): whole content is an **unbundle** — drops `bundled_in: bundle-203b1dc2`, flips `last_field_updated` to `bundled_in`.
- `294d87111c` (`updated_at 21:32:49.729942`): **re-bundles** into `bundle-87be4669` and sets `status` back to `bundled`.

I verified the blobs directly: **`:2:` (ours) is byte-identical to `git show 294d87111c:.xgd/tickets/hot/request-119dd4af.md`**. HEAD's `seed_local_overlay` (`c14f78d6d2`, authored 2026-09-09 14:35:22 -0700 — 2.5 minutes after `294d87111c`) already carries xgd-working's own post-rebundle state. Taking `--ours` therefore preserves the developer's later decision rather than discarding it; the incoming hunk's premise (membership in `bundle-203b1dc2`) is a value **neither side still wants**.

This is the strongest form of the BUG-1301 precedence shape: the already-integrated superseding decision is **xgd-working's own**, not a main-side refactor, so there is no "was main's change legitimate?" judgement call to make — the blob HEAD holds *is* `294d87111c`'s blob.

Corroborating bundle adjudication (re-verified this run): `bundle-87be4669` (BUNDLE-26) is `free_and_reconciled` on HEAD with `main_sha 66e172dd4c0dc0ac26775c9b8aacf520bb5e7505`, `completed_at 2026-09-11T10:28:16`, still in `hot/`, and its title lists REQ-159 among its seven members (REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, +2). `bundle-203b1dc2` (BUNDLE-23) is absent from both `hot/` and `cold/` on `xgd-working` — archived on both sides. Honouring incoming's bundling state would leave REQ-159 `ready_to_reconcile` under a defunct bundle while the reconciled bundle that actually shipped it claims it as a member.

## Incoming changes preserved

No code/implementation files in this conflict, so STEP 3's binary check does not apply. Intent-level disposition:

- Incoming's body changes: none — byte-identical across base, ours and theirs.
- Incoming's `status: ready_to_reconcile`: **not carried**. It is a waypoint on the monotone `bundled → ready_to_reconcile → free_and_reconciled` lifecycle, taken under `bundle-203b1dc2`, and xgd-working reverted it to `bundled` at `294d87111c` when it re-bundled. HEAD's value is that reverted state, not a stale one.
- Incoming's `bundled_in: bundle-203b1dc2` (unchanged from base): **not carried**, same reason — superseded by xgd-working's own re-bundle to `bundle-87be4669`.
- No genuine new intent is lost: nothing in `a077c28171` survives on its own branch's tip.

**Flag for the next picks in this queue:** `c09f4e8438` (the 1-second-later unbundle) and `294d87111c` (the re-bundle) should both resolve `--ours` / no-op — `294d87111c` is blob-identical to HEAD. `b354b050e7` (09-11) is **different**: it advances `status` to `free_and_reconciled` and sets `completed_at: 2026-09-11T10:28:28.246098`, neither of which HEAD has. That commit carries genuine new intent and must **not** be blanket-`--ours`; incoming should win those two facts. Same caveat already recorded for REQ-158/`f74da06627` in this bundle pair.

## Staging

`git checkout --ours` then `git add --sparse` (path outside the sparse cone — DOC-986 §2/§4.1), each as its own Bash call.

`git status --porcelain` is empty and `git diff --cached HEAD` is empty: conflict class cleared, **zero net change from HEAD** (HEAD already contains the superseding state). Per STEP 4 this was staged and left alone rather than skipped; finalize will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` verified still present at `a077c2817191c0a99162d447d0768a3936d0dd2c`.

Retry state for this SHA was `count: 1` (first attempt) at `.xgd/tmp/cherry_pick_no_progress_state.json`.
