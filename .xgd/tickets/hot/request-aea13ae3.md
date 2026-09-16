---
uid: request-aea13ae3
id: REQ-253
type: request
title: A development server refuses to run against a database that is behind its code
created_by: EPIC-10
created_at: '2026-09-16T00:47:28.663604+00:00'
updated_at: '2026-09-16T00:47:28.663604+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4a999b4a
---

# A development server refuses to run against a database that is behind its code

Production cannot deploy code that assumes a column it has not migrated. Development can, and
does, and says nothing until a request fails.

## 1. What is true today

**Production is guarded.** `bin/deploy.d/migrate/10-d1-site-store` applies the D1 migrations
before the Worker is uploaded and aborts the deploy if they fail, for a reason it states: *"A
Worker whose code assumes a column that does not exist yet fails at request time, on
production traffic, with an error that names SQLite rather than the deploy that caused it.
Failing here instead costs a deploy and nothing else."*

**Development has no equivalent.** `wrangler dev` reads whatever is in
`.wrangler/state/v3/d1` and starts. A `git pull` brings new code and new migration files, and
nothing applies the second or notices the mismatch.

The failure it produces is exactly the one the deploy hook exists to prevent, in the
environment where it is hardest to recognise:

    D1_ERROR: table asset_grants has no column named form_handle: SQLITE_ERROR

shown to the operator as *"This site cannot take messages at the moment."* — the frozen
acknowledgement, working correctly and by design carrying no diagnosis.

This cost several days on [[EPIC-10]]. The same mismatch was met three times: once as the
error above, once again forty-five minutes after the migration had been applied — because a
running dev server holds its own handle on the database and does not see a rename underneath
it — and once more as a production deploy that aborted in the migrate hook with `no such
table: sessions`.

## 2. The change

**A development server checks before it serves.** On startup, compare the migrations recorded
in the local database against the files in `db/migrations/`, and if the database is behind,
stop and say so — naming the pending files and the one command that applies them.

**Refuse rather than warn.** A warning in a scrolling dev log is a warning nobody reads, and
the failure it is trying to prevent arrives minutes later wearing a different face. The deploy
hook aborts for this reason and the same argument applies here; a development server that
started anyway would be choosing the slower failure.

**Applying them stays a separate, deliberate act.** This ticket adds no automatic migration: a
migration can drop data, and a tool that ran one because a file appeared would be a worse
problem than the one being fixed. It says what is wrong and what to type.

**A running server is told to restart.** Applying migrations under a live `wrangler dev` leaves
the worker on a stale view of the schema, which is how the same error appeared a second time
after being fixed. Whatever reports the mismatch should say so.

## 3. What this does not touch

Production's path is unchanged — `bin/deploy` already does the right thing, and this is the
same guarantee for the other environment.

It makes no claim about a database being *ahead* of its code, which is an ordinary state on a
branch and not an error.

## 4. Acceptance criteria

1. A development server whose local database is behind `db/migrations/` refuses to start.
2. The refusal names every pending migration file and the exact command that applies them.
3. A database at the same revision as the files starts normally, with no extra output.
4. A database *ahead* of the files starts normally — an older branch against a newer store is
   not an error.
5. A first run against an empty state directory is not reported as drift; it is told how to
   create the database.
6. The check reads the same `d1_migrations` table wrangler writes, so it cannot disagree with
   `wrangler d1 migrations list`.
7. The message says that a server already running must be restarted after migrations are
   applied, because a live server holds a stale view of the schema.
8. The check adds no measurable time to a normal start.