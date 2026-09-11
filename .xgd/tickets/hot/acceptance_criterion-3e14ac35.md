---
uid: acceptance_criterion-3e14ac35
id: AC-1376
type: acceptance_criterion
title: The identity is accepted by the gate from the forwarded header, the browser
  cookie, or an automation service identity
created_by: xgd
created_at: '2026-08-31T09:32:12.547116+00:00'
updated_at: '2026-09-10T04:34:09.241233+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The same valid identity is accepted by the gate however it arrives — the gate's
verdict on each is the same, and none of the three is refused as unauthenticated:

- on the request header the identity gateway attaches to what it forwards;
- in the browser cookie the gateway sets, found among other unrelated cookies;
- as an **automation service identity**, which carries a machine name in place
  of a person's email address, and which is accepted on exactly the same terms
  as a human identity — same signature, audience, issuer and expiry checks.

When both the header and the cookie are present, the header is the one used: it
is what the gateway attaches to the request it forwards, and the cookie is the
copy the client controls.

**This is the gate's verdict, not the response the caller ends up with.**
Acceptance here means the gate proved the identity and let the caller past it;
what the caller then receives is decided behind the gate. That distinction is
load-bearing for the automation case in particular: a service identity carries a
machine name and **no address at all**, and an address is what the decision
behind the gate binds to — so an automation identity this gate accepts may still
be refused further in. That outcome is out of scope here and is not asserted
either way; the claim this criterion makes is that the gate does not refuse it.

**The automation identity is a client-id/client-secret pair that the gateway
exchanges for the forwarded assertion — it is not the assertion itself.** The
header carrying the verified identity is set *by* the gateway on the request it
forwards inward; a caller that presents that header inbound has proved nothing
and is refused exactly as one presenting no credential is. So "accepted from an
automation service identity" means: the caller presents the pair at the gate,
the gate exchanges it, and the application then sees the same forwarded
assertion it sees for a human — with a machine name where an email would be.

## Verification

Present one valid identity three ways — header only; cookie only, surrounded by
other cookie pairs; and an identity whose subject is a machine name rather than
an email — and observe each is **not refused as unauthenticated**, and that the
machine-name identity is the one the gate reports having proved. Then present a
request carrying a valid identity in the header and a different, stale value in
the cookie, and observe that the identity the gate acts on is the header's. Do
not assert the served status for any of the three: that is behind the gate.

For the automation case, observe additionally that the credential a client is
required to present is the id/secret pair rather than the forwarded assertion
header: the criterion covering what an automation caller sends asserts the pair
goes out and the assertion header never does.