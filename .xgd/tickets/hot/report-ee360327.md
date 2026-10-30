---
uid: report-ee360327
id: REPORT-5587
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:21:45.041159+00:00'
updated_at: '2026-09-29T18:21:45.041159+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — class **2e intent/bookkeeping ticket** (`request-*`). Rule applied: per-fact later-positioned intent. Resolved **`--ours`** on all three conflicting facts. Conflicting commit `2e936e0320` touches only this path, so only this path was staged.

Three frontmatter facts differed; the body is byte-identical on all three sides (base/ours/theirs), so no content was composed or dropped.

| fact | base | ours (HEAD) | theirs (`2e936e0320`) | taken |
|---|---|---|---|---|
| `updated_at` | `2026-09-02T17:48:27` | `2026-09-09T21:32:50` | `2026-09-09T17:02:47` | **ours** (later) |
| `status` | `bundled` | `bundled` | `ready_to_reconcile` | **ours** |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | `bundle-203b1dc2` | **ours** |

Note only `updated_at` is a true three-way divergence; `status` was changed by theirs alone and `bundled_in` by ours alone. They are adjudicated together because they are the same decision: *which bundle owns this ticket.*

### Why ours, not the raw-timestamp rule

The enrichment's rule was "intent unknown on one or both sides — take the more recent commit by timestamp." The ledger shows the sides are not symmetric, so the fact-level basis is the bundle replay test rather than the timestamp alone (they happen to agree here).

HEAD carries only 4 commits for this path (`27621cf019` create 08-28, two 08-31 updates, then `c94654a355` `seed_local_overlay` 09-09) while the incoming side carries 17. HEAD is missing xgd-working's entire 08-31 17:25 → 09-09 10:02 update run: `c94654a355` is a bulk overlay snapshot that jumped `draft`/`updated_at 08-31T19:48` straight to `bundled`, and the 93-line body block it added is *already present in base*, i.e. main replayed a body xgd-working had authored first. That makes main's commit a catch-up copy, not a response to the incoming decision.

**Bundle replay test (decisive).** `bundle-87be4669` (BUNDLE-26, main, created 09-09) and `bundle-203b1dc2` (BUNDLE-23, xgd-working, created 09-02) carry the **identical title** ("REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more") and the **identical seven-member list in the same order** — REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158, REQ-167. Main re-created xgd-working's bundle under a new uid.

Same title + same members does not by itself hand the facts to either side, so tie-break on what each bundle then did:

- `bundle-203b1dc2` (theirs): `status: ready_to_reconcile`, `completed_at: null`, every `reconcile_sha` and `main_sha` null — and **archived** (`.xgd/tickets/archived/`) on both sides. `xgd working-timeline` cannot resolve it at all: *"not found in branch store or canonical."*
- `bundle-87be4669` (ours): `status: free_and_reconciled`, `completed_at: 2026-09-11T10:28:16`, `main_sha: 66e172dd4c0dc0ac26775c9b8aacf520bb5e7505`, `orphan_commits` populated, still in `hot/`. `xgd working-timeline` anchors it at `2026-09-11T10:28:15`.

So ours is the bundle that actually reconciled and theirs is an abandoned predecessor. Taking incoming's `bundled_in: bundle-203b1dc2` would point REQ-158 at a dead archived bundle.

`status` follows for the same reason. Incoming's `ready_to_reconcile` is the membership state *of the abandoned bundle*; pairing it with `bundled_in: bundle-87be4669` would assert the ticket is ready to reconcile under a bundle that had already completed reconciliation. Ours' `bundled` is the membership state main actually recorded for BUNDLE-26. Nothing is lost: `bundled → ready_to_reconcile → free_and_reconciled` is monotone, and the lifecycle position incoming was reaching for is already represented — and surpassed — by BUNDLE-26 being `free_and_reconciled`.

## Incoming changes preserved

No code/implementation files in this conflict, so STEP 3's binary check does not apply. Recording the intent-level disposition instead:

- Incoming's body changes: none — body is byte-identical across base, ours and theirs. Nothing dropped.
- Incoming's `status: ready_to_reconcile` and `bundled_in: bundle-203b1dc2`: **deliberately not carried**, justified above. This is a genuine same-fact intent conflict adjudicated under 2e, not a discarded developer change — the incoming values describe a bundle that both sides agree is archived and unreconciled.
- BUG-1301 precedence exception: not invoked. No hunk was dropped on refactor grounds.

## Staging

`git checkout --ours` then `git add --sparse` (path is outside the sparse cone — DOC-986 §2/§4.1; the file was materialized with markers, but `git add` without `--sparse` still refused the index update).

`git status --porcelain` is empty: conflict class cleared, and the resolution leaves **zero net change from HEAD** — an earlier pick in this resync queue already landed this effect. Per STEP 4 this was staged and left alone rather than skipped; finalize will detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` verified still present at `2e936e03201e420853f9c4edbf54d5fdd4c9ae2b`.
