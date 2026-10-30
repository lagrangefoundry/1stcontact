---
uid: report-a083bf8c
id: REPORT-4874
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:36:34.829152+00:00'
updated_at: '2026-09-23T22:36:34.829152+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (per-fact later-positioned intent). Two conflicting
  facts, both resolved in favour of HEAD:
  - `updated_at`: HEAD `2026-09-09T21:32:49` vs incoming `2026-09-02T17:48:26`
  - `fields.bundled_in`: HEAD `bundle-87be4669` vs incoming `bundle-203b1dc2`

  The ticket body did not conflict (both sides carry identical prose; the
  HEAD-side `seed_local_overlay` rewrap is already reflected on both stages),
  so `--ours` reproduces the correct merged file exactly.

## Why HEAD wins both facts

Replaying the working-side intent ledger for this ticket:

1. `7123292250` (2026-09-02 10:48) — `bundled_in := bundle-203b1dc2`,
   `status := bundled`. **This is the incoming commit being cherry-picked.**
2. `f03a4ed5dd` (2026-09-09 10:03) — `bundled_in` **removed**,
   `status` reverted to `ready_to_reconcile` (`last_field_updated: bundled_in`).
   The 203b1dc2 bundling was explicitly withdrawn.
3. `5a60c25f99` (2026-09-09 14:32) — `bundled_in := bundle-87be4669`,
   `status := bundled`.
4. `3bb3a8c547` (2026-09-09 14:35) — `seed_local_overlay` onto this resync
   branch, carrying state (3).

Both conflicting facts are the *same* fact (the bundle membership and its
timestamp), changed on both sides. HEAD's value is strictly later in the
working timeline. Taking the incoming side would have regressed the ticket to a
bundle assignment that was deliberately unset a week afterwards — the
"overlay advances past incoming status" pattern.

## Incoming changes preserved

`request-909e42f8.md` is a bookkeeping ticket, not a code file; there is no
implementation hunk to preserve. The incoming commit's only payload was the
`updated_at` / `status` / `bundled_in` frontmatter triple. `status: bundled` is
present in the resolved file (both sides agree). The incoming `bundled_in:
bundle-203b1dc2` and its timestamp are intentionally not carried forward under
rule 2e, because a later commit on the same working timeline (`f03a4ed5dd`)
removed that exact field — this is a superseded fact, not a discarded one.

No code files were in conflict; no UAT test function was deleted; the BUG-1301
precedence exception was not invoked.
