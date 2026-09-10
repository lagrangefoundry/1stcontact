---
uid: bug-f6c3fedf
id: BUG-78
type: bug
title: Homepage beta form posts to a route that does not exist
created_by: martin-github@westhead.me
created_at: '2026-09-10T21:42:09.866810+00:00'
updated_at: '2026-09-10T21:47:47.169907+00:00'
completed_at: null
last_field_updated: severity
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  chat_comment: comment-6c14b90b
  severity: high
---

# Homepage beta form: the submit target does not exist, so the fetch never reaches a server

## Symptom

On the 1st Contact homepage, submitting the email capture ("Apply to join the
early beta") shows the inline error **"Could not reach the server. Please try
again."**

## Diagnosis

The form is the `contact-form` behavior module, instance `beta-form` on the
`1stcontact` site's `home.json`. Its configured action is:

    "action": "https://app.1stcontact.io/beta-apply"

Two independent facts make that address unusable:

1. **`/beta-apply` does not exist.** There is no such route in `control-app`
   (`router.ts` serves `/`, `/index`, and `/api/*` only), and the string
   `beta-apply` appears nowhere in the repository. It was never built.
2. **`app.1stcontact.io` is wholly behind Cloudflare Access.** `access.ts`
   fails closed on every request, and Access itself challenges at the edge
   before the Worker runs. Verified 2026-09-10:
   - `GET https://app.1stcontact.io/beta-apply` → `302` to the Access login origin.
   - The CORS preflight the browser must make first — `OPTIONS` with
     `Origin: https://1stcontact.io`, `Access-Control-Request-Method: POST` —
     is answered **`403` by Access with no `Access-Control-Allow-Origin`**.

`client.js` sends the submission as a cross-origin JSON `fetch`, which requires
that preflight. The preflight is refused, so `fetch()` *rejects* rather than
resolving with a status — and the `catch` in `handleSubmit` reports exactly the
message the operator saw. No request ever reaches any Worker.

**The no-JS baseline is broken too.** `canEnhance` correctly admits `https:`, so
`preventDefault()` fires; but even without JavaScript a native POST would land on
the Access login redirect, not on a handler. There is no working path.

## The underlying gap

This is not specific to our own homepage. **The product has no form-submission
endpoint at all.** `public-site` is read-only by construction — it answers any
method other than GET/HEAD with `405` — and `control-app` is entirely gated. Any
published site's contact form is in the same position, which is what DOC-47
already records: *"there is no 1st Contact inbox behind the form yet"*, and a
form must be pointed at an address the client already has.

The homepage was configured as though that endpoint existed.

## Also broken on the same page, same cause

`account-chrome` on this page is configured with
`signIn: "https://app.1stcontact.io/auth/request-link"`. That route does not
exist either (no match anywhere in the repo) and sits behind the same Access
gate, so the "Sign in" dialog fails identically. Noted here because it is the
same page and the same class of defect; whether it is fixed under this ticket is
the operator's call.

## Where this was observed

Production `1stcontact.io` currently 404s and the production D1 `sites` table is
empty — nothing is published there. The failure reproduces from any origin,
because the action is an absolute URL to the gated production host.

## Fix — not yet decided

Options, for the operator to choose between:

- **A. Content only, no code.** Stop promising a destination that does not
  exist: replace the form with a plain address, or point the action at a mailbox
  the business already has. Honest and immediate; captures no applicants.
- **B. Build the endpoint.** A public, unauthenticated POST handler on the
  **same origin as the published page** (i.e. in `public-site`, which is not
  behind Access), so no CORS preflight is involved at all, recording the
  submission as a `lead` contact in that site's tenant. This is the generic
  enquiry-landing capability DOC-47 lists as missing, and needs spam handling
  (the honeypot is already rendered; the Turnstile mount is present but unwired)
  and rate limiting. Larger than a bug fix.
- **C. Narrow version of B** scoped to the apex site only.

## Test plan

To be written once the fix is chosen.
