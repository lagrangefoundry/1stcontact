---
uid: report-9ce13b4b
id: REPORT-4776
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T19:01:15.620012+00:00'
updated_at: '2026-09-21T19:01:15.620012+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** + the auto-enriched metadata rule ("intent unknown on one or both sides; take the more recent commit by timestamp and flag for post-merge review"). Resolved **in favour of HEAD**.

  The conflict hunk covers exactly two facts, and both sides set the same two fields differently — a genuine per-fact intent conflict, so the later-positioned intent wins on each:

  | fact | HEAD (`c94654a3` seed_local_overlay, 2026-09-11) | incoming (`1e5185e9` update, 2026-09-01) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-01T19:35:35` | HEAD |
  | `status` | `bundled` | `free_coded` | HEAD |

  (`completed_at: null` and `last_field_updated: status` are identical on both sides.) No fields or sections exist on one side and not the other, so there was nothing disjoint to combine — the whole hunk is a head-to-head collision on the same two facts.

  Corroboration beyond the raw timestamps: the incoming commit is an old `ready_to_reconcile → free_coded` transition; `xgd ticket get request-6893f6ea` reports the authoritative current state as `Status: bundled`; and the unconflicted region of the very same frontmatter already carries `bundled_in: bundle-87be4669` and `version: 0.2.27`. Taking the incoming side would have regressed the ticket to `free_coded` while leaving `bundled_in` populated — an internally inconsistent record.

  **Flagged for post-merge review** per the metadata rule, though the `bundled_in` corroboration above makes the direction unambiguous.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's incoming-code verification does not apply and the BUG-1301 precedence exception was not invoked. No UAT test function on either side was deleted.

The one incoming fact not carried forward — `status: free_coded` / `updated_at: 2026-09-01T19:35:35` — was dropped deliberately under the per-fact timeline rule of 2e, not discarded as inconvenient: it is an eight-day-older value of a field the branch has since advanced past, and it directly contradicts `bundled_in: bundle-87be4669` sitting unconflicted in the same frontmatter block.

## Staging state

Because HEAD won outright, the resolution is byte-identical to HEAD and the staged diff against HEAD is empty. `git status --porcelain` is clean and `CHERRY_PICK_HEAD` is intact; this cherry-pick is now empty and the finalize step will skip the commit. No `--continue`/`--skip`/`--quit`/`--abort` was issued.
