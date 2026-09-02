---
uid: request-631866be
id: REQ-177
type: request
title: Discontinue the raw-server hosting path (1c serve)
created_by: xgd
created_at: '2026-09-02T23:06:22.597809+00:00'
updated_at: '2026-09-02T23:42:59.557222+00:00'
completed_at: null
last_field_updated: status
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

## Related

- [[DOC-41]] — Build and Deployment. Documents the two supported environments
  and records `1c serve` as discontinued rather than silently omitting it.