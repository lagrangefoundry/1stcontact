---
uid: acceptance_criterion-3e14ac35
id: AC-1376
type: acceptance_criterion
title: The identity is verified from the forwarded header, the browser cookie, or
  an automation service identity
created_by: xgd
created_at: '2026-08-31T09:32:12.547116+00:00'
updated_at: '2026-09-04T06:05:11.677092+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The same valid identity passes the gate however it arrives:

- on the request header the identity gateway attaches to what it forwards;
- in the browser cookie the gateway sets, found among other unrelated cookies;
- as an **automation service identity**, which carries a machine name in place
  of a person's email address, and which passes the gate on exactly the same
  terms as a human identity — same signature, audience, issuer and expiry
  checks.

When both the header and the cookie are present, the header is the one used: it
is what the gateway attaches to the request it forwards, and the cookie is the
copy the client controls.

**The automation identity is a client-id/client-secret pair that the gateway
exchanges for the forwarded assertion — it is not the assertion itself.** The
header carrying the verified identity is set *by* the gateway on the request it
forwards inward; a caller that presents that header inbound has proved nothing
and is refused exactly as one presenting no credential is. So "passes the gate
as an automation service identity" means: the caller presents the pair at the
gate, the gate exchanges it, and the application then sees the same forwarded
assertion it sees for a human — with a machine name where an email would be.

An automation identity is therefore named by its machine name and carries **no
email address**, and the gate reports it that way. Whether such a caller is then
served is decided behind the gate rather than by it, and is not asserted here.

## Verification

Present one valid identity three ways — header only; cookie only, surrounded by
other cookie pairs; and an identity whose subject is a machine name rather than
an email — and observe each passes the gate: none is met with an authorisation
failure. Then present a request carrying a valid identity in the header and a
different, stale value in the cookie, and observe that the identity the gate
acts on is the header's. For the machine-name case, observe additionally that
the identity the gate reports is the machine name and that it reports no email
address for it.

For the automation case, observe additionally that the credential a client is
required to present is the id/secret pair rather than the forwarded assertion
header: the criterion covering what an automation caller sends asserts the pair
goes out and the assertion header never does.
