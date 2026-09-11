---
uid: report-efc200b1
id: REPORT-3856
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:40:31.287996+00:00'
updated_at: '2026-09-11T01:40:31.287996+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, out of the sparse-checkout cone
  (no working-tree markers; conflict existed only in the index, DOC-986 §2/§4.1).
  Rule **2e** (intent/bookkeeping ticket — `request-*`, user-authored content, not
  matrix state). Resolved per-fact, then materialised with
  `git checkout --ours` and staged with `git add --sparse`. The staged blob is
  byte-identical to index stage 2 (`139d346878a08e7eef0ce917cda8f52bacf5f3fc`),
  verified by `git hash-object`, so no conflict markers survive.

### Per-fact resolution

Base (stage 1 `2a0ac148`) had `status: draft`, `last_field_updated: created_at`,
no bundling fields, and an unanswered "Granularity" open question.

- `status` — **same fact, both sides changed it differently.** Ours `bundled`
  (commit `xgd(ticket): seed_local_overlay`, 2026-09-09T21:32) vs incoming
  `free_coding` (`048fba1a`, 2026-08-31T21:57). Later-positioned intent wins:
  **ours**. `bundled` is downstream of `free_coding` in this request's own
  lifecycle, and ours carries `bundled_in: bundle-87be4669` — the very bundle
  being reconciled — so ours is by construction after the incoming free_coding
  transition.
- `updated_at` — same fact; kept ours (`2026-09-09T21:32:49`), the later of the
  two timestamps. This is also what the auto-enriched resolution rule for this
  file prescribed ("take the more recent commit by timestamp").
- `last_field_updated: status` — both sides agree; no conflict.
- `fields.commits` (three `working_sha` entries), `fields.version: 0.2.31`,
  `fields.bundled_in: bundle-87be4669` — present on **ours only**; incoming never
  touched them. Superset kept.
- Body: the `## What landed` section (and the corresponding retirement of the
  "Granularity" open question, now answered inside it) exists on **ours only**.
  The incoming commit `048fba1a` is frontmatter-only — its diff is 3 lines, all
  inside the YAML block, and it does not touch the body at all. Kept ours.

No field was invented, and no `fields.intent_uid` / `story_uid` /
`capability_uid` was touched.

## Incoming changes preserved

No code/implementation file was conflicted, so 2c's "incoming is authoritative"
does not apply here — this is a bookkeeping ticket under 2e.

The incoming commit's entire content is the request's status transition
`draft -> free_coding` plus the matching `updated_at` / `last_field_updated`
bump. That intent **is present in HEAD via a different route, not discarded**:
HEAD already records this request at `status: bundled` with
`bundled_in: bundle-87be4669` and the three working SHAs of the free-coding work
itself, which is the state the request reached *after* passing through
`free_coding`. STEP 3's discard test is therefore not met — the incoming change
is superseded, not absent.

Taking the incoming side instead would have been a regression, reverting
`status` from `bundled` back to `free_coding` and deleting the `commits` list,
`version`, `bundled_in`, and the whole `## What landed` narrative from the body.

Consequence: the staged tree is byte-identical to HEAD (`git diff --cached HEAD`
is empty) — this cherry-pick is redundant, its effect having already landed via
the later seed_local_overlay. Per STEP 4 that is not a failure and I did not call
`--skip`; `CHERRY_PICK_HEAD` (`048fba1a`) is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

Flagged for post-merge review as the enrichment rule requested, though the
timeline here is unambiguous (9 days and one bundle apart).
