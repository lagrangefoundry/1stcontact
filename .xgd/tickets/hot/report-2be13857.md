---
uid: report-2be13857
id: REPORT-3106
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:20:22.581796+00:00'
updated_at: '2026-08-31T22:20:22.581796+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (STEP 2 rule **2e**), resolved per-fact by the timeline rule. Staged with `git checkout --ours` + `git add --sparse`.

  Only two facts conflict; both sides changed the SAME two frontmatter fields differently, so this is a genuine per-fact conflict, not a disjoint-field merge:

  | fact | HEAD (ours, `8e07e60`, 2026-08-31 07:23 -0700) | incoming (`44f12dd`, 2026-08-25 16:30 -0700) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-31T14:23:04Z` | `2026-08-25T23:30:45Z` |

  HEAD is the later-positioned side by ~6 days, matching the auto-enrichment note ("Intent unknown on one or both sides. Take the more recent commit by timestamp"). HEAD is also the strict superset in lifecycle terms: alongside `status`, it carries `completed_at`, `result: pass`, `merged_at_commit: eef7a8b4…`, the collapsed `commits` entry (`main_sha: eef7a8b4…`) and the full 140-entry `orphan_commits` old→new map. The incoming commit touches none of those fields — they are additions HEAD made after the base — so nothing on the incoming side is lost by taking HEAD for the two contested facts.

  Taking incoming would have rolled a bundle that has already completed reconcile back to `ready_to_reconcile` and rewound `updated_at` by six days.

  Net effect: the staged tree is identical to HEAD (`git diff --cached` is empty, `git ls-files -u` is empty). Per STEP 4 this is left for `cherry_pick_finalize_resolution` to detect and skip — no `--skip`/`--continue`/`--abort` was issued, and `CHERRY_PICK_HEAD` is still present.

## Incoming changes preserved

No code/implementation files were conflicted in this cherry-pick — the incoming commit `44f12dd` touches exactly one file (the bundle ticket above), and its entire diff is the 2-line frontmatter change shown in the table. So there is no code to discard and STEP 3's code-file guard does not bind here.

For the ticket itself, the incoming intent is superseded rather than discarded: `ready_to_reconcile` is an *earlier* state than HEAD's `free_and_reconciled` in the bundle lifecycle. The incoming commit's intent — move bundle-b3b7c399 forward to reconciliation — is already realised in HEAD via a later route: the bundle went on to reconcile and complete (`result: pass`, `merged_at_commit: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`). This is the 2e per-fact timeline rule applied to two directly-competing facts, not a resolution shortcut.

No BUG-1301 precedence exception was invoked; no hunks were dropped on refactor grounds; no UAT test functions were involved.

**Flagged for post-merge review** (per the enrichment rule for unknown-intent sides): `.xgd/tickets/hot/bundle-b3b7c399.md` — both sides carry the same generic subject `xgd(ticket): update bundle bundle-b3b7c399`, so the resolution rests on commit timestamp plus lifecycle-state ordering rather than a declared operation narrative.
