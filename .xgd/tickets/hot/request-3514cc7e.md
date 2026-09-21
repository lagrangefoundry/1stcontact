---
uid: request-3514cc7e
id: REQ-291
type: request
title: Fail the deploy when an applied migration's content has changed
created_by: EPIC-16
created_at: '2026-09-21T01:05:22.242071+00:00'
updated_at: '2026-09-21T18:43:56.026370+00:00'
completed_at: null
last_field_updated: body
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


---

## As built (2026-09-21)

**`db/migrations/manifest.json`** — the manifest, a JSON object of migration
filename → SHA-256 of that file's bytes, pretty-printed one key per line so a
`git diff` renders one line per file. It sits beside the migrations it describes;
wrangler's default `migrations_pattern` is `<migrations_dir>/*.sql`, so a JSON
file in that directory is invisible to it.

**`bin/migration-manifest`** — the deliberate command, plain Node with no
dependency or transform (the reason `bin/smoke` is): it runs inside a deploy, and
a gate that needed the site toolchain built before it could refuse anything would
be a gate with a new way to fail open.

- `bin/migration-manifest` rewrites the manifest and reports what moved. An
  **added** key is a new migration and reads as ordinary; a **CHANGED** value is
  an edit to a migration that already existed, printed with both hashes under a
  heading that says what it costs. The two are reported separately because they do
  not mean the same thing.
- `bin/migration-manifest --check` reports the same and writes nothing, exiting
  non-zero when anything moved.
- `bin/migration-manifest verify --env <name> --status <n>` is the hook's entry
  point, reading `wrangler d1 execute --json` output on stdin.
- It ships executable, because the refusal it prints tells an operator to type it.

The migrations directory is read from `migrations_dir` in
`apps/control-app/wrangler.toml` — the same key wrangler reads — and every
occurrence of that key must agree. The top-level block and `[env.production]`'s
are deliberately duplicated, so taking the first match would be right today and
silently wrong the day they diverge.

**The hook.** `bin/deploy.d/migrate/10-d1-site-store` asks the target environment
for `SELECT name FROM d1_migrations` through `wrangler d1 execute --remote --json`
and pipes the answer to `verify`. That query is the table wrangler itself reads;
anything else — a marker file, a recorded high-water mark — would be a second
opinion free to disagree with the one that decides what runs. The check sits above
the dry-run branch rather than inside either side of it, so the rehearsal and the
deploy run the identical verification.

### The cases, and what each one costs

| State | Outcome |
|---|---|
| applied, on disk, hash differs | **refuse** — names the file, the environment and both hashes |
| applied, on disk, hash matches | proceed |
| not applied | not checked — it is about to be, and its content is whatever it is |
| applied, on disk, **no manifest entry** | **refuse** — the manifest is stale, and says what to type |
| applied, **not in this checkout** | reported, not refused |
| environment unreadable | **refuse** — only a positive read counts |
| `no such table: d1_migrations` | proceed — that environment has applied nothing |

An applied migration with no manifest entry is refused because a tripwire that can
be disarmed by deleting a line is not a tripwire; the manifest's completeness is
load-bearing. An applied migration absent from this checkout is reported rather
than refused because an older checkout against a newer environment is an ordinary
state — the same judgement `tools/generate/src/cli/d1-migrations.ts` already makes
about a local database that is ahead of the files beside it. An unreadable
environment is a refusal for this directory's standing reason ([[REQ-149]],
[[REQ-259]]): the failure being guarded against is a confident skip based on an
answer nobody actually got. The one exception is stated by the error itself — a
database with no `d1_migrations` table has applied nothing, which is a fact about
the environment rather than a failure to read one, so a first deploy into an empty
database proceeds.

**Wrangler's own chatter is not the answer.** The hook merges stderr into the
reply so that a failure carries its own explanation, and wrangler says things on
its way to answering — `▲ [WARNING] Proxy environment variables detected` on any
machine behind a proxy. That line contains a bracket, so a reader that took the
first `[` as the start of the document would refuse a deploy that was perfectly
fine. The document is found by parsing each `[` in turn and taking the first that
yields a D1 result set. A gate that fires on a warning about a proxy is a gate
people disable.

### On the manifest lagging

The manifest is regenerated only when somebody types the command. That lag IS the
mechanism: a hash refreshed as a side effect of being looked at would always agree
with the file it was just read from and could never disagree with anything. So the
repository's own test asserts **presence, not equality** — every migration on disk
has an entry and no entry names a file that is not there — because a file with no
entry is one the deploy check cannot speak for, while a hash that no longer matches
is exactly what the check exists to find.

### Evidence

`tests/test_UAT_FC_REQ-291_applied_migration_content_drift.test.ts`, driving the
shipped hook and the shipped script through `tests/support/migrate-hook.ts`, with
only `npx` stubbed so the deployed database's answer is the test's to dictate.
Every case asserts on the `wrangler d1 migrations` invocations that followed: a
check that refuses and then applies the migrations anyway is indistinguishable
from one that refuses, unless somebody looks. The first case is the incident of
2026-09-06 constructed as data — an environment reporting the baseline as applied,
a manifest holding the hash of the bytes it applied, and a different file on disk.
