---
uid: request-01ea4eec
id: REQ-155
type: request
title: 'Capture in workerd: a ReferenceStore port, with the filesystem behind it'
created_by: xgd
created_at: '2026-08-20T23:16:33.604977+00:00'
updated_at: '2026-08-20T23:16:33.604977+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  depends_on:
  - REQ-154
  - REQ-143
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-2b271313
---

# Capture in workerd: a ReferenceStore port, with the filesystem behind it

## Why this is its own ticket

Exactly the shape [[REQ-142]] and [[REQ-143]] used for `SiteStore`, and separated for the same
reason: a storage contract buried inside a feature change is a storage contract nobody reviewed.

[[REQ-154]] gives the cloud a browser. It does not give it anywhere to put what the browser
produces. `capture/bundle.ts` writes a bundle as a **directory tree** — fourteen `mkdirSync` /
`writeFileSync` call sites — and `capture/reextract.ts` reads one back with `readdirSync`. None of
that exists in a Worker.

## What a bundle is, and what must survive

[[DOC-13]] §8 states the constraint in its last clause: *"`storage/references/` bytes move to R2.
The capture pipeline, schema, and bundle are **unchanged**."* This is a port, not a redesign. A
bundle written by the laptop and a bundle written by the cloud must be the same artifact, readable
by either.

| Member | What it is |
|---|---|
| `capture.json` | the capture record |
| `screenshot.full.png` | the full-page shot |
| `screenshot-<width>.png` | the persisted viewport ladder |
| `rendered.html` / `raw.html` | post- and pre-script DOM |
| `assets/` | the referenced bytes |
| `multistate.json` | the multi-viewport ladder — the acceptance oracle |
| `l1.json` | the ladder folded into one L1 document |
| `forms.json`, `hints.json` | derived form model and advisory structural hints |

## What the port has to add that `SiteStore` did not

- **A list verb.** `reextract.ts` uses `readdirSync` to find a bundle's members. R2 lists by
  prefix; the filesystem lists by directory. One verb, two implementations.
- **Bundle identity.** On disk a bundle is a path the operator typed (`--ref <dir>`). In R2 it
  needs a **name** that survives being handed to another verb and to an AI tool
  ([[REQ-157]]) — derived from the captured URL and the capture time, not from a directory
  the caller happened to choose.
- **Tenancy.** `SiteStore` refuses an unknown tenant at construction ([[REQ-143]]). References are
  no different: a captured competitor site belongs to the account that captured it, and nothing
  reads across.

## Deliberately not here

Re-pointing the *reproduction* verbs (`repro`, `adopt-gaps`) at the store. They read a bundle and
write a site, both of which will work through ports once this lands, but they are the
framework-growth loop ([[DOC-21]]) and are operated by a developer at a CLI. They can follow if
they ever need to; nothing in [[CHAT-27]] asks for them.

## Acceptance criteria

1. A `ReferenceStore` port with two implementations — filesystem and R2 — selected by injection,
   as REQ-142 did for sites. No `node:fs` call remains reachable from the capture pipeline.
2. `1c capture page <url>` runs inside workerd and lands a complete bundle, every member above
   present.
3. A bundle captured locally and one captured in the cloud, for the same URL, are equivalent
   member-for-member — modulo the non-determinism the pipeline already has, which the ticket must
   state rather than discover.
4. `1c refold --ref <bundle>` re-derives `l1.json` and `forms.json` from a stored bundle without
   re-hitting the site, in both implementations.
5. Bundles are tenant-scoped, and a read across tenants is refused at the same layer `SiteStore`
   refuses it.
6. Every CLI verb taking `--ref <dir>` behaves identically against the filesystem implementation.

## Origin

[[CHAT-27]]. Second of four: the browser can see, and now there is somewhere to keep what it saw.