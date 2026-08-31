---
uid: capability-3606e35b
id: CAP-103
type: capability
title: 'Operator Access Gate: Who May Reach The Builder'
created_by: xgd
created_at: '2026-08-31T09:30:13.761479+00:00'
updated_at: '2026-08-31T09:30:13.761479+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: operator_access_gate
---

# Capability: Operator Access Gate — Who May Reach The Builder

**The builder is private. Before any request is routed, read, rendered or
answered, the platform establishes that the caller is an identity the operator
has granted — and refuses everything else, on every hostname the deployment
answers on.**

The builder is the operator's surface: it lists every site, edits every
definition, spends model budget and publishes to the public web. Every other
capability in this repository assumes its caller is entitled to be there. This
capability owns the assumption itself — the gate that makes it true.

Two properties define it, and both are structural rather than procedural:

- **The gate covers every door.** Authorisation attached to one hostname
  protects that hostname and nothing else. A deployment that answers on a
  second, unpolicied address is open regardless of how correct the policy on
  the first one looks. Closing that door and verifying the identity inside the
  application are two independent controls, and this capability holds both, so
  that opening the builder takes two mistakes rather than one.

- **It fails closed, with no path from "could not check" to "carry on".**
  Missing configuration, unobtainable signing keys, an unreadable token and an
  absent token all deny. Refusals are distinguished by what would fix them, so
  an operator is sent to the right place rather than hunting for the wrong
  problem.

Scope: authorising the **operator** surface. Customer sign-in to a tenant's own
builder is a different product surface and belongs with the tenancy model; the
public site's own visitor-facing addressing and link-privacy rules belong to
site delivery, not here.
