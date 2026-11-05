---
uid: report-8faf721a
id: REPORT-11004
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:23:45.157766+00:00'
updated_at: '2026-11-05T20:23:45.157766+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, version scalar only (one hunk: `"version"`). Not one of the files 2g names (and 2g's "incoming wins" would roll the version back from 0.2.117 to 0.2.73). Applied the enrichment rule ("take the more recent commit by timestamp"): HEAD's side, `2de6a86da7 chore(version): 0.2.117 for REQ-198` (authored 2026-09-06, committed 2026-11-04), is newer than incoming `15fc018e13` (authored 2026-09-05). Kept `"version": "0.2.117"`. No conflict markers, valid JSON, staged.

## Incoming changes preserved

Incoming commit `15fc018e13` ("feat(identity): the invite turns a contact into a member", REQ-186) changes exactly one file, `package.json`, in one hunk: `"version": "0.2.71"` -> `"0.2.73"` (`git show --stat`: 1 file, +1/-1). Its message describes the invite feature, but none of that code is in this commit's tree diff. The feature is already on HEAD: `invitePerson` is in `apps/control-app/src/people.ts`, `router.ts`, `identity.ts`, `mail.ts`, plus `tests/support/invite-account.ts` and the `reconciliation-identity-*` suites.

The only incoming hunk (the version bump) was left out on purpose because it is stale, not by mistake. With it dropped, the staged index matches HEAD exactly (`git diff --cached` is empty). This cherry-pick therefore produces an EMPTY commit: cherry_pick_finalize_resolution should expect that (skip, or allow-empty).

## Arbitration of last resort (BUG-1460)

- `package.json`: resolved at **tier 1** (most recent intent). Evidence: the later version commit for REQ-198 (`2de6a86da7`, 0.2.117) supersedes the incoming commit's 0.2.73. Taking incoming would move the version backwards by 44 patch releases, and the per-file enrichment rule (newer timestamp wins) points the same way. **Dropped: the incoming side (version 0.2.73).** No developer code was lost; the feature the commit message describes is already on HEAD.
