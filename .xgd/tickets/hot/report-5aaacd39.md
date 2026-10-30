---
uid: report-5aaacd39
id: REPORT-5424
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:27:52.345848+00:00'
updated_at: '2026-09-29T02:27:52.345848+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** (per-fact timeline resolution). Incoming commit `e8e84a34e6` ("xgd(ticket): update request request-6893f6ea", 2026-08-31 18:22:23 -0700) is metadata-only: it touches `updated_at` and `last_field_updated` and nothing else. One conflicted hunk, entirely frontmatter; no body/prose divergence.
  - `updated_at` — OURS `2026-09-09T21:32:50`, THEIRS `2026-09-01T01:22:22`. Same fact, both sides → genuine conflict → later-positioned intent wins → **kept OURS**.
  - `status` — OURS `bundled`, THEIRS `free_coded`. Same fact, both sides → **kept OURS**. The incoming value is an earlier point on the same lifecycle path HEAD has already advanced past (`free_coded → bundled`); replaying it would regress the stage and orphan `fields.bundled_in: bundle-87be4669`.
  - `last_field_updated` — OURS `status`, THEIRS `story_points`. This is a derived pointer naming whichever field the most recent update touched, so its correct value is dictated by which `updated_at` survives. Having kept OURS' 2026-09-09 `status → bundled` transition as the most recent update, `status` is the only self-consistent value; taking `story_points` would leave the pointer contradicting both the retained `updated_at` and the retained `status`. **Kept OURS.**
  - `completed_at: null` — identical on both sides, no decision required.
  - Staged with `git add --sparse` — `.xgd/tickets/` is outside this resync worktree's sparse-checkout cone (DOC-986 §2/§4.1), an 11% checkout.

## Incoming changes preserved

- `.xgd/tickets/hot/request-6893f6ea.md` — verified against `git show e8e84a34e6 -- .xgd/tickets/hot/request-6893f6ea.md`. The incoming diff is exactly two lines: `updated_at` and `last_field_updated`. Both are bookkeeping metadata resolved per the per-fact genuine-conflict rule above; neither is substantive content.
  - The change this commit *records* — `last_field_updated: story_points` — points at `fields.story_points`, whose value (`8`) is **unchanged by the incoming diff** and is **present** in the resolved file at line 22. So the actual field edit this commit was bookkeeping for is fully intact in HEAD; only the redundant pointer-and-timestamp pair was superseded by HEAD's later update.

No substantive incoming content was discarded. No BUG-1301 precedence exception was invoked; no code file, and no test file, was involved in this conflict.

## Note on net effect

Every fact in `e8e84a34e6` is either already present in HEAD (`story_points: 8`) or superseded by a strictly later HEAD-side update to the same field. The resolved tree is therefore byte-identical to HEAD and `git status --porcelain` reports clean — the patch is a no-op. Per STEP 4, no `--skip` was issued; the finalize step should detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` is intact at `e8e84a34e6`.
