---
uid: report-a59de1e9
id: REPORT-5277
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:28:50.417549+00:00'
updated_at: '2026-09-28T03:28:50.417549+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**. Resolved to the **HEAD (ours)** side, per fact.

  Single conflict hunk, four lifecycle frontmatter lines. Both sides changed the *same* facts (`status`, `updated_at`, and — via context — `completed_at`) differently, so this is a genuine intent conflict, and 2e's per-fact "later-positioned intent wins" rule governs:

  | fact | ours (HEAD) | incoming (`66ebe3503a`) | winner |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours |
  | `completed_at` | `2026-08-31T19:19:36` | `null` | ours |
  | `updated_at` | `2026-08-31T19:19:36` | `2026-08-25T22:52:43` | ours |

  Ours is the later-positioned intent on every conflicting fact: six days later by timestamp (Aug 31 vs Aug 25), and strictly downstream in the lifecycle. `ticket_types.yaml:146` orders the reconcile group `[ready_to_reconcile, bundled, reconciling, free_and_reconciled]`, and `bin/xgd_backfill_bundle_child_main_sha.py:76` names `free_and_reconciled` the `TERMINAL_STATUS` — so incoming's `ready_to_reconcile` is strictly *upstream* of what HEAD already records.

  Corroborating that HEAD genuinely travelled that path rather than jumping to terminal: `bundled_in: bundle-78f4e2fe` sits unconflicted in `fields:` (it is on both sides), and the file's history shows `seed_local_overlay` (`501a0595d1`) followed by a further update (`5a37f67dcd`), both dated 2026-08-31.

  No non-overlapping fields existed to combine — the incoming commit's entire diff is two lines (`updated_at`, `status`), both of which are contested facts. The ticket body below the frontmatter is byte-identical on both sides and was untouched.

  This also matches the auto-enrichment's own rule for this file ("take the more recent commit by timestamp"): ours *is* the more recent side. Flagging it for post-merge review as that rule directs — the sole review question is whether BUG-37 is legitimately terminal, which the unconflicted `bundled_in` and the Aug 31 overlay history both support.

## Incoming changes preserved

Not a code/implementation file — no `xgd_source/**`, `tests/**`, or `bin/**` file was in conflict, so STEP 3's code-file verification has no subjects and no developer code was at risk.

For completeness, the incoming hunk is **deliberately not carried forward**, and this is the correct 2e outcome rather than a discarded change:

- `git show 66ebe3503a -- .xgd/tickets/hot/bug-6612c4b7.md` contains exactly `status: free_coded` → `ready_to_reconcile` plus its `updated_at` bump. Nothing else.
- Both of those are facts HEAD already advanced *past*. Carrying incoming forward would regress a terminal ticket to an intermediate status and null out a populated `completed_at` — i.e. it would discard the Aug 31 intent, not preserve the Aug 25 one.
- There is no unique content in the incoming side to graft: it is a strict subset of the path HEAD already records.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the grounds of a HEAD-side refactor, and no test function was deleted or was at risk of deletion (no UAT or test file appeared in this conflict).

## Staging state

- Zero conflict markers remain in the working tree.
- `git ls-files -u` is empty — no leftover index stages (the path is outside the sparse-checkout cone, per DOC-986 §2/§4.1, so staging required `git add --sparse`).
- `CHERRY_PICK_HEAD` is still `66ebe3503ac47488114d650aaae6ebf331e0639a`; the sequencer was not advanced.

**Note for the finalize step:** resolving wholly to ours leaves the staged tree identical to HEAD, so `git diff --cached HEAD` and `git status --porcelain` are both empty — this cherry-pick is now a no-op. That is the expected consequence of the incoming change being fully superseded, not an incomplete resolution. Per STEP 4 this was left for Python's finalize step to detect and skip; `--skip`/`--continue` was not called here.
