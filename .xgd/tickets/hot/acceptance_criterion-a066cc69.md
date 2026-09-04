---
uid: acceptance_criterion-a066cc69
id: AC-1604
type: acceptance_criterion
title: The gate reports the identity it verified, so nothing behind it verifies the
  same token twice
created_by: xgd
created_at: '2026-09-04T06:05:21.265045+00:00'
updated_at: '2026-09-04T06:05:21.265045+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The gate's verdict on a request is **who the caller is**, not a bare yes or no.
A caller the gate verifies is reported with:

- an **identity**, always present — a person's email address, or the machine
  name of an automation service identity;
- an **email address**, present for a person and absent for an automation
  identity. Its absence is reported as an absence rather than as an empty or
  invented address, because the email is what a later decision binds an account
  to, and the one that decides admission is the one that can be missing.

Because the verdict carries the identity, anything behind the gate can name the
caller from the verdict alone: the token is not presented, parsed or verified a
second time to recover who sent it. Verifying twice would mean two signature
checks and two consultations of the gateway's published keys per request for a
value the gate already holds.

A caller the gate refuses is reported as a refusal and carries no identity —
there is nothing verified to report — and the refusal is the response sent
instead of serving, exactly as before.

## Verification

Drive the request handler with one valid, correctly addressed human identity and
observe the gate's verdict names the caller by the email address in the token.
Drive it with an identity whose subject is a machine name and observe the verdict
names the machine and reports no email address. Drive it with a caller the gate
cannot verify and observe the verdict is a refusal carrying no identity. In every
passing case, observe the caller can be named from the verdict alone, without the
token being presented or verified again.
