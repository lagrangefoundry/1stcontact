---
uid: report-69c551c6
id: REPORT-4310
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:41:04.523158+00:00'
updated_at: '2026-09-18T05:41:04.523158+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` (REQ-147, "The builder is private: Cloudflare Access on app.1stcontact.io")
  - **Class**: UU (index-only conflict; `.xgd/tickets/` is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1)
  - **Rule applied**: 2e (intent/bookkeeping ticket — `request-*`, user-authored content, not matrix state), reinforced by the auto-enriched resolution rule for this file ("Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review.")
  - **Resolution**: HEAD taken wholesale via `git checkout --ours`, staged with `git add --sparse`.

### Why HEAD

The conflict is confined to frontmatter. The ticket body is byte-identical on both sides — a direct blob diff (`git diff HEAD:<path> $CPHEAD:<path>`) shows only these hunks:

| Field | HEAD (ours) | Incoming (theirs) |
|---|---|---|
| `status` | `free_and_reconciled` | `ready_to_reconcile` |
| `completed_at` | `2026-08-31T14:22:44Z` | `null` |
| `updated_at` | `2026-08-31T14:22:44Z` | `2026-08-24T01:15:24Z` |
| `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

Every conflicting line is an **older value of a field HEAD has since moved further forward**, plus one field (`bundled_in`) that exists only on HEAD. The incoming side carries nothing HEAD lacks, so this is 2e's "one side is a strict superset" case with HEAD as the superset — no per-fact `working-timeline` split was required, because there is no fact on the incoming side that HEAD does not already supersede.

Timestamp precedence (the rule the enrichment prescribes) agrees:

- HEAD-side commit `02c0d390016af23507af1b56e6618f3e17bf54d5` — 2026-09-01 15:04:44 -0700
- Incoming commit `95ffc177ff2251089cb173a560162260633b4a9d` — 2026-08-23 18:15:24 -0700

HEAD is more recent by nine days.

Taking the incoming side would have regressed an operator-owned lifecycle field backwards (`free_and_reconciled` → `ready_to_reconcile`), nulled a set `completed_at`, and dropped the `bundled_in` back-reference to `bundle-b3b7c399`.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bookkeeping ticket, so STEP 3's "developer code discarded" guard has no code target here. The incoming commit's intent is nonetheless accounted for rather than dropped:

The incoming commit `95ffc177ff` is a **pure lifecycle transition**, and its whole diff against its own parent is two lines:

```
-updated_at: '2026-08-20T12:51:32.113872+00:00'
+updated_at: '2026-08-24T01:15:24.843755+00:00'
-status: reconciling
+status: ready_to_reconcile
```

That intent — advance REQ-147's status forward out of `reconciling` — **is present in HEAD via a different route**: HEAD advanced the same field past `ready_to_reconcile` to `free_and_reconciled` and stamped `completed_at`, on 2026-09-01. This is the BUG-1109/BUG-1122 redundant-commit shape described in STEP 4, not the STEP 3 discard shape: the incoming commit's key change is *superseded in the same direction* by HEAD, not absent from it.

Accordingly the resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD` is empty). Per STEP 4 this is explicitly not a @fail reason and I did **not** call `--skip`; the finalize step (`cherry_pick_finalize_resolution`) will detect the clean staged diff and skip the commit itself.

No hunk was dropped under the BUG-1301 precedence exception — it did not arise in this conflict.

## Post-merge review flag

Per the enrichment rule's second clause, flagging `.xgd/tickets/hot/request-23fd6e61.md` for post-merge review: the xgd-kind/intent was unknown on both sides, so the resolution rests on commit timestamp plus the superset relation rather than on a declared operation narrative. The substantive risk is low — the ticket body is untouched on both sides and only lifecycle bookkeeping differed.

## Sequencer state

Untouched, as required. `CHERRY_PICK_HEAD` (`95ffc177ff2251089cb173a560162260633b4a9d`) is still present; no `--continue`, `--skip`, `--quit`, `--abort`, `reset`, or branch checkout was run. Git writes were limited to `checkout --ours` and `add --sparse` on the single conflicted path, each issued as the sole content of its own call (BUG-1294).
