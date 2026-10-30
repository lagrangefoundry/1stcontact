---
uid: report-b712dd32
id: REPORT-5126
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:07:30.985502+00:00'
updated_at: '2026-09-26T21:07:30.985502+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU, §2g config scalar (`version`). HEAD `0.2.40` kept over
  incoming `0.1.60`. The incoming hunk is the routine free-coded patch bump
  `0.1.59` → `0.1.60` in the pre-resync working-branch numbering; the
  main-rooted resync branch is already at `0.2.40`. Taking incoming would
  regress the published version, so the resync exception to "incoming wins on
  scalars" applies.

- `tests/reconciliation-builder-workspace-origin.test.ts` — UU, §2c code file
  resolved to HEAD under the BUG-1301 precedence note. Single conflicted hunk,
  comment-only, inside
  `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable`. No test
  function on either side was deleted or altered; the function and every probe
  it contains are unchanged.

## Incoming changes preserved

The incoming commit `b8b01ebf26` ("fix(build): the component scope has one
definition site, and it isn't a comment [FREE-CODED]") is **already integrated
into HEAD** as `2b7ef26ec4` — same subject, same author date
(2026-08-19 18:03:47 -0700), and byte-identical diff for this test file
(blob `3227fba2e8` → `0c4520cd52` on both sides). This is the
"picked commit already on HEAD under another sha" shape.

Both of the incoming commit's hunks for this file are accounted for:

- **Hunk 2** (removing the stale `{ route: '/api/ai/', url: '/api/ai/roles',
  ok: true }` prefix-route probe entry): already applied on HEAD via
  `2b7ef26ec4`. `git grep "route: '/api/ai/'," HEAD -- <file>` returns nothing,
  so the entry is absent on the HEAD side and the hunk merged as a no-op.
  `git checkout --ours` discarded nothing here.

- **Hunk 1** (the "BOTH SOURCES" comment above `const sources = [...]`): the
  incoming wording *is present on HEAD* — HEAD retains the incoming phrase
  "still serves its own copy of the assistant routes ... so reading one file
  would silently stop covering the other half and let the coverage check pass
  over a shrunken set", which does not exist in the merge base. HEAD then
  refined the one clause the incoming text got wrong going forward: incoming
  asserts "publish is the one capability only it has (REQ-149 owns the
  Worker's)", while HEAD says "Publish was the transport's other exclusive
  capability until REQ-149 put revisions on the store port; it is the router's
  now, and this reads both files either way."

  That refinement was made by `30abfebebd` ("feat(publish): mint revisions in
  the cloud; D1 is the only record [FREE-CODED]"), a legitimate, documented
  REQ-149 refactor already integrated into HEAD and sequenced *after*
  `2b7ef26ec4`. Publish ceasing to be transport-exclusive is precisely what
  that commit implements, so the incoming clause's subject no longer exists.
  Re-asserting it would reintroduce a statement the integrated refactor
  falsified. The drop is acknowledgement of a prior decision, not a resolution
  shortcut: the incoming edit's substance is present, only its since-corrected
  factual clause is superseded.

Net staged diff against HEAD is empty — the pick is a no-op because its content
already landed. Left for the finalize step to skip; no `--continue`/`--skip`/
`--quit`/`--abort` was issued and `CHERRY_PICK_HEAD` remains in place.
