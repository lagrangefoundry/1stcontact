---
uid: request-0cdfdc5b
id: REQ-146
type: request
title: The AI host moves into workerd
created_by: xgd
created_at: '2026-08-15T20:33:27.556016+00:00'
updated_at: '2026-08-18T01:40:14.716394+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 13
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-141
  - REQ-142
  - REQ-143
  - REQ-144
  - REQ-145
  - REQ-147
---

# The AI host moves into workerd

> **Status: draft, blocked.** Waiting on **lagrange-framework REQ-103**, which is itself
> still draft. See "What actually blocks this" below — the blockers are structural, not the
> four loose ends this ticket originally listed.

The last thing binding the builder to a Node process, once [[REQ-145]] has moved the routes.

**Scope narrowed (2026-08-17).** This ticket was "the AI host **and `publish`**". Publish is
now [[REQ-149]]'s, and only the AI host is left here. See "Publish is not here" below.

## 1. The AI host is closer than it looks

`tools/generate/src/cli/ai/host.ts` says so itself: the Claude backend is **fetch-based** and its
node built-ins are inside what `nodejs_compat` reaches, so *the backend and the tool loop are not
what pin it to Node*. What pins it is that **every tool bottoms out in `edit.ts`**, which reads
and writes the operator's store. [[REQ-142]] and [[REQ-143]] remove exactly that.

What is genuinely left here:

- `fileAuditSink` uses `appendFileSync` — the audit trail needs a store.
- Session persistence: a session id is derived from the slug so a reload resumes the site's
  conversation. Where that transcript lives in a Worker is undecided; [[DOC-10]] is the relevant
  design and should be reconciled with whatever [[REQ-143]] built rather than inventing a third
  store.
- `ANTHROPIC_API_KEY` becomes a `wrangler secret`, wired into [[REQ-144]]'s secret hook. REQ-144
  ships the mechanism and names no key, so this dependency points this way and not back.
  `bin/deploy` already carries the pointer: *"bin/deploy.d/secrets/ — REQ-146 lands the API key
  here"*.
- `l1-surface.json` and `instances.json` are read from disk and must ship as bundled data.

The structural properties should survive untouched: the surface stays declared as data, a slug
becomes a session in exactly one place, and no operation takes a `slug` parameter.

## 2. What actually blocks this

The four items above are real but secondary — each is a small change once the host can load at
all. Three structural blockers sit underneath them, and all three are lagrange-framework
REQ-103's to remove. Verified against the working tree and the installed package on 2026-08-17:

1. **The library is loaded by file URL at runtime.** `host.ts` reaches it through
   `sharedModuleUrl('ai')` (`tools/generate/src/cli/webui.ts:172`), which does `require.resolve`
   → `pathToFileURL` → a dynamic `import()` of that URL. workerd has no filesystem and no
   dynamic import of an arbitrary URL. This needs a **static, bundled** import — which is a
   change to how the library is delivered, not a relocation of the host.

2. **`@lagrangefoundry/ai/core` is not workerd-safe yet.** `core.js` → `session.js` →
   `session_log.js` uses `fs.appendFileSync`, `fs.openSync` and `fs.writeFileSync`. That is
   precisely REQ-103's gap 1 — *"the session junction is a file, not a port — and that was on
   purpose"* — which REQ-103 says contradicts a deliberate design decision and owes [[DOC-21]] an
   amendment rather than a silent reversal.

3. **The package is not a dependency of this repo.** It is installed out-of-repo at the workspace
   root (`node_modules/@lagrangefoundry/ai`) by lagrange-framework's deliberate install, and
   `webui.ts` states it is *never vendored into this repo*. So there is nothing for wrangler or
   esbuild to bundle from `apps/control-app` today.

**Why we wait rather than work around.** The tempting shortcut is to port the session junction
here, against D1. REQ-103 rejects that in its own words: it would be a **third** implementation,
after `components/ai/py` and `components/ai/js`, and one that would drift from both. The session
model belongs in the library that owns it.

The route says so already. [[REQ-145]] landed `/api/ai/*` as a deliberate 501 naming this
blocker (`apps/control-app/src/router.ts`) — *"the route exists, the capability does not yet"* —
so nothing is silently broken while this waits.

## 3. Publish is not here

`cmdPublish` was §2 of this ticket. It is now [[REQ-149]], *"Publish in the cloud: revisions,
history and rendered output without a filesystem"*, and [[REQ-145]] already landed
`/api/publish` as a 501 pointing there.

That split is right and should not be undone. Publish is not a relocation: the `SiteStore` port
has no notion of a revision at all — no history, no `nextRevisionId`, no snapshot, no
store-level diff — so it is a new storage contract with four unsettled design questions, which
REQ-149 poses and this ticket never did. The `sandbox` constraint ([[DOC-12]] §7) and the
forward-only `live` advance travel with it.

## 4. Acceptance criteria (provisional)

1. A chat turn runs end to end in workerd, with the API key read from a secret, and its edits
   land in the store [[REQ-143]] built.
2. Reloading the builder resumes the site's conversation.
3. Every AI write is audited durably; the audit survives a Worker restart.
4. No API key appears in logs, error envelopes, or client responses.
5. The AI library is bundled at build time — no `require.resolve`, no `pathToFileURL`, no
   runtime dynamic import remains on the Worker path.

Criteria 4 and 5 of the original list — the publish revision and the unreachable `sandbox` key —
moved to [[REQ-149]] with §2.

## Origin

[[CHAT-25]]. After this, nothing in the authoring loop needs the operator's machine.
