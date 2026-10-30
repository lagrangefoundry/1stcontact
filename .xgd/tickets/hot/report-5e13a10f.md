---
uid: report-5e13a10f
id: REPORT-5553
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:58:59.333306+00:00'
updated_at: '2026-09-29T13:58:59.333306+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Incoming commit: `13d686aaf0 feat(identity): contact_events, the immutable spine
of a contact's history [FREE-CODED]` (REQ-195). Retry count 1 — first attempt at
this SHA, `prior_stage_failure` empty.

- `db/migrations/0001_baseline.sql` — UU, config/schema file. Both sides ADD a
  different block at the same location after `idx_users_tenant_stage`: HEAD adds
  `user_names` + its two indexes (REQ-193), incoming adds the `contact_events`
  table, its two indexes and the `contact_events_are_immutable` trigger
  (REQ-195). Non-overlapping additions → **KEPT BOTH**, HEAD's block first, then
  incoming's verbatim.

- `apps/control-app/src/people.ts` — UU, code file (§2c), two conflicts:
  1. `invitePerson` docstring. Incoming's diff is a pure ADDITION of the
     "IT APPENDS TO THE CONTACT'S HISTORY" paragraph after the existing
     "AND NO MAIL IS SENT" paragraph; HEAD independently rewrote that mail
     paragraph for REQ-196 (a sender now exists: `mail.ts`). Non-overlapping →
     **KEPT BOTH**: HEAD's REQ-196 mail paragraph plus incoming's REQ-195
     paragraph verbatim.
  2. The already-exists branch's write. Incoming converts a single
     `prepare().run()` into `env.DB.batch([UPDATE, contactEventInsert])`; HEAD
     had separately dropped `display_name = COALESCE(display_name, ?)` from that
     UPDATE and replaced it with a guarded `writeName` call, because REQ-193
     moved names out of `users` into `user_names`. **INTEGRATED**: incoming's
     batch and its `contactEventInsert(CONTACT_INVITED)` entry, carrying HEAD's
     `display_name`-free UPDATE SQL, with HEAD's `writeName` block following the
     batch. Incoming's comment kept in full; HEAD's comment kept with one added
     sentence stating why `writeName` sits outside the batch. Taking incoming's
     UPDATE verbatim would have bound a column the resolved schema does not
     have.

- `tests/test_UAT_FC_REQ-190_baseline.test.ts` — UU, UAT test file (§2f). Both
  conflicts are comment-only: each side extends the same two prose blocks to
  name the table it added. **COMPOSED BOTH** — the single-key list now names
  `user_names` and `contact_events`, and both justification paragraphs are
  present. No test function was deleted or modified on either side.

  One change outside the markers was forced by the resolution: the assertion
  `expect(single.sort()).toEqual([...])` counts single-column `TEXT PRIMARY KEY`
  declarations in the baseline. Both sides carried the identical 9-element array
  (8 `id` + `uid`) so git merged the line silently, but keeping BOTH tables makes
  the true count 10. Verified empirically against the resolved baseline
  (`grep -E '^\s*\w+\s+TEXT PRIMARY KEY'` → 9 `id` + 1 `uid`), and the
  accompanying count prose updated NINE→TEN. This is the arithmetic consequence
  of the keep-both resolution rather than authored test content; left unchanged,
  the merged commit would fail on its own resolution.

- `package.json` — UU, config file (§2g), `version` scalar only. Kept HEAD's
  `0.2.97` over incoming's `0.2.87`. See the dropped-hunk note below. The
  resolved file is byte-identical to HEAD, so it no longer appears in
  `git status --porcelain`; that is expected, not a missed stage.

## Incoming changes preserved

- `db/migrations/0001_baseline.sql` — the incoming block is byte-identical to
  `git show 13d686aaf0:db/migrations/0001_baseline.sql` lines 374–464 (diffed,
  zero differences): table, both indexes, and the `BEFORE UPDATE` trigger.
- `apps/control-app/src/people.ts` — every incoming hunk is present: the REQ-195
  class docstring paragraph, the `contact-events.js` and `./events` imports, the
  `events`/`provenance` fields on `PersonDetail`, the `eventsOf`/`provenanceOf`
  reads in `personDetail`, the `CONTACT_INVITED` event in the update batch, and
  the `CONTACT_CREATED` + `CONTACT_INVITED` pair in the insert batch. Confirmed
  by grep: all six imported symbols resolve to a use site.
- `tests/test_UAT_FC_REQ-190_baseline.test.ts` — incoming's `contact_events`
  justification paragraph is present verbatim, and its assertion's intent (the
  new table is counted) is preserved and extended.

### Dropped hunk — `package.json` version scalar (BUG-1301 precedence)

Incoming's only `package.json` change is an incidental bump `0.2.86 → 0.2.87`,
not REQ-195 content. Its entire target was already superseded by later
free-coded version bumps that this same resync queue cherry-picked onto the
branch ahead of it, leaving HEAD at `0.2.97`. `version` is a monotone counter:
taking incoming's scalar would move it backwards by ten bumps and discard
commits already integrated, which is the data loss §2g's "incoming wins" exists
to prevent rather than to cause. Same call as the earlier resolutions on this
anchor (`resolve-377b581e-164e51cba7`, `-242a8bf969`). Flagged for post-merge
review as the enrichment requests, along with the three other files.

## Verification limits

- `tests/test_UAT_FC_REQ-190_baseline.test.ts` — RUN and green (6/6) under
  `vitest.node.config.mts`, which is what confirms the count correction above.
- `tests/test_UAT_FC_REQ-195_contact_history.test.ts` — RUN and green (6/6),
  same config.
- The full node suite was attempted and killed by the OS (exit 137, OOM) before
  reaching a verdict; it was not run to completion.
- `tests/test_UAT_FC_REQ-195_contact_events.workers.test.ts` and every other
  `vitest.workers.config.mts` suite were **NOT EXECUTED**. They are unrunnable in
  this session role — workerd/miniflare fails with `listen EPERM` under the
  sandbox, which is an environment limit rather than a test result. The schema
  and the D1 write paths this commit adds are therefore unproven by execution
  here; they are covered only by the byte-identity and symbol checks above.
