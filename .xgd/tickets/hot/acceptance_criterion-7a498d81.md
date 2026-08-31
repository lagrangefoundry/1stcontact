---
uid: acceptance_criterion-7a498d81
id: AC-1417
type: acceptance_criterion
title: 1c assets still bootstraps on a fresh checkout without loading the CLI barrel,
  and its --json output is one clean document
created_by: xgd
created_at: '2026-08-31T11:18:58.275135+00:00'
updated_at: '2026-08-31T11:18:58.275135+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c assets` — the one command whose output everything else imports — still
bootstraps on a fresh checkout without loading the CLI barrel, and the rewrite of
the launcher preserves that.

The barrel reaches the builder transport, which reaches the Worker's router and
its chrome document, which imports the generated import map that `assets` is the
command that produces. That map is deliberately not committed: it names each
webui component's entry point, and a checked-in copy of a generator's output would
be a second definition site for the component scope. So on a checkout where the
map does not exist yet, the barrel cannot load at all, and `assets` could never run
to fix it.

The launcher breaks the cycle by dispatching `assets` to the single module that
implements it, ahead of the barrel, and loading the barrel only on the other side
of that branch. `1c assets` is the only command with this property, and the branch
formats its own human and `--json` output rather than going through the barrel's
formatter.

`1c assets --json` therefore also satisfies the scriptable-output contract: it
exits 0, emits exactly one parseable JSON document on stdout with the real report
in it, and emits nothing on stderr.

## Verification
Confirm the `assets` branch of the `1c` entry point loads only the assets module,
and that the CLI barrel is loaded strictly on the other side of that branch (a
populated checkout cannot distinguish the two at run time, so the dispatch itself
is the property). Then run `1c assets` and confirm it exits 0, and run
`1c assets --json` and confirm stderr is empty and stdout parses as a single
document carrying the report's real keys rather than an empty object.
