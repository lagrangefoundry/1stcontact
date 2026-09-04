---
uid: report-73fec3ad
id: REPORT-3425
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:31:31.925732+00:00'
updated_at: '2026-09-04T00:31:31.925732+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket (rule
  **2e**), index-only conflict (path is outside the sparse-checkout cone, so there
  were no working-tree markers; resolved with `git checkout --ours` +
  `git add --sparse`). **Resolution: HEAD side kept in full.**

  Sides:
  - **Ours (HEAD)** — `31823f5b7c` *"xgd(ticket): seed_local_overlay request
    request-439cd0c8"*, 2026-09-02 10:50 -0700, `updated_at`
    `2026-09-02T17:48:27Z`, `status: bundled`.
  - **Theirs (incoming)** — `5d360749e5` *"xgd(ticket): update request
    request-439cd0c8"*, 2026-08-31 16:36 -0700, `updated_at`
    `2026-08-31T23:36:19Z`, `status: free_coding`.

  Per-fact resolution (2e), not a whole-file coin flip:

  1. **Body prose** — HEAD is a strict superset. The HEAD-side
     `seed_local_overlay` had already carried the free-coded body forward: every
     line the incoming commit adds is present in HEAD verbatim (see below). No
     content from either side is lost by keeping HEAD.
  2. **`## Open questions` section** — the one genuine same-fact conflict. Theirs
     lists two questions still open (`describeImage` → AI component; re-describe
     automatic vs operator-triggered). HEAD removed those two bullets and replaced
     them with a `## Resolved after implementation (2026-08-31)` section that
     *answers both*, and says so explicitly: *"Recorded here rather than by
     deleting them, so what made them questions stays legible."* HEAD's section
     also cites content the incoming commit introduced (*"the +138 KiB the
     measurement above attributes to the SDK"*), so HEAD's body demonstrably
     builds on theirs. Timeline rule → later-positioned side (HEAD, 2026-09-02)
     wins this fact.
  3. **Frontmatter / bookkeeping** — HEAD carries `status: bundled`,
     `bundled_in: bundle-203b1dc2` (this bundle), `version: 0.2.24`, and the
     `commits` list recording `working_sha d99c1f43…`. Theirs predates all of it
     (`status: free_coding`). Taking theirs would revert this ticket out of the
     very bundle being reconciled and drop workflow-owned state; HEAD wins.

## Incoming changes preserved

Verified by diffing the two index blobs directly
(`git diff a4b20546b3 deaeda92d8`), i.e. ours-vs-theirs rather than
base-vs-theirs, which shows exactly what HEAD lacks relative to the incoming
commit. Every prose addition made by `5d360749e5` is present in the resolved
file:

- Acceptance bullet *"Every route the origin declares carries the no-store
  directive — the two new ones included…"* — present.
- `## What was built, and where it departs from the decisions above` — all five
  departures, verbatim — present.
- `### The bundle measurement, for [[REQ-158]]` incl. the four-build gzip table
  (322 / 460 / 939 / 1032 KiB) and the SDK-double-copy paragraph — present.
- `### Evidence` — both UAT file descriptions and the two-doubles paragraph —
  present.
- Open question *"DNS is not resolved before a fetch…"* — present.

Nothing from the incoming diff is absent except the two open-question bullets
covered in point 2 above, which HEAD did not drop but *superseded* with an
explicit, dated resolution of both questions. That is the same developer's later
revision of their own text, not a discard — so STEP 3's guard is satisfied and no
`@fail` applies.

No code/implementation files were touched by this conflict. The BUG-1301
precedence exception was not invoked; no test function was deleted.

### Note for the finalize step

The staged tree is byte-identical to HEAD (`git ls-files -s` reports the ours
blob `a4b20546b3` at stage 0), so this cherry-pick will net to no diff. That is
the expected outcome here — the HEAD-side `seed_local_overlay` already landed
this commit's content, refined, via a different route. Per STEP 4 this is not a
`@fail` and `--skip` was **not** called; the finalize step will detect the clean
staged diff and skip the commit. `CHERRY_PICK_HEAD` (`5d360749e5`) is intact.
