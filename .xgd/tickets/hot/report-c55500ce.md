---
uid: report-c55500ce
id: REPORT-3253
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:00:26.484258+00:00'
updated_at: '2026-09-01T23:00:26.484258+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-58cf04a4.md` — class **AA** (both added), doc ticket
  (bookkeeping, rule 2e / 2b). Both sides carry identical 744-line document
  bodies; the only divergence is in the YAML front matter:
  - ours (HEAD, `updated_at: 2026-08-16T01:18:34`): retains `fields.system_kb: true`
  - theirs (incoming `f86a1ee8`, "field: retire system_kb boolean; membership
    moves to doc_kind (DOC-39 3.3)", `updated_at: 2026-08-31T19:43:22`): drops
    `fields.system_kb`
  Single-fact conflict on one field, incoming is both the later-positioned
  intent and the authoritative `free_coded` side. Resolved with
  `git checkout --theirs` + `git add --sparse` (2b superset/later-intent rule;
  incoming wins). No content invented, no other field touched.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-58cf04a4.md`: staged blob is byte-identical to the
  incoming stage-3 blob `ec08968f`. `git diff --cached HEAD` shows exactly the
  incoming commit's two changes — removal of `fields.system_kb: true` and the
  `updated_at` bump to `2026-08-31T19:43:22.768134+00:00`. The document body
  (§1 through end) is unchanged and identical on both sides, so nothing from
  the HEAD side was discarded either.

No code/implementation files, no UAT test files, and no spec tickets were in
conflict. No hunks were dropped; the BUG-1301 precedence exception was not
invoked. `git diff --name-only --diff-filter=U` is empty; the cherry-pick
sequencer state (CHERRY_PICK_HEAD) is left intact for
cherry_pick_finalize_resolution.
