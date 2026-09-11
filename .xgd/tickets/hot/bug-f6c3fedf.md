---
uid: bug-f6c3fedf
id: BUG-78
type: bug
title: Homepage beta form posts to a route that does not exist
created_by: martin-github@westhead.me
created_at: '2026-09-10T21:42:09.866810+00:00'
updated_at: '2026-09-11T02:15:48.046172+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  chat_comment: comment-6c14b90b
  severity: high
  blocked_by:
  - REQ-223
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


## Fix — decided 2026-09-10

**Blocked on [[REQ-223]]**, which builds the endpoint. Operator chose to build
the capability rather than remove the form (option B of the three above),
scoped to the contact database only — notification of the business owner is
deliberately not in it.

Once REQ-223 lands, this bug closes with two configuration values on the
`1stcontact` home page, and no code:

- `beta-form.action` → `/api/lead` — relative and same-origin, which is the
  convention the XGD site already uses and which REQ-223 §3 settles as the
  correct one. The absolute `https://app.1stcontact.io/beta-apply` is the
  anomaly, and is broken in local dev for the same reason it is broken in
  production.
- `signin.signIn` → `https://app.1stcontact.io/sign-in` — restoring the value
  [[REQ-200]] set. The configured `/auth/request-link` has never existed in the
  route table; `SIGN_IN_PATH` is and always was `/sign-in`.

**The sign-in half needs one thing this repo cannot deliver**: production
Cloudflare Access answers `GET /sign-in` with a `302` to its login origin
(verified 2026-09-10), so the dialog stays broken until a bypass policy is
added. That is recorded as REQ-223 §10 step 2 and is owed independently of both
tickets — the same missing policy also makes REQ-198's delivery webhook
unreachable.

The beta form needs no such thing: REQ-223 routes lead capture through
`public-site`, which sits in front of no Access gate.


## What was done, 2026-09-10

[[REQ-223]] landed (2 commits, 27 UATs passing, `ready_to_reconcile`), so the
endpoint exists. **The remaining work was configuration and data — no repo code
changed, and there is no commit against this ticket.**

### Applied

**1. The homepage's two module configs**, in the `1stcontact` draft page
(`site_62d3d0097bbc7b6e86bdcdb3728389a3`, `home.json`):

| Module | Field | Was | Now |
| --- | --- | --- | --- |
| `beta-form` | `action` | `https://app.1stcontact.io/beta-apply` | `/api/lead` |
| `signin` | `signIn` | `https://app.1stcontact.io/auth/request-link` | `https://app.1stcontact.io/sign-in` |

Applied as the store applies it (`tools/generate/src/store/d1r2-store.ts`): the
page row rewritten and `sites.version` bumped 58 → 59, which is what a builder
save does. The edit refuses rather than guesses if either field does not hold
the exact expected value. Backup at `.xgd/tmp/d1-backup-bug78.sqlite`.

`/api/lead` is root-relative and correct **because this site is the apex**. See
the cross-tenant note below — it is not correct for a site served under
`/site/<key>/`.

**2. `apps/public-site/.dev.vars`** (new, gitignored, local dev only):
`APEX_SITE_KEY` — without it `leadTarget` returns null for the apex and the
endpoint refuses a submission from `/` — plus Cloudflare's published Turnstile
testing keys, verified against the live siteverify endpoint on 2026-09-10 (the
accept key answers `success: true`; its always-fail counterpart answers
`invalid-input-response`; both tagged `result_with_testing_key`). Those keys
switch the control off and must never reach production.

### Not applied, and why

**`APEX_SITE_KEY` in `[env.production.vars]` — cannot be set yet.** Site ids are
minted per environment and the production `sites` table is **empty**; nothing has
ever been published there. There is no production apex key to write. It belongs
in `wrangler.toml` once the site is created and published in production.

**A real Turnstile widget.** `TURNSTILE_SECRET` absent means refuse, by design,
so production and any non-loopback deployment needs a real sitekey and secret
(`wrangler secret put TURNSTILE_SECRET`). Operator action.

**The Access bypass policy.** Still outstanding, still affects only sign-in.
Verified again 2026-09-10: `GET https://app.1stcontact.io/sign-in` answers `302`
to the Access login origin. The `signIn` value above is now correct and the
dialog will still fail in production until the policy exists.

## Two findings this work turned up

**1. The form renders in only one place, and `/api/lead` does not work there.**
`site_revisions` is **empty in every local D1** and production has no sites, so
nothing has ever been published anywhere. The only surface that renders this page
today is `control-app`'s draft preview (`/preview/1stcontact/draft/…`), and
`control-app` has no `/api/lead` route and no `LEAD_INTAKE` binding — deliberately,
per [[REQ-223]] §3.2, which refuses to put the intake behind a URL. So a
submission from the preview now answers `404` instead of the original
"could not reach the server": a different error, not a working form.

Whether a preview submission should work at all is a genuine design question and
is **not** settled here. It writes a real contact into a real tenant, so making
the preview post for real would put test submissions in the CRM; the alternatives
are a gated preview-only route on `control-app`, or a preview that declines to
submit and says so. This bug does not decide it.

**2. A cross-tenant lead leak for non-apex sites — worth its own attention.**
`leadTarget` reads the site key from the URL: a path under `/site/<key>/api/lead`
resolves to that site, and a bare `/api/lead` resolves to the **apex**. The `xgd`
site's two forms (`home.json`, `whitepapers.json`) are both configured
`action: "/api/lead"` and that site is **not** the apex — so once it is published,
its leads land in the apex tenant's contact list rather than its own.

The [[REQ-223]] UATs do not catch this because they construct
`/site/<key>/api/lead` themselves rather than following the rendered `action`.
The correct value for a non-apex site is `/site/<key>/api/lead`, or a
document-relative `api/lead`, which resolves correctly for both. Left alone here:
it is another site's content and not this bug.

## Status

**Not fixed end to end.** The configuration is right and the endpoint is proven
by REQ-223's own UATs, but nothing renders this page outside the preview, and the
preview cannot reach the endpoint. Closing this needs a decision on finding 1,
or a publish plus the production configuration above.
