---
uid: request-3514cc7e
id: REQ-291
type: request
title: Fail the deploy when an applied migration's content has changed
created_by: EPIC-16
created_at: '2026-09-21T01:05:22.242071+00:00'
updated_at: '2026-09-21T18:37:10.435078+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a8453d09
---

Parent: [[EPIC-16]]. Asked for by the operator on 2026-09-20, after the first real
`bin/deploy` failed on a migration that could never have succeeded. See [[EPIC-16]] §H
for the incident.

## What happened

`0001_baseline.sql` was applied to production on 2026-09-06 17:39:19 and then edited
**twelve times**. `d1_migrations` records a migration's NAME and its `applied_at`, and
nothing else — so wrangler considers the file permanently done and starts at `0002`,
which opens `ALTER TABLE sessions RENAME TO sessions_pre_rotation` against a database
whose baseline predates `sessions`. Production had 14 tables; the current baseline
creates 31.

The baseline's own header licensed the edits on a premise it stated out loud:
"Editing a baseline that has never been applied is not a second rebaseline." The
premise was true when written and false a few hours later. **Nobody was careless.
What is missing is a mechanism that notices a checked premise stop being true.**

## Why a rule is not enough

`db/migrations/` already carries the rule — never edit an applied migration — and the
file that broke it is the file that documents it. Restating the rule harder is not a
fix. The rule needs a check that runs where the damage happens: at deploy, against the
environment being deployed to, before anything uploads.

This is [[EPIC-16]] open question 4 ("is the migration policy check something a machine
can do?") answered in the affirmative by an incident.

## Behaviour

**A manifest of applied content.** The repo carries a checked-in map of migration
filename → SHA-256 of its bytes. It is generated from `db/migrations/` and committed,
because the check needs a record of what the bytes were that lives somewhere this repo
controls — `d1_migrations` stores `(id, name, applied_at)` and cannot be extended
without a schema change to a table wrangler owns.

**The migrate hook verifies before it applies.** For every migration the target
environment reports as applied, the hook compares the manifest's hash against the file
on disk. A mismatch **fails the deploy before anything is uploaded or applied**, naming
the file, the environment, and both hashes. A migration the environment has not applied
is not checked — it is about to be, and its content is whatever it is.

**It reports, rather than repairs.** The remedy for a drifted migration is a decision
about data — rebaseline a database with nothing in it, or write a corrective migration
for one with customers. A script cannot make that call and must not appear to.

**It runs on a dry run.** `bin/deploy --dry-run` performs the same verification, because
the whole value is catching this before the deploy that would have discovered it. The
comparison is a read.

**The manifest is refreshed deliberately.** Regenerating it is its own command, so that
`git diff` shows a hash changing as an edit to a file somebody has to justify, rather
than as a side effect of running a build.

## Acceptance

Against the state of 2026-09-06 — production with the early baseline applied, the
edited baseline on disk — the check fails and names `0001_baseline.sql`. That is the
test: the incident, replayed, is caught.

[[DOC-41]] §3 gains the check in its description of what `bin/deploy` does, and §5's
invariants gain it beside "migrations before upload".

## Boundaries

- No change to `d1_migrations` or to any table wrangler owns.
- No automatic repair, rebaseline or corrective-migration generation.
- The one-off recovery of today's production database is not this ticket — that is
  `db/ops/rebaseline-remote.sql`, run by hand under [[EPIC-16]] §H.