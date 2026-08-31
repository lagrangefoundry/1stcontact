---
uid: acceptance_criterion-c309fff7
id: AC-1410
type: acceptance_criterion
title: The model key ships as a deploy secret, and the deploy asks the deployment
  whether it is already in place rather than the operator's shell
created_by: xgd
created_at: '2026-08-31T10:39:07.452948+00:00'
updated_at: '2026-08-31T10:59:26.875467+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The model credential is supplied to the deployment as a write-only secret, and
the deploy decides what to do about it by asking **the deployment** whether the
credential is already there — not by inspecting the operator's shell:

- a value present in the operator's environment is pushed, whether or not one is
  already stored, because supplying a value is how a rotation is expressed;
- no value in the environment, and the deployment already holds one under that
  name: the deploy proceeds, reports that it left the stored value alone, and
  overwrites nothing;
- no value in either place: the deploy fails, before anything is uploaded, naming
  the credential and what to do;
- the deployment could not be asked at all: the deploy fails the same way, and
  says the store could not be read.

Only a positive answer — the deployment replied, and the name was in the reply —
lets the deploy skip. A failed read counts as absent, because the failure being
guarded against is a confident skip based on an answer nobody actually got. A
rehearsal reaches the same decision by the same route, including the failures, and
uploads nothing. The credential's value is never printed on any path; only its
name is.

A deployment that serves rendered visitor bytes and hosts no assistant is never
offered the credential at all.

## Verification

Drive the deploy through each of the four states — value in the environment;
absent locally but stored; absent in both; store unreadable — and assert the
outcome, the exit status and the message in each. Assert the push case overwrites
even when a value is already stored. Run each again as a rehearsal and assert it
reports the decision it would have acted on, fails exactly where the real deploy
would fail, and uploads nothing. Assert the credential's value appears in no
output on any path. Assert the deployment that serves visitor bytes exits before
it consults the store at all.