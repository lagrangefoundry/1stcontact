---
uid: request-714556fc
id: REQ-485
type: request
title: 'Control app: security headers on every response'
created_by: EPIC-17
created_at: '2026-10-29T17:54:08.263893+00:00'
updated_at: '2026-11-04T19:00:47.563295+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-bed5a03b
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e6646ae5
  commits:
  - working_sha: d488d5606ae33444b4c9e116d698a9f1964053ef
    reconcile_sha: null
    main_sha: null
  - working_sha: 335442bdf863a1bf82c037bf87275b662599b404
    reconcile_sha: null
    main_sha: null
  version: 0.2.705
---

## What this is

`app.1stcontact.io` is now public at the edge (REQ-475): Cloudflare Access guards only the
operator paths, and the app's own sign-in guards everything else. None of the app's responses
carry browser security headers today. A live check on 2026-10-29 found no
`Strict-Transport-Security`, no `X-Frame-Options` / `frame-ancestors`, no `Content-Security-Policy`
and no `Referrer-Policy` on `/` or `/sign-in`. A handful of routes in `router.ts` set
`x-content-type-options: nosniff` one at a time.

Found in the EPIC-17 review of the Access removal. The `SameSite=Lax` session cookie already
blocks the worst cross-site framing case. These headers are the second, independent layer.

## Required behaviour

1. **One place sets them.** Every response the control-app Worker returns carries the baseline
   below, applied once on the way out of `fetch`, not per route. A route added later gets them
   without doing anything. A route may *tighten* a header but never drop one.
2. **Baseline, on every response:**
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`. No `preload` yet: that is
     hard to undo, and is a separate decision.
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`. Magic-link and invite tokens travel in
     URLs, and must not leak to third parties in a `Referer` header.
   - `X-Frame-Options: SAMEORIGIN` plus CSP `frame-ancestors 'self'`. The builder frames its own
     preview, so `'self'` is needed, but no other origin may frame any app page.
   - `Permissions-Policy` denying what the app never uses (camera, microphone, geolocation,
     payment, usb, …), so injected content cannot request them. Check first whether the builder
     uses any of these (e.g. microphone for voice). Allow `self` only for what it really uses.
3. **A Content-Security-Policy on the app's own pages** (builder shell, sign-in, terms, portal):
   `default-src 'self'`; `script-src 'self'` plus hashes for the inline scripts that exist today
   (`chrome.ts`, `terms.ts`, `builder/people.js`), or move them to files; `object-src 'none'`;
   `base-uri 'self'`; `form-action 'self'`; `connect-src` limited to what the builder calls.
   **Ship it first as `Content-Security-Policy-Report-Only`** and switch to enforcing once a beta
   session shows no violations. The switch is in this ticket's scope, but can be a later commit.
4. **Preview and served-content responses get their own policy, not the app's.**
   `/preview/<site>/…`, `/api/material/file` and anything else that serves customer- or
   capture-authored bytes on this origin must not inherit the builder's CSP, because the
   builder's CSP would break them. They get the stricter rule the threat model calls for (F1):
   a sandbox CSP on material files. Preview pages get a policy that allows exactly what a
   published page needs (fonts, Turnstile).
5. **No regression to existing routes.** Every route that already sets `nosniff` keeps it, and
   the per-route copies are removed in favour of (1).

## Out of scope

- Headers on published customer sites (`apps/public-site`). That is threat-model F4 and
  needs a policy per site.
- HSTS `preload` submission.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, run through the Worker's `fetch`:
- builder shell, `/sign-in`, a 401 and a 404 each carry the full baseline (1, 2)
- a route added in the test without header code still gets the baseline (1)
- the app pages carry the CSP, report-only until enforcement lands (3)
- a preview response and a material-file response do not carry the builder CSP, and the
  material file carries the sandbox policy (4)
- after the change, no route outside the central function sets `x-content-type-options` itself
  (5, source-level scan)
- `bin/smoke`: one check that `app.1stcontact.io/sign-in` returns HSTS and `frame-ancestors`

## What landed (free-coded)

`apps/control-app/src/security-headers.ts` holds the one function, `withSecurityHeaders`.
`index.ts`'s `fetch` runs every response through it after `handleFetch`, whichever exit
the handler took. The seven per-route `x-content-type-options` copies in `router.ts` are
gone.

