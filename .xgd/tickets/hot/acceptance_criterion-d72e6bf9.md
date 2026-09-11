---
uid: acceptance_criterion-d72e6bf9
id: AC-1761
type: acceptance_criterion
title: The gate reports the verified identity it proved, not a yes/no
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:42:08.903096+00:00'
updated_at: '2026-09-11T06:42:08.903096+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The gate's verdict is **who the caller is**, not merely whether they may pass.

When a caller is let past, the gate reports the identity it proved — the
machine-or-person name in every case, and the person's email address in the case
of a human identity. An automation service identity authenticates as a machine
name and carries no address at all, so the name is always reported and the
address is reported as explicitly absent rather than guessed, defaulted, or
filled in from the name.

The verdict is carried onward to whatever decides admission behind the gate, so
the address the gate proved is available there **without the token being
verified a second time**: one signature check and one signing-key lookup per
request, not two. A refusal is unchanged in shape — the caller receives the
gate's own response and nothing is carried onward.

This matters because the decision behind the gate binds to the address. If that
decision had to recover the address itself, every admitted request would pay for
two verifications of the same token, and the two checks could disagree about who
the caller is.

## Verification

Drive the request handler with a valid human identity and observe that the gate
reports both the proved identity and the email address from the token, and that
the decision taken behind the gate acted on that same address — the address
appears in the operator-facing record of that decision without the caller having
sent it twice. Drive it again with a valid automation service identity, which
carries a machine name and no address, and observe that the reported identity is
the machine name and the address is reported as absent.

Count the gate's calls to the gateway's published signing keys across a single
request that is let past and then decided on behind the gate: the key set is
fetched and the signature checked once, not once per consumer of the identity.

Finally, drive it with a token the gate refuses and observe that no identity is
carried onward — the refusal is the whole verdict.
