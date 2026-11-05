---
uid: report-86db26a3
id: REPORT-10954
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:45:25.144270+00:00'
updated_at: '2026-11-05T19:45:25.144270+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, version scalar only (`"version"` line). Kept HEAD (`0.2.117`), dropped incoming (`0.2.4`).
  Rule: the enrichment rule ("take the more recent commit by timestamp; flag for post-merge review"), backed up by STEP 3h tier 1.
  HEAD side: 2de6a86da7 `chore(version): 0.2.117 for REQ-198`, committed 2026-11-04.
  Incoming side: de9d788f53 `feat(schema): reserve locale-shaped page slugs`, committed 2026-11-01, authored 2026-08-22.
  Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

The incoming commit de9d788f53 touches only `package.json`, changing the version from `0.2.82` to `0.2.4`. In its original commit (31a4ca7da5) that line was a `0.2.3 → 0.2.4` bump made at the time.
- The commit's real content is already on HEAD via commit 6852ca1359 (same subject): `isLocaleShapedSlug` in `packages/site-schema/src/locale.ts:348` and its use in `packages/site-schema/src/schema.ts:9,561`. That is the locale.ts, schema.ts, and UAT test change described in the commit message. No developer code is lost.
- The only dropped hunk is the stale version number. Applying it would roll the package version back from 0.2.117 to 0.2.4.

The resolution leaves no difference from HEAD, so the cherry-pick is now empty. CHERRY_PICK_HEAD is still present; finalize should treat it as empty (skip, or allow-empty).

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved by tier 1 (most recent intent), dropping the incoming side.
  Evidence:
  - REQ-198's version commit (2026-11-04) is later than the incoming commit and sets the current release version.
  - The incoming value 0.2.4 is a leftover release number from an old working-branch bump. The commit's stated rationale (slug reservation) has nothing to do with the version and is already integrated in 6852ca1359.

Note on the instructions: STEP 4 says a resolution with no difference from HEAD should exit @fail. The EXITS section says this is not a @fail reason and applies STEP 3h. I followed EXITS / BUG-1460.
