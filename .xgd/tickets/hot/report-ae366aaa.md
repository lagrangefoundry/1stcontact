---
uid: report-ae366aaa
id: REPORT-4442
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:18:11.384501+00:00'
updated_at: '2026-09-19T13:18:11.384501+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU** (index-only; path is outside the
  sparse-checkout cone, so no working-tree markers). Rule **2e** (intent/bookkeeping
  ticket), superset branch. Resolved to **OURS**, staged with
  `git checkout --ours` + `git add --sparse`.

  Per-fact analysis (body text is byte-identical on both sides; the whole conflict is
  four frontmatter facts):

  | fact | ours (HEAD, `seed_local_overlay`, 2026-09-17) | theirs (incoming `free_coded`, 2026-09-01) | kept |
  |---|---|---|---|
  | `status` | `bundled` | `free_coded` | ours |
  | `bundled_in` | `bundle-8e1807f6` | *absent* | ours |
  | `completed_at` | `2026-09-14T10:29:03` | `null` | ours |
  | `updated_at` | `2026-09-16T01:48:38` | `2026-09-01T22:10:38` | ours |
  | `commits` (3 × working_sha) | present | present | identical |
  | `version` | `0.2.39` | `0.2.39` | identical |
  | body | unchanged from base | unchanged from base | identical |

  Ours is a strict superset of theirs: every fact the incoming commit contributes is
  already present on HEAD, with the lifecycle advanced one step further
  (`free_coded` → `bundled`) and `bundled_in` added. Incoming-wins would have
  *regressed* the status and dropped `bundled_in`.

  Timeline confirms the same answer — the enrichment's stated rule for this file was
  "take the more recent commit by timestamp":
  - ours: `3f2311b0` *xgd(ticket): seed_local_overlay request request-51514090*, 2026-09-17 13:23:47 -0700
  - theirs: `56087d83` *xgd(ticket): update request request-51514090*, 2026-09-01 15:10:38 -0700

  No field was invented; nothing outside the two sides was introduced. No
  `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket.

Incoming commit `56087d83` changed exactly three things in this file relative to the
merge base: it added `fields.commits` (three `working_sha` entries —
`f5807330`, `92e927e7`, `d612c1aa`), added `fields.version: 0.2.39`, and advanced
`status` off `draft`. **All three are present in the resolved (ours) version.**
The commits list and version are byte-identical; the status advanced past the incoming
value along the same lifecycle (`draft` → `free_coded` → `bundled`) rather than away
from it.

This is BUG-1109/BUG-1122's "redundant, not discarded" case per STEP 4: the staged
tree nets to no diff vs HEAD (`git diff --cached HEAD` is empty), because HEAD already
carries this commit's effect via the later `seed_local_overlay` route. STEP 3's guard
is satisfied — the incoming commit's key changes are *present* in HEAD, not absent.
No `--skip` was invoked; finalize will detect the clean staged diff.

No BUG-1301 precedence exception was used; no hunk was dropped; no test function was
deleted.

## Post-merge review flag

Flagged per the enrichment's instruction ("flag this file for post-merge review"):
`.xgd/tickets/hot/request-51514090.md` — ours-side status `bundled` /
`bundled_in: bundle-8e1807f6` was kept over the incoming `free_coded`. This is the
expected overlay-ahead-of-incoming shape for a ticket being reconciled in its own
bundle, but worth a confirming glance that `bundled_in` still names the right bundle
after the run completes.
