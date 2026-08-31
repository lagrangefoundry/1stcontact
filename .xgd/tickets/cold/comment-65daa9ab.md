---
uid: comment-65daa9ab
id: COMMENT-596
type: comment
title: Comment on bug BUG-31
created_by: xgd
created_at: '2026-07-31T20:24:45.580492+00:00'
updated_at: '2026-07-31T20:30:51.198153+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-55832d21
  kind: chat_transcript
---

<!-- xgd-turn id="35d74332-911d-49c1-8790-50624eee2baa-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T20:24:43.340408+00:00" -->
#### You
please free code a fix for this bug

<!-- xgd-turn id="35d74332-911d-49c1-8790-50624eee2baa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-31T20:30:51.162791+00:00" -->
#### Claude
I'll start by reviewing the current state of the code to plan the fix.

Now I'll implement the fix. Starting with the manifest keying:

Now `deploy.ts` — the prefix, prune scope, and the URL:

Now the prune scoping, key-shortening helpers, and the report:

Now the Worker side — make the `sites/`-only resolution explicit rather than incidental:

Now update the existing call sites in the three tests that use `manifestKey` from the deploy package:

Now the DOC-12 §7 correction:

Now version bump and commit:

Staging only the files this fix touched — the `storage/sites/xgd/` changes were already in the tree at session start and are unrelated:

Now the ticket. Reading the existing body first so I preserve it:

Done. BUG-31 is at `free_coded` with commit `90453834b`.

## What I fixed

The R2 key layout omitted the store root that every other layer preserves, so `--sandbox` stopped mattering the moment a key was built. The root is now part of the address on both sides:

- **`manifest.ts`** — `manifestKey(root, slug)`, `readManifest(client, root, slug)`, `writeManifest(client, root, slug, …)`.
- **`deploy.ts`** — snapshot prefix and the `--prune` listing built from `ctx.root`. `DeployResult` gains `root`; `url` becomes `string | null`.
- **`site-store.ts`** — the servable root is the named constant `SERVABLE_ROOT = 'sites'`. Nothing derives a root from a request, so a `sandbox/` key is unreachable by construction.
- **DOC-12 §7** — mapping table corrected to show `<root>`, with the "only `sites/` is servable" note.

## The judgement call

The ticket left open whether `--sandbox` should refuse (a) or upload under a namespaced root (b), recommending (a). **I went with (b)** — the `Fix` bullets and all five acceptance criteria describe a namespaced sandbox root, and once the root is threaded (~20 lines) keeping `--sandbox` uniform across every command is simpler than a one-command exception. A sandbox deploy uploads and indexes normally but reports no URL; the report prints the prefix and `(sandbox — not publicly reachable)`. If you'd rather it refused outright, that's a small follow-on — say the word and I'll add it to this ticket.

## Evidence

Five UATs in `tests/bug31-sandbox-r2-namespace.test.ts`, driving the real `cmdDeploy` and the Worker's real `fetch`, with R2 faked only at the upload boundary and the binding. The overwrite test is the load-bearing one: a real and a sandbox site share a slug, both publish revision 1, and the sandbox `--channel published` deploy leaves the real site's `manifest.live`, its `rev/0001/` bytes, and what `/site/acme/` serves entirely unchanged.

Regression scope green — 28 tests across `req110`, `req111`, `req113`, `deploy-workflow`, `public-site`, `control-app`, plus the 5 new. `tsc --noEmit` clean for `tools/generate` and `apps/public-site`.

Two files in `storage/sites/xgd/draft/pages/` were already modified/untracked when the session started; I left them alone and staged only the fix.

<!-- xgd-chat-end -->