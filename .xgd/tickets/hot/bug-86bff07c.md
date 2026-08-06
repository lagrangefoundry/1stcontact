---
uid: bug-86bff07c
id: BUG-28
type: bug
title: 'contact-form: a mailto:/tel: action validates but client.js kills the submit,
  blocking the no-JS baseline'
created_by: xgd
created_at: '2026-07-27T21:22:42.547000+00:00'
updated_at: '2026-08-05T19:32:19.735981+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 940644597b2671c8867bbddd4511e05d7cf36ce4
    reconcile_sha: null
    main_sha: null
  version: 0.0.219
  bundled_in: bundle-ee56a66e
---

## The defect

`contact-form` accepts a `mailto:` / `tel:` action at validation and then makes
it unusable at runtime, with no error anyone can see.

`assertSafeUrl` explicitly permits those schemes:

```ts
// packages/framework/src/modules/safety.ts:25
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])
```

So `config.action: "mailto:hello@xgd.dev"` validates, renders a correct
`<form method="post" action="mailto:…">`, and would work exactly as intended
with JavaScript disabled.

But `client.js` intercepts **unconditionally**:

```js
// packages/framework/src/modules/contact-form/client.js
async function handleSubmit(form, event) {
  event.preventDefault()                       // ← always
  ...
  const action = form.getAttribute('action') || ''
  try {
    response = await fetch(action, { method: 'POST', ... })   // ← throws on mailto:
  } catch (_e) {
    showError(form, 'Could not reach the server. Please try again.')
    return
  }
```

`fetch("mailto:…")` rejects. The visitor gets **"Could not reach the server.
Please try again."** and the submit is already cancelled, so the native
`method="post"` navigation — the vetted no-JS baseline the module's own docblock
names as its degradation path — is never reached.

## Why it matters

The module's two halves disagree about what an `action` is. The safety layer
says a `mailto:` action is a legitimate endpoint; the client says every action is
a JSON API. Between them, the form is **silently dead in every JS-enabled
browser** while looking perfectly healthy in the rendered HTML.

This is not a corner case: it is the default state of any authored site that does
not yet have a backend. REQ-95 hit it on the first authored form on xgd.dev —
the only way to stub a capture endpoint is a `mailto:`, and that is exactly the
input that breaks.

It also violates the module's declared `isolation` obligation
(`meta.ts` → `conformance.obligations`), which promises that "a failure degrades
to the no-JS post baseline". Here the enhancement *prevents* the baseline.

## Behaviour required

`client.js` must enhance only the submissions it can actually enhance:

- Action is **http(s) or relative** (including empty, which posts to self) →
  intercept and `fetch` as today.
- Action carries **any other permitted scheme** (`mailto:`, `tel:`) → do not
  call `preventDefault()`; let the user agent perform the native submit.

The scheme already carries all the information needed, so no new `config` field
should be added for this — an `enhance: false` dial would be an aesthetic-style
escape hatch for something the data already determines, and DOC-25 §2 rules that
out.

Detection must be defensive in keeping with the rest of the file: an
unparseable action falls back to the native submit rather than throwing.

## Acceptance criteria

1. With `action: "mailto:…"`, a JS-enabled submit performs the native form post
   and shows no error banner.
2. With `action: "https://…"`, behaviour is unchanged: intercepted, JSON
   `fetch`, inline success swap, inline error on non-2xx.
3. With `action: ""` (post to self), behaviour is unchanged (intercepted).
4. With `action: "tel:…"`, native submit, as (1).
5. An action that cannot be parsed falls back to the native submit and does not
   throw.

## Evidence

Observed on xgd.dev's beta-capture form (REQ-95), rendered output:

```html
<form action="mailto:hello@xgd.dev" method="post" data-contact-form>
  <input id="cf-email" name="email" type="email" required placeholder="Email address">
```

Correct HTML; unusable in the browser.