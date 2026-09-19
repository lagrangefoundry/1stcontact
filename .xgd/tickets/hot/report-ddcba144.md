---
uid: report-ddcba144
id: REPORT-4400
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:22:30.349881+00:00'
updated_at: '2026-09-19T11:22:30.349881+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` (BUG-40) — **UU**, index-only (the path is
  outside the sparse-checkout cone on this reconcile branch: `.xgd/tickets/` is
  excluded, so there were no working-tree markers, only three index stages).
  Rule applied: **2e — intent/bookkeeping ticket, superset test**, resolved to
  the OURS side (`git checkout --ours` + `git add --sparse`).

  Why ours: both sides are successive snapshots of the *same* BUG-40 write-up,
  not competing edits to different facts.

  - Incoming (`cda495bd`, `xgd(ticket): update bug bug-3ade1af4`, 2026-09-01
    12:15 -0700): `status: free_coding`, `completed_at: null`,
    `updated_at: 2026-09-01T19:15:17Z`, title "23 failures … ten UATs",
    `fields: {severity, story_points}`.
  - Ours (`af0186bf`, `xgd(ticket): seed_local_overlay bug bug-3ade1af4`,
    2026-09-17 13:23 -0700): `status: bundled`, `completed_at: 2026-09-14`,
    `updated_at: 2026-09-16T01:48:35Z`, title "27 failures + 30 collection
    errors … eleven UATs", `fields: {severity, story_points, commits[
    working_sha e5d76233], version 0.2.33, bundled_in bundle-8e1807f6}`.

  Ours is a strict superset on every fact, per-field:
  - `status` / `completed_at` / `updated_at` — ours is strictly later on the
    ticket lifecycle. Taking theirs would have *regressed* the ticket from
    `bundled` back to `free_coding` and cleared `completed_at`.
  - `fields` — ours has theirs' two fields at identical values, plus `commits`,
    `version` and `bundled_in` that theirs never carried.
  - `title` / body — every section present on the incoming side is present on
    ours in a later, expanded revision (see next section). No incoming
    paragraph is absent as a *fact*; several are absent only as earlier
    phrasings of a fact ours restates more completely.

  No timeline tie-break was needed and none was invented: the enrichment's
  "take the more recent commit by timestamp" and 2e's superset rule both point
  at ours. Nothing was composed from outside the two sides, and no
  `fields.intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

Not a code file, so STEP 3's per-hunk code check does not apply literally; the
equivalent check — is the incoming commit's intent present in the resolved
file? — passes. This is the BUG-1109/BUG-1122 "redundant, not discarded" case:
the incoming commit's key changes are **present in HEAD via a later route**,
not missing from it.

Incoming hunk-by-hunk, against the resolved (ours) content:

- `title: Untitled` → a real title: **present**, as the later revision that
  counts 27 failures + 30 collection errors and eleven UATs rather than 23 and
  ten. Ours' count is the superset (it adds AC-964).
- `status: draft` → advanced: **present and further advanced** (`bundled`,
  past incoming's `free_coding`).
- `fields.severity: medium`, `fields.story_points: 5`: **present**, identical
  values.
- Body `## Symptom` + the vitest failure block: **present**, with the
  `Errors 30 errors` line carried through.
- Body `## Cause 1 — a half-finished pnpm install`: **present verbatim**,
  including the iconv-lite / whatwg-encoding diagnosis, the `node_modules/.pnpm/
  lock.yaml` override divergence, REQ-44's byte-for-byte preflight, the list of
  eight affected reconciliation suites, the `.idea` EPERM explanation and the
  "operator should still run `pnpm install` outside the sandbox" instruction.
- Body `## Cause 2 — a stale 1c assets build`: **present and superseded in
  place.** Incoming's heading reads "(environment, no code change)" and ends
  with "Note for later: nothing in the suite builds these assets … worth a
  ticket of its own." Ours reads "(environment, plus one real defect)" and
  replaces that note with the finding and the fix — `1c assets` `rm -rf`'d
  `dist-assets/` before refilling it, racing
  `reconciliation-platform-build-deploy-smoke` against
  `reconciliation-builder-workspace-origin`, now assembled in
  `dist-assets.staging/` and swapped in atomically. Ours is the resolution of
  incoming's open note, not a deletion of it.
- Body `## Cause 3` items 1–7: **all present**, each in a later revision.
  Item 2 (AC-1055 / REQ-127) states the same BUG-38 `slugForSession`→`hasDraft`
  rule and adds the traversal-onto-a-real-site case and the test renames; item 3
  (AC-1123) adds the parameter-sheet panel assertion; item 4 (AC-1331) fixes the
  leg ordering so the incomplete leg runs first; item 5 (AC-1336/7/8) adds the
  origin-keyed fetch double; items 1, 6, 7 are substantively identical.
  Ours then adds an eighth item (AC-964) that incoming does not have.
- Body `## Test plan`: **present**, extended with the coverage argument for the
  one production change (the staged asset swap).

The only incoming text with no counterpart in the resolution is the two
sentences of the Cause 2 "Note for later", which ours discharges by fixing the
defect the note asked for a ticket about. No developer-authored fact was
dropped.

No BUG-1301 precedence exception was invoked; no test function was deleted.

## Staging state

`git status --porcelain` is empty; `git ls-files -u` is empty; the path is
staged at stage 0 as blob `1f50971c`, which equals `HEAD:.xgd/tickets/hot/
bug-3ade1af4.md`, so `git diff --cached HEAD` is empty. Per STEP 4 this is
expected and is not a `--skip` trigger — the finalize step detects the clean
staged diff and skips the commit. `CHERRY_PICK_HEAD` (`cda495bd`) was left in
place; no `--continue` / `--skip` / `--quit` / `--abort` / `reset` was run.
