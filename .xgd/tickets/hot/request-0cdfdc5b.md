---
uid: request-0cdfdc5b
id: REQ-146
type: request
title: The AI host and publish move into workerd
created_by: xgd
created_at: '2026-08-15T20:33:27.556016+00:00'
updated_at: '2026-08-15T20:33:27.556016+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 13
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-143
  - REQ-145
---

# The AI host and `publish` move into workerd

> **Status: draft.** Blocked on [[REQ-143]] and [[REQ-145]]; the details will move once those land.

The last two things binding the builder to a Node process, once [[REQ-145]] has moved the routes.

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
- `ANTHROPIC_API_KEY` becomes a `wrangler secret` ([[REQ-144]]).
- `l1-surface.json` and `instances.json` are read from disk and must ship as bundled data.

The structural properties should survive untouched: the surface stays declared as data, a slug
becomes a session in exactly one place, and no operation takes a `slug` parameter.

## 2. `publish`

`cmdPublish` writes revision snapshots to the filesystem. Half of the destination already exists:
`1c deploy` writes `<root>/<slug>/rev/NNNN/{out,source}/` and a `manifest.json` to R2 today, and
[[CHAT-11]] confirmed that path working in production. This is about making `publish` itself
write there, so publishing does not require the operator's disk.

`sandbox` must stay unservable by construction — the Worker never derives a root from a request
([[DOC-12]] §7).

## 3. Acceptance criteria (provisional)

1. A chat turn runs end to end in workerd, with the API key read from a secret, and its edits
   land in the store [[REQ-143]] built.
2. Reloading the builder resumes the site's conversation.
3. Every AI write is audited durably; the audit survives a Worker restart.
4. `publish` from the Worker produces a revision that `public-site` serves, with `live` advancing
   in the manifest — forward-only, no head pointer ([[DOC-12]] principle 3).
5. No `sandbox` key is reachable from any URL.
6. No API key appears in logs, error envelopes, or client responses.

## Origin

[[CHAT-25]]. After this, nothing in the authoring loop needs the operator's machine.
