---
uid: request-3b023783
id: REQ-486
type: request
title: 'Forms: Turnstile hostname check and per-IP sign-in limit'
created_by: EPIC-17
created_at: '2026-10-29T17:54:29.575678+00:00'
updated_at: '2026-11-04T19:01:05.285580+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  epic_parent: epic-bed5a03b
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dbab05ec
  commits:
  - working_sha: 53423cffc9262b000af1b543a9e6c42efde7bdbf
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a908d3e1b251d2ac851abafdd779166fc1a5b784
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.706
---

## What this is

Two abuse controls the EPIC-17 web-form review (2026-10-29) found missing. Both are small, and
both close gaps in controls we already have rather than adding new ones.

## 1. Turnstile: verify the hostname, not just `success`

`verifyTurnstile` in `apps/public-site/src/lead.ts` accepts any siteverify answer with
`success: true`. Siteverify also returns the `hostname` the challenge was solved on. Without
checking it, a token solved on any page carrying our site key is accepted on every site we serve.
Cloudflare's own widget-domain list is the only thing standing in the way, and that list lives in
a dashboard with no test behind it. (Threat model F8.)

Required:
- 1a. A submission is accepted only when siteverify's `hostname` equals the hostname of the
  request that delivered it, i.e. the site the form was served on. That is the apex, a
  `*.1stc.site` host, or a customer's own domain.
- 1b. A mismatch, a missing `hostname` or a non-string `hostname` is refused, with the same
  wording and status as a failed verification (403). The caller cannot tell a wrong-host token
  from a bad token.
- 1c. The check runs inside the verifier, so no caller can get `success` without the
  hostname check having run.
- 1d. The draft-preview path (`identified: true`) is unchanged. It skips Turnstile entirely, for
  the reason recorded at that call site.

## 2. Sign-in: a per-IP limit on issuing magic links

`POST /sign-in` (control-app `sign-in.ts`) is limited only per address: 5 links an hour
(`SIGNIN_RATE_LIMIT`). The form is on the public apex, and since REQ-475 the endpoint is public
at the edge, with no Turnstile and no per-source limit. One source can script requests across
many addresses: unwanted mail to invited people, plus send volume that counts against our
sending-domain reputation, which is established only once (EPIC-17 §5).

Required:
- 2a. A Cloudflare rate-limit binding (same mechanism as `LEAD_RATE_LIMIT`), keyed on
  `cf-connecting-ip` and nothing caller-supplied. It is declared at the top level and again
  under each named environment, because named environments inherit no bindings.
- 2b. A request over the limit gets **the same acknowledgement** as any other issue request,
  and no mail is sent. A different answer would tell a prober they had been limited, and would
  bring back the membership oracle that the identical answer exists to close.
- 2c. Missing binding → the issue route refuses (503) and sends nothing, the same fail-closed
  rule `lead.ts` follows. The operator's break-glass way in, `/sign-in/access`, is not this
  route and is unaffected.
- 2d. The limit is generous enough that a household or office behind one NAT can sign in
  normally. Suggested: 10 per 60 s. A per-IP cap is a backstop; the per-address limit remains.
- 2e. Only issuing is limited. Redeeming a link (the POST behind the emailed button) and
  sign-out are not, since a limit there would lock out someone already holding a valid link.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`:
- siteverify double answering `success:true` with the matching hostname → lead captured (1a)
- `success:true` with another hostname, and with no hostname → 403, nothing captured, same
  body as a failed token (1a, 1b)
- draft-preview submission still captured without a token (1d)
- the limiter double refusing → `POST /sign-in` answers byte-identically to an allowed request,
  and the mail double was not called (2a, 2b)
- no binding → 503 and no mail (2c)
- link redemption still succeeds while the limiter is refusing (2e)

-