---
uid: report-84d8288d
id: REPORT-4383
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:31:23.914169+00:00'
updated_at: '2026-09-19T10:31:23.914169+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (per-fact, later-positioned intent wins).

  Incoming commit `048fba1a` (`xgd(ticket): update request request-26dafd83`,
  2026-08-31 14:57:02 -0700) changed exactly three frontmatter scalars:
  `updated_at` → `2026-08-31T21:57:01Z`, `last_field_updated` → `status`,
  `status: draft` → `free_coding`. It touched nothing else — no fields, no body.

  HEAD side (`2cf37792`, `xgd(ticket): seed_local_overlay`, 2026-09-09 14:35:22
  -0700) changed the same three scalars — `updated_at` → `2026-09-09T21:32:49Z`,
  `status: draft` → `bundled` — and additionally added, with no incoming
  counterpart, `fields.commits` (3 working_sha entries), `fields.version:
  0.2.31`, `fields.bundled_in: bundle-87be4669`, and a ~75-line `## What landed`
  body section (plus the matching removal of the now-answered "Granularity" open
  question).

  Per-fact resolution:
  - `status` / `updated_at` / `last_field_updated` — the only overlapping fact,
    and the only region git flagged. Both sides moved it off `draft`. HEAD's
    intent is later on the working timeline (2026-09-09 vs 2026-08-31), and
    `bundled` is strictly downstream of `free_coding` on the request lifecycle:
    the ticket passed *through* `free_coding` on its way to `bundled`. Kept
    HEAD.
  - `fields.commits`, `fields.version`, `fields.bundled_in`, `## What landed`
    body — HEAD-only, untouched by incoming, merged cleanly outside the conflict
    region. Preserved in full.

  The auto-enriched metadata's rule ("take the more recent commit by timestamp")
  selects the same side, so both the enrichment rule and 2e's per-fact timeline
  rule agree. No field was invented and no `intent_uid`/`story_uid`/
  `capability_uid` was touched.

## Incoming changes preserved

Not a code file, so STEP 3's diff check applies to the ticket's facts. The
incoming commit's sole intent — advance this request off `draft` into the
free-coding lifecycle — **is present in HEAD via a different route**, not
absent: HEAD carries `status: bundled`, the state this request reached *after*
`free_coding`, along with the three `working_sha` commits and the `bundled_in`
reference that record the free-coding work actually landing. Nothing the
developer authored is dropped; the incoming scalars are superseded by later
values of the same three fields.

This is therefore the redundant case described in STEP 4 (BUG-1109/BUG-1122),
not the discard case in STEP 3: the staged tree nets to no diff vs HEAD because
the post-watermark state already subsumes this commit. Per instruction,
`--skip` was NOT called — the resolution is staged and the cherry-pick sequencer
is left intact for `cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was used; no test function was deleted.

## Post-merge review flag

The enrichment metadata classified intent as unknown on one or both sides and
asked that this file be flagged for post-merge review. Flagging it here: the
resolved ticket reports `status: bundled` / `bundled_in: bundle-87be4669`, while
the commit being replayed believed the request was still `free_coding`. That is
consistent and expected given the timeline, but it is a status fact rather than
code, so it is worth an operator's glance.
