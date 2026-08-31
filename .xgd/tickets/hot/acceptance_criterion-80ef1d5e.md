---
uid: acceptance_criterion-80ef1d5e
id: AC-1425
type: acceptance_criterion
title: 'The smoke check asserts the operator surface is private: an unauthenticated
  caller is challenged and the platform-default hostname does not answer, each on
  its own option'
created_by: xgd
created_at: '2026-08-31T12:12:25.714590+00:00'
updated_at: '2026-08-31T12:12:25.714590+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The smoke check asserts, from outside, that the operator surface is private. Two checks join the
set, each selected by its **own** option and each stated as a negative — "this did not serve the
builder" — rather than as one expected status, because every way the gate can hold looks different
and a check that recognised only one of them would fail a correctly-protected origin:

- **The control origin challenges an unauthenticated caller.** Given the control origin, a request
  carrying no identity must not be answered with success. A redirect to the identity provider's
  login host, or a refusal, is a pass. The Worker's own refusal when its gate is unconfigured is
  also a pass — it is not serving — but is reported as such in the check's detail, so an operator
  reads "the gate has not yet been proved against a real challenge" rather than "protected".
- **The platform-default hostname does not answer.** Given that hostname, a successful response is
  a failure: it is the door no hostname policy covers. A hostname that no longer resolves at all is
  the success case here — the one check in the set where a transport error is the outcome sought —
  and the report says so rather than reporting an error.

Each check is **skipped by name** when its option is not supplied, with the missing option named as
the reason. Neither may fail against an origin it does not apply to: the control surface and the
public site are independent axes, and pointing the check at one must not be reported as a failure
of the other.

Both failures name the check and say what was seen: a served builder is reported as being served
publicly, and an answering default hostname is reported as the door no policy covers.

## Verification

Drive the check against a control origin answering each of the three protected forms in turn — a
redirect to the identity provider, a refusal, and the Worker's own unconfigured refusal — with the
default hostname not resolving: both checks pass in every case, and the unconfigured form's detail
says the challenge was not proved.

Then drive it twice against a public builder: once with the control origin serving a page to an
unauthenticated caller, once with the default hostname answering. Each run exits non-zero, the
failure list names exactly the check that owns that door, and its detail names the exposure.

Finally, run with neither option supplied: both checks are reported skipped, each naming the option
it wanted, and the run does not fail on their account.
