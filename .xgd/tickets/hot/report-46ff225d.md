---
uid: report-46ff225d
id: REPORT-5258
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:31:03.518413+00:00'
updated_at: '2026-09-28T02:31:03.518413+00:00'
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

  Evidence that this is the "incoming commit already on HEAD" case, not a
  wholesale discard of developer intent:

  - Incoming commit `fe97d3bc344f6b637416ce69b5e6043fe3759e10`
    ("xgd(ticket): update bug bug-6612c4b7", author date
    2026-08-24 14:06:15 -0700) adds a single frontmatter key,
    `fields.title: 'control-app: Edit mode dies with Cloudflare 1102 — the
    preview render cache never hits in the Worker'`, and changes
    `updated_at` / `last_field_updated: title`. It touches nothing else;
    the body diff is a trailing-newline change only.
  - HEAD already carries that exact operation under a remapped sha:
    `28b2974007f6b7024b576dcee4f80a5c1fd039bc`, same subject, same author
    date (2026-08-24 14:06:15 -0700), adding the identical `fields.title`
    key with identical wording.
  - Fifteen seconds later on the same lineage,
    `a9021e4749b53b238eccdde1e37a98605e170e02` (2026-08-24 14:06:30 -0700)
    withdrew `fields.title` again; the rename now lives in the canonical
    frontmatter `title:` field, which the resolved file carries
    ("Edit mode dies with Cloudflare 1102 …").
  - Four further HEAD-side commits on this file
    (`5a37f67dcd`, `da99b79858`, `53a6dbb565`, latest 2026-08-31 19:19:36Z)
    advanced the ticket to `status: free_and_reconciled` with
    `completed_at`, `chat_comment`, a three-entry `commits` list,
    `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`, and a rewritten body
    carrying the confirmed root cause (Workers Free plan 10 ms CPU ceiling
    vs ~78 ms per preview request).

  Applying the incoming side for any of these facts would regress
  `free_and_reconciled` → `draft`, drop `completed_at` / `commits` /
  `version` / `bundled_in`, revert the confirmed-root-cause body to the
  older hypothesis text, and resurrect a `fields.title` key that a later
  commit on the same lineage deliberately removed. No fact is contested:
  every field the incoming commit touches is already settled later on HEAD.

  Net effect: the staged tree is identical to HEAD (no staged diff). Left
  for the finalize step to detect and skip — `--skip` was not invoked here.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's sole semantic
  intent is the BUG-37 title rename to "control-app: Edit mode dies with
  Cloudflare 1102 — the preview render cache never hits in the Worker".
  That wording is present in the resolved file at the canonical frontmatter
  `title:` field (line 5). The incoming commit's literal artefact — the
  duplicate `fields.title` key — is intentionally absent, because HEAD
  commit `a9021e4749` on the same ticket lineage removed it 15 seconds
  after it was written, normalising the rename onto the real `title` field.
  That removal is a legitimate, already-integrated correction by the same
  author in the same editing session, not a resolution shortcut taken here.

No code files, no UAT test files, and no spec tickets were involved in this
conflict.
