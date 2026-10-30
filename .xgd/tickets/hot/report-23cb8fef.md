---
uid: report-23cb8fef
id: REPORT-5259
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:33:18.595453+00:00'
updated_at: '2026-09-28T02:33:18.595453+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Resolved to the HEAD (ours) side in full.

  Incoming commit `b0af50e15776b86450ee3293be69c365779dd26e`
  ("xgd(ticket): update bug bug-6612c4b7", author date
  2026-08-24 14:06:24 -0700) does exactly two things against its base
  (blob `615faf7f10`):

  - sets the canonical frontmatter `title:` to
    `'control-app: Edit mode dies with Cloudflare 1102 — the preview render
    cache never hits in the Worker'` (i.e. applies the BUG-37 rename to the
    real title field), and
  - bumps `updated_at` 2026-08-24T21:06:15Z → 2026-08-24T21:06:24Z.

  It touches no other field and does not change the body.

  Per-fact comparison against ours (blob `f3b9d25bf1`):

  - `title` — ours already carries the identical renamed string. The
    overlay seed commit `501a0595d1cfbfc8675a1aeecb8a34aebc719f47`
    ("xgd(ticket): seed_local_overlay bug bug-6612c4b7") established the
    ticket on this branch already renamed, at `status: bundled`,
    `updated_at` 2026-08-26T17:36:27Z. Not a contested fact — both sides
    agree on the value.
  - `updated_at` — ours is 2026-08-31T19:19:36Z, later than incoming's
    2026-08-24T21:06:24Z. Later-positioned intent wins (2e).

  Ours additionally carries state that incoming has no opinion on and
  that predates nothing on the incoming side: `status:
  free_and_reconciled`, `completed_at`, `last_field_updated: status`,
  `chat_comment: comment-a4e77428`, a three-entry `commits` list,
  `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`, and a body rewritten
  around the confirmed root cause (Workers Free plan 10 ms CPU ceiling vs
  ~78 ms per preview request). Taking the incoming side for the file would
  regress `free_and_reconciled` → `draft`, drop all of the above, and
  revert the confirmed root cause to the earlier hypothesis text — with no
  incoming fact gained, since the one fact incoming asserts is already
  present.

  Note on `fields.title`: incoming's base still carries the transient
  duplicate `fields.title` key, and ours does not. That key was withdrawn
  on this branch by `a9021e4749b53b238eccdde1e37a98605e170e02`
  (2026-08-24 14:06:30 -0700) — 15 seconds after it was written, by the
  same author in the same editing session, normalising the rename onto the
  canonical `title:` field. This incoming commit does not re-add it; it
  merely inherits it from its base. It stays absent, correctly.

  Net effect: the staged tree is identical to HEAD (no staged diff). Left
  for the finalize step to detect and skip — `--skip` was not invoked here.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's sole semantic
  change, the `title:` rename to "control-app: Edit mode dies with
  Cloudflare 1102 — the preview render cache never hits in the Worker", is
  present verbatim in the resolved file at frontmatter line 5. Its only
  other change, the `updated_at` bump, is superseded by a strictly later
  timestamp on the ours side per rule 2e.

No code files, no UAT test files, and no spec tickets were involved in this
conflict. No hunk was dropped under the BUG-1301 precedence exception.
