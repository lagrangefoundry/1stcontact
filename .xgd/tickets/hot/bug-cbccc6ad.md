---
uid: bug-cbccc6ad
id: BUG-69
type: bug
title: 'Builder chat: pane keeps the previous business''s conversation when both sites
  share a slug'
created_by: martin-github@westhead.me
created_at: '2026-09-10T17:19:08.328076+00:00'
updated_at: '2026-09-10T17:29:35.491783+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-cbc306f3
  severity: medium
  commits:
  - working_sha: 9898bc8af7920b753752fb44dc01b114fc9824cf
    reconcile_sha: null
    main_sha: null
  version: 0.2.146
---

## Symptom

Switching business with the shell's business switcher updates the site pane
correctly, but the chat pane sometimes keeps the conversation from the business
being left behind. Observed switching **Lagrange Foundry → XGD**: the XGD site
rendered on the left, the Lagrange Foundry transcript stayed on the right.

It does not happen on every switch, which is the tell.

## Root cause

A session id is derived from the slug alone — `sessionIdFor(slug)` in
`host-core.ts` returns `site-<slug>`. That is unique *within* a business,
because every request is business-scoped by the `/b/<id>` prefix and the host
resolves it against that tenant's own store. It is **not** unique across
businesses, and slugs are deliberately per-business rather than global.

The chat pane treats the id as globally unique:

    // chat.js, setSession
    const next = session?.sessionId ?? null
    if (next === sessionId) return          // ← no-op

So on a switch between two businesses whose sites share a slug, the origin is
asked for the new session (correctly, under the new prefix), answers with the
right transcript — and the pane discards it, because the id string is the one
it is already showing.

The two businesses in the report both have a site slugged `unnamed`, which is
why this switch reproduced it and others did not.

The same collision affects the composer's draft persistence: `mountChat` is
keyed `builder-chat:<sessionId>`, so a half-typed message under one business's
`unnamed` would surface under another business's `unnamed`.

`REQ-179` already has a case for the shared-slug switch
(`test_UAT_FC_REQ-179_the_frame_reloads_when_only_the_business_changed`) but it
asserts only that the transport was *asked* — its fixture returns an empty
transcript both times, so the pane's refusal to swap was invisible.

## Fix

The conversation's identity, **as the client holds it**, is the pair
`(business, sessionId)` — not the id alone. The origin's id shape is left
untouched; it is correct in the address space it lives in.

- `chat.js` — `setSession(session, key)` takes an identity key alongside the
  session. The pane dedupes on the key and mounts `mountChat` under it, so a
  changed business remounts the pane and gives each business its own composer
  draft. The wire `sessionId` is unchanged and is still what turns are addressed
  to; `getSessionId()` keeps returning it.
- `app.js` — `showSite` derives the key from the business the read was made
  under, scoped exactly the way `api.js` scopes a URL: prefixed when a business
  is selected, bare when there is none. All four `setSession` call sites (the
  open, the unconfigured deployment, the failed open, and the empty pane) use
  the same derivation.

## Test plan

`tests/test_UAT_FC_BUG-69_chat_follows_the_business.test.ts` — the real builder
over the installed webui components, two businesses whose sites share a slug,
driven through `app.scope.setBusiness` the way the switcher drives it:

1. The pane shows the **new** business's transcript after a switch on a shared
   slug — the case that regressed.
2. The pane is remounted under a business-distinct chat id, so a composer draft
   does not travel between businesses.
3. A plain site change within one business still swaps (no regression).

Regression scope: the builder pane suites — REQ-122, REQ-179, BUG-42, BUG-43,
BUG-46, BUG-64, and the assistant-pane reconciliation suite.