---
uid: report-a76aca71
id: REPORT-5588
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:25:58.043287+00:00'
updated_at: '2026-09-29T18:25:58.043287+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — class **2e intent/bookkeeping ticket** (`request-*`). Rule applied: per-fact later-positioned intent, reinforced by the BUG-1301 precedence reasoning. Resolved **`--ours`**. Conflicting commit `169231f128` touches only this path, so only this path was staged.

Incoming commit `169231f1288f2fad5b357e59c7f66044d7f64cea` (`xgd(ticket): update request request-6893f6ea`, 2026-09-09 10:03:00 -0700) lands **13 seconds** after the previously-resolved `2e936e0320` (10:02:47). Its whole content is an **unbundle**: drop `bundled_in: bundle-203b1dc2`, flip `last_field_updated` to `bundled_in`, bump `updated_at`.

| fact | base (`2e936e0320`) | ours (HEAD) | theirs (`169231f128`) | taken |
|---|---|---|---|---|
| `updated_at` | `2026-09-09T17:02:47` | `2026-09-09T21:32:50` | `2026-09-09T17:02:59` | **ours** (later) |
| `last_field_updated` | `status` | `status` | `bundled_in` | **ours** |
| `status` | `ready_to_reconcile` | `bundled` | `ready_to_reconcile` | **ours** |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | *(removed)* | **ours** |

Body is byte-identical on all three sides; no content was composed or dropped.

### Why ours — incoming is a transient waypoint xgd-working itself superseded

The enrichment's rule was again the weak "intent unknown → take the more recent commit by timestamp." Ours *is* the later timestamp (21:32:50 vs 17:02:59), but the stronger evidence is that **incoming's own branch abandoned this change two commits later**.

Full ledger tip on `xgd-working` for this path:

```
f74da06627  2026-09-11 03:28:21  update request request-6893f6ea
fbfce2c94e  2026-09-09 14:32:50  update request request-6893f6ea
169231f128  2026-09-09 10:03:00  update request request-6893f6ea   <- being picked
2e936e0320  2026-09-09 10:02:47  update request request-6893f6ea   <- previous pick
```

`xgd-working`'s **own final state** for REQ-158 is `status: free_and_reconciled`, `completed_at: 2026-09-11T10:28:21`, and **`bundled_in: bundle-87be4669`** — i.e. xgd-working converges on the *same* bundle HEAD has. So the 17:02:59 unbundle from `bundle-203b1dc2` was a transient step: xgd-working dropped `bundled_in`, then re-set it to `bundle-87be4669` at `fbfce2c94e` (author 2026-09-09 14:32:50 -0700 = **21:32:50 UTC**).

That timestamp is exactly our `updated_at: 2026-09-09T21:32:50.270415`, and I verified the blobs directly: **`:2:` (ours) is byte-identical to `git show fbfce2c94e:.xgd/tickets/hot/request-6893f6ea.md`**. HEAD's `seed_local_overlay` already carries xgd-working's own post-rebundle state. Taking `--ours` therefore preserves the developer's later decision rather than discarding it — the incoming hunk's target (`bundled_in: bundle-203b1dc2`) is a value neither side still wants.

Corroborating, per the bundle adjudication recorded on the previous pick: `bundle-203b1dc2` (BUNDLE-23) is archived on both sides with every `reconcile_sha`/`main_sha` null and is unresolvable via `xgd working-timeline`; `bundle-87be4669` (BUNDLE-26) is `free_and_reconciled` with `main_sha 66e172dd4c0dc0ac26775c9b8aacf520bb5e7505`, still in `hot/`, and lists REQ-158 among its seven members. Honouring incoming's deletion would orphan REQ-158 from a bundle that both branches agree it belongs to.

## Incoming changes preserved

No code/implementation files in this conflict, so STEP 3's binary check does not apply. Intent-level disposition:

- Incoming's body changes: none — byte-identical across base, ours and theirs.
- Incoming's `bundled_in` **removal**: deliberately not carried. This is the BUG-1301 precedence shape — the hunk's entire target was already superseded on HEAD, and here the superseding commit is **xgd-working's own `fbfce2c94e`**, not a main-side refactor. That makes it unambiguously a legitimate already-integrated decision rather than a resolution shortcut on my part: the blob HEAD holds *is* `fbfce2c94e`'s blob.
- Incoming's `status: ready_to_reconcile` / `last_field_updated: bundled_in`: not carried, same reason — waypoints on the monotone `bundled → ready_to_reconcile → free_and_reconciled` lifecycle that HEAD's membership in the reconciled BUNDLE-26 already represents.

**Flag for the next picks in this queue:** `fbfce2c94e` should be a no-op against HEAD (blob-identical). `f74da06627` (09-11) is different — it advances `status` to `free_and_reconciled` and sets `completed_at`, which HEAD does **not** have. That one carries genuine new intent and must **not** be blanket-`--ours`; incoming should win those two facts.

## Staging

`git checkout --ours` then `git add --sparse` (path outside the sparse cone — DOC-986 §2/§4.1), each as its own Bash call.

`git status --porcelain` is empty and `git diff --cached HEAD` is empty: conflict class cleared, **zero net change from HEAD** (HEAD already contains the superseding state). Per STEP 4 this was staged and left alone rather than skipped; finalize will detect the clean staged diff. `CHERRY_PICK_HEAD` verified still present at `169231f1288f2fad5b357e59c7f66044d7f64cea`.
