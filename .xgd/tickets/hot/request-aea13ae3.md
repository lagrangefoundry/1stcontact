---
uid: request-aea13ae3
id: REQ-253
type: request
title: A development server refuses to run against a database that is behind its code
created_by: EPIC-10
created_at: '2026-09-16T00:47:28.663604+00:00'
updated_at: '2026-09-16T01:23:59.413272+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4a999b4a
  commits:
  - working_sha: fa7bd5a8c8c7c3f2bd7031dfbd7a910eeef8ea70
    reconcile_sha: null
    main_sha: null
  - working_sha: c45919fcfcb7dc8b40dcb41f4a6c235b0cd0f030
    reconcile_sha: null
    main_sha: null
  version: 0.2.212
  story_points: 3
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
## 5. How it is done

**The gate lives in `1c builder`**, which is the one thing that starts a development
server: `pnpm dev` and `pnpm dev:control` both reach `wrangler dev` through it (REQ-145,
BUG-50). It runs before the banner, so a refused start never prints a URL nobody can use.

**`--remote` is not gated.** That flag points wrangler at the *deployed* database, which
`bin/deploy` migrates and about which the local file says nothing. Refusing on it would block
the one mode the check has no evidence for.

**The binding is read from the block `wrangler dev` reads.** `apps/control-app/wrangler.toml`
declares its D1 database twice — once at the top level and once under `[env.production]`,
because a named environment inherits nothing — so the check takes the database name, its id and
`migrations_dir` from the top-level `[[d1_databases]]` block alone. Taking the first match
anywhere in the file would be right today and silently wrong the day the two differ.

**What counts as a migration is wrangler's own rule**: `*.sql` directly in `migrations_dir`,
ordered by leading number rather than lexicographically, so `0010_` follows `0009_`. A pending
list in the wrong order is a list that reads as the wrong work.

**The database is read directly, not through wrangler.** `d1_migrations` is read out of the
SQLite file miniflare persists, with `node:sqlite` from the runtime this repository already
requires — no new dependency, and single-digit milliseconds where shelling out to
`wrangler d1 migrations list` costs seconds and standing up a Miniflare spawns workerd. That is
what makes AC8 affordable. Finding the file means deriving miniflare's name for it from the
`database_id`, which is a copy of four lines that miniflare does not export.

**A check that cannot run warns and starts.** An unreadable database, or a `wrangler.toml` with
no D1 block in it, is a different fact from a database that is behind its code. Reporting the
first as the second would make the check itself the thing that stops an operator working —
a worse bug than the one it was written for.

**A file that exists with nothing applied is drift, not a first run.** Only a missing file is
"the database has not been created yet"; an empty `d1_migrations` table is a database that has
had nothing applied, and reads as such.

**One existing suite stands the gate aside.** `test_UAT_FC_BUG-50_builder_env_files` drives the
same entry point to assert the argv handed to wrangler, and reads the developer's own
`.wrangler/state` — untracked, so present on a working laptop and absent on a fresh clone. It
mocks the check for the reason it already mocks `spawn`; the gate is pinned at that same entry
point by this ticket's own UATs, against a fixture checkout holding a real SQLite database.