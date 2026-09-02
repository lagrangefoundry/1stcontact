---
uid: request-631866be
id: REQ-177
type: request
title: Discontinue the raw-server hosting path (1c serve)
created_by: xgd
created_at: '2026-09-02T23:06:22.597809+00:00'
updated_at: '2026-09-02T23:43:40.977687+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-362ba12d
  commits:
  - working_sha: 246333cbfe665faa5e85435b2072041910c826a3
    reconcile_sha: null
    main_sha: null
  version: 0.2.48
---

# Discontinue the raw-server hosting path — and stop calling the test fixtures "servers"

## Why

The operator's instruction was to discontinue any aspect of the system still
using raw servers, on the reading that everything now runs on Cloudflare. That
reading is right about *hosting* and wrong about *tooling*, and the difference
matters enough to write down before anything is deleted.

There is exactly one raw server an operator can start as a way to look at a
site: `1c serve <slug>`. It is a `node:http` static file server over
`dist/<slug>/<channel>/`. Nothing deploys through it, nothing depends on it, and
it presents a second, divergent way to view a site next to the real one
(`wrangler dev`, which serves through the same routes and runtime as
production). It should go.

Everything else that looks like a raw server is **in-process test and capture
scaffolding**, and removing it would break the build.

## What must NOT be removed

`startServe` and `startBuilder` are library functions, not hosts. They bind an
ephemeral loopback port inside a test or a CLI run and close it again:

| Function | Used by | Consequence of removal |
|---|---|---|
| `startServe` | `1c shot`, `1c aligned-crops`, `conformance/harness.ts` | Screenshots and the module conformance harness lose the origin Playwright points at |
| `startBuilder` | **42 test files** | The control-app router loses its test transport |

`startBuilder` is already demoted correctly — `1c builder` starts `wrangler dev`
and the comment at `index.ts:720-728` explains that keeping two live paths would
be the two-code-paths problem. That reasoning is sound and this ticket does not
disturb it.

The screenshot loop is the load-bearing one. `1c shot` renders to disk, serves
the directory on a loopback port and drives a browser at it. Replacing that with
workerd would make the fidelity loop slower for no gain in fidelity — the bytes
under test are static render output, not Worker behaviour — and [[REQ-157]]
depends on that loop continuing to work.

## What this ticket does

**1. Remove `1c serve`.** The command, its `case 'serve'` arm, its help text and
its usage line. The CLI's own help currently advertises it as a way to view a
site, which is the part that misleads.

**2. Say what the fixtures are, in their own headers.** `serve.ts` and
`builder.ts` should state at the top that they are test and capture
infrastructure, never a hosting path, and that the only supported way to serve a
site is a Worker. The code already earns this — `builder.ts` says it, `serve.ts`
does not — and the point is that the next person auditing for "raw servers"
reaches the same conclusion this ticket did without re-deriving it.

**3. Leave `startServe` exported.** `shot.ts`, `aligned-crops.ts` and the
conformance harness import it directly; the CLI command is what goes, not the
function under it.

## What is deliberately not in scope

The file-backed local store (`1c new`/`render`/`publish`/`checkout`/
`revisions`, `storage/sites/`). It is not a server. It is the local authoring
and reproduction tier that feeds `bin/publish` into D1 and R2, and [[DOC-12]]
treats it as a tier rather than a legacy path. Nothing here argues against it.

## What landed

Commit `246333cbfe` — `refactor(cli): discontinue the raw-server hosting path`.

**Observable behaviour after this change:**

- `1c serve <slug>` is no longer a command. It falls through to the CLI's
  unknown-command default: a `Unknown command: serve` refusal on stderr followed
  by the usage text, and exit code 1. No port is bound.
- `1c help` no longer advertises any way to serve a site outside a Worker. The
  `1c serve` usage line is gone; `1c builder` (which starts `wrangler dev`) is
  what the help offers instead.
- `startServe` remains exported from `tools/generate/src/cli` and still binds an
  ephemeral loopback origin over a site's rendered output. This is the half that
  had to survive: the command is what goes, not the function under it, and the
  screenshot / conformance loop drives it directly.

**Code changes:**

- `cli/index.ts` — removed the `case 'serve'` arm, its usage line, the
  now-unused top-level `startServe` import (the re-export still comes straight
  from `./serve`, so the fixture stays exported), the `run()` doc-comment caveat
  about a command that never returns, and `serve` from the help text's list of
  ungated offline verbs.
- `cli/serve.ts` — new file header stating this is the static-preview **capture
  fixture**, that it is not a hosting path, that `1c serve` existed and was
  removed and why, and that the only supported way to serve a site is a Worker.
  `startServe`'s own doc-comment is reworded from "serve a site for browser
  viewing" to what it actually is.
- `cli/builder.ts` — same "not a hosting path" statement added at the top of the
  existing header, which already made the argument but did not state the
  conclusion in those terms.
- `tools/generate/README.md` — dropped the `1c serve` row from the command table.

**Consequential test edits.** Two existing preflight UATs
(`req44-install-preflight`, `reconciliation-1c-install-preflight`) enumerate the
offline verbs that are never gated on an install check, and both listed `serve`.
The assertions still passed after removal — `assertInstall` is a no-op for a
command not in `COMMAND_DEPS`, including one that no longer exists — but the
lists would have been asserting something about a verb that is gone. `serve` was
dropped from both. No assertion semantics changed.

## Test plan

`tests/req177-discontinue-raw-server.test.ts` — three UATs, pinning both halves
of the hosting-vs-tooling distinction:

- `test_UAT_FC_REQ-177_serve_is_no_longer_a_command` — `run(['serve','demo'])`
  reports `Unknown command: serve` and sets exit code 1.
- `test_UAT_FC_REQ-177_help_advertises_no_raw_server` — the usage text has no
  `1c serve` line, and does offer `1c builder` / `wrangler dev`.
- `test_UAT_FC_REQ-177_capture_fixture_still_binds_a_loopback_origin` — drives
  `startServe` over real HTTP against a rendered snapshot and asserts a 200 with
  the expected bytes. Deliberately not a type-level assertion: keeping the export
  while deleting the implementation must not pass.

Regression scope run and green: the new file, `req113-serve-extensionless`,
`reconciliation-clean-page-urls`, `req37-launcher`,
`reconciliation-1c-aligned-crops-sandbox-routing`, `bug30-relativize-fragment`,
both install-preflight suites, and the three suites that reference the usage
text (`reconciliation-system-knowledge-base`, `req83-capture-to-l1-fold`,
`reconciliation-l1-fold`). `tools/generate` and `apps/control-app` typecheck with
no new errors (one pre-existing `session-knowledge.ts` error is unrelated and
present on the base commit).

## Related

- [[DOC-41]] — Build and Deployment. Documents the two supported environments
  and records `1c serve` as discontinued rather than silently omitting it.