- **Merge rule (1).** If a route already set a baseline header, the route's value stays.
  If it did not, the baseline value is added. A route's own `Content-Security-Policy` is
  kept, and ours is appended beside it. Two policies are enforced independently, so the
  added one can only take permissions away.
- **Baseline (2)** is exactly as specified. `Permissions-Policy` denies accelerometer,
  camera, display-capture, geolocation, gyroscope, hid, magnetometer, microphone, midi,
  payment, serial and usb. The builder uses none of them: there is no `getUserMedia` or
  voice input. It does write the clipboard (`phone-preview.js`). `clipboard-write` is not
  listed, so it keeps its default of `self`. `frame-ancestors 'self'` is **enforced** on
  every response, as its own policy, from the first commit.
- **Three classes of response, chosen by path** after the `/b/<id>` prefix is stripped:
  - **app** (everything else: builder shell, sign-in, terms, API): the CSP from (3), sent
    as **`Content-Security-Policy-Report-Only`**.
    - `script-src` is `'self'` plus the sha256 of the three inline scripts. These are the
      shell's import map (now the `IMPORT_MAP` constant in `chrome.ts`), the boot guard
      (`BOOT_GUARD`), and the terms accept script. The terms script is now the
      `TERMS_SCRIPT` constant. The version it accepts moved to the button's
      `data-version`, so the hashed bytes never vary per response. The hashes are
      computed once per isolate with WebCrypto.
    - `people.js` has no inline script. Its sent-mail view is a sandboxed `srcdoc` frame,
      which inherits this policy. That is why `style-src` keeps `'unsafe-inline'` and
      `img-src` allows `https:`.
    - `form-action` is `'self' https:`, not `'self'`. A redeemed sign-in link's POST is
      answered with a 303 to wherever the sign-in began (REQ-482): the apex or a bound
      customer domain. Browsers check `form-action` against that redirect.
  - **site** (`/preview/…` and the account portal `/account`): the policy a published
    page needs. It allows inline script and style (the renderer emits them per page, so
    hashes cannot cover them), Turnstile (`challenges.cloudflare.com` in script, frame and
    connect), remote `https:` pictures, and self-hosted fonts. This policy is also
    report-only.
    - **Decision:** the portal is listed in (3) as an app page, but it is rendered by
      `servePreview`, the published renderer. So it gets the site policy. The builder's
      hash list would block its inline scripts.
  - **content** (`/api/material/file`): an **enforced** policy:
    `sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'`.
    An uploaded SVG or HTML file opened directly is inert (F1).
    - **Exception:** `application/pdf` gets only the baseline frame rule. Browsers refuse
      to show a PDF in a sandboxed document, and the builder's reader frames PDFs. The PDF
      viewer belongs to the browser, not to this origin's script.
- **Report-only → enforcing is still to do.** Switching means changing
  `PAGE_POLICY_HEADER` to `content-security-policy` once a beta session's browser console
  shows no violations. There is no `report-uri` endpoint. A public, unauthenticated
  collector would be a new surface, so violations are read from DevTools for now.
- **`bin/smoke`** has a new check, `control_app_sign_in_security_headers`: `GET
  <control-origin>/sign-in` must carry HSTS (`max-age=`) and an enforced
  `frame-ancestors 'self'`. The fake control apps in the smoke UATs (REQ-144, REQ-147,
  BUG-57, the deploy-smoke reconciliation suite) now serve those headers and list the
  check.

## UATs

- `tests/test_UAT_FC_REQ-485_security_headers.workers.test.ts`. Every case goes through
  `worker.fetch` in workerd:
  - the shell, `/sign-in`, a 401 and a 404 each carry the full baseline;
  - a route the test adds (via the asset fallthrough) carries it with no header code of
    its own;
  - a route that sets `X-Frame-Options: DENY` and its own CSP keeps both and still gets
    the rest;
  - the shell, the terms interstitial and sign-in carry the report-only app CSP, and every
    inline script each page actually serves is admitted by its hash;
  - a preview page carries the site policy, not the builder's;
  - an uploaded SVG at `/api/material/file` is enforced `sandbox` and carries no
    report-only builder CSP.
- `tests/test_UAT_FC_REQ-485_one_place_sets_the_headers.test.ts`: a source scan. No file in
  `apps/control-app/src` except `security-headers.ts` names `x-content-type-options`.